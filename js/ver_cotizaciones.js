$(document).ready(function () {
    const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    let windowEmpresas = [];
    let windowProductos = [];
    let preciosProductos = {};
    let rowCount = 0;

    /* let windowSucursalesOpcionesEdit = '<option value="">Selecciona destino...</option>'; */
    window.windowSucursalesOpciones = '<option value="">Selecciona destino...</option>';
    let isEditMultiSucursal = false;

    //>>>==========================================
    //>>> 1. CARGA INICIAL DE DATOS MAESTROS
    //>>>==========================================
    $.ajax({ url: 'api/api_cotizador.php?action=get_empresas', type: 'GET', success: function (data) { windowEmpresas = data; } });

    $.ajax({
        url: 'api/api_cotizador.php?action=get_productos',
        type: 'GET',
        success: function (data) {
            windowProductos = data;
            data.forEach(prod => {
                preciosProductos[prod.id_product] = prod;
            });
        }
    });

    $('#edit_estatus').on('change', function () {
        let val = $(this).val();
        let tieneDir = $(this).data('tiene-dir');

        if (val === 'Autorizada (información completa)' && tieneDir === 0) {
            alert("No puedes marcar la cotización como 'Autorizada' sin antes registrar las direcciones de Certificado y Envío.");
            $(this).val('Por aprobar').trigger('change.select2');
        }
    });

    $(document).on('change', '.chk-desglosar', function () {
        $(this).siblings('.hidden-desglose').val($(this).is(':checked') ? 'Y' : 'N');
    });

    $(document).on('change', '.select-sucursal-fila-edit', function () {
        $(this).attr('data-selected-suc', $(this).val());
    });

    //>>> ==============================================
    //>>> 2. CARGAR TABLA PRINCIPAL CON DATATABLES
    //>>> ==============================================

    {/* <td>
        <div class="hstack gap-3">
            <div><a class="d-block fw-bold">${folioVisual}</a></div>
            <div class="avatar-image avatar-md rounded">
                img class="img-fluid" src="assets/images/gallery/icono_cot.jpg">
            </div>
        </div>
    </td>
    if (estatusTexto !== 'Autorizada (información completa)' && estatusTexto !== 'No autorizada' && estatusTexto !== 'Ganada' && estatusTexto !== 'Perdida') {
                        let urgeDireccion = (estatusTexto === 'Autorizada (sin dirección)' || (estatusTexto === 'Por aprobar' && yaTieneDirecciones === 0));
                        let colorIcon = urgeDireccion ? 'text-warning' : 'text-primary';
                        let latido = urgeDireccion ? 'style="animation: pulse 2s infinite;"' : '';
                        let claseFondo = urgeDireccion ? 'bg-soft-warning border border-warning' : 'bg-soft-light border border-light';

                        btnCompletarVenta = `<a href="finalizar_venta.php?id=${cot.id_cotizacion}" class="avatar-text avatar-md ${claseFondo}" ${latido}>
                                                <abbr title="${urgeDireccion ? '¡Faltan Direcciones! Haz clic aquí.' : 'Gestionar Direcciones'}" style="text-decoration:none;">
                                                    <i class="feather-map-pin ${colorIcon}"></i>
                                                </abbr>
                                            </a>`;
                    } */}
    function cargarTablaPrincipal() {
        $.ajax({
            url: 'api/api_ver_cotizaciones.php?action=leer',
            method: 'GET',
            cache: false,
            dataType: 'json',
            success: function (data) {
                let tbody = $('#tabla-cotizaciones');
                let $tabla = $('#tableMisCotizaciones');

                if ($.fn.DataTable && $.fn.DataTable.isDataTable($tabla)) {
                    $tabla.DataTable().destroy();
                }

                tbody.empty();

                if (data.length === 0) {
                    tbody.append('<tr><td colspan="6" class="text-center text-muted py-4">No hay cotizaciones registradas.</td></tr>');
                    return;
                }

                data.forEach(function (cot) {
                    let folioVisual = cot.folio_especial ? cot.folio_especial : cot.id_cotizacion.toString().padStart(5, '0');

                    let nombreSol = cot.nombre ? cot.nombre : 'Admin';
                    let apellidoSol = cot.apellido_pat ? cot.apellido_pat : '';
                    let solicitante = `${nombreSol} ${apellidoSol}`.trim();
                    let razonSoc = cot.razon_social ? cot.razon_social : 'Sin Empresa';

                    let badgeColor = 'bg-soft-primary text-primary';
                    let estatusTexto = cot.estatus ? cot.estatus : 'Guardado';

                    if (estatusTexto === 'Autorizada (sin dirección)') badgeColor = 'bg-soft-warning text-warning';
                    if (estatusTexto === 'Autorizada (información completa)') badgeColor = 'bg-soft-success text-success';
                    if (estatusTexto === 'No autorizada') badgeColor = 'bg-soft-danger text-danger';

                    let btnCompletarVenta = '';
                    let yaTieneDirecciones = parseInt(cot.tiene_dir) || 0;
                    let equiposSinDir = parseInt(cot.equipos_sin_dir) || 0; // ✨ Leemos la columna de equipos sin dirección

                    if (estatusTexto !== 'Autorizada (información completa)' && estatusTexto !== 'No autorizada' && estatusTexto !== 'Ganada' && estatusTexto !== 'Perdida') {

                        let urgeDireccion = (estatusTexto === 'Autorizada (sin dirección)' || ((estatusTexto === 'Por aprobar' || estatusTexto === 'Guardado') && yaTieneDirecciones === 0));
                        let alertaEdicionIncompleta = (yaTieneDirecciones > 0 && equiposSinDir > 0);

                        // Valores por defecto (TU COLOR ACTUAL)
                        let colorIcon = 'text-primary';
                        let latido = '';
                        let claseFondo = 'bg-soft-light border border-light';
                        let textoTooltip = 'Gestionar Direcciones';

                        if (alertaEdicionIncompleta) {
                            // 🔴 ESTADO CRÍTICO (ROJO)
                            colorIcon = 'text-danger';
                            latido = 'style="animation: pulse 1.5s infinite;"';
                            claseFondo = 'bg-soft-danger border border-danger';
                            textoTooltip = '¡Alerta! Equipos nuevos sin dirección. Haz clic aquí para corregir.';
                        } else if (urgeDireccion) {
                            // 🟡 ADVERTENCIA (AMARILLO)
                            colorIcon = 'text-warning';
                            latido = 'style="animation: pulse 2s infinite;"';
                            claseFondo = 'bg-soft-warning border border-warning';
                            textoTooltip = '¡Faltan Direcciones! Haz clic aquí.';
                        }

                        btnCompletarVenta = `<a href="finalizar_venta.php?id=${cot.id_cotizacion}" class="avatar-text avatar-md ${claseFondo}" ${latido}>
                                                <abbr title="${textoTooltip}" style="text-decoration:none;">
                                                    <i class="feather-map-pin ${colorIcon}"></i>
                                                </abbr>
                                            </a>`;
                    }

                    let btnEliminar = '';
                    if (estatusTexto.includes('Autorizada') || estatusTexto === 'No autorizada' || estatusTexto === 'Ganada' || estatusTexto === 'Perdida') {
                        btnEliminar = `<a href="javascript:void(0);" class="avatar-text avatar-md" style="opacity: 0.4; cursor: not-allowed; pointer-events: none;"><abbr title="No se puede eliminar en este estatus" style="text-decoration:none;"><i class="feather-trash-2 text-muted"></i></abbr></a>`;
                    } else {
                        btnEliminar = `<a href="#" class="avatar-text avatar-md btn-borrar-cot" data-id="${cot.id_cotizacion}"><abbr title="Eliminar" style="text-decoration:none;"><i class="feather-trash-2 text-danger"></i></abbr></a>`;
                    }

                    let tr = `
                        <tr>
                            <td>
                                <div class="d-flex flex-column align-items-center justify-content-center gap-1 text-center">
                                    <div class="avatar-image avatar-sm rounded bg-soft-light d-flex align-items-center justify-content-center">
                                        <img class="img-fluid" src="assets/images/gallery/icono_cot.jpg" style="max-height: 24px;">
                                    </div>
                                    <a class="d-block fw-bold mb-0 text-dark fs-14">${folioVisual}</a>
                                </div>
                            <td><span class="d-block fw-bold">${cot.fecha_cot}</span></td>
                            <td>
                                <span class="d-block fw-bold text-uppercase">${razonSoc}</span>
                                <small class="text-muted fs-11">Solicitante: ${solicitante}</small>
                            </td>
                            <td><span class="text-dark fw-bold">${formatoMoneda.format(cot.gran_total)}</span></td>
                            <td><span class="badge ${badgeColor}">${estatusTexto}</span></td>
                            <td class="text-center">
                                <div class="hstack gap-2 justify-content-center">
                                    ${btnCompletarVenta}
                                    <a href="imprimir_cotizacion.php?id=${cot.id_cotizacion}" target="_blank" class="avatar-text avatar-md"><abbr title="Imprimir" style="text-decoration:none;"><i class="feather-printer"></i></abbr></a>
                                    <a href="#" class="avatar-text avatar-md btn-editar-modal" data-id="${cot.id_cotizacion}" data-folio="${folioVisual}"><abbr title="Editar" style="text-decoration:none;"><i class="feather-edit"></i></abbr></a>
                                    ${btnEliminar}
                                </div>
                            </td>
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
                        searching: false,
                        info: true,
                        dom: "<'table-responsive'tr>" +
                            "<'row align-items-center p-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-end'p>>",
                        drawCallback: function () {
                            $('.dataTables_paginate > .pagination').addClass('pagination-sm mb-0');
                        }
                    });
                }
            },
            error: function () {
                $('#tabla-cotizaciones').html('<tr><td colspan="6" class="text-center text-danger py-4">Error al cargar las cotizaciones.</td></tr>');
            }
        });
    }

    cargarTablaPrincipal();


    //>>>============================================== 
    //>>>           3. MODAL DE EDICIÓN
    //>>>============================================== 

    function construirFila(index, id_detalle_cot = 0, prod_id = '', precio = '', qty = 1, total = '', isCalib = true, esServicio = false, isDesglose = false, sucursal_destino_id = '') {
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

        let checkedAttr = (isCalib && !esServicio) ? 'checked' : '';
        let disabledAttr = esServicio ? 'disabled' : '';
        let checkedDesglose = (isDesglose && !esServicio) ? 'checked' : '';
        let valDesglose = (isDesglose && !esServicio) ? 'Y' : 'N';
        let displayStyle = isEditMultiSucursal ? '' : 'style="display: none;"';

        let tdSucursal = `
            <td class="align-middle col-edit-multisucursal" ${displayStyle}>
                <select class="form-select form-select-sm select-sucursal-fila-edit" name="sucursal_fila[]" data-selected-suc="${sucursal_destino_id}">
                    ${window.windowSucursalesOpcionesEdit}
                </select>
            </td>
        `;

        return `
            <tr id="edit_addr${index}" class="fila-producto">
                <td class="text-center align-middle fila-numero">${index + 1}</td>
                <td class="align-middle">
                    <input type="hidden" name="id_detalle[]" value="${id_detalle_cot}">
                    <input type="number" name="cantidad_cot[]" class="form-control edit-qty" step="1" min="1" value="${qty}" required>
                </td>
                <td class="align-middle"><select class="form-control select-prod-modal" name="productos[]" required>${opciones}</select></td>
                ${tdSucursal}
                <td class="align-middle">
                    <div class="modulo-config">
                        <div class="form-check mb-2 d-flex justify-content-center align-items-center gap-2">
                            <input class="form-check-input m-0 border-primary chk-incluir chk-config" type="checkbox" id="edit_chk_incluir_${index}" ${checkedAttr} ${disabledAttr} style="cursor: pointer;">
                            <label class="form-check-label fs-12 fw-bold text-dark text-start" for="edit_chk_incluir_${index}" style="cursor: pointer; padding-top: 2px;">Incluir Calibración</label>
                        </div>
                        <div class="form-check d-flex justify-content-center align-items-center gap-2">
                            <input type="hidden" name="desglosar[]" class="hidden-desglose" value="${valDesglose}">
                            <input class="form-check-input m-0 border-secondary chk-desglosar chk-config" type="checkbox" id="edit_chk_desglosar_${index}" ${checkedDesglose} ${disabledAttr} style="cursor: pointer;">
                            <label class="form-check-label fs-11 text-muted text-start" for="edit_chk_desglosar_${index}" style="cursor: pointer; padding-top: 2px;">Desglosar</label>
                        </div>
                    </div>
                    <div class="info-desglose text-center mt-2"></div>
                </td>
                <td class="align-middle"><input type="number" name="unitario[]" class="form-control edit-price" step="any" value="${precio}" required></td>
                <td class="align-middle">
                    <div class="d-flex align-items-center gap-2">
                        <input type="number" name="total[]" class="form-control edit-total" readonly value="${total}">
                        <a href="#" class="text-danger btn-eliminar-fila-unica" title="Eliminar fila" style="font-size: 1.2rem;"><i class="feather-trash-2"></i></a>
                    </div>
                </td>
            </tr>
        `;
    }

    /* function cargarSucursales(usuarioId, preseleccion_suc = null) {
        let $selectSuc = $('#edit_select_sucursal');
        $selectSuc.empty().append('<option value="">Cargando...</option>');

        if (usuarioId) {
            $.ajax({
                url: 'api/api_cotizador.php?action=get_sucursales_usuario&usuario_id=' + usuarioId,
                method: 'GET', dataType: 'json',
                success: function (data) {
                    $selectSuc.empty();
                    windowSucursalesOpcionesEdit = '<option value="">Selecciona destino...</option>';

                    if (data.length === 0) {
                        $selectSuc.append('<option value="" disabled>Sin sucursales asignadas</option>');
                        windowSucursalesOpcionesEdit = '<option value="" disabled>Sin sucursales asignadas</option>';
                    } else {
                        $selectSuc.append('<option value="">Selecciona la sucursal...</option>');
                        data.forEach(suc => {
                            $selectSuc.append(`<option value="${suc.id_sucursal}">${suc.nombre_sucursal} (${suc.estado})</option>`);
                            windowSucursalesOpcionesEdit += `<option value="${suc.id_sucursal}">${suc.nombre_sucursal}</option>`;
                        });
                        if (preseleccion_suc) {
                            $selectSuc.val(preseleccion_suc).trigger('change');
                        }
                    }

                    $('.select-sucursal-fila-edit').each(function() {
                        let valToSelect = $(this).attr('data-selected-suc');
                        $(this).html(windowSucursalesOpcionesEdit);
                        if (valToSelect) {
                            $(this).val(valToSelect);
                        }
                    });
                }
            });
        } else {
            $selectSuc.empty().append('<option value="">Selecciona un solicitante primero...</option>');
        }
    } */

    function cargarSolicitantes(id_empresa, preseleccion = null, isReadOnly = false, preseleccion_suc = null) {
        $.ajax({
            url: 'api/api_cotizador.php?action=get_usuarios&empresa_id=' + id_empresa,
            method: 'GET',
            success: function (users) {
                let $selSol = $('#edit_select_solicitante');
                $selSol.empty().append('<option value="">Selecciona...</option>');
                users.forEach(u => { $selSol.append(`<option value="${u.id_usuario}">${u.nombre} ${u.apellido_pat} ${u.apellido_mat}</option>`); });

                /* if (preseleccion) {
                    $selSol.val(preseleccion);
                    cargarSucursales(preseleccion, preseleccion_suc);
                } */
                if (preseleccion) {
                    $selSol.val(preseleccion);
                    // En ver_cotizaciones_all.js tienes $selSol.data('old', preseleccion).val(preseleccion); déjalo así.
                    cargarSelectSucursales(preseleccion, '#edit_select_sucursal', '.select-sucursal-fila-edit', preseleccion_suc);
                }

                $selSol.select2({ dropdownParent: $('#modalEditarCotizacion') });

                if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
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

    $('#edit_select_empresa').on('change', function () { cargarSolicitantes($(this).val()); });

    $('#edit_select_solicitante').on('change', function () {
        let val = $(this).val();
        // En ver_cotizaciones_all.js usas data('old') para evitar re-cargas innecesarias
        if (!val || $(this).data('old') === val) return;
        $(this).data('old', val);

        cargarSelectSucursales(val, '#edit_select_sucursal', '.select-sucursal-fila-edit', null);
        /* cargarSucursales($(this).val(), null);  */
    });

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

    //& EDITAR EL MODAL Y LLENAR DATOS
    $(document).on('click', '.btn-editar-modal', function (e) {
        e.preventDefault();
        window.productoAgregadoEnEdicion = false; // ✨ BANDERA APAGADA
        let id_cot = $(this).data('id');
        let folioVisualModal = $(this).data('folio');
        $('#modal_folio_badge').text(folioVisualModal.includes('-') ? folioVisualModal : '#' + folioVisualModal);

        $.ajax({
            url: 'api/api_ver_cotizaciones.php?action=get_cotizacion&id=' + id_cot,
            method: 'GET',
            success: function (res) {
                let cot = res.cotizacion;
                let dets = res.detalles;

                isEditMultiSucursal = !cot.Sucursal_id || cot.Sucursal_id == 0;
                $('#edit_is_multisucursal').val(isEditMultiSucursal ? '1' : '0');

                let isReadOnly = (cot.estatus === 'Autorizada (información completa)' || cot.estatus === 'No autorizada');
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
                $('#edit_total_amount').val(cot.precio_iva);

                let $selEmp = $('#edit_select_empresa');
                $selEmp.empty().append('<option value="">Selecciona un cliente...</option>');
                windowEmpresas.forEach(emp => { $selEmp.append(`<option value="${emp.id_empresa}">${emp.razon_social}</option>`); });
                $selEmp.val(cot.Empresa_id).select2({ dropdownParent: $('#modalEditarCotizacion') });

                $('#edit_estatus').data('tiene-dir', cot.tiene_dir ? parseInt(cot.tiene_dir) : 0);

                let estatusBD = cot.estatus ? cot.estatus : 'Guardado';
                if (estatusBD === 'Autorizada (sin dirección)') estatusBD = 'Autorizada (información completa)';
                $('#edit_estatus').val(estatusBD).trigger('change');

                let $colSolicitante = $('#edit_select_solicitante').closest('div[class*="col-"]');
                let $colPrecio      = $('#tipo_precio').closest('div[class*="col-"]');
                let $colEstatus     = $('#fila_estatus_lan');
                let $colCliente     = $('#edit_select_empresa').closest('div[class*="col-"]');
                let $colSucursal    = $('#edit_select_sucursal').closest('div[class*="col-"]');
                let $colTipoProd    = $('#edit_filtro_tipo_producto').closest('div[class*="col-"]');
                let $colDivision    = $('#division').closest('div[class*="col-"]');

                function setColClass($el, colClass) {
                    $el.removeClass(function (index, className) {
                        return (className.match(/(^|\s)col-\S+/g) || []).join(' ');
                    }).addClass(colClass);
                }

                setColClass($colCliente, 'col-md-4');
                setColClass($colDivision, 'col-md-4');
                setColClass($colSolicitante, 'col-md-4');
                $colPrecio.show();
                $colEstatus.show();
                $selEmp.prop('disabled', false);
                $colSucursal.insertAfter($colSolicitante);

                if (isEditMultiSucursal) {
                    $colSucursal.hide();
                    $('#edit_select_sucursal').prop('required', false);
                    $('.col-edit-multisucursal').show();
                } else {
                    $colSucursal.show();
                    $('#edit_select_sucursal').prop('required', true);
                    $('.col-edit-multisucursal').hide();
                }

                // ✨ LÓGICA EXCLUSIVA PARA EL PORTAL B2B (CLIENTES)
                if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
                    $colPrecio.hide();
                    $colEstatus.hide();
                    
                    if (isEditMultiSucursal) {
                        // MULTISUCURSAL: Expande Cliente y División a media pantalla (6+6)
                        setColClass($colDivision, 'col-md-6');
                        setColClass($colCliente, 'col-md-6');
                    } else {
                        // SUCURSAL ÚNICA: Acomoda División, Cliente y Sucursal en una sola fila (4+4+4)
                        setColClass($colDivision, 'col-md-4');
                        setColClass($colCliente, 'col-md-4');
                        setColClass($colSucursal, 'col-md-4');
                        
                        // Ordenamos para que queden juntos en HTML uno tras otro
                        $colCliente.insertAfter($colDivision);
                        $colSucursal.insertAfter($colCliente);
                    }

                    // Solicitante y Tipo de Producto llenan la segunda fila (6+6)
                    setColClass($colSolicitante, 'col-md-6');
                    setColClass($colTipoProd, 'col-md-6');
                    $colTipoProd.insertAfter($colSolicitante);
                    
                    $selEmp.prop('disabled', true);

                    // Campos ocultos para mantener los valores
                    if ($('#hidden_edit_empresa').length === 0) {
                        $('#formEditarCotizacion').append(`<input type="hidden" id="hidden_edit_empresa" name="Empresa_id" value="${cot.Empresa_id}">`);
                        $('#formEditarCotizacion').append(`<input type="hidden" id="hidden_edit_precio" name="tipo_precio" value="${cot.tipo_precio}">`);
                        $('#formEditarCotizacion').append(`<input type="hidden" id="hidden_edit_estatus" name="estatus" value="${cot.estatus ? cot.estatus : 'Guardado'}">`);
                    } else {
                        $('#hidden_edit_empresa').val(cot.Empresa_id);
                        $('#hidden_edit_precio').val(cot.tipo_precio);
                        $('#hidden_edit_estatus').val(cot.estatus ? cot.estatus : 'Guardado');
                    }
                }

                cargarSolicitantes(cot.Empresa_id, cot.Usuario_empresa_id, isReadOnly, cot.Sucursal_id);

                let catBD = cot.categoria ? cot.categoria.toUpperCase().trim() : 'NUEVO';
                if (['NUEVO', 'USADO', 'CALIBRACION'].includes(catBD)) {
                    $('#edit_filtro_tipo_producto').val(catBD).trigger('change');
                } else {
                    $('#edit_filtro_tipo_producto').val('TODOS').trigger('change');
                }

                $('#edit_filtro_tipo_producto').css({
                    'pointer-events': 'none',
                    'background-color': '#e9ecef',
                    'opacity': '1'
                });

                let $tbody = $('#edit_tbody_productos');
                $tbody.empty(); rowCount = 0;

                dets.forEach((item, index) => {
                    let isCalibIncluida = true;
                    let esServicio = false;

                    if (preciosProductos[item.Product_id]) {
                        let pData = preciosProductos[item.Product_id];
                        let precioSoloEquipo = (cot.tipo_precio === 'Farmacia') ? parseFloat(pData.pf_equipo) : parseFloat(pData.pp_equipo);
                        let precioGuardado = parseFloat(item.precio_unitario);

                        if (Math.abs(precioGuardado - precioSoloEquipo) < 0.01) isCalibIncluida = false;

                        let claveM = pData.clave_product.toUpperCase();
                        let descM = pData.descripcion_product.toUpperCase();
                        if (claveM.includes('SERVICIO') || descM.includes('SERVICIO')) {
                            esServicio = true;
                            isCalibIncluida = false;
                        }
                    }

                    $tbody.append(construirFila(index, item.id_detalle_cot, item.Product_id, item.precio_unitario, item.cantidad, item.precio_extendido, isCalibIncluida, esServicio, item.desglosar === 'Y', item.sucursal_destino_id));
                    calculateRowEdit($(`#edit_addr${index}`));
                    rowCount++;
                });

                $('.select-prod-modal').select2({ 
                    theme: 'bootstrap-5',
                    dropdownParent: $('#modalEditarCotizacion'),
                    width: '100%'
                });

                if (isReadOnly) {
                    $('#formEditarCotizacion input, #formEditarCotizacion select').prop('disabled', true);
                    $('#edit_add_row').hide();
                    $('.btn-eliminar-fila-unica').hide();
                    $('#formEditarCotizacion button[type="submit"]').hide();
                }

                $('#modalEditarCotizacion').modal('show');
            }
        });
    });

    //>>>==============================================
    //>>>  4. MATEMÁTICAS Y FILAS DINÁMICAS EN MODAL
    //>>>==============================================
    $("#edit_add_row").click(function () {
        $("#edit_tbody_productos").append(construirFila(rowCount, 0, '', '', 1, '', false, false, false, ''));
        window.productoAgregadoEnEdicion = true; // ✨ BANDERA ENCENDIDA
        let filtroActual = $('#edit_filtro_tipo_producto').val();
        $(`#edit_chk_incluir_${rowCount}`).prop('checked', true);
        if (filtroActual === 'NUEVO' || filtroActual === 'USADO') {
            $(`#edit_chk_incluir_${rowCount}`).prop('checked', true);
        }

        // $(`#edit_addr${rowCount} .select-prod-modal`).select2({ dropdownParent: $('#modalEditarCotizacion') });
        $(`#edit_addr${rowCount} .select-prod-modal`).select2({ 
            theme: 'bootstrap-5',
            dropdownParent: $('#modalEditarCotizacion'),
            width: '100%'
        });

        // ✨ Inicializamos la sucursal clonada con el tema correcto y su placeholder
        $(`#edit_addr${rowCount} .select-sucursal-fila-edit`).select2({ 
            theme: 'bootstrap-5',
            dropdownParent: $('#modalEditarCotizacion'), 
            width: '100%', 
            placeholder: "Selecciona destino..." 
        });
        rowCount++;
        recalcularNumerosFila();
    });

    $(document).on('click', '.btn-eliminar-fila-unica', function (e) {
        e.preventDefault();
        if ($('#edit_tbody_productos tr.fila-producto').length > 1) {
            $(this).closest('tr').remove();
            recalcularNumerosFila();
            calcEditTotal();
        } else {
            alert("La cotización debe tener al menos un producto.");
        }
    });

    // ✨ RASTREADOR PROTEGIDO: Solo alteramos el texto visible del td sin destruir el input hidden
    function recalcularNumerosFila() {
        $('#edit_tbody_productos tr.fila-producto').each(function (index) {
            $(this).find('.fila-numero').contents().filter(function () {
                return this.nodeType === 3; // Selecciona solo el texto (los números)
            }).replaceWith(index + 1);
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
        if (!pData) return;

        let qty = parseFloat(row.find('.edit-qty').val()) || 0;
        let tipoPrecio = $('#tipo_precio').val();

        let optionSelected = prodSelect.find('option:selected');
        let esServicio = optionSelected.data('servicio') === true || optionSelected.data('servicio') === 'true';

        if (esServicio) {
            row.find('.chk-incluir').prop('checked', false).prop('disabled', true);
            row.find('.chk-desglosar').prop('checked', false).prop('disabled', true);
        } else {
            row.find('.chk-incluir').prop('disabled', false);
            row.find('.chk-desglosar').prop('disabled', false);
        }

        let incluirCalib = row.find('.chk-incluir').is(':checked');
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
            textoInformativo = `<small class="text-info d-block fw-bold mt-1">Servicio ($${pEquipo.toFixed(2)})</small>`;
        } else {
            if (incluirCalib) {
                row.find('.edit-price').val(pAntesIva.toFixed(2));
                if (desglosar) {
                    textoInformativo = `<small class="text-primary d-block fw-bold mt-1">Equipo ($${pEquipo.toFixed(2)}) + Calibración ($${pCalib.toFixed(2)})</small>`;
                } else {
                    textoInformativo = `<small class="text-muted d-block mt-1">Incluye equipo y calibración</small>`;
                }
            } else {
                row.find('.edit-price').val(pEquipo.toFixed(2));
                if (desglosar) {
                    textoInformativo = `<small class="text-info d-block fw-bold mt-1">Solo Equipo ($${pEquipo.toFixed(2)})</small>`;
                } else {
                    textoInformativo = `<small class="text-muted d-block mt-1">Solo Equipo</small>`;
                }
            }
        }

        row.find('.info-desglose').html(textoInformativo);

        let unitario = parseFloat(row.find('.edit-price').val()) || 0;
        let totalFila = unitario * qty;
        row.find('.edit-total').val(totalFila > 0 ? totalFila.toFixed(2) : '');
    }

    function calcEditTotal() {
        let sub = 0;
        $("#tab_logic_edit tbody tr.fila-producto").each(function () {
            let t = parseFloat($(this).find(".edit-total").val()) || 0;
            sub += t;
        });
        $("#edit_sub_total").val(sub.toFixed(2));
        let tax = parseFloat($("#edit_tax").val()) || 0;
        $("#edit_total_amount").val((sub + (sub * tax / 100)).toFixed(2));
    }


    //>>>============================================== 
    //>>>       5. GUARDAR CAMBIOS Y ELIMINAR
    //>>>============================================== 
    $('#formEditarCotizacion').on('submit', function (e) {
        e.preventDefault();

        if (!isEditMultiSucursal && !$('#edit_select_sucursal').val()) {
            alert("Debes seleccionar una sucursal de destino antes de guardar.");
            return;
        }

        $('#tab_logic_edit tbody tr.fila-producto').each(function () { calculateRowEdit($(this)); });
        calcEditTotal();

        let btnSubmit = $(this).find('button[type="submit"]');
        let textoOriginal = btnSubmit.text();
        btnSubmit.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...');

        let formData = $(this).serializeArray();

        $.ajax({
            url: 'api/api_ver_cotizaciones.php',
            type: 'POST',
            data: $.param(formData),
            success: function (res) {

                btnSubmit.prop('disabled', false).text(textoOriginal);

                if (res.status === 'success') {
                    $('#modalEditarCotizacion').modal('hide');
                    $('.modal-backdrop').remove();

                    let estatusSeleccionado = $('#edit_estatus').val();

                    if (estatusSeleccionado.includes('Autorizada') || window.productoAgregadoEnEdicion) {
                        alert("Cambios guardados. Serás redirigido para verificar las direcciones de los equipos.");

                        // Reseteamos la bandera por seguridad
                        window.productoAgregadoEnEdicion = false;

                        window.location.href = 'finalizar_venta.php?id=' + $('#edit_id_cotizacion').val() + '&editado=1';
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

    $(document).on('click', '.btn-borrar-cot', function (e) {
        e.preventDefault();
        if (confirm("¿Eliminar permanentemente esta cotización?")) {
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

    $(document).on('change', '#edit_filtro_tipo_producto', function () {
        let nuevoFiltro = $(this).val();

        $('#edit_tbody_productos tr.fila-producto').each(function () {
            let $row = $(this);
            let $selectProd = $row.find('.select-prod-modal');
            let idProductoActual = $selectProd.val();

            let opcionesActualizadas = '<option value="">Selecciona...</option>';

            windowProductos.forEach(p => {
                let claveM = p.clave_product.toUpperCase();
                let descM = p.descripcion_product.toUpperCase();
                let estadoBD = p.estado_product ? p.estado_product.toUpperCase().trim() : 'N/A';

                let pasaFiltro = false;
                if (nuevoFiltro === 'TODOS') {
                    pasaFiltro = true;
                } else if (nuevoFiltro === estadoBD) {
                    pasaFiltro = true;
                } else if (p.id_product == idProductoActual) {
                    pasaFiltro = true;
                }

                if (pasaFiltro) {
                    let selected = (p.id_product == idProductoActual) ? 'selected' : '';
                    let marca = (p.marca_product && p.marca_product !== 'N/A') ? p.marca_product.toUpperCase() : '';
                    let textoMarca = marca ? ` | Marca: ${marca}` : '';
                    let isSrv = (estadoBD === 'CALIBRACION');

                    opcionesActualizadas += `<option value="${p.id_product}" data-servicio="${isSrv}" ${selected}>[${claveM}] ${descM}${textoMarca}</option>`;
                }
            });

            if ($selectProd.hasClass('select2-hidden-accessible')) {
                $selectProd.select2('destroy');
            }

            /* $selectProd.html(opcionesActualizadas).val(idProductoActual);
            $selectProd.select2({ dropdownParent: $('#modalEditarCotizacion') }); */
            $selectProd.html(opcionesActualizadas).val(idProductoActual);
            $selectProd.select2({ 
                theme: 'bootstrap-5', // ✨ Mantenemos el tema al recargar por filtros
                dropdownParent: $('#modalEditarCotizacion'),
                width: '100%'
            });
        });
    });
});