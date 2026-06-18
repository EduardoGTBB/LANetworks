$(document).ready(function () {

    // ✨ 0. INICIALIZAR SELECT2 PARA MODAL
    $('#Empresa_id').select2({
        dropdownParent: $('#modalPlaza'),
        width: '100%',
        placeholder: "Selecciona una empresa..."
    });

    $('#atencion_a_1').select2({
        dropdownParent: $('#modalPlaza'),
        width: '100%',
        placeholder: "Selecciona un contacto..."
    });

    $('#atencion_a_2').select2({
        dropdownParent: $('#modalPlaza'),
        width: '100%',
        placeholder: "Opcional: Selecciona un contacto..."
    });


    // 1. Forzar mayúsculas
    $('#formPlaza').on('input', '.mayusculas, #nombre_plaza', function() {
        $(this).val($(this).val().toUpperCase());
    });

    // 2. Cargar Empresas una sola vez
    $.ajax({
        url: 'api/api_cotizador.php?action=get_empresas',
        method: 'GET', dataType: 'json',
        success: function (data) {
            let $select = $('#Empresa_id');
            $select.empty().append('<option value="">Selecciona una empresa...</option>');
            data.forEach(emp => {
                $select.append(`<option value="${emp.id_empresa}">${emp.razon_social}</option>`);
            });
            $select.trigger('change.select2');
            cargarTabla();
        }
    });

    // 2.1 FUNCIÓN PARA CARGAR CONTACTOS DINÁMICOS
    function cargarContactosPorEmpresa(empresa_id, callback = null) {
        let $c1 = $('#atencion_a_1');
        let $c2 = $('#atencion_a_2');

        if (!empresa_id) {
            $c1.empty().append('<option value="">Seleccione una empresa primero...</option>').trigger('change.select2');
            $c2.empty().append('<option value="">Seleccione una empresa primero...</option>').trigger('change.select2');
            if (callback) callback();
            return;
        }

        $c1.empty().append('<option value="">Cargando contactos...</option>').trigger('change.select2');
        $c2.empty().append('<option value="">Cargando contactos...</option>').trigger('change.select2');

        $.ajax({
            url: 'api/api_ver_sucursales.php?action=get_usuarios_empresa&empresa_id=' + empresa_id,
            method: 'GET', dataType: 'json',
            success: function (users) {
                $c1.empty().append('<option value="">Selecciona un contacto...</option>');
                $c2.empty().append('<option value="">Opcional: Selecciona un contacto...</option>');
                
                users.forEach(u => {
                    let nombreCompleto = `${u.nombre} ${u.apellido_pat} ${u.apellido_mat || ''}`.trim().toUpperCase();
                    $c1.append(`<option value="${nombreCompleto}">${nombreCompleto}</option>`);
                    $c2.append(`<option value="${nombreCompleto}">${nombreCompleto}</option>`);
                });

                $c1.trigger('change.select2');
                $c2.trigger('change.select2');

                if (callback) callback();
            }
        });
    }

    // 2.2 Evento: Cuando el usuario elige otra empresa en el Select2
    $('#Empresa_id').on('change', function() {
        if($(this).val()) {
            cargarContactosPorEmpresa($(this).val());
        }
    });


    // 3. FUNCIÓN VISUAL INTELIGENTE
    function formatearApilado(cadena) {
        if (!cadena) return '<span class="text-muted">N/A</span>';
        let items = cadena.split('||').map(item => item.trim());
        let todosIguales = items.every(val => val === items[0]);

        if (items.length === 1 || todosIguales) {
            return items[0]; 
        }

        let html = '<div class="d-flex flex-column" style="font-size: 11px; line-height: 1.4;">';
        items.forEach((item, index) => {
            let color = index === 0 ? 'primary' : 'warning';
            let borde = index > 0 ? 'border-top pt-1 mt-1' : 'mb-1';
            html += `<div class="${borde}"><span class="badge bg-soft-${color} text-${color} px-1 me-1">${index + 1}</span> ${item}</div>`;
        });
        html += '</div>';
        
        return html;
    }

    // 4. Cargar Tabla
    function cargarTabla() {
        $.ajax({
            url: 'api/api_ver_plazas.php?action=leer',
            method: 'GET',
            success: function (data) {
                let tbody = $('#tabla_plazas');
                let $tabla = $('#tablePlazas');
                if ($.fn.DataTable.isDataTable($tabla)) { $tabla.DataTable().destroy(); }
                tbody.empty();

                data.forEach(function (p) {
                    let badge = p.estatus === 'Y' ? '<span class="badge bg-soft-success text-success">Activo</span>' : '<span class="badge bg-soft-danger text-danger">Inactivo</span>';
                    
                    let htmlContactos = formatearApilado(p.contactos);
                    let htmlCalles = formatearApilado(p.calles);

                    tbody.append(`
                        <tr>
                            <td class="align-middle"><strong>${p.nombre_plaza}</strong></td>
                            <td class="text-center align-middle"><span class="badge bg-soft-primary text-primary fw-bold">${p.total_domicilios}</span></td>
                            <td class="align-middle">${htmlContactos}</td>
                            <td class="align-middle">${htmlCalles}</td>
                            <td class="align-middle">${p.municipio_principal || ''}, ${p.estado_principal || ''}</td>
                            <td class="align-middle">${badge}</td>
                            <td class="text-center align-middle">
                                <div class="hstack gap-2 justify-content-center">
                                    <a href="#" class="avatar-text avatar-md btn-editar" data-id="${p.id_plaza}"><i class="feather-edit"></i></a>
                                    <a href="#" class="avatar-text avatar-md btn-eliminar" data-id="${p.id_plaza}"><i class="feather-trash-2 text-danger"></i></a>
                                </div>
                            </td>
                        </tr>
                    `);
                });

                $tabla.DataTable({ 
                    language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' }, 
                    pageLength: 10,
                    dom: '<"table-responsive"t><"row align-items-center p-3"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
                    order: [[0, 'asc']]
                });
            }
        });
    }

    // 5. Buscador General
    $('#buscador_personalizado').on('keyup', function () {
        let tabla = $('#tablePlazas').DataTable();
        tabla.search(this.value).draw();
    });

    // 6. GUARDAR
    $('#formPlaza').on('submit', function (e) {
        e.preventDefault();
        
        let $btn = $(this).find('button[type="submit"]');
        let textoOriginal = $btn.text();
        $btn.prop('disabled', true).text('Guardando...');

        $.ajax({
            url: 'api/api_ver_plazas.php',
            type: 'POST',
            dataType: 'json',
            data: $(this).serialize(),
            success: function (res) {
                if (res.status === 'success') {
                    $('#modalPlaza').modal('hide');
                    cargarTabla();
                    alert(res.message);
                } else {
                    alert(res.message);
                }
            },
            error: function (xhr) {
                alert('Ocurrió un error al guardar. Revisa la consola.');
                console.error(xhr.responseText);
            },
            complete: function () {
                $btn.prop('disabled', false).text(textoOriginal);
            }
        });
    });

    // 7. EDITAR
    $(document).on('click', '.btn-editar', function (e) {
        e.preventDefault();
        let id = $(this).data('id');
        
        $.ajax({
            url: 'api/api_ver_plazas.php?action=get_plaza&id=' + id,
            method: 'GET',
            success: function (res) {
                if (res.status === 'success') {
                    $('#formPlaza')[0].reset(); 
                    $('.switch-clonador').prop('checked', false); 
                    
                    let p = res.data;
                    $('#action').val('guardar');
                    $('#id_plaza').val(p.id_plaza); 
                    $('#nombre_plaza').val(p.nombre_plaza);
                    $('#estatus').prop('checked', p.estatus === 'Y');
                    
                    $('#Empresa_id').val(p.Empresa_id ? p.Empresa_id : '').trigger('change.select2'); 
                    
                    cargarContactosPorEmpresa(p.Empresa_id, function() {
                        if (p.domicilios && p.domicilios.length > 0) {
                            let d1 = p.domicilios[0];
                            if ($('#atencion_a_1 option[value="'+d1.atencion_a+'"]').length === 0 && d1.atencion_a !== '') {
                                $('#atencion_a_1').append(`<option value="${d1.atencion_a}">${d1.atencion_a}</option>`);
                            }
                            
                            $('#atencion_a_1').val(d1.atencion_a).trigger('change.select2');
                            $('#calle_1').val(d1.calle);
                            $('#num_ext_1').val(d1.num_ext);
                            $('#num_int_1').val(d1.num_int);
                            
                            // ✨ CORRECCIÓN: Cargamos entre_calle y y_calle en la edición del Domicilio 1
                            $('#entre_calle_1').val(d1.entre_calle);
                            $('#y_calle_1').val(d1.y_calle);

                            $('#colonia_1').val(d1.colonia);
                            $('#localidad_1').val(d1.localidad);
                            $('#municipio_1').val(d1.municipio);
                            $('#estado_1').val(d1.estado);
                            $('#cp_1').val(d1.cp);
                            $('#telefono_1').val(d1.telefono);
                        }

                        if (p.domicilios && p.domicilios.length > 1) {
                            let d2 = p.domicilios[1];
                            if ($('#atencion_a_2 option[value="'+d2.atencion_a+'"]').length === 0 && d2.atencion_a !== '') {
                                $('#atencion_a_2').append(`<option value="${d2.atencion_a}">${d2.atencion_a}</option>`);
                            }

                            $('#atencion_a_2').val(d2.atencion_a).trigger('change.select2');
                            $('#calle_2').val(d2.calle);
                            $('#num_ext_2').val(d2.num_ext);
                            $('#num_int_2').val(d2.num_int);
                            
                            // ✨ CORRECCIÓN: Cargamos entre_calle y y_calle en la edición del Domicilio 2
                            $('#entre_calle_2').val(d2.entre_calle);
                            $('#y_calle_2').val(d2.y_calle);

                            $('#colonia_2').val(d2.colonia);
                            $('#localidad_2').val(d2.localidad);
                            $('#municipio_2').val(d2.municipio);
                            $('#estado_2').val(d2.estado);
                            $('#cp_2').val(d2.cp);
                            $('#telefono_2').val(d2.telefono);
                        }
                    });

                    $('.modal-title').text('Editar Plaza Logística');
                    
                    // ✨ CORRECCIÓN: Cambiar texto del botón a "Guardar Cambios"
                    $('#formPlaza button[type="submit"]').text('Guardar Cambios');

                    $('#modalPlaza').modal('show');
                }
            }
        });
    });

    // 8. NUEVO
    $(document).on('click', '#btnNuevaPlaza', function (e) {
        e.preventDefault();
        $('#formPlaza')[0].reset();
        $('#action').val('guardar');
        $('#id_plaza').val(''); 
        
        $('#Empresa_id').val('').trigger('change.select2');
        cargarContactosPorEmpresa(''); 

        $('#estatus').prop('checked', true);
        $('.switch-clonador').prop('checked', false);
        $('.modal-title').text('Nueva Plaza Logística');
        
        // ✨ CORRECCIÓN: Restaurar texto original del botón en creaciones nuevas
        $('#formPlaza button[type="submit"]').text('Guardar Plaza');

        $('#modalPlaza').modal('show');
    });

    // 9. ELIMINAR
    $(document).on('click', '.btn-eliminar', function (e) {
        e.preventDefault();
        if (confirm("¿Estás seguro de eliminar por completo esta Plaza y todas sus direcciones?")) {
            $.ajax({
                url: 'api/api_ver_plazas.php',
                type: 'POST',
                data: { action: 'eliminar', id_plaza: $(this).data('id') },
                success: function (res) {
                    if (res.status === 'success') {
                        cargarTabla();
                    } else { alert(res.message); }
                }
            });
        }
    });

    // ==========================================================
    // 10. PANEL DE CLONACIÓN INTELIGENTE (DOMICILIO 2)
    // ==========================================================
    const camposContacto = ['atencion_a', 'telefono'];
    const camposDireccion = ['calle', 'num_ext', 'num_int', 'entre_calle', 'y_calle', 'colonia', 'localidad', 'cp', 'municipio', 'estado'];

    function clonarCampos(arregloCampos, limpiarSiFalso = false) {
        arregloCampos.forEach(campo => {
            let $campoDestino = $('#' + campo + '_2');
            if (limpiarSiFalso) {
                $campoDestino.val('');
            } else {
                $campoDestino.val($('#' + campo + '_1').val());
            }
            
            if ($campoDestino.hasClass('select2-hidden-accessible')) {
                $campoDestino.trigger('change.select2');
            }
        });
    }

    $('#switchCopiarContacto').change(function() {
        if ($(this).is(':checked')) {
            clonarCampos(camposContacto);
        } else {
            clonarCampos(camposContacto, true);
        }
    });

    $('#switchCopiarUbicacion').change(function() {
        if ($(this).is(':checked')) {
            clonarCampos(camposDireccion);
        } else {
            clonarCampos(camposDireccion, true);
        }
    });

    $('#formPlaza').on('input change', 'input[id$="_1"]_1, select[id$="_1"]', function() {
        let idBase = $(this).attr('id').replace('_1', '');
        let copiaContacto = $('#switchCopiarContacto').is(':checked') && camposContacto.includes(idBase);
        let copiaDireccion = $('#switchCopiarUbicacion').is(':checked') && camposDireccion.includes(idBase);

        if (copiaContacto || copiaDireccion) {
            let $destino = $('#' + idBase + '_2');
            $destino.val($(this).val());
            if ($destino.hasClass('select2-hidden-accessible')) {
                $destino.trigger('change.select2');
            }
        }
    });

    $('#formPlaza').on('input change', 'input[id$="_2"], select[id$="_2"]', function() {
        let idBase = $(this).attr('id').replace('_2', '');
        if (camposContacto.includes(idBase)) $('#switchCopiarContacto').prop('checked', false);
        if (camposDireccion.includes(idBase)) $('#switchCopiarUbicacion').prop('checked', false);
    });

});