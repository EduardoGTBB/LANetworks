$(document).ready(function () {
    let id_cot = $('#id_cotizacion').val();
    let isSucursalUnica = false;
    let sucursalesMap = {};

    // 1. Limpiar y preparar el contenedor del selector de Plazas en Envío General
    if ($('#div_selector_contacto_gral').length === 0) {
        let htmlContactoGral = `
            <div class="mb-4 border-bottom pb-3 d-none" id="div_selector_contacto_gral">
                <label class="fw-bold text-dark h6 mb-2"><i class="feather-map-pin me-1 text-success"></i>Contacto / Dirección de Plaza:</label>
                <select class="form-select border-success text-success fw-bold shadow-sm" id="selector_contacto_gral">
                </select>
            </div>
        `;
        $('#select_envio_multi').replaceWith(htmlContactoGral);
    }

    // 2. Cargar datos de la Cotización
    $.ajax({
        url: 'api/api_finalizar_venta.php?action=get&id_cotizacion=' + id_cot,
        method: 'GET', dataType: 'json', cache: false,
        success: function (res) {
            if (res.status === 'success' && res.data) {
                let d = res.data;

                let folioFormat = d.folio_especial ? d.folio_especial : id_cot.toString().padStart(5, '0');
                $('#breadcrumb_folio').text('#' + folioFormat);

                if (d.fiscal && d.fiscal.calle_numero_fiscal) {
                    $('#btn_regresar').html('Regresar');
                } else {
                    $('#btn_regresar').html('Dejar para después');
                }

                // Llenar Fiscal
                if (d.empresa_default) {
                    $('input[name="f_calle"]').val(d.empresa_default.calle_numero || d.empresa_default.calle || '');
                    $('input[name="f_colonia"]').val(d.empresa_default.colonia || '');
                    $('input[name="f_localidad"]').val(d.empresa_default.localidad || '');
                    $('input[name="f_municipio"]').val(d.empresa_default.municipio || '');
                    $('input[name="f_estado"]').val(d.empresa_default.estado || '');
                    $('input[name="f_cp"]').val(d.empresa_default.codigo_postal || d.empresa_default.cp || '');
                }

                if (d.detalles && d.detalles.length > 0) {
                    isSucursalUnica = !d.es_multisucursal;
                    construirEquipos(d.detalles);

                    let doms_plaza = [];
                    let doms_map = new Map();

                    d.detalles.forEach(item => {
                        let parsed = [];
                        try { parsed = JSON.parse(item.domicilios_plaza_json || '[]'); } catch(e){}
                        parsed.forEach(dom => {
                            let key = dom.id_plaza_domicilio || dom.calle_formateada;
                            if(!doms_map.has(key)) {
                                dom.nombre_plaza = item.nombre_plaza || 'Plaza';
                                doms_map.set(key, dom);
                                doms_plaza.push(dom);
                            }
                        });
                    });

                    let equipo_base = d.detalles[0];

                    if (isSucursalUnica) {
                        $('#alerta_sucursal_unica').removeClass('d-none');
                        $('#col_envio_gral').removeClass('col-lg-12').addClass('col-lg-6');
                        $('#lbl_envio_gral').hide();
                        $('#col_cert_gral').removeClass('d-none');
                        $('#seccion_desglose_equipos').hide();
                        
                        let suc = d.sucursal_global;
                        let tieneCertGuardado = (equipo_base && equipo_base.c_calle && equipo_base.c_calle.trim() !== '');
                        if (tieneCertGuardado) {
                            $('#cert_gral_calle').val(equipo_base.c_calle);
                            $('#cert_gral_colonia').val(equipo_base.c_colonia);
                            $('#cert_gral_localidad').val(equipo_base.c_localidad);
                            $('#cert_gral_municipio').val(equipo_base.c_municipio);
                            $('#cert_gral_estado').val(equipo_base.c_estado);
                            $('#cert_gral_cp').val(equipo_base.c_cp);
                        } else if (suc) {
                            $('#cert_gral_calle').val(suc.suc_calle || '');
                            $('#cert_gral_colonia').val(suc.suc_colonia || '');
                            $('#cert_gral_localidad').val(suc.suc_localidad || '');
                            $('#cert_gral_municipio').val(suc.suc_municipio || '');
                            $('#cert_gral_estado').val(suc.suc_estado || '');
                            $('#cert_gral_cp').val(suc.suc_cp || '');
                        }
                    } else {
                        $('#alerta_sucursal_unica').addClass('d-none');
                        $('#col_envio_gral').removeClass('col-lg-6').addClass('col-lg-12'); 
                        $('#lbl_envio_gral').show();
                        $('#col_cert_gral').addClass('d-none'); 
                        $('#seccion_desglose_equipos').show(); 

                        let $selMulti = $('#select_sucursal_envio_gral');
                        if($selMulti.length > 0) {
                            $selMulti.empty().append('<option value="">Escribir manualmente...</option>');
                            d.detalles.forEach(item => {
                                if (item.sucursal_destino_id && !sucursalesMap[item.sucursal_destino_id]) {
                                    sucursalesMap[item.sucursal_destino_id] = {
                                        calle: item.suc_calle || '',
                                        colonia: item.suc_colonia || '',
                                        localidad: item.suc_localidad || '',
                                        municipio: item.suc_municipio || '',
                                        estado: item.suc_estado || '',
                                        cp: item.suc_cp || ''
                                    };
                                    let nombreSuc = item.suc_nombre || 'Sucursal ' + item.sucursal_destino_id;
                                    $selMulti.append(`<option value="${item.sucursal_destino_id}">${nombreSuc}</option>`);
                                }
                            });
                        }
                    }

                    // ==========================================
                    // LÓGICA INTELIGENTE: SWITCH vs SELECTOR
                    // ==========================================
                    if (doms_plaza.length > 1 || (!isSucursalUnica && doms_plaza.length > 0)) {
                        $('#switch_envio_unica').addClass('d-none');
                        $('#div_selector_contacto_gral').removeClass('d-none');

                        let options = '<option value="">Escribir manualmente...</option>';
                        if (isSucursalUnica) {
                            options += '<option value="CERTIFICADO" class="fw-bold text-dark">🚚 Usar la misma dirección del Certificado</option>';
                        }
                        
                        options += '<optgroup label="Plazas Disponibles">';
                        doms_plaza.forEach((d, i) => {
                            let text = `Atn: ${d.atencion_a} - ${d.calle_formateada}`;
                            if (!isSucursalUnica) text = `[${d.nombre_plaza}] ` + text;
                            options += `<option value="${i}">${text}</option>`;
                        });
                        options += '</optgroup>';
                        
                        $('#selector_contacto_gral').html(options);

                        $('#selector_contacto_gral').off('change').on('change', function() {
                            let val = $(this).val();
                            
                            if (val === 'CERTIFICADO') {
                                $('#envio_gral_calle').val($('#cert_gral_calle').val());
                                $('#envio_gral_colonia').val($('#cert_gral_colonia').val());
                                $('#envio_gral_localidad').val($('#cert_gral_localidad').val());
                                $('#envio_gral_municipio').val($('#cert_gral_municipio').val());
                                $('#envio_gral_estado').val($('#cert_gral_estado').val());
                                $('#envio_gral_cp').val($('#cert_gral_cp').val());
                            } else if (val !== '') {
                                let dt = doms_plaza[val];
                                $('#envio_gral_calle').val(dt.calle_formateada);
                                $('#envio_gral_colonia').val(dt.colonia);
                                $('#envio_gral_localidad').val(dt.localidad || dt.municipio);
                                $('#envio_gral_municipio').val(dt.municipio);
                                $('#envio_gral_estado').val(dt.estado);
                                $('#envio_gral_cp').val(dt.cp);
                            } else {
                                $('#envio_gral_calle, #envio_gral_colonia, #envio_gral_localidad, #envio_gral_municipio, #envio_gral_estado, #envio_gral_cp').val('');
                            }
                            sincronizarEnvioEquipos();
                        });

                    } else {
                        $('#div_selector_contacto_gral').addClass('d-none');
                        if (isSucursalUnica) {
                            $('#switch_envio_unica').removeClass('d-none');
                        }
                    }

                    // ==========================================
                    // ✨ MAGIA DE AUTOLLENADO IGNORANDO LOS EN BLANCO Y SELECCIONANDO EL DROPDOWN
                    // ==========================================
                    if (isSucursalUnica) {
                        let tieneEnvioGuardado = (equipo_base && equipo_base.e_calle && equipo_base.e_calle.trim() !== '');
                        if (tieneEnvioGuardado) {
                            $('#envio_gral_calle').val(equipo_base.e_calle);
                            $('#envio_gral_colonia').val(equipo_base.e_colonia);
                            $('#envio_gral_localidad').val(equipo_base.e_localidad);
                            $('#envio_gral_municipio').val(equipo_base.e_municipio);
                            $('#envio_gral_estado').val(equipo_base.e_estado);
                            $('#envio_gral_cp').val(equipo_base.e_cp);
                            sincronizarEnvioEquipos(); 

                            // Seleccionamos el dropdown si coincide
                            if ($('#selector_contacto_gral').length > 0) {
                                let indexPlaza = doms_plaza.findIndex(dt => dt.calle_formateada.trim() === equipo_base.e_calle.trim() && dt.cp.trim() === equipo_base.e_cp.trim());
                                if (indexPlaza !== -1) {
                                    $('#selector_contacto_gral').val(indexPlaza);
                                } else if (equipo_base.c_calle && equipo_base.e_calle.trim() === equipo_base.c_calle.trim()) {
                                    $('#selector_contacto_gral').val('CERTIFICADO');
                                    $('#check_envio_igual_cert').prop('checked', true);
                                }
                            }

                        } else if (doms_plaza.length === 1) {
                            let dt = doms_plaza[0];
                            $('#envio_gral_calle').val(dt.calle_formateada);
                            $('#envio_gral_colonia').val(dt.colonia);
                            $('#envio_gral_localidad').val(dt.localidad || dt.municipio);
                            $('#envio_gral_municipio').val(dt.municipio);
                            $('#envio_gral_estado').val(dt.estado);
                            $('#envio_gral_cp').val(dt.cp);
                            sincronizarEnvioEquipos(); 
                            if ($('#selector_contacto_gral').length > 0) $('#selector_contacto_gral').val(0);
                        }
                        sincronizarCertEquipos();

                    } else {
                        let primerValido = d.detalles.find(item => item.e_calle && item.e_calle.trim() !== '');
                        
                        if (primerValido) {
                            let todasIguales = true;
                            for (let i = 0; i < d.detalles.length; i++) {
                                let item = d.detalles[i];
                                if (item.e_calle && item.e_calle.trim() !== '') {
                                    if (item.e_calle.trim() !== primerValido.e_calle.trim() || item.e_cp.trim() !== primerValido.e_cp.trim()) {
                                        todasIguales = false;
                                        break;
                                    }
                                }
                            }
                            
                            if (todasIguales) {
                                $('#envio_gral_calle').val(primerValido.e_calle);
                                $('#envio_gral_colonia').val(primerValido.e_colonia);
                                $('#envio_gral_localidad').val(primerValido.e_localidad);
                                $('#envio_gral_municipio').val(primerValido.e_municipio);
                                $('#envio_gral_estado').val(primerValido.e_estado);
                                $('#envio_gral_cp').val(primerValido.e_cp);
                                
                                sincronizarEnvioEquipos(); 

                                // Seleccionamos el dropdown si coincide
                                if ($('#selector_contacto_gral').length > 0) {
                                    let indexPlaza = doms_plaza.findIndex(dt => dt.calle_formateada.trim() === primerValido.e_calle.trim() && dt.cp.trim() === primerValido.e_cp.trim());
                                    if (indexPlaza !== -1) {
                                        $('#selector_contacto_gral').val(indexPlaza);
                                    }
                                }
                            }
                        }
                    }

                    // ==========================================
                    // 🚀 RADAR: ALERTA DE EQUIPOS NUEVOS O EN BLANCO
                    // ==========================================
                    let equiposSinDir = d.detalles.filter(item => !item.e_calle || item.e_calle.trim() === '');
                    let numSinDir = equiposSinDir.length;

                    const urlParams = new URLSearchParams(window.location.search);
                    const vieneDeEdicion = urlParams.has('editado');

                    if (numSinDir > 0 && vieneDeEdicion) {
                        let msjExtra = isSucursalUnica 
                            ? "El sistema ha pre-llenado la información en base a los otros equipos. Por favor verifícala y <strong>da clic en Guardar</strong> para registrar los equipos nuevos."
                            : "Por favor, revisa la información precargada o asigna manualmente la dirección a los equipos faltantes y haz clic en <strong>Guardar</strong>.";
                        
                        $('#col_cert_gral').closest('.row.mt-4').before(`
                            <div class="alert alert-danger mb-4 border-0 border-start border-5 border-danger shadow-sm">
                                <i class="feather-alert-triangle me-2" style="font-size: 1.1rem;"></i> 
                                <strong>¡Acción Requerida!</strong> Detectamos <strong>${numSinDir}</strong> equipo(s) recién agregado(s) sin dirección asignada. 
                                <br><span class="ms-4">${msjExtra}</span>
                            </div>
                        `);

                        equiposSinDir.forEach(item => {
                            let $equipoUI = $('#heading_' + item.id_detalle_cot).closest('.equipo-item');
                            $equipoUI.addClass('border-danger border-2 shadow-sm');
                            $equipoUI.find('.accordion-button').addClass('text-danger bg-soft-danger');
                            $('#collapse_' + item.id_detalle_cot).collapse('show');
                        });
                    }
                }
            }
        },
        error: function (xhr) {
            console.error("Error al cargar la API:", xhr.responseText);
        }
    });

    // 3. Construir Equipos
    function construirEquipos(detalles) {
        let html = '';
        detalles.forEach((item, index) => {
            let id = item.id_detalle_cot;

            let env_calle = (item.e_calle && item.e_calle.trim() !== '') ? item.e_calle : '';
            let env_colonia = (item.e_colonia && item.e_colonia.trim() !== '') ? item.e_colonia : '';
            let env_localidad = (item.e_localidad && item.e_localidad.trim() !== '') ? item.e_localidad : '';
            let env_municipio = (item.e_municipio && item.e_municipio.trim() !== '') ? item.e_municipio : '';
            let env_estado = (item.e_estado && item.e_estado.trim() !== '') ? item.e_estado : '';
            let env_cp = (item.e_cp && item.e_cp.trim() !== '') ? item.e_cp : '';

            let cert_calle = (item.c_calle && item.c_calle.trim() !== '') ? item.c_calle : (item.suc_calle || '');
            let cert_colonia = (item.c_colonia && item.c_colonia.trim() !== '') ? item.c_colonia : (item.suc_colonia || '');
            let cert_localidad = (item.c_localidad && item.c_localidad.trim() !== '') ? item.c_localidad : (item.suc_localidad || '');
            let cert_municipio = (item.c_municipio && item.c_municipio.trim() !== '') ? item.c_municipio : (item.suc_municipio || '');
            let cert_estado = (item.c_estado && item.c_estado.trim() !== '') ? item.c_estado : (item.suc_estado || '');
            let cert_cp = (item.c_cp && item.c_cp.trim() !== '') ? item.c_cp : (item.suc_cp || '');

            let nombreSucursal = item.suc_nombre ? item.suc_nombre : 'Sin sucursal asignada';

            html += `
            <div class="accordion-item border mb-4 shadow-sm equipo-item" style="border-radius: 8px; overflow: hidden;">
                <input type="hidden" class="id_detalle_hidden" value="${id}"> 
                
                <h2 class="accordion-header" id="heading_${id}">
                    <button class="accordion-button ${index !== 0 ? 'collapsed' : ''} fw-bold bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_${id}">
                        <span class="badge bg-primary me-2 px-2 py-1 fs-12">#${index + 1}</span>
                        [${item.clave_product}] ${item.descripcion_product} <span class="ms-2 text-muted fw-normal">(Cant: ${item.cantidad})</span>
                    </button>
                </h2>
                <div id="collapse_${id}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" data-bs-parent="#contenedor_equipos">
                    <div class="accordion-body row pt-4">
                        <div class="col-md-6 border-end">
                            <div class="d-flex align-items-baseline mb-3">
                                <h6 class="fw-bold mb-0 me-2" style="color: #d39e00;">Certificado</h6>
                                <small class="text-muted">(${nombreSucursal})</small>
                            </div>
                            <input type="text" class="form-control mb-2 c_calle" value="${cert_calle}" placeholder="Calle y número">
                            <input type="text" class="form-control mb-2 c_colonia" value="${cert_colonia}" placeholder="Colonia">
                            <input type="text" class="form-control mb-2 c_localidad" value="${cert_localidad}" placeholder="Localidad">
                            <input type="text" class="form-control mb-2 c_municipio" value="${cert_municipio}" placeholder="Municipio">
                            <input type="text" class="form-control mb-2 c_estado" value="${cert_estado}" placeholder="Estado">
                            <input type="text" class="form-control c_cp" value="${cert_cp}" placeholder="C.P.">
                        </div>
                        <div class="col-md-6">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h6 class="fw-bold text-success mb-0">Envío</h6>
                                <div class="form-check form-switch m-0 d-flex align-items-center">
                                    <input class="form-check-input switch-copiar-cert mt-0" type="checkbox" id="switch_cert_${id}" style="transform: scale(1.1); margin-right: 8px;">
                                    <label class="form-check-label fs-12 text-muted" for="switch_cert_${id}">¿Igual a Certificado?</label>
                                </div>
                            </div>
                            <input type="text" class="form-control mb-2 e_calle" value="${env_calle}" placeholder="Calle y número">
                            <input type="text" class="form-control mb-2 e_colonia" value="${env_colonia}" placeholder="Colonia">
                            <input type="text" class="form-control mb-2 e_localidad" value="${env_localidad}" placeholder="Localidad">
                            <input type="text" class="form-control mb-2 e_municipio" value="${env_municipio}" placeholder="Municipio">
                            <input type="text" class="form-control mb-2 e_estado" value="${env_estado}" placeholder="Estado">
                            <input type="text" class="form-control e_cp" value="${env_cp}" placeholder="C.P.">
                        </div>
                    </div>
                </div>
            </div>`;
        });
        $('#contenedor_equipos').html(html);
    }

    // 4. Comportamiento de Switches Particulares y Generales
    $(document).on('change', '.switch-copiar-cert', function () {
        let $fila = $(this).closest('.accordion-body');
        if ($(this).is(':checked')) {
            $fila.find('.e_calle').val($fila.find('.c_calle').val());
            $fila.find('.e_colonia').val($fila.find('.c_colonia').val());
            $fila.find('.e_localidad').val($fila.find('.c_localidad').val());
            $fila.find('.e_municipio').val($fila.find('.c_municipio').val());
            $fila.find('.e_estado').val($fila.find('.c_estado').val());
            $fila.find('.e_cp').val($fila.find('.c_cp').val());
        } else {
            $fila.find('.e_calle, .e_colonia, .e_localidad, .e_municipio, .e_estado, .e_cp').val('');
        }
    });

    $(document).on('input', '.c_calle, .c_colonia, .c_localidad, .c_municipio, .c_estado, .c_cp', function () {
        let $fila = $(this).closest('.accordion-body');
        if ($fila.find('.switch-copiar-cert').is(':checked')) {
            $fila.find('.e_calle').val($fila.find('.c_calle').val());
            $fila.find('.e_colonia').val($fila.find('.c_colonia').val());
            $fila.find('.e_localidad').val($fila.find('.c_localidad').val());
            $fila.find('.e_municipio').val($fila.find('.c_municipio').val());
            $fila.find('.e_estado').val($fila.find('.c_estado').val());
            $fila.find('.e_cp').val($fila.find('.c_cp').val());
        }
    });

    $(document).on('input', '.e_calle, .e_colonia, .e_localidad, .e_municipio, .e_estado, .e_cp', function () {
        let $fila = $(this).closest('.accordion-body');
        if ($fila.find('.switch-copiar-cert').is(':checked')) {
            $fila.find('.switch-copiar-cert').prop('checked', false);
        }
    });

    $('#check_cert_igual_fiscal').change(function () {
        if ($(this).is(':checked')) {
            $('#cert_gral_calle').val($('input[name="f_calle"]').val());
            $('#cert_gral_colonia').val($('input[name="f_colonia"]').val());
            $('#cert_gral_localidad').val($('input[name="f_localidad"]').val());
            $('#cert_gral_municipio').val($('input[name="f_municipio"]').val());
            $('#cert_gral_estado').val($('input[name="f_estado"]').val());
            $('#cert_gral_cp').val($('input[name="f_cp"]').val());

            if (isSucursalUnica && $('#check_envio_igual_cert').is(':checked')) {
                $('#check_envio_igual_cert').trigger('change');
            }
        } else {
            $('#cert_gral_calle, #cert_gral_colonia, #cert_gral_localidad, #cert_gral_municipio, #cert_gral_estado, #cert_gral_cp').val('');
            if (isSucursalUnica && $('#check_envio_igual_cert').is(':checked')) {
                $('#check_envio_igual_cert').trigger('change');
            }
        }
        sincronizarCertEquipos();
    });

    $('#check_envio_igual_cert').change(function () {
        if ($(this).is(':checked')) {
            $('#envio_gral_calle').val($('#cert_gral_calle').val());
            $('#envio_gral_colonia').val($('#cert_gral_colonia').val());
            $('#envio_gral_localidad').val($('#cert_gral_localidad').val());
            $('#envio_gral_municipio').val($('#cert_gral_municipio').val());
            $('#envio_gral_estado').val($('#cert_gral_estado').val());
            $('#envio_gral_cp').val($('#cert_gral_cp').val());
        } else {
            $('#envio_gral_calle, #envio_gral_colonia, #envio_gral_localidad, #envio_gral_municipio, #envio_gral_estado, #envio_gral_cp').val('');
        }
        sincronizarEnvioEquipos();
    });

    $('#select_sucursal_envio_gral').change(function() {
        let val = $(this).val();
        if (val && sucursalesMap[val]) {
            let s = sucursalesMap[val];
            $('#envio_gral_calle').val(s.calle);
            $('#envio_gral_colonia').val(s.colonia);
            $('#envio_gral_localidad').val(s.localidad);
            $('#envio_gral_municipio').val(s.municipio);
            $('#envio_gral_estado').val(s.estado);
            $('#envio_gral_cp').val(s.cp);
        } else {
            $('#envio_gral_calle, #envio_gral_colonia, #envio_gral_localidad, #envio_gral_municipio, #envio_gral_estado, #envio_gral_cp').val('');
        }
        sincronizarEnvioEquipos();
    });

    $('#cert_gral_calle, #cert_gral_colonia, #cert_gral_localidad, #cert_gral_municipio, #cert_gral_estado, #cert_gral_cp').on('input', function () {
        sincronizarCertEquipos();
        if ($('#check_cert_igual_fiscal').is(':checked')) $('#check_cert_igual_fiscal').prop('checked', false);
        
        if ($('#check_envio_igual_cert').is(':checked')) {
            $('#envio_gral_calle').val($('#cert_gral_calle').val());
            $('#envio_gral_colonia').val($('#cert_gral_colonia').val());
            $('#envio_gral_localidad').val($('#cert_gral_localidad').val());
            $('#envio_gral_municipio').val($('#cert_gral_municipio').val());
            $('#envio_gral_estado').val($('#cert_gral_estado').val());
            $('#envio_gral_cp').val($('#cert_gral_cp').val());
            sincronizarEnvioEquipos();
        }
    });

    $('#envio_gral_calle, #envio_gral_colonia, #envio_gral_localidad, #envio_gral_municipio, #envio_gral_estado, #envio_gral_cp').on('input', function () {
        sincronizarEnvioEquipos();
        if (isSucursalUnica && $('#check_envio_igual_cert').is(':checked')) $('#check_envio_igual_cert').prop('checked', false);
        if (!isSucursalUnica && $('#select_sucursal_envio_gral').val() !== "") $('#select_sucursal_envio_gral').val('');
    });

    function sincronizarEnvioEquipos() {
        $('.e_calle').val($('#envio_gral_calle').val());
        $('.e_colonia').val($('#envio_gral_colonia').val());
        $('.e_localidad').val($('#envio_gral_localidad').val());
        $('.e_municipio').val($('#envio_gral_municipio').val());
        $('.e_estado').val($('#envio_gral_estado').val());
        $('.e_cp').val($('#envio_gral_cp').val());
    }

    function sincronizarCertEquipos() {
        if (isSucursalUnica) {
            $('.c_calle').val($('#cert_gral_calle').val());
            $('.c_colonia').val($('#cert_gral_colonia').val());
            $('.c_localidad').val($('#cert_gral_localidad').val());
            $('.c_municipio').val($('#cert_gral_municipio').val());
            $('.c_estado').val($('#cert_gral_estado').val());
            $('.c_cp').val($('#cert_gral_cp').val());
        }
    }

    // 5. Guardar JSON
    $('#formFormalizar').on('submit', function (e) {
        e.preventDefault();

        if (isSucursalUnica) {
            sincronizarCertEquipos();
            sincronizarEnvioEquipos();
        }
        let payloadEquipos = [];

        $('.equipo-item').each(function () {
            let idDetalle = $(this).find('.id_detalle_hidden').val();
            if (idDetalle) {
                payloadEquipos.push({
                    id_detalle: parseInt(idDetalle),
                    cert: {
                        calle: $(this).find('.c_calle').val(), colonia: $(this).find('.c_colonia').val(),
                        localidad: $(this).find('.c_localidad').val(), municipio: $(this).find('.c_municipio').val(),
                        estado: $(this).find('.c_estado').val(), cp: $(this).find('.c_cp').val()
                    },
                    envio: {
                        calle: $(this).find('.e_calle').val(), colonia: $(this).find('.e_colonia').val(),
                        localidad: $(this).find('.e_localidad').val(), municipio: $(this).find('.e_municipio').val(),
                        estado: $(this).find('.e_estado').val(), cp: $(this).find('.e_cp').val()
                    }
                });
            }
        });

        let dataEnvio = {
            id_cotizacion: parseInt($('#id_cotizacion').val()),
            fiscal: {
                calle: $('input[name="f_calle"]').val(), colonia: $('input[name="f_colonia"]').val(),
                localidad: $('input[name="f_localidad"]').val(), municipio: $('input[name="f_municipio"]').val(),
                estado: $('input[name="f_estado"]').val(), cp: $('input[name="f_cp"]').val()
            },
            equipos: payloadEquipos
        };

        let btnSubmit = $(this).find('button[type="submit"]');
        let textoOriginal = btnSubmit.text();
        btnSubmit.prop('disabled', true).html('Guardando...');

        $.ajax({
            url: 'api/api_finalizar_venta.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dataEnvio),
            success: function (res) {
                if (res.status === 'success') {
                    alert(res.message);
                    window.location.href = $('#url_origen').val();
                } else {
                    alert("Error: " + res.message);
                    btnSubmit.prop('disabled', false).text(textoOriginal);
                }
            },
            error: function (xhr) {
                alert("Error de conexión. Revisa la consola.");
                console.log(xhr.responseText);
                btnSubmit.prop('disabled', false).text(textoOriginal);
            }
        });
    });
});