$(document).ready(function () {

    // Inicializar Select2 Múltiple
    $('#usuarios_multi').select2({
        placeholder: "Selecciona usuarios...",
        allowClear: true,
        width: '100%',
        dropdownParent: $('#modalSucursal .modal-content')
    });

    $('#nombre_sucursal, #calle, #num_ext, #num_int, #entre_calle, #y_calle, #colonia, #poblacion, #municipio, #estado').on('input', function() {
        $(this).val($(this).val().toUpperCase());
    });

    // 1. Cargar Empresas para el Select
    $.ajax({
        url: 'api/api_cotizador.php?action=get_empresas',
        method: 'GET', dataType: 'json',
        success: function (data) {
            data.forEach(emp => {
                $('#Empresa_id').append(`<option value="${emp.id_empresa}">${emp.razon_social}</option>`);
            });
        }
    });

    // 2. Al cambiar empresa, traer sus usuarios
    $('#Empresa_id').on('change', function () {
        let empId = $(this).val();
        let $select = $('#usuarios_multi');

        $select.empty().trigger('change');

        if (empId) {
            $.ajax({
                url: 'api/api_ver_sucursales.php?action=get_usuarios_empresa&empresa_id=' + empId,
                method: 'GET',
                dataType: 'json',
                success: function (users) {
                    $select.empty();
                    if (users.length > 0) {
                        users.forEach(u => {
                    let newOption = new Option(`${u.nombre} ${u.apellido_pat} ${u.apellido_mat || ''}`.trim() , u.id_usuario, false, false);
                            $select.append(newOption);
                        });
                    }
                    $select.trigger('change');
                }
            });
        }
    });

    // 3. Cargar DataTables 
    function cargarTabla() {
        $.ajax({
            url: 'api/api_ver_sucursales.php?action=leer',
            method: 'GET', dataType: 'json',
            success: function (data) {
                let tbody = $('#all_surc');

                // DESTRUCCIÓN SEGURA: Evita el error rojo de "Cannot reinitialise"
                if ($.fn.DataTable.isDataTable('#proposalList')) {
                    $('#proposalList').DataTable().clear().destroy();
                }

                tbody.empty();

                data.forEach((suc, index) => {
                    let badgeClass = (suc.estatus === 'Y') ? 'bg-soft-success text-success' : 'bg-soft-danger text-danger';
                    let textoEstatus = (suc.estatus === 'Y') ? 'Activa' : 'Inactiva';

                    let id_sae_display = suc.id_sae ? suc.id_sae : '<span class="text-muted">-</span>';
                    let municipio_display = suc.municipio ? suc.municipio : 'Sin municipio';
                    let estado_display = suc.estado ? suc.estado : '';

                    let tr = `
                        <tr>
                            <td class="text-center align-middle"><span class="badge bg-primary fs-12">${id_sae_display}</span></td>
                            <td class="align-middle">
                                <span class="d-block fw-bold text-dark">${suc.nombre_sucursal}</span>
                                <small class="text-muted"><i class="feather-briefcase text-primary"></i> ${suc.razon_social || 'Sin empresa'}</small>
                            </td>
                            <td class="align-middle">
                                <span class="d-block text-dark">${municipio_display}, ${estado_display}</span>
                                <small class="text-muted fs-11">Ver dirección completa al editar</small>
                            </td>
                            <td class="text-center align-middle"><span class="badge ${badgeClass}">${textoEstatus}</span></td>
                            <td class="text-center align-middle">
                                <div class="hstack gap-2 justify-content-center">
                                    <a href="#" class="avatar-text avatar-md btn-editar" data-id="${suc.id_sucursal}">
                                        <abbr title="Editar Sucursal" style="text-decoration:none;"><i class="feather-edit"></i></abbr>
                                    </a>
                                    <a href="#" class="avatar-text avatar-md btn-eliminar" data-id="${suc.id_sucursal}">
                                        <abbr title="Eliminar" style="text-decoration:none;"><i class="feather-trash-2 text-danger"></i></abbr>
                                    </a>
                                </div>
                            </td>
                        </tr>
                    `;
                    tbody.append(tr);
                });

                // INICIALIZAR DATATABLES CON EL BUSCADOR NATIVO
                if ($.fn.DataTable) {
                    $('#proposalList').DataTable({
                        language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' },
                        lengthChange: false,
                        searching: true, // <--- 1. Activamos las búsquedas
                        // 2. Modificamos el DOM para crear el espacio de la barra de búsqueda (la letra 'f')
                        dom: "<'row mb-3'<'col-sm-12 col-md-6 d-flex justify-content-start'f><'col-sm-12 col-md-6'>>" +
                            "<'table-responsive'tr>" +
                            "<'row align-items-center p-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-end'p>>",
                        drawCallback: function () {
                            $('.dataTables_paginate > .pagination').addClass('pagination-sm mb-0');
                        }
                    });
                }
            }
        });
    }

    // Ejecutar carga
    cargarTabla();

    // 4. Nuevo
    $('#btnNuevaSucursal').click(function (e) {
        e.preventDefault();
        $('#formSucursal')[0].reset();
        $('#Sucursal_action').val('crear');
        $('#sucursal_id').val('');
        $('#bloque_estatus_suc').hide();
        $('#usuarios_multi').val(null).trigger('change');
        $('#modalSucursalLabel').text('Nueva Sucursal');
        $('#modalSucursal').modal('show');
    });

    // 5. Editar
    $(document).on('click', '.btn-editar', function (e) {
        e.preventDefault();
        let id = $(this).data('id');

        $.ajax({
            url: 'api/api_ver_sucursales.php?action=get_sucursal&id=' + id,
            method: 'GET', dataType: 'json',
            success: function (res) {
                if (res.status === 'success') {
                    let s = res.data;
                    $('#sucursal_id').val(s.id_sucursal);
                    $('#Sucursal_action').val('editar');
                    $('#id_sae').val(s.id_sae);
                    $('#nombre_sucursal').val(s.nombre_sucursal);
                    $('#modalSucursalLabel').text('Editar Sucursal');
                    $('#calle').val(s.calle);
                    $('#num_ext').val(s.num_ext);
                    $('#num_int').val(s.num_int);
                    $('#entre_calle').val(s.entre_calle);
                    $('#y_calle').val(s.y_calle);
                    $('#colonia').val(s.colonia);
                    $('#cp').val(s.cp);
                    $('#poblacion').val(s.poblacion);
                    $('#municipio').val(s.municipio);
                    $('#estado').val(s.estado);
                    $('#estatus_suc').prop('checked', s.estatus === 'Y');
                    $('#bloque_estatus_suc').show();

                    $('#Empresa_id').val(s.Empresa_id);
                    $.ajax({
                        url: 'api/api_ver_sucursales.php?action=get_usuarios_empresa&empresa_id=' + s.Empresa_id,
                        method: 'GET', dataType: 'json',
                        success: function (users) {
                            let $usrMulti = $('#usuarios_multi');
                            $usrMulti.empty();
                            users.forEach(u => {
                                $usrMulti.append(`<option value="${u.id_usuario}">${u.nombre} ${u.apellido_pat} ${u.apellido_mat}</option>`);
                            });
                            $usrMulti.val(s.usuarios_asignados).trigger('change');
                        }
                    });

                    $('#modalSucursal').modal('show');
                }
            }
        });
    });

    // 6. Guardar (Submit)
    $('#formSucursal').on('submit', function (e) {
        e.preventDefault();
        let btn = $(this).find('button[type="submit"]');
        let txt = btn.text();
        btn.prop('disabled', true).text('Guardando...');

        $.ajax({
            url: 'api/api_ver_sucursales.php',
            type: 'POST',
            data: $(this).serialize(),
            success: function (res) {
                if (res.status === 'success') {
                    $('#modalSucursal').modal('hide');
                    alert(res.message);
                    cargarTabla();
                } else {
                    alert(res.message);
                }
                btn.prop('disabled', false).text(txt);
            },
            error: function () {
                alert('Error de conexión');
                btn.prop('disabled', false).text(txt);
            }
        });
    });

    // 7. Eliminar
    $(document).on('click', '.btn-eliminar', function (e) {
        e.preventDefault();
        if (confirm('¿Eliminar esta sucursal?')) {
            $.post('api/api_ver_sucursales.php', { action: 'eliminar', id_sucursal: $(this).data('id') }, function (res) {
                alert(res.message);
                cargarTabla();
            }, 'json');
        }
    });
});

/* //& Tabla sin buscador */
/* //° $(document).ready(function () {
    let tablaSucursales;

    // Inicializar Select2 Múltiple
    $('#usuarios_multi').select2({
        placeholder: "Selecciona usuarios...",
        allowClear: true,
        width: '100%',
        dropdownParent: $('#modalSucursal .modal-content')
    });

    // 1. Cargar Empresas para el Select
    $.ajax({
        url: 'api/api_cotizador.php?action=get_empresas',
        method: 'GET', dataType: 'json',
        success: function (data) {
            data.forEach(emp => {
                $('#Empresa_id').append(`<option value="${emp.id_empresa}">${emp.razon_social}</option>`);
            });
        }
    });

    // 2. Al cambiar empresa, traer sus usuarios
    $('#Empresa_id').on('change', function () {
        let empId = $(this).val();
        let $select = $('#usuarios_multi');

        // Limpiamos el Select2 antes de cargar nuevos datos
        $select.empty().trigger('change');

        if (empId) {
            $.ajax({
                url: 'api/api_ver_sucursales.php?action=get_usuarios_empresa&empresa_id=' + empId,
                method: 'GET',
                dataType: 'json',
                success: function (users) {
                    $select.empty(); // Aseguramos que esté limpio

                    if (users.length > 0) {
                        users.forEach(u => {
                            // Creamos la opción: texto a mostrar, valor (ID)
                            let newOption = new Option(`${u.nombre} ${u.apellido_pat}`, u.id_usuario, false, false);
                            $select.append(newOption);
                        });
                    }
                    // Refrescamos visualmente el Select2
                    $select.trigger('change');
                },
                error: function () {
                    console.error("Error al cargar los usuarios de la empresa.");
                }
            });
        }
    });

    // 3. Cargar DataTables
    function cargarTabla() {
        $.ajax({
            url: 'api/api_ver_sucursales.php?action=leer',
            method: 'GET', dataType: 'json',
            success: function (data) {
                let tbody = $('#all_surc');
                if ($.fn.DataTable.isDataTable('#proposalList')) { $('#proposalList').DataTable().destroy(); }
                tbody.empty();

                data.forEach((suc, index) => {
                        let badgeClass = (suc.estatus === 'Y') ? 'bg-soft-success text-success' : 'bg-soft-danger text-danger';
                        let textoEstatus = (suc.estatus === 'Y') ? 'Activa' : 'Inactiva';
                        
                        // Validaciones para que no diga "null" si el campo está vacío
                        let id_sae_display = suc.id_sae ? suc.id_sae : '<span class="text-muted">-</span>';
                                                                    '<span class="badge bg-primary"></span>'
                        let municipio_display = suc.municipio ? suc.municipio : 'Sin municipio';
                        let estado_display = suc.estado ? suc.estado : '';
                        let contacto_display = suc.contacto ? suc.contacto : '<span class="text-muted fs-11">Sin contacto asignado</span>';
                        let correo_display = suc.correo ? suc.correo : '';

                        let tr = `
                            <tr>
                                <td class="text-center align-middle"><span class="badge bg-primary fs-12">${id_sae_display}</span></td>
                                <td class="align-middle">
                                    <span class="d-block fw-bold text-dark">${suc.nombre_sucursal}</span>
                                    <small class="text-muted"><i class="feather-briefcase text-primary"></i> ${suc.razon_social || 'Sin empresa'}</small>
                                </td>
                                <td class="align-middle">
                                    <span class="d-block text-dark">${municipio_display}, ${estado_display}</span>
                                    <small class="text-muted fs-11">Ver dirección completa al editar</small>
                                </td>
                                <td class="text-center align-middle"><span class="badge ${badgeClass}">${textoEstatus}</span></td>
                                <td class="text-center align-middle">
                                    <div class="hstack gap-2 justify-content-center">
                                        <a href="#" class="avatar-text avatar-md btn-editar" data-id="${suc.id_sucursal}">
                                            <abbr title="Editar Sucursal" style="text-decoration:none;"><i class="feather-edit"></i></abbr>
                                        </a>
                                        <a href="#" class="avatar-text avatar-md btn-eliminar" data-id="${suc.id_sucursal}">
                                            <abbr title="Eliminar" style="text-decoration:none;"><i class="feather-trash-2 text-danger"></i></abbr>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        `;
                        tbody.append(tr);
                    });

                if ($.fn.DataTable) {
                    $('#proposalList').DataTable({
                        language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' },
                        lengthChange: false,
                        searching: false,
                        // ESTO ELIMINA EL ESPACIO EN BLANCO SUPERIOR Y ACOMODA LA PAGINACIÓN ABAJO
                        dom: "<'table-responsive'tr><'row align-items-center p-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-end'p>>",
                        drawCallback: function () {
                            $('.dataTables_paginate > .pagination').addClass('pagination-sm mb-0');
                        }
                    });
                }
            }
        });
    }
    cargarTabla();

    // 4. Nuevo
    $('#btnNuevaSucursal').click(function (e) {
        e.preventDefault();
        $('#formSucursal')[0].reset();
        $('#Sucursal_action').val('crear');
        $('#sucursal_id').val('');
        $('#bloque_estatus_suc').hide();
        $('#usuarios_multi').val(null).trigger('change');
        $('#modalSucursalLabel').text('Nueva Sucursal');
        $('#modalSucursal').modal('show');
    });

    // 5. Editar
    $(document).on('click', '.btn-editar', function (e) {
        e.preventDefault();
        let id = $(this).data('id');

        $.ajax({
            url: 'api/api_ver_sucursales.php?action=get_sucursal&id=' + id,
            method: 'GET', dataType: 'json',
            success: function (res) {
                if (res.status === 'success') {
                    let s = res.data;
                    $('#sucursal_id').val(s.id_sucursal);
                    $('#Sucursal_action').val('editar');
                    $('#id_sae').val(s.id_sae);
                    $('#nombre_sucursal').val(s.nombre_sucursal);

                    $('#modalSucursalLabel').text('Editar Sucursal');

                    $('#calle').val(s.calle);
                    $('#num_ext').val(s.num_ext);
                    $('#num_int').val(s.num_int);
                    $('#entre_calle').val(s.entre_calle);
                    $('#y_calle').val(s.y_calle);
                    $('#colonia').val(s.colonia);
                    $('#cp').val(s.cp);
                    $('#poblacion').val(s.poblacion);
                    $('#municipio').val(s.municipio);
                    $('#estado').val(s.estado);

                    $('#estatus_suc').prop('checked', s.estatus === 'Y');
                    $('#bloque_estatus_suc').show();

                    // Seleccionar empresa y cargar usuarios asincrónicamente
                    $('#Empresa_id').val(s.Empresa_id);
                    $.ajax({
                        url: 'api/api_ver_sucursales.php?action=get_usuarios_empresa&empresa_id=' + s.Empresa_id,
                        method: 'GET', dataType: 'json',
                        success: function (users) {
                            let $usrMulti = $('#usuarios_multi');
                            $usrMulti.empty();
                            users.forEach(u => {
                                $usrMulti.append(`<option value="${u.id_usuario}">${u.nombre} ${u.apellido_pat}</option>`);
                            });
                            // Pre-seleccionar los usuarios guardados
                            $usrMulti.val(s.usuarios_asignados).trigger('change');
                        }
                    });

                    $('#modalSucursal').modal('show');
                }
            }
        });
    });

    // 6. Guardar (Submit)
    $('#formSucursal').on('submit', function (e) {
        e.preventDefault();
        let btn = $(this).find('button[type="submit"]');
        let txt = btn.text();
        btn.prop('disabled', true).text('Guardando...');

        $.ajax({
            url: 'api/api_ver_sucursales.php',
            type: 'POST',
            data: $(this).serialize(),
            success: function (res) {
                if (res.status === 'success') {
                    $('#modalSucursal').modal('hide');
                    alert(res.message);
                    cargarTabla();
                } else {
                    alert(res.message);
                }
                btn.prop('disabled', false).text(txt);
            },
            error: function () {
                alert('Error de conexión');
                btn.prop('disabled', false).text(txt);
            }
        });
    });

    // 7. Eliminar
    $(document).on('click', '.btn-eliminar', function (e) {
        e.preventDefault();
        if (confirm('¿Eliminar esta sucursal?')) {
            $.post('api/api_ver_sucursales.php', { action: 'eliminar', id_sucursal: $(this).data('id') }, function (res) {
                alert(res.message);
                cargarTabla();
            }, 'json');
        }
    });
});  */