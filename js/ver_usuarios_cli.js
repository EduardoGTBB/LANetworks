$(document).ready(function () {
    //| Mayuscuals en los campos de Nombre y Apellidos  
    $('#nombre, #apellido_pat, #apellido_mat').on('input', function() {
        $(this).val($(this).val().toUpperCase());
    });

    // [fn] ==============================================
    // [fn]   1.CARGAR EMPRESAS PARA EL SELECT
    // [fn] ==============================================
    function cargarEmpresas() {
        $.ajax({
            url: 'api/api_cotizador.php?action=get_empresas',
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                let $select = $('#Empresa_id');
                $select.empty().append('<option value="">Selecciona una empresa...</option>');
                data.forEach(function (empresa) {
                    $select.append(`<option value="${empresa.id_empresa}">${empresa.razon_social}</option>`);
                });

                $select.select2({
                    width: '100%',
                    dropdownParent: $('#modalUsuario .modal-content') // Evita que se esconda detrás del modal
                });
            }
        });
    }

    // [fn] ==============================================
    // [fn]  2. CARGAR LA TABLA DE USUARIOS CLIENTES
    // [fn] ==============================================
    function cargarTabla() {
        $.ajax({
            url: 'api/api_ver_usuarios_cli.php?action=leer',
            method: 'GET',
            cache: false,
            dataType: 'json',
            success: function (data) {
                let tbody = $('#all_users');
                
                // DESTRUCCIÓN SEGURA: Para evitar el error de "Cannot reinitialise"
                if ($.fn.DataTable.isDataTable('#proposalList')) {
                    $('#proposalList').DataTable().clear().destroy();
                }

                tbody.empty();

                if (data.length === 0) {
                    tbody.append('<tr><td colspan="6" class="text-center text-muted">No hay usuarios registrados.</td></tr>');
                    return;
                }

                // Dibujamos las filas con tu diseño original
                data.forEach(function (usr) {
                    let name_usuario = `${usr.nombre} ${usr.apellido_pat} ${usr.apellido_mat}`;
                    let foto = (usr.foto_perfil && usr.foto_perfil.trim() !== '') ? usr.foto_perfil : 'user.png';

                    let estatusBadge = usr.activo === 'true' 
                        ? '<span class="badge bg-soft-success text-success">Activo</span>' 
                        : '<span class="badge bg-soft-danger text-danger">Inactivo</span>';

                    let tr = `
                        <tr>
                            <td>
                                <div class="avatar-image avatar-md border border-gray-200">
                                    <img src="assets/images/avatar/${foto}" alt="" class="img-fluid">
                                </div>
                            </td>
                            <td><span class="d-block fw-bold">${name_usuario}</span></td>
                            <td><span class="d-block fw-bold">${usr.correo}</span></td>
                            <td><span class="d-block text-muted">${usr.razon_social}</span></td>
                            
                            <td>${estatusBadge}</td>
                            
                            <td class="text-center">
                                <div class="hstack gap-2 justify-content-center">
                                    <a href="#" class="avatar-text avatar-md btn-editar" 
                                        data-id="${usr.id_usuario}"
                                        data-nombre="${usr.nombre}"
                                        data-pat="${usr.apellido_pat}"
                                        data-mat="${usr.apellido_mat}"
                                        data-correo="${usr.correo}"
                                        data-empresa="${usr.Empresa_id}"
                                        data-activo="${usr.activo}" 
                                        data-foto="${foto}">
                                        <abbr title="Editar" style="text-decoration:none;"><i class="feather-edit"></i></abbr>
                                    </a>
                                    <a href="#" class="avatar-text avatar-md btn-eliminar" data-id="${usr.id_usuario}">
                                        <abbr title="Eliminar" style="text-decoration:none;"><i class="feather-trash-2 text-danger"></i></abbr>
                                    </a>
                                </div>
                            </td>
                        </tr>
                    `;
                    tbody.append(tr);
                });

                // INICIALIZAR DATATABLES (Buscador a la izquierda)
                if ($.fn.DataTable) {
                    $('#proposalList').DataTable({
                        language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' },
                        lengthChange: false,
                        searching: true, // Activamos el buscador
                        // Acomodamos el DOM para poner el buscador ('f') a la izquierda
                        dom: "<'row mb-3'<'col-sm-12 col-md-6 d-flex justify-content-start'f><'col-sm-12 col-md-6'>>" +
                             "<'table-responsive'tr>" +
                             "<'row align-items-center p-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-end'p>>",
                        columnDefs: [
                            { orderable: false, targets: [0, 5] } // No permite ordenar por la columna de Foto (0) ni la de Botones (5)
                        ],
                        drawCallback: function () {
                            $('.dataTables_paginate > .pagination').addClass('pagination-sm mb-0');
                        }
                    });
                }
            },
            error: function (xhr) {
                $('#all_users').html('<tr><td colspan="6" class="text-center text-danger">Error cargando la tabla de usuarios.</td></tr>');
            }
        });
    }

    cargarEmpresas();
    cargarTabla();

    // [fn] ==============================================
    // [fn]          3. VISUALIZAR FOTO
    // [fn] ==============================================
    $('#input_foto_cli').change(function(e) {
        let reader = new FileReader();
        reader.onload = function(e) {
            $('#preview_foto_cli').attr('src', e.target.result);
        }
        if(this.files[0]) reader.readAsDataURL(this.files[0]);
    });

    // [fn] ==============================================
    // [fn]       4. ABRIR MODAL PARA NUEVO USUARIO
    // [fn] ==============================================
    $('#btnNuevoUsuario').click(function (e) {
        e.preventDefault();
        $('#formUsuario')[0].reset();

        $('.progress-bar div').css('background-color', '#e5e7eb');
        $('#usuario_password, #confirmar_password').attr('type', 'password');

        $('#usuario_action').val('crear');
        $('#usuario_id').val('');
        
        $('#preview_foto_cli').attr('src', 'assets/images/avatar/user.png');
        $('#input_foto_cli').val('');
        
        // Ocultamos el bloque de estatus, los nuevos siempre son activos
        $('#bloque_estatus_usr').hide();
        
        $('#usuario_password, #confirmar_password').prop('required', true);
        $('#req_pass, #req_pass2').show();
        $('#nota_pass').hide();

        $('#modalUsuarioLabel').text('Nuevo Usuario');
        $('#modalUsuario').modal('show');
    });

    // [fn] ==============================================
    // [fn]         5. MODAL PARA EDITAR USUARIO
    // [fn] ==============================================
    $(document).on('click', '.btn-editar', function (e) {
        e.preventDefault();
        $('#usuario_id').val($(this).data('id'));
        $('#nombre').val($(this).data('nombre'));
        $('#apellido_pat').val($(this).data('pat'));
        $('#apellido_mat').val($(this).data('mat'));
        $('#correo').val($(this).data('correo'));
        $('#Empresa_id').val($(this).data('empresa'));

        let foto = $(this).data('foto') ? $(this).data('foto') : 'user.png';
        $('#preview_foto_cli').attr('src', 'assets/images/avatar/' + foto);
        $('#input_foto_cli').val('');

        let activo = $(this).data('activo');
        if (activo === true || activo === 'true') {
            $('#estatus_usr').prop('checked', true);
        } else {
            $('#estatus_usr').prop('checked', false);
        }
        
        $('#bloque_estatus_usr').show();

        $('#usuario_password, #confirmar_password').val('').prop('required', false);
        $('#req_pass, #req_pass2').hide();
        $('#nota_pass').show();

        $('#usuario_action').val('editar');
        $('#modalUsuarioLabel').text('Editar Usuario');
        $('#modalUsuario').modal('show');
    });

    // [fn] ==============================================
    // [fn]             6. GUARDAR FORMULARIO
    // [fn] ==============================================
    $(document).on('submit', '#formUsuario', function (e) {
        e.preventDefault();

        // Validación de contraseñas iguales
        let pass1 = $('#usuario_password').val();
        let pass2 = $('#confirmar_password').val();

        if (pass1 !== "" || pass2 !== "") {
            if (pass1 !== pass2) {
                alert("Error: Las contraseñas no coinciden. Por favor verifícalas.");
                $('#usuario_password').focus();
                return;
            }
        }
        
        let formData = new FormData(this);

        $.ajax({
            url: 'api/api_ver_usuarios_cli.php',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function (response) {
                if (response.status === 'success') {
                    $('#modalUsuario').modal('hide');
                    $('.modal-backdrop').remove(); 
                    cargarTabla(); 
                    alert(response.message);
                } else {
                    alert("Error: " + response.message);
                }
            },
            error: function (xhr) {
                alert("Error de BD. Revisa la consola.");
                console.error("Respuesta del servidor: ", xhr.responseText);
            }
        });
    });

    // [fn] ==============================================
    // [fn]              7. ELIMINAR USUARIO
    // [fn] ==============================================
    $(document).on('click', '.btn-eliminar', function (e) {
        e.preventDefault();
        let id_usuario = $(this).data('id');

        if (confirm("¿Estás seguro de eliminar este usuario? Si ya tiene cotizaciones, solo se inactivará.")) {
            $.ajax({
                url: 'api/api_ver_usuarios_cli.php',
                type: 'POST',
                data: { action: 'eliminar', id_usuario: id_usuario },
                dataType: 'json',
                success: function (response) {
                    if (response.status === 'success' || response.status === 'warning') {
                        alert(response.message);
                        cargarTabla(); 
                    } else {
                        alert("Error: " + response.message);
                    }
                }
            });
        }
    });
});
/* //° $(document).ready(function () {
    // ==========================================
    // 1. CARGAR EMPRESAS PARA EL SELECT
    // ==========================================
    function cargarEmpresas() {
        $.ajax({
            url: 'api/api_cotizador.php?action=get_empresas',
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                let $select = $('#Empresa_id');
                $select.empty().append('<option value="">Selecciona una empresa...</option>');
                data.forEach(function (empresa) {
                    $select.append(`<option value="${empresa.id_empresa}">${empresa.razon_social}</option>`);
                });
            }
        });
    }

    // ==========================================
    // 2. CARGAR LA TABLA DE USUARIOS CLIENTES
    // ==========================================
    function cargarTabla() {
        $.ajax({
            // url: 'api/api_ver_all_users.php?action=leer',
            url: 'api/api_ver_usuarios_cli.php?action=leer',
            method: 'GET',
            cache: false,
            dataType: 'json',
            success: function (data) {
                let tbody = $('#all_users');
                tbody.empty();

                if (data.length === 0) {
                    tbody.append('<tr><td colspan="6" class="text-center text-muted">No hay usuarios registrados.</td></tr>');
                    return;
                }

                data.forEach(function (usr) {
                    let name_usuario = `${usr.nombre} ${usr.apellido_pat} ${usr.apellido_mat}`;
                    let foto = (usr.foto_perfil && usr.foto_perfil.trim() !== '') ? usr.foto_perfil : 'user.png';

                    // ¡AQUÍ ESTÁ EL AJUSTE! Validamos exactamente el texto 'true'
                    let estatusBadge = usr.activo === 'true' 
                        ? '<span class="badge bg-soft-success text-success">Activo</span>' 
                        : '<span class="badge bg-soft-danger text-danger">Inactivo</span>';

                    let tr = `
                        <tr>
                            <td>
                                <div class="avatar-image avatar-md border border-gray-200">
                                    <img src="assets/images/avatar/${foto}" alt="" class="img-fluid">
                                </div>
                            </td>
                            <td><span class="d-block fw-bold">${name_usuario}</span></td>
                            <td><span class="d-block fw-bold">${usr.correo}</span></td>
                            <td><span class="d-block text-muted">${usr.razon_social}</span></td>
                            
                            <td>${estatusBadge}</td>
                            
                            <td class="text-center">
                                <div class="hstack gap-2 justify-content-center">
                                    <a href="#" class="avatar-text avatar-md btn-editar" 
                                        data-id="${usr.id_usuario}"
                                        data-nombre="${usr.nombre}"
                                        data-pat="${usr.apellido_pat}"
                                        data-mat="${usr.apellido_mat}"
                                        data-correo="${usr.correo}"
                                        data-empresa="${usr.Empresa_id}"
                                        data-activo="${usr.activo}" 
                                        data-foto="${foto}">
                                        <abbr title="Editar" style="text-decoration:none;"><i class="feather-edit"></i></abbr>
                                    </a>
                                    <a href="#" class="avatar-text avatar-md btn-eliminar" data-id="${usr.id_usuario}">
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
                $('#all_users').html('<tr><td colspan="6" class="text-center text-danger">Error cargando la tabla de usuarios.</td></tr>');
            }
        });
    }

    cargarEmpresas();
    cargarTabla();

    // ==========================================
    // 3. PREVISUALIZAR FOTO
    // ==========================================
    $('#input_foto_cli').change(function(e) {
        let reader = new FileReader();
        reader.onload = function(e) {
            $('#preview_foto_cli').attr('src', e.target.result);
        }
        if(this.files[0]) reader.readAsDataURL(this.files[0]);
    });

    // ==========================================
    // 4. ABRIR MODAL PARA NUEVO USUARIO
    // ==========================================
    $('#btnNuevoUsuario').click(function (e) {
        e.preventDefault();
        $('#formUsuario')[0].reset();
        $('#usuario_action').val('crear');
        $('#usuario_id').val('');
        
        $('#preview_foto_cli').attr('src', 'assets/images/avatar/user.png');
        $('#input_foto_cli').val('');
        
        // Ocultamos el bloque de estatus, los nuevos siempre son activos
        $('#bloque_estatus_usr').hide();
        
        $('#usuario_password, #confirmar_password').prop('required', true);
        $('#req_pass, #req_pass2').show();
        $('#nota_pass').hide();

        $('#modalUsuarioLabel').text('Nuevo Usuario');
        $('#modalUsuario').modal('show');
    });

    // ==========================================
    // 5. ABRIR MODAL PARA EDITAR USUARIO
    // ==========================================
    $(document).on('click', '.btn-editar', function (e) {
        e.preventDefault();
        $('#usuario_id').val($(this).data('id'));
        $('#nombre').val($(this).data('nombre'));
        $('#apellido_pat').val($(this).data('pat'));
        $('#apellido_mat').val($(this).data('mat'));
        $('#correo').val($(this).data('correo'));
        $('#Empresa_id').val($(this).data('empresa'));

        let foto = $(this).data('foto') ? $(this).data('foto') : 'user.png';
        $('#preview_foto_cli').attr('src', 'assets/images/avatar/' + foto);
        $('#input_foto_cli').val('');

        // ¡AJUSTE PARA EL SWITCH (true/false)!
        let activo = $(this).data('activo');
        if (activo === true || activo === 'true') {
            $('#estatus_usr').prop('checked', true);
        } else {
            $('#estatus_usr').prop('checked', false);
        }
        
        $('#bloque_estatus_usr').show();

        $('#usuario_password, #confirmar_password').val('').prop('required', false);
        $('#req_pass, #req_pass2').hide();
        $('#nota_pass').show();

        $('#usuario_action').val('editar');
        $('#modalUsuarioLabel').text('Editar Usuario');
        $('#modalUsuario').modal('show');
    });

    // ==========================================
    // 6. GUARDAR FORMULARIO
    // ==========================================
    $(document).on('submit', '#formUsuario', function (e) {
        e.preventDefault();

        // Validación de contraseñas iguales
        let pass1 = $('#usuario_password').val();
        let pass2 = $('#confirmar_password').val();

        if (pass1 !== "" || pass2 !== "") {
            if (pass1 !== pass2) {
                alert("Error: Las contraseñas no coinciden. Por favor verifícalas.");
                $('#usuario_password').focus();
                return;
            }
        }
        
        let formData = new FormData(this);

        $.ajax({
            url: 'api/api_ver_usuarios_cli.php',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function (response) {
                if (response.status === 'success') {
                    $('#modalUsuario').modal('hide');
                    $('.modal-backdrop').remove(); 
                    cargarTabla(); 
                    alert(response.message);
                } else {
                    alert("Error: " + response.message);
                }
            },
            error: function (xhr) {
                alert("Error de BD. Revisa la consola.");
                console.error("Respuesta del servidor: ", xhr.responseText);
            }
        });
    });

    // ==========================================
    // 7. ELIMINAR USUARIO
    // ==========================================
    $(document).on('click', '.btn-eliminar', function (e) {
        e.preventDefault();
        let id_usuario = $(this).data('id');

        if (confirm("¿Estás seguro de eliminar este usuario? Si ya tiene cotizaciones, solo se inactivará.")) {
            $.ajax({
                url: 'api/api_ver_usuarios_cli.php',
                type: 'POST',
                data: { action: 'eliminar', id_usuario: id_usuario },
                dataType: 'json',
                success: function (response) {
                    // ¡AJUSTE! Aceptamos status 'success' (borrado) y 'warning' (inactivado por candado)
                    if (response.status === 'success' || response.status === 'warning') {
                        alert(response.message);
                        cargarTabla(); 
                    } else {
                        alert("Error: " + response.message);
                    }
                }
            });
        }
    });
}); */