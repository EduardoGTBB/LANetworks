$(document).ready(function() {
    
    // Función para cargar la tabla de empresas
    function cargarTabla() {
        $.ajax({
            url: 'api/api_ver_clientes.php?action=leer',
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                let tbody = $('#table_clientes');
                
                // Destruir DataTable si ya existe para redibujarlo
                if ($.fn.DataTable.isDataTable('#proposalList')) {
                    $('#proposalList').DataTable().destroy();
                }
                
                tbody.empty();

                if (data.length === 0) {
                    tbody.append('<tr><td colspan="7" class="text-center text-muted py-4">No hay empresas registradas.</td></tr>');
                } else {
                    data.forEach(function(emp) {
                        let badge = emp.estatus === 'Y' 
                            ? '<span class="badge bg-soft-success text-success">Activa</span>' 
                            : '<span class="badge bg-soft-danger text-danger">Inactiva</span>';
                        
                        tbody.append(`
                            <tr>
                                <td><span class="fw-bold text-dark">${emp.nombre_empresa}</span></td>
                                <td>${emp.razon_social}</td>
                                <td>${emp.rfc}</td>
                                <td><span class="badge bg-soft-info text-info">${emp.dias_credito} días</span></td>
                                <td>${badge}</td>
                                <td class="text-center">
                                    <div class="hstack gap-2 justify-content-center">
                                        <a href="#" class="avatar-text avatar-md btn-editar" data-id="${emp.id_empresa}"><i class="feather-edit"></i></a>
                                        <a href="#" class="avatar-text avatar-md btn-eliminar" data-id="${emp.id_empresa}"><i class="feather-trash-2 text-danger"></i></a>
                                    </div>
                                </td>
                            </tr>
                        `);
                    });
                }

                // Inicializar DataTables con diseño limpio
                $('#proposalList').DataTable({
                    language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' },
                    lengthChange: false,
                    searching: false,
                    dom: "<'table-responsive'tr><'row align-items-center p-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-end'p>>",
                    drawCallback: function () {
                        $('.dataTables_paginate > .pagination').addClass('pagination-sm mb-0');
                    }
                });
            },
            error: function() {
                console.error("Error al cargar los datos de las empresas.");
            }
        });
    }

    // Cargar la tabla al iniciar
    cargarTabla();

    // ==========================================
    // EVENTOS DE BOTONES
    // ==========================================

    // Botón "Nueva Empresa"
    $('#btnNuevoCliente').click(function(e) {
        e.preventDefault();
        $('#formEmpresa')[0].reset();
        $('#empresa_action').val('crear');
        $('#id_empresa').val('');
        $('#bloque_estatus').hide(); 
        $('#modalEmpresaLabel').text('Nueva Empresa');
        $('#modalEmpresa').modal('show');
    });

    // Botón "Editar" (Delegado)
    $(document).on('click', '.btn-editar', function(e) {
        e.preventDefault();
        let id = $(this).data('id');
        
        $.ajax({
            url: 'api/api_ver_clientes.php?action=leer_uno&id=' + id,
            method: 'GET',
            dataType: 'json',
            success: function(res) {
                if (res.status === 'success') {
                    let emp = res.data;
                    $('#empresa_action').val('editar');
                    $('#id_empresa').val(emp.id_empresa);
                    $('#modalEmpresaLabel').text('Editar Empresa');
                    
                    // Llenar datos simplificados
                    $('#nombre_empresa').val(emp.nombre_empresa);
                    $('#razon_social').val(emp.razon_social);
                    $('#rfc').val(emp.rfc);
                    $('#dias_credito').val(emp.dias_credito);
                    
                    // Mostrar control de estatus
                    $('#bloque_estatus').show();
                    $('#estatus').prop('checked', emp.estatus === 'Y');

                    $('#modalEmpresa').modal('show');
                } else {
                    alert(res.message);
                }
            }
        });
    });

    // ==========================================
    // ENVIAR FORMULARIO (CREAR/EDITAR)
    // ==========================================
    $('#formEmpresa').on('submit', function(e) {
        e.preventDefault();
        
        let btn = $(this).find('button[type="submit"]');
        let originalText = btn.text();
        btn.prop('disabled', true).text('Guardando...');

        $.ajax({
            url: 'api/api_ver_clientes.php',
            type: 'POST',
            data: $(this).serialize(),
            dataType: 'json',
            success: function(res) {
                if (res.status === 'success') {
                    $('#modalEmpresa').modal('hide');
                    alert(res.message);
                    cargarTabla(); 
                } else {
                    alert("Error: " + res.message);
                }
                btn.prop('disabled', false).text(originalText);
            },
            error: function() {
                alert("Ocurrió un error en la conexión.");
                btn.prop('disabled', false).text(originalText);
            }
        });
    });

    // ==========================================
    // ELIMINAR EMPRESA
    // ==========================================
    $(document).on('click', '.btn-eliminar', function(e) {
        e.preventDefault();
        let id = $(this).data('id');
        
        if (confirm('¿Estás seguro de que deseas eliminar o inactivar esta empresa?')) {
            $.ajax({
                url: 'api/api_ver_clientes.php',
                type: 'POST',
                data: { action: 'eliminar', id_empresa: id },
                dataType: 'json',
                success: function(res) {
                    if (res.status === 'success') {
                        alert(res.message);
                        cargarTabla();
                    } else {
                        alert("Error: " + res.message);
                    }
                }
            });
        }
    });
});

/* //° $(document).ready(function () {

    // ==========================================
    // 1. CARGAR LA TABLA DE EMPRESAS (CLIENTES)
    // ==========================================
    function cargarEmpresas() {
        $.ajax({
            url: 'api/api_ver_clientes.php',
            method: 'GET',
            cache: false, // Evita que el navegador muestre datos viejos
            dataType: 'json',
            success: function (data) {
                let tbody = $('#table_clientes');
                tbody.empty();

                if (data.length === 0) {
                    tbody.append('<tr><td colspan="7" class="text-center text-muted">No hay empresas registradas.</td></tr>');
                    return;
                }

                data.forEach(function (cli) {
                    // ¡AQUÍ NACE LA MAGIA DEL ESTATUS! 
                    // Leemos lo que manda la BD y pintamos el globo correcto
                    let estatusBadge = cli.estatus === 'Y'
                        ? '<span class="badge bg-soft-success text-success">Activo</span>'
                        : '<span class="badge bg-soft-danger text-danger">Inactivo</span>';

                    let tr = `
                        <tr>
                            <td><span class="d-block fw-bold">${cli.nombre_empresa}</span></td>
                            <td><span class="d-block text-muted text-uppercase">${cli.razon_social}</span></td>
                            <td><span class="d-block text-muted text-uppercase">${cli.rfc}</span></td>
                            <td><span class="d-block fw-bold">${cli.dias_credito}</span></td>
                            
                            <td>${estatusBadge}</td>
                            
                            <td class="text-center">
                                <div class="hstack gap-2 justify-content-center">
                                    <a href="#" class="avatar-text avatar-md btn-editar"
                                        data-id="${cli.id_empresa}"
                                        data-nombre="${cli.nombre_empresa}"
                                        data-razon="${cli.razon_social}"
                                        data-rfc="${cli.rfc}"
                                        data-tel="${cli.dias_credito}"
                                        data-estatus="${cli.estatus}">
                                        <abbr title="Editar cliente" style="text-decoration:none;"><i class="feather-edit"></i></abbr>
                                    </a>
                                    <a href="#" class="avatar-text avatar-md btn-eliminar" data-id="${cli.id_empresa}">
                                        <abbr title="Eliminar cliente" style="text-decoration:none;"><i class="feather-trash-2 text-danger"></i></abbr>
                                    </a>
                                </div>
                            </td>
                        </tr>
                    `;
                    tbody.append(tr);
                });
            },
            error: function () {
                $('#table_clientes').html('<tr><td colspan="7" class="text-center text-danger">Error al cargar la información.</td></tr>');
            }
        });
    }

    // Llamamos a la tabla al cargar la página
    cargarEmpresas();

    // ==========================================
    // 2. FORZAR MAYÚSCULAS VISUALMENTE
    // ==========================================
    $('#razon_social, #rfc').on('input', function () {
        $(this).val($(this).val().toUpperCase());
    });

    // ==========================================
    // 3. ABRIR MODAL PARA NUEVO CLIENTE
    // ==========================================
    $('#btnNuevoCliente').click(function (e) {
        e.preventDefault();
        $('#formCliente')[0].reset();
        $('#cliente_action').val('crear');
        $('#cliente_id').val('');

        // Ocultamos el botón de estatus porque al crear siempre es Activo
        $('#bloque_estatus_cli').hide();

        $('#modalClienteLabel').text('Nueva Empresa');
        $('#modalCliente').modal('show');
    });

    // ==========================================
    // 4. ABRIR MODAL PARA EDITAR CLIENTE
    // ==========================================
    $(document).on('click', '.btn-editar', function (e) {
        e.preventDefault();
        $('#cliente_id').val($(this).data('id'));
        $('#nombre_empresa').val($(this).data('nombre'));
        $('#razon_social').val($(this).data('razon').toUpperCase());
        $('#rfc').val($(this).data('rfc').toUpperCase());
        $('#telefono').val($(this).data('tel'));
        $('#correo').val($(this).data('correo'));
        $('#calle_numero').val($(this).data('calle'));
        $('#colonia').val($(this).data('colonia'));
        $('#localidad').val($(this).data('localidad'));
        $('#codigo_postal').val($(this).data('cp'));
        $('#municipio').val($(this).data('municipio'));
        $('#estado').val($(this).data('estado'));
        $('#pais').val($(this).data('pais')); 
        $.ajax({
            url: 'api/api_ver_clientes.php?action=leer_uno&id=' + id,
            method: 'GET', dataType: 'json',
            success: function (res) {
                if (res.status === 'success') {
                    let e = res.data;
                    $('#empresa_action').val('editar');
                    $('#id_empresa').val(e.id_empresa);
                    $('#nombre_empresa').val(e.nombre_empresa);
                    $('#razon_social').val(e.razon_social);
                    $('#rfc').val(e.rfc);
                    $('#dias_credito').val(e.dias_credito);
                    $('#bloque_estatus').show();
                    $('#estatus').prop('checked', e.estatus === 'Y');
                    $('#modalEmpresa').modal('show');
                }
            }
        });

        // Leemos el estatus actual y prendemos o apagamos el switch
        let estatus = $(this).data('estatus');
        if (estatus === 'Y') {
            $('#estatus_cli').prop('checked', true);
        } else {
            $('#estatus_cli').prop('checked', false);
        }

        // Mostramos el switch para que el usuario pueda cambiarlo si quiere
        $('#bloque_estatus_cli').show();

        $('#cliente_action').val('editar');
        $('#modalClienteLabel').text('Editar Empresa');
        $('#modalCliente').modal('show');
    });

    // ==========================================
    // 5. GUARDAR CLIENTE (Crear o Editar)
    // ==========================================
    $(document).on('submit', '#formCliente', function (e) {
        e.preventDefault();
        let formData = new FormData(this);

        $.ajax({
            url: 'api/api_ver_clientes.php',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function (response) {
                if (response.status === 'success') {
                    $('#modalCliente').modal('hide');
                    $('.modal-backdrop').remove();
                    cargarEmpresas();
                    alert(response.message);
                } else {
                    alert("Error: " + response.message);
                }
            },
            error: function (xhr) {
                alert("Ocurrió un error de conexión. Revisa la consola.");
                console.error("Error del servidor: ", xhr.responseText);
            }
        });
    });

    // ==========================================
    // 6. ELIMINAR CLIENTE (Físico o Lógico)
    // ==========================================
    $(document).on('click', '.btn-eliminar', function (e) {
        e.preventDefault();
        let id_empresa = $(this).data('id');

        if (confirm("¿Estás seguro de eliminar esta empresa? Si tiene usuarios enlazados, solo se inactivará.")) {
            $.ajax({
                url: 'api/api_ver_clientes.php',
                type: 'POST',
                data: { action: 'eliminar', id_empresa: id_empresa },
                dataType: 'json',
                success: function (response) {
                    // Si el estatus es success (se borró) o warning (se inactivó por el candado)
                    if (response.status === 'success' || response.status === 'warning') {
                        alert(response.message);
                        cargarEmpresas(); // Recargamos la tabla para ver los cambios
                    } else {
                        alert("Error: " + response.message);
                    }
                },
                error: function (xhr) {
                    alert("Ocurrió un error al intentar eliminar. Revisa la consola.");
                    console.error("Error del servidor: ", xhr.responseText);
                }
            });
        }
    });
}); */