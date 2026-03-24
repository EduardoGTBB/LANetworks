$(document).ready(function () {

    function cargarProductos() {
        const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
        
        $.ajax({
            url: 'api/api_ver_productos.php', 
            method: 'GET',
            cache: false,
            dataType: 'json',
            success: function (data) {
                let tbody = $('#table_productos');
                tbody.empty();

                if (data.length === 0) {
                    tbody.append('<tr><td colspan="7" class="text-center text-muted">No hay productos registrados.</td></tr>');
                    return;
                }

                data.forEach(function (prod) {
                    let folio = prod.id_product.toString().padStart(4, '0');
                    let foto = (prod.foto_product && prod.foto_product.trim() !== '') ? prod.foto_product : 'producto.png';
                    
                    let estatusBadge = prod.estatus === 'Y' 
                        ? '<span class="badge bg-soft-success text-success">Activo</span>' 
                        : '<span class="badge bg-soft-danger text-danger">Inactivo</span>';

                    let tr = `
                    <tr>
                        <td><span class="d-block">${prod.clave_product}</span></td>
                        <td>
                            <div class="hstack gap-3 align-items-center">
                                <div class="avatar-image avatar-md rounded">
                                    <img class="img-fluid" src="assets/images/productos/${foto}" alt="">
                                </div>
                                <div><span class="d-block text-muted text-uppercase">${prod.descripcion_product}</span></div>
                            </div>
                        </td>
                        <td><span class="d-block fw-bold text-primary">${formatoMoneda.format(prod.precio_farmacia)}</span></td>
                        <td><span class="d-block fw-bold text-success">${formatoMoneda.format(prod.precio_publico)}</span></td>
                        <td>${estatusBadge}</td>
                        <td class="text-center">
                            <div class="hstack gap-2 justify-content-center">
                                <a href="#" class="avatar-text avatar-md btn-editar"
                                    data-id="${prod.id_product}"
                                    data-descripcion="${prod.descripcion_product}"
                                    data-c_product="${prod.clave_product}"
                                    data-p_farmacia="${prod.precio_farmacia}"
                                    data-p_publico="${prod.precio_publico}"
                                    data-estatus="${prod.estatus}"
                                    data-foto="${foto}">
                                    <abbr title="Editar producto" style="text-decoration:none;"><i class="feather-edit"></i></abbr>
                                </a>
                                <a href="#" class="avatar-text avatar-md btn-eliminar" data-id="${prod.id_product}">
                                    <abbr title="Eliminar producto" style="text-decoration:none;"><i class="feather-trash-2 text-danger"></i></abbr>
                                </a>
                            </div>
                        </td>
                    </tr>
                `;
                    tbody.append(tr);
                });
            },
            error: function (xhr) {
                $('#table_productos').html('<tr><td colspan="7" class="text-center text-danger">Error al cargar la información.</td></tr>');
            }
        });
    }

    cargarProductos();

    // Transformar a mayúsculas al escribir (Visual)
    $('#descripcion_product').on('input', function() {
        $(this).val($(this).val().toUpperCase());
    });

    $('#input_foto_prod').change(function(e) {
        let reader = new FileReader();
        reader.onload = function(e) { $('#preview_foto_prod').attr('src', e.target.result); }
        if(this.files[0]) reader.readAsDataURL(this.files[0]);
    });

    $('#btnNuevoProducto').click(function (e) {
        e.preventDefault();
        $('#formProducto')[0].reset(); 
        $('#producto_action').val('crear');
        $('#producto_id').val('');
        $('#preview_foto_prod').attr('src', 'assets/images/productos/producto.png');
        $('#input_foto_prod').val('');
        $('#bloque_estatus_prod').hide(); // Ocultamos estatus al crear
        $('#modalProductoLabel').text('Nuevo Producto');
        $('#modalProductos').modal('show');
    });

    $(document).on('click', '.btn-editar', function (e) {
        e.preventDefault();
        $('#producto_id').val($(this).data('id'));
        $('#descripcion_product').val($(this).data('descripcion').toUpperCase());
        $('#clave_product').val($(this).data('c_product'));
        $('#precio_farmacia').val($(this).data('p_farmacia'));
        $('#precio_publico').val($(this).data('p_publico'));

        let estatus = $(this).data('estatus');
        if (estatus === 'Y') { $('#estatus_prod').prop('checked', true); } 
        else { $('#estatus_prod').prop('checked', false); }

        let foto = $(this).data('foto') ? $(this).data('foto') : 'producto.png';
        $('#preview_foto_prod').attr('src', 'assets/images/productos/' + foto);
        $('#input_foto_prod').val('');

        $('#bloque_estatus_prod').show(); // Mostramos estatus al editar
        $('#producto_action').val('editar');
        $('#modalProductoLabel').text('Editar Producto');
        $('#modalProductos').modal('show');
    });

    $(document).on('submit', '#formProducto', function (e) {
        e.preventDefault();
        let formData = new FormData(this);

        $.ajax({
            url: 'api/api_ver_productos.php', 
            type: 'POST',
            data: formData,
            processData: false, 
            contentType: false, 
            dataType: 'json',
            success: function (response) {
                if (response.status === 'success') {
                    $('#modalProductos').modal('hide'); 
                    $('.modal-backdrop').remove(); 
                    cargarProductos(); 
                    alert(response.message);
                } else { alert("Error: " + response.message); }
            }
        });
    });

    $(document).on('click', '.btn-eliminar', function (e) {
        e.preventDefault();
        let id_product = $(this).data('id');

        if (confirm("¿Estás seguro de eliminar este producto? Si está en una cotización, solo se desactivará.")) {
            $.ajax({
                url: 'api/api_ver_productos.php', 
                type: 'POST',
                data: { action: 'eliminar', id_product: id_product },
                dataType: 'json',
                success: function (response) {
                    // Si responde warning, le avisamos que se desactivó. Si responde success, se borró bien.
                    if (response.status === 'success' || response.status === 'warning') {
                        alert(response.message);
                        cargarProductos(); 
                    } else { alert("Error: " + response.message); }
                }
            });
        }
    });
});