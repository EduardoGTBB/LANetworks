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

        $('#Empresa_id').val('').trigger('change');

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

        // Reset del indicador de fuerza
        $('#pw_strength_container, #pw_strength_text').hide();
        $('#pw_strength_bar').css('width', '0%');
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
        $('#Empresa_id').val($(this).data('empresa')).trigger('change');

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

    // [fn] ==============================================
    // [fn]       8. MOSTRAR / OCULTAR CONTRASEÑAS
    // [fn] ==============================================
    $(document).on('click', '.toggle-password', function (e) {
        e.preventDefault();
        
        // Leemos a qué input controla este botón
        let targetId = $(this).data('target');
        let $input = $(targetId);
        let $icon = $(this).find('i');

        if ($input.attr('type') === 'password') {
            $input.attr('type', 'text');
            $icon.removeClass('feather-eye-off').addClass('feather-eye'); // Ojo abierto
        } else {
            $input.attr('type', 'password');
            $icon.removeClass('feather-eye').addClass('feather-eye-off'); // Ojo cerrado
        }
    });

    // [fn] ==============================================
    // [fn]   9. GENERADOR DE CONTRASEÑAS (CIBERSEGURO)
    // [fn] ==============================================
    $(document).on('click', '#btn_generar_password', function (e) {
        e.preventDefault();
        
        // 🛡️ Motor criptográficamente seguro
        let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*+?";
        let length = 16;
        let generatedPassword = "";
        let array = new Uint32Array(length);
        
        window.crypto.getRandomValues(array);
        for (let i = 0; i < length; i++) {
            generatedPassword += chars[array[i] % chars.length];
        }

        // 1. Copiamos la contraseña en AMBOS campos
        $('#usuario_password').val(generatedPassword);
        $('#confirmar_password').val(generatedPassword);

        // 2. Cambiamos el tipo a "text" para que el usuario pueda ver y copiar la contraseña generada
        $('#usuario_password, #confirmar_password').attr('type', 'text');
        
        // 3. Sincronizamos los iconos visuales al estado de "Ojo abierto"
        $('.toggle-password i').removeClass('feather-eye-off').addClass('feather-eye');

        // 4. Disparamos la evaluación visual para que la barra se pinte de verde
        $('#usuario_password').trigger('input');
    });

    // [fn] ==============================================
    // [fn]  10. INDICADOR DE FUERZA DE CONTRASEÑA
    // [fn] ==============================================
    $(document).on('input', '#usuario_password', function () {
        let val = $(this).val();
        let $container = $('#pw_strength_container');
        let $bar = $('#pw_strength_bar');
        let $text = $('#pw_strength_text');

        if (val === '') {
            $container.hide();
            $text.hide();
            return;
        }

        $container.show();
        $text.show();

        // 1. Evaluación estricta de longitud mínima (Menos de 8 es inaceptable)
        if (val.length < 8) {
            $bar.removeClass('bg-warning bg-info bg-success').addClass('bg-danger');
            $text.removeClass('text-warning text-info text-success').addClass('text-danger');
            $bar.css('width', '25%');
            $text.text('Muy corta (Mínimo 8 caracteres)');
            return;
        }

        // 2. Algoritmo de evaluación por complejidad y longitud
        let score = 0;
        
        // Complejidad (Hasta 75 puntos)
        if (val.match(/[a-z]/) && val.match(/[A-Z]/)) score += 25; // Mayúsculas y minúsculas
        if (val.match(/\d/)) score += 25; // Números
        if (val.match(/[^a-zA-Z\d]/)) score += 25; // Símbolos

        // Longitud óptima (25 puntos adicionales)
        if (val.length >= 16) score += 25;

        // Reset visual
        $bar.removeClass('bg-danger bg-warning bg-info bg-success');
        $text.removeClass('text-danger text-warning text-info text-success');
        $bar.css('width', score + '%');

        // Renderizado según puntuación
        if (score <= 50) {
            $bar.addClass('bg-warning');
            $text.text('Regular (Añade símbolos o números)').addClass('text-warning');
        } else if (score === 75) {
            $bar.addClass('bg-info');
            // ✨ UX: Le indicamos al administrador exactamente qué le falta
            $text.text('Buena (Llega a 16 caracteres para hacerla Fuerte)').addClass('text-info');
        } else if (score === 100) {
            $bar.addClass('bg-success');
            $text.text('Fuerte y Segura').addClass('text-success');
        }
    });
});