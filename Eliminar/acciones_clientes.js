$(document).ready(function () {

    // 1. FUNCIÓN PARA CARGAR LA TABLA DESDE EL API MAESTRO
    function cargarTabla() {
        $.ajax({
            url: 'api/api_clientes.php?action=leer', // Modificamos la ruta
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                let tbody = $('#table_clientes');
                tbody.empty();

                if (data.length === 0) {
                    tbody.append('<tr><td colspan="8" class="text-center text-muted">No hay clientes registrados.</td></tr>');
                    return;
                }

                data.forEach(function (cli) {
                    let folio = cli.id_empresa.toString().padStart(4, '0');
                    
                    let tr = `
                        <tr>
                            <td><span class="d-block">${cli.nombre_empresa}</span></td>
                            <td><span class="d-block text-muted">${cli.razon_social}</span></td>
                            <td><span class="d-block text-muted">${cli.rfc}</span></td>
                            <td><span class="d-block fw-bold">${cli.telefono}</span></td>
                            <td><span class="d-block fw-bold">${cli.correo}</span></td>
                            <td><span class="badge bg-soft-success text-success">Activo</span></td>
                            <td class="text-center">
                                <div class="hstack gap-2 justify-content-center">
                                    <a href="#" class="avatar-text avatar-md btn-editar" 
                                        data-id="${cli.id_empresa}" 
                                        data-nombre="${cli.nombre_empresa}" 
                                        data-razon="${cli.razon_social}" 
                                        data-rfc="${cli.rfc}" 
                                        data-telefono="${cli.telefono}" 
                                        data-correo="${cli.correo}"
                                        data-calle="${cli.calle_numero}"
                                        data-colonia="${cli.colonia || ''}"
                                        data-localidad="${cli.localidad || ''}"
                                        data-cp="${cli.codigo_postal || ''}"
                                        data-municipio="${cli.municipio || ''}"
                                        data-estado="${cli.estado || ''}">
                                        <abbr title="Editar" style="text-decoration:none;"><i class="feather-edit"></i></abbr>
                                    </a>
                                    <a href="#" class="avatar-text avatar-md btn-eliminar" data-id="${cli.id_empresa}">
                                        <abbr title="Eliminar" style="text-decoration:none;"><i class="feather-trash-2 text-danger"></i></abbr>
                                    </a>
                                </div>
                            </td>
                        </tr>
                    `;
                    tbody.append(tr);
                });
            },
            error: function (xhr) {
                console.error("Error al cargar tabla:", xhr.responseText);
                $('#table_clientes').html('<tr><td colspan="8" class="text-center text-danger">Error al cargar la información.</td></tr>');
            }
        });
    }

    // Cargamos la tabla al iniciar
    cargarTabla();

    // 2. ABRIR MODAL PARA AGREGAR
    $('#btnNuevoCliente').click(function(e) {
        e.preventDefault();
        $('#formCliente')[0].reset(); 
        $('#cliente_action').val('crear'); 
        $('#cliente_id').val('');
        $('#modalClienteLabel').text('Nuevo Cliente');
        $('#modalCliente').modal('show');
    });

    // 3. ABRIR MODAL PARA EDITAR
    $(document).on('click', '.btn-editar', function(e) {
        e.preventDefault();
        
        $('#cliente_id').val($(this).data('id'));
        $('#nombre_empresa').val($(this).data('nombre'));
        $('#razon_social').val($(this).data('razon'));
        $('#rfc').val($(this).data('rfc'));
        $('#telefono').val($(this).data('telefono'));
        $('#correo').val($(this).data('correo'));
        $('#calle_numero').val($(this).data('calle'));
        $('#colonia').val($(this).data('colonia'));
        $('#localidad').val($(this).data('localidad'));
        $('#codigo_postal').val($(this).data('cp'));
        $('#municipio').val($(this).data('municipio'));
        $('#estado').val($(this).data('estado'));
        
        $('#cliente_action').val('editar'); 
        $('#modalClienteLabel').text('Editar Cliente');
        $('#modalCliente').modal('show');
    });

    // 4. GUARDAR FORMULARIO (Agrega o Edita)
    $(document).on('submit', '#formCliente', function(e) {
        e.preventDefault();
        let formData = $(this).serialize();

        $.ajax({
            url: 'api/api_clientes.php',
            type: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if(response.status === 'success') {
                    $('#modalCliente').modal('hide'); 
                    $('.modal-backdrop').remove(); 
                    cargarTabla(); // Recargamos la tabla para ver el nuevo registro de inmediato
                    alert(response.message);
                } else {
                    alert("Error: " + response.message);
                }
            },
            error: function(xhr) {
                alert("Error crítico. Revisa la consola.");
                console.error("Respuesta del servidor: ", xhr.responseText);
            }
        });
    });

    // 5. ELIMINAR CLIENTE
    $(document).on('click', '.btn-eliminar', function(e) {
        e.preventDefault();
        let id_empresa = $(this).data('id');

        if (confirm("¿Estás seguro de eliminar este cliente? Esto podría afectar las cotizaciones existentes.")) {
            $.ajax({
                url: 'api/api_clientes.php',
                type: 'POST',
                data: { action: 'eliminar', id_empresa: id_empresa },
                dataType: 'json',
                success: function(response) {
                    if(response.status === 'success') {
                        cargarTabla(); 
                    } else {
                        alert("Error: " + response.message);
                    }
                }
            });
        }
    });
});