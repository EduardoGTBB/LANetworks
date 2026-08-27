$(document).ready(function () {

    let windowContactosOptions = '<option value="">Seleccione una empresa primero...</option>';
    let domCount = 0;

    $('#Empresa_id').select2({
        dropdownParent: $('#modalPlaza'),
        width: '100%',
        placeholder: "Selecciona una empresa..."
    });

    // ✨ INICIALIZAR MULTISELECT PARA USUARIOS
    $('#usuarios_multi').select2({
        placeholder: "Selecciona usuarios...",
        allowClear: true,
        width: '100%',
        dropdownParent: $('#modalPlaza .modal-content')
    });

    $('#formPlaza').on('input', '.mayusculas, #nombre_plaza', function () {
        $(this).val($(this).val().toUpperCase());
    });

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

    function cargarContactosPorEmpresa(empresa_id, callback = null) {
        if (!empresa_id) {
            windowContactosOptions = '<option value="">Seleccione una empresa primero...</option>';
            actualizarSelectsDinamicos();
            if (callback) callback();
            return;
        }

        $.ajax({
            url: 'api/api_ver_plazas.php?action=get_usuarios_empresa&empresa_id=' + empresa_id,
            method: 'GET', dataType: 'json',
            success: function (users) {
                windowContactosOptions = '<option value="">Selecciona un contacto...</option>';
                users.forEach(u => {
                    let nombreCompleto = `${u.nombre} ${u.apellido_pat} ${u.apellido_mat || ''}`.trim().toUpperCase();
                    windowContactosOptions += `<option value="${nombreCompleto}">${nombreCompleto}</option>`;
                });
                actualizarSelectsDinamicos();
                if (callback) callback();
            }
        });
    }

    // ✨ NUEVA FUNCIÓN: CARGAR USUARIOS PARA PERMISOS
    function cargarUsuariosEmpresa(empresa_id, seleccionados = []) {
        let $select = $('#usuarios_multi');
        $select.empty().trigger('change');
        if (empresa_id) {
            $.ajax({
                url: 'api/api_ver_plazas.php?action=get_usuarios_empresa&empresa_id=' + empresa_id,
                method: 'GET', dataType: 'json',
                success: function (users) {
                    users.forEach(u => {
                        let newOption = new Option(`${u.nombre} ${u.apellido_pat} ${u.apellido_mat || ''}`.trim(), u.id_usuario, false, false);
                        $select.append(newOption);
                    });
                    if (seleccionados.length > 0) {
                        $select.val(seleccionados);
                    }
                    $select.trigger('change');
                }
            });
        }
    }

    function actualizarSelectsDinamicos() {
        $('.select-contacto-dinamico').each(function () {
            let val = $(this).attr('data-selected') || $(this).val();
            if ($(this).hasClass('select2-hidden-accessible')) {
                $(this).select2('destroy');
            }
            $(this).html(windowContactosOptions);
            if (val && windowContactosOptions.includes(val)) {
                $(this).val(val);
            }
            $(this).select2({ dropdownParent: $('#modalPlaza'), width: '100%' });
        });
    }

    $('#Empresa_id').on('change', function () {
        if ($(this).val()) {
            cargarContactosPorEmpresa($(this).val());
            cargarUsuariosEmpresa($(this).val()); // Cargar usuarios de la empresa
        }
    });

    function construirBloqueDomicilio(d = null) {
        domCount++;
        let isFirst = (domCount === 1);
        let showClass = isFirst ? 'show' : '';
        let bgClass = (domCount % 2 === 0) ? 'bg-light' : 'bg-white';

        let topBar = '';
        if (!isFirst) {
            topBar = `
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 p-3 rounded border shadow-sm" style="background-color: #f4f5f7; gap: 15px;">
                <div class="d-flex flex-wrap gap-4 align-items-center">
                    <div class="form-check form-switch m-0 d-flex align-items-center">
                        <input class="form-check-input mt-0 switch-copiar-contacto me-2 border-secondary" type="checkbox" id="switchCont${domCount}" style="transform: scale(1.2);">
                        <label class="form-check-label text-dark fw-bold mb-0" for="switchCont${domCount}" style="cursor: pointer;"><i class="feather-users me-1 text-primary"></i> Copiar Contacto</label>
                    </div>
                    <div class="form-check form-switch m-0 d-flex align-items-center">
                        <input class="form-check-input mt-0 switch-copiar-direccion me-2 border-secondary" type="checkbox" id="switchDir${domCount}" style="transform: scale(1.2);">
                        <label class="form-check-label text-dark fw-bold mb-0" for="switchDir${domCount}" style="cursor: pointer;"><i class="feather-map me-1 text-primary"></i> Copiar Dirección</label>
                    </div>
                </div>
                <div>
                    <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-domicilio fw-bold px-3 py-2"><i class="feather-trash-2 me-1"></i> ELIMINAR DIRECCIÓN</button>
                </div>
            </div>`;
        }

        let html = `
        <div class="accordion-item mb-3 border shadow-sm bloque-domicilio" style="border-radius: 8px; overflow: hidden;">
            <h2 class="accordion-header">
                <button class="accordion-button ${isFirst ? '' : 'collapsed'} ${bgClass} fw-bold texto-titulo-domicilio text-primary" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDom${domCount}">
                    <i class="feather-map-pin me-2"></i> Dirección #${domCount}
                </button>
            </h2>
            <div id="collapseDom${domCount}" class="accordion-collapse collapse ${showClass}">
                <div class="accordion-body ${bgClass} pt-4 border-top">
                    ${topBar}
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Contacto <span class="text-danger">*</span></label>
                            <select class="form-select mayusculas select-contacto-dinamico" name="atencion_a[]" data-selected="${d ? d.atencion_a : ''}" required>
                                ${windowContactosOptions}
                            </select>
                        </div>
                        <div class="col-md-6 mb-3"><label class="form-label">Teléfono</label><input type="text" class="form-control mayusculas" name="telefono[]" value="${d && d.telefono ? d.telefono : ''}"></div>
                        <div class="col-md-12 mb-3"><label class="form-label">Calle y Número <span class="text-danger">*</span></label><input type="text" class="form-control mayusculas" name="calle[]" value="${d && d.calle ? d.calle : ''}" required></div>
                        <div class="col-md-6 mb-3"><label class="form-label">No. Ext.</label><input type="text" class="form-control mayusculas" name="num_ext[]" value="${d && d.num_ext ? d.num_ext : ''}"></div>
                        <div class="col-md-6 mb-3"><label class="form-label">No. Int.</label><input type="text" class="form-control mayusculas" name="num_int[]" value="${d && d.num_int ? d.num_int : ''}"></div>
                        <div class="col-md-6 mb-3"><label class="form-label">Entre Calle</label><input type="text" class="form-control mayusculas" name="entre_calle[]" value="${d && d.entre_calle ? d.entre_calle : ''}"></div>
                        <div class="col-md-6 mb-3"><label class="form-label">Y Calle</label><input type="text" class="form-control mayusculas" name="y_calle[]" value="${d && d.y_calle ? d.y_calle : ''}"></div>
                        <div class="col-md-6 mb-3"><label class="form-label">Colonia <span class="text-danger">*</span></label><input type="text" class="form-control mayusculas" name="colonia[]" value="${d && d.colonia ? d.colonia : ''}" required></div>
                        <div class="col-md-6 mb-3"><label class="form-label">Localidad</label><input type="text" class="form-control mayusculas" name="localidad[]" value="${d && d.localidad ? d.localidad : ''}"></div>
                        <div class="col-md-4 mb-3"><label class="form-label">C.P. <span class="text-danger">*</span></label><input type="text" class="form-control mayusculas" name="cp[]" value="${d && d.cp ? d.cp : ''}" required></div>
                        <div class="col-md-4 mb-3"><label class="form-label">Municipio <span class="text-danger">*</span></label><input type="text" class="form-control mayusculas" name="municipio[]" value="${d && d.municipio ? d.municipio : ''}" required></div>
                        <div class="col-md-4 mb-3"><label class="form-label">Estado <span class="text-danger">*</span></label><input type="text" class="form-control mayusculas" name="estado[]" value="${d && d.estado ? d.estado : ''}" required></div>
                    </div>
                </div>
            </div>
        </div>`;

        $('#contenedor_domicilios').append(html);

        let $nuevoSelect = $('.select-contacto-dinamico').last();
        if (d && d.atencion_a) {
            if ($nuevoSelect.find(`option[value="${d.atencion_a}"]`).length === 0) {
                $nuevoSelect.append(`<option value="${d.atencion_a}">${d.atencion_a}</option>`);
            }
            $nuevoSelect.attr('data-selected', d.atencion_a);
            $nuevoSelect.val(d.atencion_a);
        }
        $nuevoSelect.select2({ dropdownParent: $('#modalPlaza'), width: '100%' });
    }

    $(document).on('click', '#btnAgregarDomicilio', function () {
        construirBloqueDomicilio();
    });

    $(document).on('click', '.btn-eliminar-domicilio', function () {
        $(this).closest('.bloque-domicilio').remove();
        domCount = 0;

        $('.bloque-domicilio').each(function () {
            domCount++;
            $(this).find('.texto-titulo-domicilio').html(`<i class="feather-map-pin me-2"></i> Dirección #${domCount}`);

            let isEven = (domCount % 2 === 0);
            let $btn = $(this).find('.accordion-button');
            let $body = $(this).find('.accordion-body');

            if (isEven) {
                $btn.removeClass('bg-white').addClass('bg-light');
                $body.removeClass('bg-white').addClass('bg-light');
            } else {
                $btn.removeClass('bg-light').addClass('bg-white');
                $body.removeClass('bg-light').addClass('bg-white');
            }
        });
    });

    function formatearApilado(cadena) {
        if (!cadena) return '<span class="text-muted">N/A</span>';
        let items = cadena.split('||').map(item => item.trim()).filter(item => item !== '');
        if (items.length === 0) return '<span class="text-muted">N/A</span>';
        let uniqueItems = [...new Set(items)];
        if (uniqueItems.length === 1) { return `<span class="d-block text-dark">${uniqueItems[0]}</span>`; }

        let html = '<div class="d-flex flex-column" style="font-size: 11px; line-height: 1.4;">';
        uniqueItems.forEach((item, index) => {
            let colores = ['primary', 'warning', 'success', 'info'];
            let color = colores[index % colores.length];
            let borde = index > 0 ? 'border-top pt-1 mt-1' : 'mb-1';
            html += `<div class="${borde}"><span class="badge bg-soft-${color} text-${color} px-1 me-1">${index + 1}</span><span class="text-dark">${item}</span></div>`;
        });
        html += '</div>';
        return html;
    }

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

                /* $tabla.DataTable({ 
                    language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' }, 
                    searching: true,
                    pageLength: 10,
                    dom: '<"table-responsive"t><"row align-items-center p-3"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
                    order: [[0, 'asc']]
                }); */
                $tabla.DataTable({ 
                    language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' }, 
                    lengthChange: false,
                    searching: true,
                    pageLength: 10,
                    dom: "<'row mb-3'<'col-sm-12 col-md-6 d-flex justify-content-start'f><'col-sm-12 col-md-6'>>" +
                            "<'table-responsive'tr>" +
                            "<'row align-items-center p-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-end'p>>",
                    order: [[0, 'asc']]
                });
            }
        });
    }

    $('#buscador_personalizado').on('keyup', function () {
        $('#tablePlazas').DataTable().search(this.value).draw();
    });

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
                } else { alert(res.message); }
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

    $(document).on('click', '.btn-editar', function (e) {
        e.preventDefault();
        let id = $(this).data('id');

        $.ajax({
            url: 'api/api_ver_plazas.php?action=get_plaza&id=' + id,
            method: 'GET',
            success: function (res) {
                if (res.status === 'success') {
                    $('#formPlaza')[0].reset();
                    $('#contenedor_domicilios').empty();
                    domCount = 0;

                    let p = res.data;
                    $('#action').val('guardar');
                    $('#id_plaza').val(p.id_plaza);
                    $('#nombre_plaza').val(p.nombre_plaza);
                    $('#estatus').prop('checked', p.estatus === 'Y');

                    $('#Empresa_id').val(p.Empresa_id ? p.Empresa_id : '').trigger('change.select2');

                    cargarContactosPorEmpresa(p.Empresa_id, function () {
                        if (p.domicilios && p.domicilios.length > 0) {
                            p.domicilios.forEach(d => {
                                construirBloqueDomicilio(d);
                            });
                            evaluarSwitchesIniciales();
                        } else {
                            construirBloqueDomicilio();
                        }
                    });

                    // Carga los usuarios asignados a esta plaza
                    cargarUsuariosEmpresa(p.Empresa_id, p.usuarios_asignados);

                    $('.modal-title').text('Editar Plaza Logística');
                    $('#formPlaza button[type="submit"]').text('Guardar Cambios');
                    $('#modalPlaza').modal('show');
                }
            }
        });
    });

    $(document).on('click', '#btnNuevaPlaza', function (e) {
        e.preventDefault();
        $('#formPlaza')[0].reset();
        $('#action').val('guardar');
        $('#id_plaza').val('');

        $('#Empresa_id').val('').trigger('change.select2');
        $('#usuarios_multi').val(null).trigger('change');

        cargarContactosPorEmpresa('', function () {
            $('#contenedor_domicilios').empty();
            domCount = 0;
            construirBloqueDomicilio();
        });

        $('#estatus').prop('checked', true);
        $('.modal-title').text('Nueva Plaza Logística');
        $('#formPlaza button[type="submit"]').text('Guardar Plaza');
        $('#modalPlaza').modal('show');
    });

    $(document).on('click', '.btn-eliminar', function (e) {
        e.preventDefault();
        if (confirm("¿Estás seguro de eliminar por completo esta Plaza y TODAS sus direcciones?")) {
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

    const camposContacto = ['atencion_a[]', 'telefono[]'];
    const camposDireccion = ['calle[]', 'num_ext[]', 'num_int[]', 'entre_calle[]', 'y_calle[]', 'colonia[]', 'localidad[]', 'cp[]', 'municipio[]', 'estado[]'];

    function evaluarSwitchesIniciales() {
        let bloques = $('.bloque-domicilio');
        if (bloques.length <= 1) return;

        for (let i = 1; i < bloques.length; i++) {
            let $curr = $(bloques[i]);
            let $prev = $(bloques[i - 1]);

            let sameContact = true;
            camposContacto.forEach(name => {
                let v1 = $prev.find(`[name="${name}"]`).val() || '';
                let v2 = $curr.find(`[name="${name}"]`).val() || '';
                if (v1 !== v2) sameContact = false;
            });
            if (sameContact && $curr.find(`[name="atencion_a[]"]`).val() !== '') {
                $curr.find('.switch-copiar-contacto').prop('checked', true);
            }

            let sameDir = true;
            camposDireccion.forEach(name => {
                let v1 = $prev.find(`[name="${name}"]`).val() || '';
                let v2 = $curr.find(`[name="${name}"]`).val() || '';
                if (v1 !== v2) sameDir = false;
            });
            if (sameDir && $curr.find(`[name="calle[]"]`).val() !== '') {
                $curr.find('.switch-copiar-direccion').prop('checked', true);
            }
        }
    }

    $(document).on('change', '.switch-copiar-contacto', function () {
        let $currentBlock = $(this).closest('.bloque-domicilio');
        let $prevBlock = $currentBlock.prev('.bloque-domicilio');

        if ($(this).is(':checked') && $prevBlock.length) {
            camposContacto.forEach(name => {
                let val = $prevBlock.find(`[name="${name}"]`).val();
                let $target = $currentBlock.find(`[name="${name}"]`);
                $target.val(val);
                if ($target.hasClass('select2-hidden-accessible')) { $target.trigger('change.select2'); }
            });
        } else {
            camposContacto.forEach(name => {
                let $target = $currentBlock.find(`[name="${name}"]`);
                $target.val('');
                if ($target.hasClass('select2-hidden-accessible')) { $target.trigger('change.select2'); }
            });
        }
    });

    $(document).on('change', '.switch-copiar-direccion', function () {
        let $currentBlock = $(this).closest('.bloque-domicilio');
        let $prevBlock = $currentBlock.prev('.bloque-domicilio');

        if ($(this).is(':checked') && $prevBlock.length) {
            camposDireccion.forEach(name => {
                let val = $prevBlock.find(`[name="${name}"]`).val();
                $currentBlock.find(`[name="${name}"]`).val(val);
            });
        } else {
            camposDireccion.forEach(name => {
                $currentBlock.find(`[name="${name}"]`).val('');
            });
        }
    });

    $(document).on('input change', '.bloque-domicilio input[type="text"], .bloque-domicilio select', function (e) {
        let $currentBlock = $(this).closest('.bloque-domicilio');
        let name = $(this).attr('name');
        let val = $(this).val();

        if (e.originalEvent) {
            if (camposContacto.includes(name)) {
                $currentBlock.find('.switch-copiar-contacto').prop('checked', false);
            } else if (camposDireccion.includes(name)) {
                $currentBlock.find('.switch-copiar-direccion').prop('checked', false);
            }
        }

        let cascadeUpdate = function ($block, inputName, inputVal) {
            let $next = $block.next('.bloque-domicilio');
            if ($next.length) {
                let isContacto = camposContacto.includes(inputName);
                if (isContacto && $next.find('.switch-copiar-contacto').is(':checked')) {
                    let $target = $next.find(`[name="${inputName}"]`);
                    $target.val(inputVal);
                    if ($target.hasClass('select2-hidden-accessible')) $target.trigger('change.select2');
                    cascadeUpdate($next, inputName, inputVal);
                } else if (!isContacto && $next.find('.switch-copiar-direccion').is(':checked')) {
                    $next.find(`[name="${inputName}"]`).val(inputVal);
                    cascadeUpdate($next, inputName, inputVal);
                }
            }
        };
        cascadeUpdate($currentBlock, name, val);
    });

    // ✨ AUTO-ASIGNAR USUARIO PERMITIDO AL SELECCIONARLO COMO CONTACTO
    $(document).on('change', '.select-contacto-dinamico', function () {
        let nombreContacto = $(this).val();
        
        if (nombreContacto) {
            let $selectPermisos = $('#usuarios_multi');
            let seleccionadosActuales = $selectPermisos.val() || [];
            let idUsuarioEncontrado = null;

            // Buscamos dentro de las opciones de "Usuarios Permitidos" cuál coincide con el texto
            $selectPermisos.find('option').each(function () {
                if ($(this).text().trim() === nombreContacto.trim()) {
                    idUsuarioEncontrado = $(this).val();
                    return false; // Rompemos el ciclo each al encontrarlo
                }
            });

            // Si lo encontramos y no está seleccionado ya, lo agregamos
            if (idUsuarioEncontrado && !seleccionadosActuales.includes(idUsuarioEncontrado)) {
                seleccionadosActuales.push(idUsuarioEncontrado);
                $selectPermisos.val(seleccionadosActuales).trigger('change');
            }
        }
    });
});