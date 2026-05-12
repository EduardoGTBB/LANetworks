$(document).ready(function () {

    function cargarTablaAdmin() {
        $.ajax({
            url: 'api/api_ver_usuarios.php',
            method: 'GET',
            cache: false, // Previene que el navegador esconda los cambios
            dataType: 'json',
            success: function (data) {
                let tbody = $('#table_users_admin');
                tbody.empty();

                if (data.length === 0) {
                    tbody.append('<tr><td colspan="6" class="text-center text-muted">No hay usuarios registrados.</td></tr>');
                    return;
                }

                data.forEach(function (user) {
                    let folio = user.id_user_admin.toString().padStart(4, '0');
                    let name_users_admin = `${user.admin_nombre} ${user.admin_apell_pat}`;

                    let perfilBadge = user.perfil === 'admin'
                        ? '<span class="badge bg-soft-primary text-primary">Administrador</span>'
                        : '<span class="badge bg-soft-warning text-warning">Operativo</span>';

                    // Etiqueta dinámica de estatus
                    let estatusBadge = user.estatus === 'Y'
                        ? '<span class="badge bg-soft-success text-success">Activo</span>'
                        : '<span class="badge bg-soft-danger text-danger">Inactivo</span>';

                    let permisosInfo = JSON.stringify({
                        mp_cotizador: user.mp_cotizador,
                        mp_ver_cotiz: user.mp_ver_cotiz,
                        mp_ver_clientes: user.mp_ver_clientes,
                        mp_ver_productos: user.mp_ver_productos,
                        mp_ver_usuarios: user.mp_ver_usuarios
                    });

                    let foto = (user.foto_perfil && user.foto_perfil.trim() !== '') ? user.foto_perfil : 'user.png';

                    let tr = `
                        <tr>
                            <td><div class="avatar-image avatar-md"><img src="assets/images/avatar/${foto}" alt="" class="img-fluid"></div></td>
                            <td><span class="d-block fw-bold">${name_users_admin}</span></td>
                            <td><span class="d-block fw-bold">${user.usuario_lan}</span></td>
                            <td>${perfilBadge}</td>
                            <td>${estatusBadge}</td>
                            <td class="text-center">
                                <div class="hstack gap-2 justify-content-center">
                                    <a href="#" class="avatar-text avatar-md btn-editar"
                                        data-id="${user.id_user_admin}"
                                        data-nombre="${user.admin_nombre}"
                                        data-apellido="${user.admin_apell_pat}"
                                        data-usuario="${user.usuario_lan}"
                                        data-perfil="${user.perfil}"
                                        data-estatus="${user.estatus}"
                                        data-permisos='${permisosInfo}'
                                        data-foto="${foto}">
                                        <abbr title="Editar usuario" style="text-decoration:none;"><i class="feather-edit"></i></abbr>
                                    </a>
                                    <a href="#" class="avatar-text avatar-md btn-eliminar" data-id="${user.id_user_admin}">
                                        <abbr title="Eliminar usuario" style="text-decoration:none;"><i class="feather-trash-2 text-danger"></i></abbr>
                                    </a>
                                </div>
                            </td>
                        </tr>
                    `;
                    tbody.append(tr);
                });
            },
            error: function (xhr) {
                $('#table_users_admin').html('<tr><td colspan="6" class="text-center text-danger">Error conectando a la base de datos. Revisa la consola.</td></tr>');
            }
        });
    }

    cargarTablaAdmin();

    $(document).ready(function () {
        // 1. Destruimos cualquier instancia previa que la plantilla haya creado por error
        if ($('.select-permisos').hasClass("select2-hidden-accessible")) {
            $('.select-permisos').select2('destroy');
        }

        // 2. Función de formato para colores e iconos
        function formatState(state) {
            if (!state.id) { return state.text; }

            var $el = $(state.element);
            var icon = $el.data('icon');
            var color = $el.data('color');

            var $state = $('<span class="d-flex align-items-center justify-content-start w-100"></span>');

            if (icon) {
                // Añadimos el icono. Asumo que usas Feather Icons basado en tu HTML
                $state.append('<i class="' + icon + ' me-2"></i>');
            }

            $state.append('<span>' + state.text + '</span>');

            if (color) {
                $state.addClass(color);
            }

            return $state;
        }

        // 3. Inicializamos de forma segura dentro del modal
        $('.select-permisos').select2({
            // CRÍTICO: Apuntamos al modal-content en lugar del ID general del modal
            dropdownParent: $('#modalUsersA .modal-content'),
            templateResult: formatState,
            templateSelection: formatState,
            minimumResultsForSearch: Infinity,
            width: '100%' // Asegura que no se colapse visualmente
        });
    });

    $('.show-pass, .show-pass2').click(function () {
        let input = $(this).siblings('input.password');
        let icon = $(this).find('i');
        if (input.attr('type') === 'password') {
            input.attr('type', 'text');
            icon.removeClass('feather-eye').addClass('feather-eye-off');
        } else {
            input.attr('type', 'password');
            icon.removeClass('feather-eye-off').addClass('feather-eye');
        }
    });

    $('#newPassword').on('input', function () {
        let val = $(this).val();
        let bars = $('.progress-bar div');
        bars.removeClass('bg-danger bg-warning bg-success').css('width', '0%');
        if (val.length === 0) return;
        let strength = 0;
        if (val.length >= 8) strength++;
        if (/[a-z]/.test(val) && /[A-Z]/.test(val)) strength++;
        if (/\d/.test(val) || /[^a-zA-Z\d]/.test(val)) strength++;
        if (strength === 1) { bars.eq(0).addClass('bg-danger').css('width', '25%'); }
        else if (strength === 2) { bars.slice(0, 2).addClass('bg-warning').css('width', '25%'); }
        else if (strength >= 3) { bars.slice(0, 4).addClass('bg-success').css('width', '25%'); }
    });

    $('#perfil').on('change', function () {
        let perfil = $(this).val();
        let selectsPermisos = $('select[name^="mp_"]');
        if (perfil === 'admin') {
            selectsPermisos.val('Activado').trigger('change');
            selectsPermisos.prop('disabled', true);
        } else {
            selectsPermisos.prop('disabled', false);
        }
    });

    $('#btnNuevoAdmin').click(function (e) {
        e.preventDefault();
        $('#formUserAdmin')[0].reset();
        $('#admin_action').val('crear');
        $('#admin_id').val('');
        $('#modalUserAdminLabel').text('Nuevo Usuario');

        $('#preview_foto').attr('src', 'assets/images/avatar/user.png');
        $('#input_foto').val('');

        $('#newPassword, #newPassword2').prop('required', true);
        $('#req_pass').show();
        $('#nota_pass').hide();
        $('.progress-bar div').removeClass('bg-danger bg-warning bg-success').css('width', '0%');

        $('select[name^="mp_"]').val('Desactivado').trigger('change');
        $('#perfil').val('').trigger('change');

        $('#bloque_estatus').hide();
        $('#modalUsersA').modal('show');
    });

    $(document).on('click', '.btn-editar', function (e) {
        e.preventDefault();
        $('#admin_id').val($(this).data('id'));
        $('#admin_nombre').val($(this).data('nombre'));
        $('#admin_apellidos').val($(this).data('apellido'));
        $('#usuario_lan').val($(this).data('usuario'));

        let foto = $(this).data('foto') ? $(this).data('foto') : 'user.png';
        $('#preview_foto').attr('src', 'assets/images/avatar/' + foto);
        $('#input_foto').val('');

        $('#perfil').val($(this).data('perfil')).trigger('change');

        let estatus = $(this).data('estatus');
        if (estatus === 'Y') {
            $('#estatus').prop('checked', true);
        } else {
            $('#estatus').prop('checked', false);
        }

        if ($(this).data('perfil') !== 'admin') {
            let permisosRaw = $(this).data('permisos');
            let permisos = typeof permisosRaw === 'string' ? JSON.parse(permisosRaw) : permisosRaw;

            $('select[name="mp_cotizador"]').val(permisos.mp_cotizador || 'Desactivado').trigger('change');
            $('select[name="mp_ver_cotiz"]').val(permisos.mp_ver_cotiz || 'Desactivado').trigger('change');
            $('select[name="mp_ver_clientes"]').val(permisos.mp_ver_clientes || 'Desactivado').trigger('change');
            $('select[name="mp_ver_productos"]').val(permisos.mp_ver_productos || 'Desactivado').trigger('change');
            $('select[name="mp_ver_usuarios"]').val(permisos.mp_ver_usuarios || 'Desactivado').trigger('change');
        }

        $('#newPassword, #newPassword2').val('').prop('required', false);
        $('#req_pass').hide();
        $('#nota_pass').show();
        $('.progress-bar div').removeClass('bg-danger bg-warning bg-success').css('width', '0%');

        $('#admin_action').val('editar');
        $('#modalUserAdminLabel').text('Editar Usuario');

        $('#bloque_estatus').show();
        $('#modalUsersA').modal('show');
    });

    $('#input_foto').change(function (e) {
        let reader = new FileReader();
        reader.onload = function (e) {
            $('#preview_foto').attr('src', e.target.result);
        }
        if (this.files[0]) reader.readAsDataURL(this.files[0]);
    });

    $(document).on('submit', '#formUserAdmin', function (e) {
        e.preventDefault();

        let pass1 = $('#newPassword').val();
        let pass2 = $('#newPassword2').val();

        if (pass1 !== "" || pass2 !== "") {
            if (pass1 !== pass2) {
                alert("Error: Las contraseñas no coinciden. Por favor verifícalas.");
                $('#newPassword').focus();
                return;
            }
        }

        // Habilitamos los permisos temporalmente para empaquetarlos
        let disabledSelects = $('select[name^="mp_"]');
        disabledSelects.prop('disabled', false);

        let formData = new FormData(this);

        if ($('#perfil').val() === 'admin') {
            disabledSelects.prop('disabled', true);
        }

        $.ajax({
            url: 'api/api_ver_usuarios.php',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function (response) {
                if (response.status === 'success') {
                    $('#modalUsersA').modal('hide');
                    $('.modal-backdrop').remove();
                    cargarTablaAdmin();
                    alert(response.message);
                } else {
                    alert("Error: " + response.message);
                }
            },
            error: function (xhr) {
                alert("Error de BD. Revisa la consola.");
            }
        });
    });

    $(document).on('click', '.btn-eliminar', function (e) {
        e.preventDefault();
        let id_admin = $(this).data('id');

        if (confirm("¿Estás seguro de eliminar este usuario de LAN? Si tiene cotizaciones, solo se inactivará.")) {
            $.ajax({
                url: 'api/api_ver_usuarios.php',
                type: 'POST',
                data: { action: 'eliminar', id_user_admin: id_admin },
                dataType: 'json',
                success: function (response) {
                    if (response.status === 'success' || response.status === 'warning') {
                        alert(response.message);
                        cargarTablaAdmin();
                    } else { alert("Error: " + response.message); }
                }
            });
        }
    });
});