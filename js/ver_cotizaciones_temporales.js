$(document).ready(function () {

    // ✨ 1. INICIALIZAR SELECTS DEL MODAL DE EDICIÓN
    // (Hemos omitido el campo oculto #edit_estatus para que no colapse Select2)
    $('#tipo_precio, #edit_filtro_tipo_producto').each(function () {
        if ($(this).hasClass('select2-hidden-accessible')) {
            $(this).select2('destroy');
        }
        $(this).select2({
            theme: 'bootstrap-5',
            dropdownParent: $('#modalEditarCotizacionTemp'),
            width: '100%'
        });
    });

    const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    const formatoInput = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    $(document).on('blur', '.precio-mask', function () {
        let valor = String($(this).val()).replace(/,/g, '');
        if (valor !== '' && !isNaN(valor)) {
            $(this).val(formatoInput.format(valor));
        } else {
            $(this).val('');
        }
    });

    $(document).on('focus', '.precio-mask', function () {
        let valor = String($(this).val()).replace(/,/g, '');
        $(this).val(valor);
    });

    $(document).on('input', '.precio-mask', function () {
        this.value = this.value.replace(/[^0-9.,]/g, '');
    });

    let windowEmpresas = [];
    let windowProductos = [];
    let preciosProductos = {};
    let rowCount = 0;
    window.windowSucursalesOpcionesEdit = '<option value="">Selecciona Sucursal...</option>';
    let isEditMultiSucursal = false;
    let sucursalesCacheEdit = [];

    // CARGA DE CATÁLOGOS INICIALES
    $.ajax({ url: 'api/api_cotizador.php?action=get_empresas', type: 'GET', success: function (data) { windowEmpresas = data; } });
    $.ajax({
        url: 'api/api_cotizador.php?action=get_productos', type: 'GET',
        success: function (data) {
            windowProductos = data;
            data.forEach(p => { preciosProductos[p.id_product] = p; });
        }
    });

    $(document).on('change', '.chk-desglosar', function () {
        $(this).siblings('.hidden-desglose').val($(this).is(':checked') ? 'Y' : 'N');
    });

    $(document).on('change', '.select-sucursal-fila-edit', function () {
        $(this).attr('data-selected-suc', $(this).val());
    });

    // >>> ==============================================
    // >>> CARGAR TABLA PRINCIPAL (SOLO TEMPORALES)
    // >>> ==============================================
    function cargarTablaPrincipal() {
        $.ajax({
            url: 'api/api_ver_cotizaciones.php?action=leer_temporales',
            method: 'GET', cache: false, dataType: 'json',
            success: function (data) {
                let tbody = $('#tabla-cotizaciones');
                let $tabla = $('#tableCotizacionesTemporales');

                if ($.fn.DataTable && $.fn.DataTable.isDataTable($tabla)) { $tabla.DataTable().destroy(); }
                tbody.empty();

                if (data.length === 0) {
                    tbody.append('<tr><td colspan="7" class="text-center text-muted py-4">No hay cotizaciones temporales registradas.</td></tr>');
                    return;
                }

                data.forEach(function (cot) {
                    let folioVisual = cot.folio_especial ? cot.folio_especial : cot.id_cotizacion.toString().padStart(5, '0');
                    let razonSoc = cot.razon_social ? cot.razon_social : 'Sin Empresa';
                    let solicitante = `${cot.nombre || ''} ${cot.apellido_pat || ''}`.trim();
                    
                    let badgeColor = 'bg-soft-primary text-primary';
                    let estatusTexto = cot.estatus ? cot.estatus : 'Guardado para aprobación';

                    if (estatusTexto === 'Autorizada (sin dirección)') badgeColor = 'bg-soft-warning text-warning';
                    if (estatusTexto === 'Autorizada (información completa)') badgeColor = 'bg-soft-success text-success';
                    if (estatusTexto === 'No autorizada') badgeColor = 'bg-soft-danger text-danger';

                    let btnEditar = `<a href="#" class="avatar-text avatar-md bg-soft-primary text-primary btn-editar-modal" data-id="${cot.id_cotizacion}" data-folio="${folioVisual}"><abbr title="Editar o Volver Normal" style="text-decoration:none;"><i class="feather-edit"></i></abbr></a>`;
                    let btnEliminar = `<a href="javascript:void(0);" class="avatar-text avatar-md bg-soft-danger text-danger btn-borrar-cot" data-id="${cot.id_cotizacion}"><abbr title="Eliminar" style="text-decoration:none;"><i class="feather-trash-2"></i></abbr></a>`;
                    let btnPdfComercial = `<a href="imprimir_cotizacion.php?id=${cot.id_cotizacion}" target="_blank" class="avatar-text avatar-md bg-soft-dark text-dark"><abbr title="PDF Comercial" style="text-decoration:none;"><i class="feather-printer"></i></abbr></a>`;

                    let botonesActivos = [btnPdfComercial, btnEditar, btnEliminar];
                    let filasHTML = `<div class="d-flex justify-content-center gap-1">${botonesActivos.join('')}</div>`;

                    let colEstatusHTML = `<span class="badge ${badgeColor}">${estatusTexto}</span>`;
                    let fechaFiltro = cot.fecha_cot ? cot.fecha_cot : '';

                    // ✨ NUEVO: Inyectar botón de acción rápida (Solo Rechazar habilitado)
                    let esClienteSeguro = (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL);

                    if (estatusTexto === 'Guardado para aprobación' && !esClienteSeguro) {
                        colEstatusHTML = `
                            <div class="d-flex align-items-center justify-content-center gap-2">
                                <span class="badge ${badgeColor}">${estatusTexto}</span>
                                <div class="dropdown">
                                    <a href="javascript:void(0);" class="btn btn-sm btn-primary d-flex align-items-center justify-content-center shadow-sm" data-bs-toggle="dropdown" aria-expanded="false" title="Evaluar Cotización" style="width: 30px; height: 30px; padding: 0; border-radius: 6px;">
                                        <i class="feather-check-circle" style="font-size: 15px;"></i>
                                    </a>
                                    <ul class="dropdown-menu shadow-lg border-0 mt-2 p-2" style="min-width: 160px; border-radius: 10px;">
                                        <li><h6 class="dropdown-header text-muted text-uppercase fw-bolder mb-1" style="font-size: 10px; letter-spacing: 0.5px;">Tomar decisión</h6></li>
                                        <li>
                                            <a class="dropdown-item btn-cambiar-estatus fw-bold text-danger py-2 px-3 rounded d-flex align-items-center" href="#" data-id="${cot.id_cotizacion}" data-estatus="No autorizada" data-folio="${folioVisual}" style="transition: background-color 0.2s;">
                                                <i class="feather-x-circle me-2" style="font-size: 1.1rem;"></i> Rechazar
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        `;
                    }

                    let tr = `
                        <tr>
                            <td class="align-middle">
                                <div class="d-flex flex-column align-items-center justify-content-center text-center">
                                    <div class="avatar-image avatar-sm rounded bg-soft-warning d-flex align-items-center justify-content-center mb-1">
                                        <i class="feather-clock text-warning fs-4"></i>
                                    </div>
                                    <a class="d-block fw-bold mb-0 text-dark fs-14">${folioVisual}</a>
                                    <span class="fs-11 text-muted d-block mt-1"><i class="feather-calendar me-1"></i>${cot.fecha_cot}</span>
                                </div>
                            </td>
                            
                            <td class="align-middle" style="max-width: 270px; white-space: normal; overflow-wrap: break-word;">
                                <div class="fw-bolder text-uppercase text-dark mb-1" style="font-size: 13px; line-height: 1.2;">
                                    ${razonSoc}
                                </div>
                                <div class="d-flex flex-column gap-1 mt-2">
                                    <span class="text-muted fw-semibold" style="font-size: 11px;">
                                        <span class="text-dark">Solicitante:</span> ${solicitante}
                                    </span>
                                    <span class="text-warning fw-bold" style="font-size: 11px;">
                                        <i class="feather-alert-triangle me-1"></i>SIN DESTINO / TEMPORAL
                                    </span>
                                </div>
                            </td>
                            
                            <td class="align-middle text-center"><span class="text-dark fw-bold">${formatoMoneda.format(cot.gran_total)}</span></td>
                            <td class="align-middle text-center"><span class="d-none">${estatusTexto}</span>${colEstatusHTML}</td>
                            
                            <td class="d-none">${cot.categoria ? cot.categoria.trim().toUpperCase() : 'NUEVO'}</td>
                            <td class="d-none">${fechaFiltro}</td>
                            <td class="text-center align-middle" style="min-width: 110px;">${filasHTML}</td>
                        </tr>
                    `;
                    tbody.append(tr);
                });

                if ($.fn.DataTable) {
                    $tabla.DataTable({
                        language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' },
                        destroy: true,
                        pageLength: 8,
                        lengthChange: false,
                        ordering: false,
                        searching: true,
                        info: true,
                        
                        dom: "<'#temp-search-dt.d-none'f>" +
                            "<'row m-0'<'col-12 p-0'<'#contenedor-tabs-datatables'>>>" +
                            "<'table-responsive'tr>" +
                            "<'row m-0 align-items-center p-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-end'p>>",

                        initComplete: function () {
                            let tabsHtml = $('#template-tabs-cotizaciones').html();
                            $('#contenedor-tabs-datatables').html(tabsHtml).css({ 'width': '100%', 'display': 'block' });

                            let $search = $('#temp-search-dt .dataTables_filter').detach();
                            $('#temp-search-dt').remove();
                            $('#contenedor-buscador-dt').empty().append($search);

                            $('.dataTables_filter').css({ 'margin': '0', 'padding': '0', 'text-align': 'right', 'max-width': '100%' });
                            $('.dataTables_filter label').addClass('mb-0 d-flex align-items-center justify-content-end gap-2 fw-bold text-muted').css({ 'font-size': '13px', 'max-width': '100%' });
                            $('.dataTables_filter input').addClass('form-control shadow-sm m-0 border-warning').css({ 'border-radius': '6px', 'height': '34px', 'width': '250px', 'max-width': '100%' });

                            setTimeout(() => {
                                $('#filtro_estatus_tabla').trigger('change');
                                if (window.pestanaActivaCotizaciones !== 'TODOS') {
                                    aplicarFiltroCategoria(window.pestanaActivaCotizaciones);
                                    $('.tab-filtro-cat').removeClass('active').attr('aria-selected', 'false');
                                    $(`.tab-filtro-cat[data-categoria="${window.pestanaActivaCotizaciones}"]`).addClass('active').attr('aria-selected', 'true');
                                }
                            }, 100);
                        },

                        drawCallback: function () {
                            $('.dataTables_paginate > .pagination').addClass('pagination-sm mb-0');

                            let api = this.api();
                            let parseValor = function (i) {
                                let text = typeof i === 'string' ? i.replace(/<[^>]*>?/gm, '') : i;
                                return typeof text === 'string' ? text.replace(/[\$,]/g, '') * 1 : typeof text === 'number' ? text : 0;
                            };

                            let total = api.column(2, { search: 'applied' }).data().reduce(function (a, b) {
                                return a + parseValor(b);
                            }, 0);

                            let $badgeContainer = $('#contenedor-badge-total');

                            if (total > 0) {
                                let badgeHTML = `
                                    <div class="d-flex align-items-center bg-white shadow-sm px-3" style="height: 34px; border-radius: 6px; border: 1px solid #ffc107; border-left: 4px solid #ffc107;">
                                        <span class="text-muted fw-bold text-uppercase me-2" style="font-size: 10px;">Total:</span>
                                        <span class="fw-bolder text-warning" style="font-size: 13px;">${formatoMoneda.format(total)}</span>
                                    </div>`;
                                $badgeContainer.html(badgeHTML);
                            } else {
                                $badgeContainer.empty();
                            }
                        }
                    });
                }
            }
        });
    }

    cargarTablaPrincipal();
    
    //>>>============================================== 
    //>>> MODAL DE EDICIÓN Y CONVERSIÓN DE TEMPORALES
    //>>>============================================== 
    function verificarBotonFondoEdicion() {
        let cantidadFilas = $('#tab_logic_edit tbody tr.fila-producto').length;
        if (cantidadFilas >= 4) {
            $('#edit_btn_add_row_bottom').slideDown('fast');
        } else {
            $('#edit_btn_add_row_bottom').slideUp('fast');
        }
    }

    function cargarSucursalesEdicion(usuarioId, preseleccion_suc = null, preseleccion_plaza = null, isReadOnly = false) {
        let $selectSuc = $('#edit_select_sucursal');
        let $infoPlaza = $('#edit_info_plaza');
        let $wrapperPlaza = $('#wrapper_info_plaza_edit');

        if ($selectSuc.hasClass('select2-hidden-accessible')) $selectSuc.select2('destroy');
        $selectSuc.empty().append('<option value="">Cargando...</option>');
        $infoPlaza.empty().append('<option value="">Cargando plazas...</option>');

        if (usuarioId) {
            $wrapperPlaza.slideDown('fast');
            $.ajax({
                url: 'api/api_cotizador.php?action=get_sucursales_usuario&usuario_id=' + usuarioId,
                method: 'GET',
                dataType: 'json',
                success: function (data) {
                    sucursalesCacheEdit = data;

                    $selectSuc.empty();
                    window.windowSucursalesOpcionesEdit = '<option value="">Selecciona sucursal...</option>';

                    if (data.length === 0) {
                        $selectSuc.append('<option value="" disabled>Sin sucursales asignadas</option>');
                        window.windowSucursalesOpcionesEdit = '<option value="" disabled>Sin sucursales asignadas</option>';
                    } else {
                        $selectSuc.append('<option value="">Selecciona la sucursal...</option>');
                        let conteoNombres = {};

                        data.forEach(suc => {
                            let nombre = suc.nombre_listo_para_mostrar;
                            conteoNombres[nombre] = (conteoNombres[nombre] || 0) + 1;
                        });

                        let sucursalesAgregadas = new Set(); 

                        data.forEach(suc => {
                            if (!sucursalesAgregadas.has(suc.id_sucursal)) {
                                sucursalesAgregadas.add(suc.id_sucursal);
                                let nombreBase = suc.nombre_listo_para_mostrar;
                                let nombreVisual = nombreBase;

                                if (conteoNombres[nombreBase] > 1) {
                                    let calle = suc.calle ? suc.calle.trim() : '';
                                    let numExt = suc.num_ext ? suc.num_ext.trim() : '';
                                    let idSae = suc.id_sae ? suc.id_sae : '';
                                    
                                    let direccionCompleta = calle;
                                    if (numExt !== '') direccionCompleta += (direccionCompleta !== '' ? ' No. ' + numExt : 'No. ' + numExt);
                                    
                                    if (direccionCompleta !== '') {
                                        nombreVisual = `${nombreBase} - (${direccionCompleta})`;
                                    } else if (idSae !== '') {
                                        nombreVisual = `${nombreBase} - (SAE: ${idSae})`;
                                    }
                                }

                                $selectSuc.append(`<option value="${suc.id_sucursal}">${nombreVisual}</option>`);
                                window.windowSucursalesOpcionesEdit += `<option value="${suc.id_sucursal}">${nombreVisual}</option>`;
                            }
                        });

                        if (preseleccion_suc) {
                            $selectSuc.val(preseleccion_suc.toString());
                        }

                        if (!$selectSuc.val() && data.length === 1 && !isEditMultiSucursal) {
                            $selectSuc.val(data[0].id_sucursal);
                        }
                    }

                    $selectSuc.select2({ dropdownParent: $('#modalEditarCotizacionTemp'), theme: 'bootstrap-5', width: '100%' });

                    if (isReadOnly) {
                        $selectSuc.prop('disabled', true);
                    }

                    $('.select-sucursal-fila-edit').each(function () {
                        let valToSelect = $(this).attr('data-selected-suc') || $(this).val();
                        $(this).html(window.windowSucursalesOpcionesEdit);
                        if (valToSelect) $(this).val(valToSelect);

                        if ($(this).hasClass('select2-hidden-accessible')) {
                            $(this).trigger('change.select2');
                        } else if (isEditMultiSucursal && $.fn.select2) {
                            $(this).select2({ theme: 'bootstrap-5', dropdownParent: $('#modalEditarCotizacionTemp'), width: '100%', placeholder: "Selecciona sucursal..." });
                            if (isReadOnly) $(this).prop('disabled', true);
                        }
                    });

                    let plazasUnicas = new Map();
                    data.forEach(suc => {
                        if (suc.ids_plazas && suc.nombres_plazas) {
                            let ids = suc.ids_plazas.toString().split('||');
                            let nombres = suc.nombres_plazas.split('||');
                            for (let i = 0; i < ids.length; i++) {
                                let idPlaza = ids[i].trim();
                                let nomPlaza = nombres[i].trim();
                                if (idPlaza && nomPlaza) plazasUnicas.set(idPlaza, nomPlaza);
                            }
                        }
                    });

                    if ($infoPlaza.hasClass('select2-hidden-accessible')) $infoPlaza.select2('destroy');
                    $infoPlaza.empty().removeClass('form-select').addClass('form-control').css({ 'pointer-events': '', 'background-image': '', 'appearance': '' });

                    if (plazasUnicas.size === 0) {
                        $infoPlaza.append('<option value="">El usuario no tiene plazas ligadas</option>');
                    } else if (plazasUnicas.size === 1) {
                        let plazaActiva = Array.from(plazasUnicas.entries())[0];
                        $infoPlaza.append(`<option value="${plazaActiva[0]}" selected>${plazaActiva[1]}</option>`);
                    } else {
                        $infoPlaza.append('<option value="">Selecciona la plaza...</option>');
                        plazasUnicas.forEach((nombre, id) => {
                            $infoPlaza.append(`<option value="${id}">${nombre}</option>`);
                        });

                        if (typeof preseleccion_plaza !== 'undefined' && preseleccion_plaza) {
                            $infoPlaza.val(preseleccion_plaza.toString());
                        }

                        if ($.fn.select2) {
                            $infoPlaza.select2({ theme: 'bootstrap-5', width: '100%', minimumResultsForSearch: Infinity });
                        }
                    }

                    if (isReadOnly || plazasUnicas.size <= 1) {
                        $infoPlaza.prop('disabled', true).removeClass('bg-white').addClass('bg-light').css('pointer-events', 'none');
                    } else {
                        $infoPlaza.prop('disabled', false).removeClass('bg-light').addClass('bg-white').css('pointer-events', 'auto');
                    }
                },
                error: function () {
                    $selectSuc.empty().append('<option value="">Error al cargar</option>');
                    $infoPlaza.empty().append('<option value="">Error al cargar</option>');
                }
            });
        } else {
            sucursalesCacheEdit = [];
            $selectSuc.empty().append('<option value="">Esperando al solicitante...</option>');
            $infoPlaza.empty().append('<option value="">Esperando sucursal...</option>');
            $wrapperPlaza.slideUp('fast');
        }
    }

    function construirFila(index, id_detalle_cot = 0, prod_id = '', precio = '', qty = 1, total = '', esServicio = false, isDesglose = false, sucursal_destino_id = '', equipo_id = '') {
        let opciones = '<option value="">Selecciona...</option>';
        let filtroActual = $('#edit_filtro_tipo_producto').val() || 'TODOS';

        windowProductos.forEach(p => {
            let claveM = p.clave_product.toUpperCase();
            let descM = p.descripcion_product.toUpperCase();
            let estadoBD = p.estado_product ? p.estado_product.toUpperCase().trim() : 'N/A';
            let pasaFiltro = false;

            if (filtroActual === 'TODOS') pasaFiltro = true;
            else if (filtroActual === estadoBD) pasaFiltro = true;
            else if (p.id_product == prod_id) pasaFiltro = true;

            if (pasaFiltro) {
                let selected = (p.id_product == prod_id) ? 'selected' : '';
                let marca = (p.marca_product && p.marca_product !== 'N/A') ? p.marca_product.toUpperCase() : '';
                let textoMarca = marca ? ` | Marca: ${marca}` : '';
                let isSrv = (estadoBD === 'CALIBRACION');

                opciones += `<option value="${p.id_product}" data-servicio="${isSrv}" ${selected}>[${claveM}] ${descM}${textoMarca}</option>`;
            }
        });

        let disabledAttr = esServicio ? 'disabled' : '';
        let checkedDesglose = (isDesglose && !esServicio) ? 'checked' : '';
        let valDesglose = (isDesglose && !esServicio) ? 'Y' : 'N';
        let displayStyle = isEditMultiSucursal ? '' : 'style="display: none;"';
        let precioVal = precio ? formatoInput.format(precio) : '';
        
        let tdSucursal = `
            <td class="align-middle col-edit-multisucursal" ${displayStyle}>
                <select class="form-select form-select-sm select-sucursal-fila-edit" name="sucursal_fila[]" data-selected-suc="${sucursal_destino_id}">
                    ${window.windowSucursalesOpcionesEdit}
                </select>
            </td>
        `;

        return `
            <tr id="edit_addr${index}" class="fila-producto">
                <td class="text-center align-middle fila-numero">
                    <input type="hidden" name="id_detalle[]" value="${id_detalle_cot}">
                    <span class="num-fila-txt">${index + 1}</span>
                </td>
                <td class="align-middle"><input type="number" name="cantidad_cot[]" class="form-control edit-qty" step="1" min="1" value="${qty}" required></td>
                <td class="align-middle">
                    <select class="form-control select-prod-modal" name="productos[]" required>${opciones}</select>
                    <div class="puntos-calibracion-wrapper mt-2" style="display:none;"></div>
                    <input type="text" name="equipo_id[]" class="form-control form-control-sm mt-2 equipo-id-input border-primary" placeholder="ID del equipo (Opcional)" value="${equipo_id || ''}" style="display:none;">
                </td>
                ${tdSucursal}
                <td class="align-middle text-center">
                    <div class="form-check d-flex justify-content-center align-items-center gap-2 mt-2">
                        <input type="hidden" name="desglosar[]" class="hidden-desglose" value="${valDesglose}">
                        <input class="form-check-input m-0 border-secondary chk-desglosar chk-config" type="checkbox" id="edit_chk_desglosar_${index}" ${checkedDesglose} ${disabledAttr} style="cursor: pointer;">
                        <label class="form-check-label fs-11 text-muted text-start" for="edit_chk_desglosar_${index}" style="cursor: pointer; padding-top: 2px;">
                            Desglosar partida
                        </label>
                    </div>
                    <div class="info-desglose text-center mt-2"></div>
                </td>
                <td class="align-middle"><input type="text" name="unitario[]" class="form-control edit-price precio-mask" value="${precioVal}" autocomplete="off" required></td>
                <td class="align-middle">
                    <div class="d-flex align-items-center gap-2">
                        <input type="text" class="form-control edit-total-visual text-end fw-bold" readonly value="">
                        <input type="hidden" name="total[]" class="edit-total-hidden" value="${total}">
                        <a href="#" class="text-danger btn-eliminar-fila-unica" title="Eliminar fila" style="font-size: 1.2rem;"><i class="feather-trash-2"></i></a>
                    </div>
                </td>
            </tr>
        `;
    }

    function cargarSolicitantes(id_empresa, preseleccion = null, isReadOnly = false, preseleccion_suc = null, preseleccion_plaza = null) {
        let $selSol = $('#edit_select_solicitante');
        if ($selSol.hasClass('select2-hidden-accessible')) $selSol.select2('destroy');
        $selSol.html('<option value="">Cargando...</option>');

        $.ajax({
            url: 'api/api_cotizador.php?action=get_usuarios&empresa_id=' + id_empresa,
            method: 'GET',
            success: function (users) {
                $selSol.html('<option value="">Selecciona...</option>');
                users.forEach(u => { $selSol.append(`<option value="${u.id_usuario}">${u.nombre} ${u.apellido_pat} ${u.apellido_mat}</option>`); });

                if (preseleccion) {
                    $selSol.data('old', preseleccion.toString()).val(preseleccion);
                    cargarSucursalesEdicion(preseleccion, preseleccion_suc, preseleccion_plaza, isReadOnly);
                }

                $selSol.select2({ dropdownParent: $('#modalEditarCotizacionTemp') });

                if (isReadOnly) {
                    $selSol.prop('disabled', true);
                    if ($('#hidden_edit_usuario').length === 0) {
                        $('#formEditarCotizacion').append(`<input type="hidden" id="hidden_edit_usuario" name="Usuario_id" value="${preseleccion}">`);
                    } else {
                        $('#hidden_edit_usuario').val(preseleccion);
                    }
                }
            }
        });
    }

    $('#edit_select_solicitante').on('change', function () {
        let val = $(this).val();
        if (!val || $(this).data('old') === val) return;
        $(this).data('old', val);
        cargarSucursalesEdicion(val, null, null, false);
    });

    $('#edit_select_empresa').on('change', function () { cargarSolicitantes($(this).val()); });

    let previousTipoPrecio = '';
    $('#tipo_precio').on('focus click', function () { previousTipoPrecio = $(this).val(); }).on('change', function () {
        let nuevoPrecio = $(this).val();
        if (previousTipoPrecio && nuevoPrecio && previousTipoPrecio !== nuevoPrecio) {
            if (confirm("ATENCIÓN: Cambiar la lista de precios recalculará de forma automática todas las partidas. ¿Deseas continuar?")) {
                previousTipoPrecio = nuevoPrecio;
                $('#tab_logic_edit tbody tr.fila-producto').each(function () { calculateRowEdit($(this)); });
                calcEditTotal();
            } else { $(this).val(previousTipoPrecio); }
        }
    });

    // >>>============================================== 
    // >>> LÓGICA DE EDICIÓN Y CONVERSIÓN DE TEMPORAL
    // >>>============================================== 

    // Función auxiliar para previsualizar el nuevo Folio cuando se va a convertir
    function calcularFolioPredictivoEdicion() {
        let esTemporal = $('input[name="es_temporal"]:checked').val() || 'Y';
        let categoria = $('#edit_filtro_tipo_producto').val();
        let $badgeFolio =$('#modal_folio_badge');

        if (esTemporal === 'N') {
            $badgeFolio.html('<span class="spinner-border spinner-border-sm" style="width: 1rem; height: 1rem;"></span>').removeClass('bg-soft-warning text-warning').addClass('bg-soft-primary text-primary');

            $.ajax({
                url: 'api/api_cotizador.php?action=preview_folio&cat=' + categoria + '&es_temp=N',
                method: 'GET',
                dataType: 'json',
                success: function (res) {
                    if (res.status === 'success') {
                        $badgeFolio.html('<i class="feather-hash me-1"></i>' + res.folio);
                    }
                },
                error: function () {
                    $badgeFolio.text('Error');
                }
            });
        } else {
            // Si regresa a temporal, devolvemos el folio original
            let folioOriginal = $badgeFolio.data('folio-original');$badgeFolio.html(folioOriginal).removeClass('bg-soft-primary text-primary').addClass('bg-soft-warning text-warning');
        }
    }

    // Lógica interactiva del Radio Button "Naturaleza de la Cotización"
    $(document).on('change', 'input[name="es_temporal"]', function () {
        let esTemporal = $(this).val();
        let $selectSuc =$('#edit_select_sucursal');
        let $filaTipoSucursal =$('#fila_tipo_sucursal_edit'); 

        if (esTemporal === 'Y') {
            // Modo Temporal: Desactiva los selectores de sucursal
            $filaTipoSucursal.hide();$('#wrapper_selector_sucursal_edit').hide();
            $selectSuc.prop('required', false);$('.col-edit-multisucursal').hide(); 

            $('label[for="edit_rad_temporal"]').removeClass('text-muted').addClass('text-dark');
            $('label[for="edit_rad_normal"]').removeClass('text-dark').addClass('text-muted');
        } else {
            // Modo Normal: Muestra la decisión y fuerza ÚNICA siempre al abrir
            $filaTipoSucursal.slideDown('fast');$('#edit_rad_unica').prop('checked', true).trigger('change'); 

            $('label[for="edit_rad_normal"]').removeClass('text-muted').addClass('text-dark');
            $('label[for="edit_rad_temporal"]').removeClass('text-dark').addClass('text-muted');
        }

        calcularFolioPredictivoEdicion();
    });

    // Lógica interactiva del Radio Button "Sucursal Única / Multi-sucursal" en Edición
    $(document).on('change', 'input[name="tipo_sucursal_flujo_edit"]', function () {
        let tipo = $(this).val();
        let $selectSuc = $('#edit_select_sucursal');

        if (tipo === 'multisucursal') {
            isEditMultiSucursal = true; 
            $('#edit_is_multisucursal').val('1'); 
            $('#wrapper_selector_sucursal_edit').hide();
            $selectSuc.val('').trigger('change.select2').prop('required', false); 
            $('.col-edit-multisucursal').fadeIn('fast');
            
            // ✨ FIX UI: Aplicar estilos Select2 a las filas existentes cuando se muestra la columna
            $('.select-sucursal-fila-edit').each(function () {
                if (!$(this).hasClass('select2-hidden-accessible')) {
                    $(this).select2({ 
                        theme: 'bootstrap-5', 
                        dropdownParent: $('#modalEditarCotizacionTemp'), 
                        width: '100%', 
                        placeholder: "Selecciona destino..." 
                    });
                }
            });
            
        } else {
            isEditMultiSucursal = false; 
            $('#edit_is_multisucursal').val('0'); 
            $('#wrapper_selector_sucursal_edit').fadeIn('fast');
            $selectSuc.prop('required', true);
            $('.col-edit-multisucursal').hide(); 
            $('.select-sucursal-fila-edit').val('').trigger('change.select2');
        }
    });

    $(document).on('change', '#edit_filtro_tipo_producto', function () {
        calcularFolioPredictivoEdicion();
        
        let nuevoFiltro = $(this).val();

        $('#edit_tbody_productos tr.fila-producto').each(function () {
            let $row =$(this);
            let $selectProd =$row.find('.select-prod-modal');
            let idProductoActual = $selectProd.val();

            let opcionesActualizadas = '<option value="">Selecciona...</option>';

            windowProductos.forEach(p => {
                let claveM = p.clave_product.toUpperCase();
                let descM = p.descripcion_product.toUpperCase();
                let estadoBD = p.estado_product ? p.estado_product.toUpperCase().trim() : 'N/A';

                let pasaFiltro = false;
                if (nuevoFiltro === 'TODOS') pasaFiltro = true;
                else if (nuevoFiltro === estadoBD) pasaFiltro = true;
                else if (p.id_product == idProductoActual) pasaFiltro = true;

                if (pasaFiltro) {
                    let selected = (p.id_product == idProductoActual) ? 'selected' : '';
                    let marca = (p.marca_product && p.marca_product !== 'N/A') ? p.marca_product.toUpperCase() : '';
                    let textoMarca = marca ? ` | Marca: ${marca}` : '';
                    let isSrv = (estadoBD === 'CALIBRACION');
                    opcionesActualizadas += `<option value="${p.id_product}" data-servicio="${isSrv}" ${selected}>[${claveM}] ${descM}${textoMarca}</option>`;
                }
            });

            if ($selectProd.hasClass('select2-hidden-accessible')) $selectProd.select2('destroy');$selectProd.html(opcionesActualizadas).val(idProductoActual);
            $selectProd.select2({ theme: 'bootstrap-5', dropdownParent:$('#modalEditarCotizacionTemp'), width: '100%' });
        });
    });

    // >>>============================================== 
    // >>> FIN LÓGICA DE EDICIÓN Y CONVERSIÓN DE TEMPORAL
    // >>>==============================================


    // ✨ ABRIR MODAL
    $(document).on('click', '.btn-editar-modal', function (e) {
        e.preventDefault();
        window.productoAgregadoEnEdicion = false;
        let id_cot = $(this).data('id');
        let folioVisualModal = String($(this).data('folio'));
        
        // Guardamos el folio en memoria para poder restaurarlo si cambia de opinión
        $('#modal_folio_badge').data('folio-original', folioVisualModal).text(folioVisualModal.includes('-') ? folioVisualModal : '#' + folioVisualModal).removeClass('bg-soft-primary text-primary').addClass('bg-soft-warning text-warning');

        $.ajax({
            url: 'api/api_ver_cotizaciones.php?action=get_cotizacion&id=' + id_cot,
            method: 'GET',
            success: function (res) {
                let cot = res.cotizacion;
                let dets = res.detalles;

                // 🛡️ REGLA: Forzamos ÚNICA al arrancar para limpiar estados corruptos.
                isEditMultiSucursal = false;
                $('#edit_is_multisucursal').val('0');

                let isReadOnly = false;
                let perfilActual = (typeof USER_PERFIL !== 'undefined') ? USER_PERFIL : 'cliente';

                if (cot.estatus === 'No autorizada') {
                    isReadOnly = true;
                } else if (cot.estatus.includes('Autorizada') && perfilActual !== 'admin') {
                    isReadOnly = true;
                }

                $('#formEditarCotizacion input, #formEditarCotizacion select').prop('disabled', false);
                $('#edit_add_row').show();
                $('#formEditarCotizacion button[type="submit"]').prop('disabled', false).text('Actualizar Cambios').show();

                $('#edit_id_cotizacion').val(cot.id_cotizacion);
                $('#edit_comentarios').val(cot.comentarios);
                $('#division').val(cot.division).trigger('change');

                previousTipoPrecio = cot.tipo_precio;
                $('#tipo_precio').val(cot.tipo_precio).trigger('change');
                $('#edit_tax').val(cot.porcentaje_iva);
                $('#edit_sub_total').val(cot.importe_total);
                $('#edit_sub_total_visual').val(formatoMoneda.format(cot.importe_total));
                $('#edit_total_amount').val(cot.precio_iva);
                $('#edit_total_amount_visual').val(formatoMoneda.format(cot.precio_iva));

                let $selEmp =$('#edit_select_empresa');
                if ($selEmp.hasClass('select2-hidden-accessible')) $selEmp.select2('destroy');$selEmp.html('<option value="">Selecciona un cliente...</option>');
                windowEmpresas.forEach(emp => { $selEmp.append(`<option value="${emp.id_empresa}">${emp.razon_social}</option>`); });
                $selEmp.data('old', cot.Empresa_id.toString()).val(cot.Empresa_id);
                $selEmp.select2({ dropdownParent:$('#modalEditarCotizacionTemp') });

                let estatusBD = cot.estatus ? cot.estatus : 'Guardado para aprobación';
                $('#edit_estatus').val(estatusBD);

                // ✨ INYECTA EL ESTADO DE LOS RADIO BUTTONS AL CARGAR
                // 🛡️ ZERO TRUST FRONTEND: Si por alguna razón la red falla o la BD no envía el dato, forzamos 'Y' por seguridad extrema para evitar conversiones accidentales.
                let naturalezaBD = cot.es_temporal ? cot.es_temporal : 'Y';

                if (naturalezaBD === 'Y') {
                    $('#edit_rad_temporal').prop('checked', true).trigger('change');
                } else {
                    $('#edit_rad_normal').prop('checked', true).trigger('change');
                }

                let id_plaza_db = cot.Plaza_id ? cot.Plaza_id : null;
                cargarSolicitantes(cot.Empresa_id, cot.Usuario_empresa_id, isReadOnly, cot.Sucursal_id, id_plaza_db);

                let catBD = cot.categoria ? cot.categoria.toUpperCase().trim() : 'NUEVO';
                if (['NUEVO', 'USADO', 'CALIBRACION'].includes(catBD)) {
                    $('#edit_filtro_tipo_producto').val(catBD).trigger('change');
                } else {
                    $('#edit_filtro_tipo_producto').val('TODOS').trigger('change');
                }
                $('#edit_filtro_tipo_producto').css({ 'pointer-events': 'none', 'background-color': '#e9ecef', 'opacity': '1' });

                let $tbody =$('#edit_tbody_productos');
                $tbody.empty(); rowCount = 0;

                dets.forEach((item, index) => {
                    let esServicio = false;
                    if (preciosProductos[item.Product_id]) {
                        let pData = preciosProductos[item.Product_id];
                        let estadoBD = pData.estado_product ? pData.estado_product.toUpperCase().trim() : '';
                        if (estadoBD === 'CALIBRACION') esServicio = true;
                    }
                    $tbody.append(construirFila(index, item.id_detalle_cot, item.Product_id, item.precio_unitario, item.cantidad, item.precio_extendido, esServicio, item.desglosar === 'Y', item.sucursal_destino_id, item.equipo_id));
                    calculateRowEdit($(`#edit_addr${index}`));
                    rowCount++;
                });

                $('.select-prod-modal').select2({ theme: 'bootstrap-5', dropdownParent:$('#modalEditarCotizacionTemp'), width: '100%' });

                if (isReadOnly) {
                    $('#formEditarCotizacion input, #formEditarCotizacion select').prop('disabled', true);
                    $('#edit_add_row').hide();
                    $('#edit_btn_add_row_bottom').hide();
                    $('.btn-eliminar-fila-unica').hide();$('#formEditarCotizacion button[type="submit"]').hide();
                } else {
                    verificarBotonFondoEdicion();
                }

                $('#modalEditarCotizacionTemp').modal('show');
            },
            error: function(xhr) {
                alert("Error al intentar abrir la cotización. Revisa tu conexión.");
                console.error(xhr.responseText);
            }
        });
    });

    $("#edit_add_row, #edit_btn_add_row_bottom").click(function () {
        $("#edit_tbody_productos").append(construirFila(rowCount, 0, '', '', 1, '', false, false, '', ''));
        window.productoAgregadoEnEdicion = true;

        $(`#edit_addr${rowCount} .select-prod-modal`).select2({ theme: 'bootstrap-5', dropdownParent: $('#modalEditarCotizacionTemp'), width: '100%' });
        $(`#edit_addr${rowCount} .select-sucursal-fila-edit`).select2({ theme: 'bootstrap-5', dropdownParent: $('#modalEditarCotizacionTemp'), width: '100%', placeholder: "Selecciona Sucursal..." });
        rowCount++;
        recalcularNumerosFila();
        verificarBotonFondoEdicion();
    });

    $(document).on('click', '.btn-eliminar-fila-unica', function (e) {
        e.preventDefault();
        if ($('#edit_tbody_productos tr.fila-producto').length > 1) {
            $(this).closest('tr').remove();
            recalcularNumerosFila();
            calcEditTotal();
            verificarBotonFondoEdicion();
        } else {
            alert("La cotización debe tener al menos un producto.");
        }
    });

    function recalcularNumerosFila() {
        $('#edit_tbody_productos tr.fila-producto').each(function (index) {
            $(this).find('.num-fila-txt').text(index + 1);
        });
    }

    $(document).on('change', '.select-prod-modal, .chk-config', function () {
        let row = $(this).closest('tr');
        calculateRowEdit(row);
        calcEditTotal();
    });

    $(document).on("keyup change", ".edit-qty, #edit_tax", function () {
        let row = $(this).closest('tr');
        if (row.length > 0) calculateRowEdit(row);
        calcEditTotal();
    });

    function calculateRowEdit(row) {
        let prodSelect = row.find('.select-prod-modal');
        let prodId = prodSelect.val();
        let pData = preciosProductos[prodId];
        let $puntosWrapper = row.find('.puntos-calibracion-wrapper');
        let $inputID = row.find('.equipo-id-input');

        if (!pData) {
            row.find('.edit-price').val('');
            row.find('.edit-total-hidden').val('');
            row.find('.edit-total-visual').val('');
            row.find('.info-desglose').html('');
            $puntosWrapper.slideUp('fast').empty();$inputID.hide().prop('required', false).val('');
            row.find('.chk-desglosar').prop('disabled', false);
            calcEditTotal();
            return;
        }

        let ptos = pData.puntos_calibracion;
        if (ptos !== null && ptos !== undefined && String(ptos).trim() !== '' && String(ptos).trim() !== 'null') {
            let puntosFormateados = String(ptos).trim().replace(/\n/g, '<br>');
            $puntosWrapper.html(`<span class="badge bg-soft-success text-success px-2 py-1 fs-11 w-100 shadow-sm mt-1" style="white-space: normal; text-align: left; line-height: 1.4; border-left: 3px solid #28a745;"><i class="feather-target me-1 fw-bold"></i> Ptos de calibración: ${puntosFormateados}</span>`).slideDown('fast');
        } else {
            $puntosWrapper.hide().empty();
        }

        let estadoBD = pData.estado_product ? pData.estado_product.toUpperCase().trim() : '';
        let esServicio = (estadoBD === 'CALIBRACION');

        if (esServicio) {
            $inputID.hide().prop('required', false).val('');
            row.find('.chk-desglosar').prop('checked', false).prop('disabled', true);
        } else {
            row.find('.chk-desglosar').prop('disabled', false);

            if (estadoBD === 'USADO') {
                $inputID.show().prop('readonly', false).removeClass('bg-light').prop('required', true).attr('placeholder', 'ID del equipo (Obligatorio)');
            } else {
                $inputID.prop('required', false).attr('placeholder', 'ID del equipo (Opcional)');
            }
        }

        let qty = parseFloat(row.find('.edit-qty').val()) || 0;
        let tipoPrecio = $('#tipo_precio').val();
        let desglosar = row.find('.chk-desglosar').is(':checked');

        if (!tipoPrecio) {
            row.find('.info-desglose').html('<small class="text-danger fw-bold">Falta lista de precios</small>');
            return;
        }

        let pEquipo = (tipoPrecio === 'Farmacia') ? parseFloat(pData.pf_equipo) : parseFloat(pData.pp_equipo);
        let pCalib = (tipoPrecio === 'Farmacia') ? parseFloat(pData.pf_calib) : parseFloat(pData.pp_calib);
        let pAntesIva = (tipoPrecio === 'Farmacia') ? parseFloat(pData.pf_antes_iva) : parseFloat(pData.pp_antes_iva);
        let textoInformativo = "";

        if (esServicio) {
            row.find('.edit-price').val(pEquipo.toFixed(2));
            textoInformativo = `<small class="text-info d-block fw-bold mt-1">Servicio (${formatoMoneda.format(pEquipo)})</small>`;
        } else {
            row.find('.edit-price').val(pAntesIva.toFixed(2));

            if (desglosar) {
                if (estadoBD === 'USADO') {
                    textoInformativo = `<small class="text-primary d-block fw-bold mt-1">Equipo (${formatoMoneda.format(0)}) + Calibración (${formatoMoneda.format(pAntesIva)})</small>`;
                } else {
                    textoInformativo = `<small class="text-primary d-block fw-bold mt-1">Equipo (${formatoMoneda.format(pEquipo)}) + Calibración (${formatoMoneda.format(pCalib)})</small>`;
                }
            } else {
                textoInformativo = `<small class="text-muted d-block mt-1">Incluye equipo y calibración</small>`;
            }
        }

        row.find('.info-desglose').html(textoInformativo);
        let unitarioRaw = String(row.find('.edit-price').val()).replace(/,/g, '');
        let unitario = parseFloat(unitarioRaw) || 0;
        let totalFila = unitario * qty;

        row.find('.edit-total-hidden').val(totalFila > 0 ? totalFila.toFixed(2) : '');
        row.find('.edit-total-visual').val(totalFila > 0 ? formatoMoneda.format(totalFila) : '');

        calcEditTotal();
    }

    function calcEditTotal() {
        let sub = 0;
        $("#tab_logic_edit tbody tr.fila-producto").each(function () {
            let t = parseFloat($(this).find(".edit-total-hidden").val()) || 0;
            sub += t;
        });

        $("#edit_sub_total").val(sub.toFixed(2));
        $("#edit_sub_total_visual").val(formatoMoneda.format(sub));

        let tax = 16;
        let monto_iva = (sub / 100) * tax;
        let totalFinal = sub + monto_iva;

        $("#edit_total_amount").val(totalFinal.toFixed(2));
        $("#edit_total_amount_visual").val(formatoMoneda.format(totalFinal));
    }

    // ✨ GUARDAR Y CERRAR MODAL
    $('#formEditarCotizacion').on('submit', function (e) {
        e.preventDefault();
        
        let esTemporal = $('input[name="es_temporal"]:checked').val() || 'N';
        let isMulti = $('#edit_is_multisucursal').val() === '1';

        if (esTemporal === 'N' && !isMulti && !$('#edit_select_sucursal').val()) {
            alert("⚠️ Estás convirtiendo la cotización a Normal. Debes seleccionar una Sucursal para certificado antes de guardar.");
            return;
        }

        $('#tab_logic_edit tbody tr.fila-producto').each(function () { calculateRowEdit($(this)); });
        calcEditTotal();

        let btnSubmit = $(this).find('button[type="submit"]');
        let textoOriginal = btnSubmit.text();
        btnSubmit.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...');

        let $disabledFields = $(this).find(':disabled');$disabledFields.prop('disabled', false);

        let formData = $(this).serializeArray();$disabledFields.prop('disabled', true);

        $.ajax({
            url: 'api/api_ver_cotizaciones.php',
            type: 'POST',
            data: $.param(formData),
            success: function (res) {
                btnSubmit.prop('disabled', false).text(textoOriginal);

                if (res.status === 'success') {
                    $('#modalEditarCotizacionTemp').modal('hide'); // <--- CIERRA EL MODAL CORRECTAMENTE
                    $('.modal-backdrop').remove();

                    if (esTemporal === 'N') {
                        alert("✅ Cotización convertida a Normal exitosamente.\nSerás redirigido para verificar las direcciones de los equipos.");
                        window.location.href = 'finalizar_venta.php?id=' + $('#edit_id_cotizacion').val() + '&editado=1&from=todas_cotizaciones';
                    } else {
                        alert("Cambios guardados exitosamente.");
                        cargarTablaPrincipal();
                    }
                } else {
                    alert("Error: " + res.message);
                }
            },
            error: function () {
                alert("Error de conexión al servidor.");
                btnSubmit.prop('disabled', false).text(textoOriginal);
            }
        });
    });

    $(document).on('change', '#edit_filtro_tipo_producto', function () {
        let nuevoFiltro = $(this).val();

        $('#edit_tbody_productos tr.fila-producto').each(function () {
            let $row =$(this);
            let $selectProd =$row.find('.select-prod-modal');
            let idProductoActual = $selectProd.val();

            let opcionesActualizadas = '<option value="">Selecciona...</option>';

            windowProductos.forEach(p => {
                let claveM = p.clave_product.toUpperCase();
                let descM = p.descripcion_product.toUpperCase();
                let estadoBD = p.estado_product ? p.estado_product.toUpperCase().trim() : 'N/A';

                let pasaFiltro = false;
                if (nuevoFiltro === 'TODOS') pasaFiltro = true;
                else if (nuevoFiltro === estadoBD) pasaFiltro = true;
                else if (p.id_product == idProductoActual) pasaFiltro = true;

                if (pasaFiltro) {
                    let selected = (p.id_product == idProductoActual) ? 'selected' : '';
                    let marca = (p.marca_product && p.marca_product !== 'N/A') ? p.marca_product.toUpperCase() : '';
                    let textoMarca = marca ? ` | Marca: ${marca}` : '';
                    let isSrv = (estadoBD === 'CALIBRACION');
                    opcionesActualizadas += `<option value="${p.id_product}" data-servicio="${isSrv}" ${selected}>[${claveM}] ${descM}${textoMarca}</option>`;
                }
            });

            if ($selectProd.hasClass('select2-hidden-accessible')) $selectProd.select2('destroy');$selectProd.html(opcionesActualizadas).val(idProductoActual);
            $selectProd.select2({ theme: 'bootstrap-5', dropdownParent:$('#modalEditarCotizacionTemp'), width: '100%' });
        });
    });

    let $modalContainer =$('#modalEditarCotizacionTemp');
    let $modalScroll =$('#formEditarCotizacion');
    let $btnTopModal =$('#btnBackToTopModal');

    if ($btnTopModal.length) {$modalScroll.on('scroll', function () {
            if ($(this).scrollTop() > 200)$btnTopModal.css('display', 'flex');
            else $btnTopModal.css('display', 'none');
        });

        $btnTopModal.on('click', function () {$modalScroll[0].scrollTo({ top: 0, behavior: 'smooth' });
        });

        $modalContainer.on('hidden.bs.modal', function () {$btnTopModal.css('display', 'none');
        });
    }

    $(document).on('click', '.btn-borrar-cot', function (e) {
        e.preventDefault();
        if (confirm("¿Estás seguro de Eliminar permanentemente esta cotización?")) {
            $.ajax({
                url: 'api/api_ver_cotizaciones.php',
                type: 'POST',
                data: { action: 'eliminar', id_cotizacion: $(this).data('id') },
                success: function (res) {
                    if (res.status === 'success') {
                        cargarTablaPrincipal();
                    } else {
                        alert("Error al eliminar: " + res.message);
                    }
                }
            });
        }
    });

    // >>>============================================== 
    // >>> SISTEMA DE PESTAÑAS (NAV-TABS)
    // >>>============================================== 
    window.pestanaActivaCotizaciones = 'TODOS';

    $(document).on('click', '.tab-filtro-cat', function (e) {
        e.preventDefault();
        $('.tab-filtro-cat').removeClass('active').attr('aria-selected', 'false');$(this).addClass('active').attr('aria-selected', 'true');

        let categoria = $(this).data('categoria');
        window.pestanaActivaCotizaciones = categoria;
        aplicarFiltroCategoria(categoria);
    });

    function aplicarFiltroCategoria(categoria) {
        let $tablaDT =$('#tableCotizacionesTemporales').DataTable();
        
        $tablaDT.column(4).search('');$tablaDT.column(3).search(''); 

        if (categoria === 'TODOS') {
            let estatusGlobal = $('#filtro_estatus_tabla').val();
            if(estatusGlobal) {
                $tablaDT.column(3).search('^\\s*' + estatusGlobal, true, false);
            }
            $tablaDT.draw();
            
        } else if (categoria === 'CANCELADAS') {
            $tablaDT.column(3).search('^\\s*No autorizada', true, false).draw();$('#filtro_estatus_tabla').val('No autorizada');
            
        } else {
            let regex = '^\\s*' + categoria + '\\s*$';
            $tablaDT.column(4).search(regex, true, false);
            
            let estatusGlobal = $('#filtro_estatus_tabla').val();
            if(estatusGlobal) {
                $tablaDT.column(3).search('^\\s*' + estatusGlobal, true, false);
            }
            $tablaDT.draw();
        }
    }

    $(document).off('change', '#filtro_estatus_tabla').on('change', '#filtro_estatus_tabla', function () {
        let valor = $(this).val();
        let $tablaDT =$('#tableCotizacionesTemporales').DataTable();

        if (window.pestanaActivaCotizaciones === 'CANCELADAS' && valor !== 'No autorizada') {
            window.pestanaActivaCotizaciones = 'TODOS';
            $('.tab-filtro-cat').removeClass('active').attr('aria-selected', 'false');$(`.tab-filtro-cat[data-categoria="TODOS"]`).addClass('active').attr('aria-selected', 'true');
            $tablaDT.column(4).search(''); 
        }

        if (valor) {
            $tablaDT.column(3).search('^\\s*' + valor, true, false).draw();
            if (valor === 'No autorizada' && window.pestanaActivaCotizaciones !== 'CANCELADAS') {
                window.pestanaActivaCotizaciones = 'CANCELADAS';
                $('.tab-filtro-cat').removeClass('active').attr('aria-selected', 'false');$(`.tab-filtro-cat[data-categoria="CANCELADAS"]`).addClass('active').attr('aria-selected', 'true');
                $tablaDT.column(4).search('');
            }
        } else {
            $tablaDT.column(3).search('', true, false).draw();
        }
    });

    // >>>============================================== 
    // >>> ✨ MOTOR AVANZADO DE RANGOS DE FECHA Y ESTATUS
    // >>>============================================== 
    window.filtroFechaInicio = '';
    window.filtroFechaFin = '';

    function toggleFechas() {
        if ($('#radio_rango').is(':checked')) {
            $('#fecha_inicio_filtro, #fecha_fin_filtro').prop('disabled', false).removeClass('bg-light border-0').css({'cursor': 'pointer', 'color': '#ffc107', 'border': '1px solid #ffc107'});
            $('#input_mes_filtro').prop('disabled', true).removeClass('shadow-sm').addClass('bg-light border-0').css({'cursor': 'not-allowed', 'color': '#6c757d', 'border': 'none'});
        } else {
            $('#fecha_inicio_filtro, #fecha_fin_filtro').prop('disabled', true).removeClass('bg-white').addClass('bg-light border-0').css({'cursor': 'not-allowed', 'color': '#6c757d', 'border': 'none'});
            $('#input_mes_filtro').prop('disabled', false).removeClass('bg-light border-0').addClass('shadow-sm').css({'cursor': 'pointer', 'color': '#495057', 'border': '1px solid #ced4da'});
        }
    }

    $('input[name="tipo_filtro_fecha"]').on('change', toggleFechas);
    toggleFechas();

    $('#fecha_inicio_filtro, #fecha_fin_filtro, #input_mes_filtro').on('click touchstart', function(e) { e.stopPropagation(); });

    let hoyDate = new Date();
    let mesActualFormato = hoyDate.getFullYear() + '-' + String(hoyDate.getMonth() + 1).padStart(2, '0');
    $('#input_mes_filtro').val(mesActualFormato);

    $('#btn_cancelar_periodo').on('click', function() { $('#btnFiltroPeriodo').dropdown('toggle'); });

    $('#btn_limpiar_periodo').on('click', function() {
        window.filtroFechaInicio = '';
        window.filtroFechaFin = '';
        $('#texto_periodo').text('Periodo: Todos');
        $('#btnFiltroPeriodo').dropdown('toggle');
        $('#tableCotizacionesTemporales').DataTable().draw();
    });

    $('#btn_aceptar_periodo').on('click', function() {
        let tipo = $('input[name="tipo_filtro_fecha"]:checked').val();
        let textoFiltro = 'Periodo: Todos';
        
        if (tipo === 'mes') {
            let valMes = $('#input_mes_filtro').val(); 
            if (valMes) {
                let parts = valMes.split('-');
                let y = parseInt(parts[0]);
                let m = parseInt(parts[1]); 
                window.filtroFechaInicio = `${y}-${String(m).padStart(2, '0')}-01`;
                let ultimoDia = new Date(y, m, 0).getDate();
                window.filtroFechaFin = `${y}-${String(m).padStart(2, '0')}-${ultimoDia}`;
                let dateObj = new Date(y, m - 1, 1);
                let mesTexto = dateObj.toLocaleString('es-ES', {month:'short'}).toUpperCase();
                textoFiltro = `MES: ${mesTexto} ${y}`;
            } else {
                window.filtroFechaInicio = ''; window.filtroFechaFin = '';
            }
        } else {
            let inicio = $('#fecha_inicio_filtro').val();
            let fin = $('#fecha_fin_filtro').val();
            if (inicio && fin) {
                if(inicio > fin) { alert("La fecha de inicio no puede ser mayor a la fecha final."); return; }
                window.filtroFechaInicio = inicio; window.filtroFechaFin = fin;
                let iniArr = inicio.split('-'); let finArr = fin.split('-');
                textoFiltro = `RANGO: ${iniArr[2]}/${iniArr[1]}/${iniArr[0].slice(2)} AL ${finArr[2]}/${finArr[1]}/${finArr[0].slice(2)}`;
            } else {
                alert("Por favor selecciona ambas fechas."); return;
            }
        }
        
        $('#texto_periodo').text(textoFiltro);
        $('#btnFiltroPeriodo').dropdown('toggle');
        $('#tableCotizacionesTemporales').DataTable().draw();
    });

    $.fn.dataTable.ext.search.push(
        function( settings, data, dataIndex ) {
            if (!window.filtroFechaInicio || !window.filtroFechaFin) return true; 
            let fechaFilaStr = data[5]; 
            if(!fechaFilaStr) return true;
            return (fechaFilaStr >= window.filtroFechaInicio && fechaFilaStr <= window.filtroFechaFin);
        }
    );

    // >>>============================================== 
    // >>> ACCIÓN RÁPIDA: RECHAZAR COTIZACIÓN TEMPORAL
    // >>>==============================================
    $(document).on('click', '.btn-cambiar-estatus', function (e) {
        e.preventDefault();
        let id_cot = $(this).data('id');
        let nuevo_estatus = $(this).data('estatus');
        let folio = $(this).data('folio');

        if (confirm(`¿Estás seguro de que deseas RECHAZAR la cotización temporal #${folio}?`)) {
            $.ajax({
                url: 'api/api_ver_cotizaciones.php',
                type: 'POST',
                data: { action: 'cambiar_estatus', id_cotizacion: id_cot, estatus: nuevo_estatus },
                dataType: 'json',
                success: function (res) {
                    if (res.status === 'success') {
                        cargarTablaPrincipal(); // Refrescamos la tabla instantáneamente
                    } else {
                        alert("Error: " + res.message);
                    }
                },
                error: function () {
                    alert("Error de red al actualizar el estatus. Por favor intenta de nuevo.");
                }
            });
        }
    });
});