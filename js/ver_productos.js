$(document).ready(function () {

    $('#clave_product, #descripcion_product, #marca_product').on('input', function() {
        $(this).val($(this).val().toUpperCase());
    }); 

    $.get('api/api_ver_productos.php?action=get_puntos', function(data) {
        let $datalist = $('#lista_puntos');
        $datalist.empty();
        data.forEach(p => { 
            // Insertamos las opciones como sugerencias de autocompletado
            $datalist.append(`<option value="${p}">`); 
        });
    }, 'json');
    
    function cargarProductos() {
        const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

        $.ajax({
            url: 'api/api_ver_productos.php',
            method: 'GET',
            cache: false,
            dataType: 'json',
            success: function (data) {
                let tbody = $('#table_productos');
                let $tabla = tbody.closest('table');

                // DESTRUIR MEMORIA DE DATATABLES
                if ($.fn.DataTable && $.fn.DataTable.isDataTable($tabla)) {
                    $tabla.DataTable().destroy();
                }

                tbody.empty();

                if (!data || data.length === 0) {
                    tbody.append('<tr><td colspan="7" class="text-center text-muted py-4">No hay productos registrados.</td></tr>');
                    return;
                }

                data.forEach(function (prod) {
                    let foto = (prod.foto_product && prod.foto_product.trim() !== '') ? prod.foto_product : 'producto.png';
                    let estatusBadge = prod.estatus === 'Y'
                        ? '<span class="badge bg-soft-success text-success">Activo</span>'
                        : '<span class="badge bg-soft-danger text-danger">Inactivo</span>';

                    let p_farmacia = prod.pf_equipo ? parseFloat(prod.pf_equipo) : 0;
                    let c_farmacia = prod.pf_calib ? parseFloat(prod.pf_calib) : 0;
                    let p_publico = prod.pp_equipo ? parseFloat(prod.pp_equipo) : 0;
                    let c_publico = prod.pp_calib ? parseFloat(prod.pp_calib) : 0;

                    let marca = (prod.marca_product && prod.marca_product !== 'N/A') ? prod.marca_product : '<span class="text-muted fst-italic">N/A</span>';
                    let tipo = (prod.tipo_product && prod.tipo_product !== 'N/A') ? prod.tipo_product : '<span class="text-muted fst-italic">N/A</span>';
                    let estado = (prod.estado_product && prod.estado_product !== 'N/A') ? prod.estado_product : '<span class="text-muted fst-italic">N/A</span>';

                    let atributos = `
                        <span class="d-block fs-11"><b>Marca:</b> ${marca}</span>
                        <span class="d-block fs-11"><b>Tipo:</b> ${tipo}</span>
                        <span class="d-block fs-11"><b>Estado:</b> ${estado}</span>
                    `;
                    
                    let badgePuntos = '';
                    if (prod.puntos_calibracion && String(prod.puntos_calibracion).trim() !== '' && String(prod.puntos_calibracion).trim() !== 'null') {
                        let ptosFormateados = String(prod.puntos_calibracion).trim().replace(/\n/g, '<br>');
                        badgePuntos = `
                            <div class="mt-2">
                                <span class="badge bg-soft-primary text-primary px-2 py-1 fs-11 shadow-sm d-inline-block" style="white-space: normal; text-align: left; line-height: 1.4; border-left: 3px solid #0d6efd;">
                                    <i class="feather-target me-1 fw-bold"></i> Ptos de calibración: ${ptosFormateados}
                                </span>
                            </div>
                        `;
                    }

                    let tr = `
                        <tr>
                            <td class="text-center align-middle">
                                <div class="d-flex flex-column align-items-center justify-content-center">
                                    <div class="avatar-image avatar-lg rounded mb-2">
                                        <img class="img-fluid" src="assets/images/productos/${foto}" alt="img" style="object-fit: cover;">
                                    </div>
                                    <div><a href="javascript:void(0);" class="d-block fw-bold">${prod.clave_product}</a></div>
                                </div>
                            </td>
                            <td>${atributos}</td>
                            <td>
                                <span class="d-block text-wrap">${prod.descripcion_product}</span>
                                ${badgePuntos}
                            </td>
                            <td><span class="text-primary fw-bold">${formatoMoneda.format(p_farmacia)}</span><br><small class="text-muted">+ ${formatoMoneda.format(c_farmacia)} calib</small></td>
                            <td><span class="text-success fw-bold">${formatoMoneda.format(p_publico)}</span><br><small class="text-muted">+ ${formatoMoneda.format(c_publico)} calib</small></td>
                            <td>${estatusBadge}</td>
                            <td>
                                <div class="hstack gap-2 justify-content-end">
                                    <a href="#" class="avatar-text avatar-md btn-editar" data-id="${prod.id_product}"><i class="feather-edit"></i></a>
                                    <a href="#" class="avatar-text avatar-md btn-eliminar" data-id="${prod.id_product}"><i class="feather-trash-2 text-danger"></i></a>
                                </div>
                            </td>
                        </tr>
                    `;
                    tbody.append(tr);
                });

                if ($.fn.DataTable) {
                    $tabla.DataTable({
                        language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' },
                        destroy: true,
                        pageLength: 10,
                        lengthChange: false,
                        ordering: false,
                        searching: true,
                        info: true,
                        dom: "<'row mb-3'<'col-sm-12 col-md-6 d-flex align-items-center'f><'col-sm-12 col-md-6 d-flex justify-content-end'>>" +
                             "<'table-responsive'tr>" +
                             "<'row align-items-center p-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-end'p>>"
                    });
                }
            },
            error: function () {
                $('#table_productos').html('<tr><td colspan="7" class="text-center text-danger py-4">Error al cargar productos</td></tr>');
            }
        });
    }

    cargarProductos();

    // NUEVO PRODUCTO
    $('#btnNuevoProducto').on('click', function() {
        $('#puntos_calibracion').val('');
        $('#formProducto')[0].reset();
        
        $('#producto_action').val('crear');
        $('#producto_id').val('');
        $('#foto_actual').val('');
        
        $('#preview_foto_prod').attr('src', 'assets/images/productos/producto.png');
        $('#modalProductos').modal('show');
        $('#marca_product').val('N/A');
        $('#tipo_product').val('N/A');
        $('#estado_product').val('N/A');
    });

    // EDITAR PRODUCTO
    $(document).on('click', '.btn-editar', function (e) {
        e.preventDefault();
        $('#formProducto')[0].reset();
        $('input[type="file"]').val('');

        let id_product = $(this).data('id');
        
        // Asignación estricta de variables HTML
        $('#producto_id').val(id_product);
        $('#producto_action').val('editar');

        $.ajax({
            url: 'api/api_ver_productos.php?action=leer_uno&id=' + id_product,
            method: 'GET',
            dataType: 'json',
            success: function(res) {
                if(res) {
                    $('#producto_id').val(res.id_product);
                    $('#producto_action').val('editar');
                    $('#foto_actual').val(res.foto_product);

                    $('#clave_product').val(res.clave_product);
                    $('#descripcion_product').val(res.descripcion_product);
                    $('#pf_equipo').val(res.pf_equipo);
                    $('#pf_calib').val(res.pf_calib);
                    $('#pp_equipo').val(res.pp_equipo);
                    $('#pp_calib').val(res.pp_calib);

                    $('#marca_product').val(res.marca_product || 'N/A');
                    $('#tipo_product').val(res.tipo_product || 'N/A');
                    $('#estado_product').val(res.estado_product || 'N/A');
                    $('#puntos_calibracion').val(res.puntos_calibracion || '');
                    
                    $('#estatus_prod').prop('checked', res.estatus === 'Y');

                    let imgSrc = (res.foto_product && res.foto_product.trim() !== '') ? 'assets/images/productos/' + res.foto_product : 'assets/images/productos/producto.png';
                    $('#preview_foto_prod').attr('src', imgSrc);

                    $('#modalProductos').modal('show');
                }
            }
        });
    });

    // GUARDAR O ACTUALIZAR
    $('#formProducto').on('submit', function (e) {
        e.preventDefault();
        
        let btn = $(this).find('button[type="submit"]');
        let txtOriginal = btn.text();
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Procesando...');

        let formData = new FormData(this);

        // --- BLINDAJE JAVASCRIPT: Inyección forzada de datos ---
        // Esto asegura que, pase lo que pase con el HTML, los datos viajen
        let currentAction = $('#producto_action').val() || 'crear';
        let currentId = $('#producto_id').val() || 0;
        let fotoActual = $('#foto_actual').val() || '';

        formData.set('action', currentAction);
        formData.set('id_product', currentId);
        formData.set('foto_actual', fotoActual);
        // -------------------------------------------------------

        $.ajax({
            url: 'api/api_ver_productos.php',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function (response) {
                btn.prop('disabled', false).text(txtOriginal);
                if (response.status === 'success') {
                    $('#modalProductos').modal('hide');
                    $('.modal-backdrop').remove();
                    
                    cargarProductos(); 
                    alert(response.message);
                } else { 
                    alert("Error detectado: " + response.message); 
                }
            },
            error: function (xhr) {
                btn.prop('disabled', false).text(txtOriginal);
                alert("Error Crítico del Servidor. Revisa la consola.");
                console.error("Detalle del Error:", xhr.responseText);
            }
        });
    });

    // ELIMINAR PRODUCTO
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
                    if (response.status === 'success' || response.status === 'warning') {
                        alert(response.message);
                        cargarProductos();
                    } else { alert("Error: " + response.message); }
                }
            });
        }
    });

    // PREVISUALIZAR IMAGEN
    $('#input_foto_prod').on('change', function() {
        let file = this.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = function(e) {
                $('#preview_foto_prod').attr('src', e.target.result);
            }
            reader.readAsDataURL(file);
        }
    });
});