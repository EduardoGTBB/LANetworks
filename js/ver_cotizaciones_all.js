$(document).ready(function () {
    const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    let windowEmpresas = [];
    let windowProductos = [];
    let preciosProductos = {};
    let rowCount = 0;

    let windowSucursalesOpcionesEdit = '<option value="">Selecciona destino...</option>';
    let isEditMultiSucursal = false;

    // 1. CARGA INICIAL
    $.ajax({ url: 'api/api_cotizador.php?action=get_empresas', type: 'GET', success: function (data) { windowEmpresas = data; } });
    
    $.ajax({
        url: 'api/api_cotizador.php?action=get_productos', type: 'GET',
        success: function (data) {
            windowProductos = data;
            data.forEach(p => { 
                preciosProductos[p.id_product] = p; 
            });
        }
    });

    $('#edit_estatus').on('change', function() {
        let val = $(this).val();
        let tieneDir = $(this).data('tiene-dir');
        
        if (val === 'Autorizada (información completa)' && tieneDir === 0) {
            alert("No puedes marcar la cotización como 'Autorizada' sin antes registrar las direcciones de Certificado y Envío.");
            $(this).val('Por aprobar').trigger('change.select2'); 
        }
    });
    
    $(document).on('change', '.chk-desglosar', function() {
        $(this).siblings('.hidden-desglose').val( $(this).is(':checked') ? 'Y' : 'N' );
    });

    $(document).on('change', '.select-sucursal-fila-edit', function() {
        $(this).attr('data-selected-suc', $(this).val());
    });

    // 2. CARGAR TABLA PRINCIPAL
    function cargarTablaPrincipal() {
        $.ajax({
            url: 'api/api_ver_cotizaciones.php?action=leer_todas',
            method: 'GET', cache: false, dataType: 'json',
            success: function (data) {
                let tbody = $('#tabla-cotizaciones');
                let $tabla = $('#tableAllCotizaciones');

                if ($.fn.DataTable && $.fn.DataTable.isDataTable($tabla)) { $tabla.DataTable().destroy(); }
                tbody.empty();

                if (data.length === 0) {
                    tbody.append('<tr><td colspan="6" class="text-center text-muted py-4">No hay cotizaciones registradas.</td></tr>');
                    return;
                }

                data.forEach(function (cot) {
                    let folio = cot.id_cotizacion.toString().padStart(4, '0');
                    let razonSoc = cot.razon_social ? cot.razon_social : 'Sin Empresa';

                    let nombreSol = cot.nombre ? cot.nombre : 'Sin registro';
                    let apellidoSol = cot.apellido_pat ? cot.apellido_pat : '';
                    let solicitante = `${nombreSol} ${apellidoSol}`.trim();

                    let creador = cot.admin_nombre ? `${cot.admin_nombre} ${cot.admin_apell_pat}` : 'Portal B2B (Cliente)';
                    let colorCreador = cot.admin_nombre ? 'text-primary' : 'text-danger';

                    let badgeColor = 'bg-soft-primary text-primary';
                    let estatusTexto = cot.estatus ? cot.estatus : 'Guardado';

                    if (estatusTexto === 'Autorizada (sin dirección)') badgeColor = 'bg-soft-warning text-warning';
                    if (estatusTexto === 'Autorizada (información completa)') badgeColor = 'bg-soft-success text-success';
                    if (estatusTexto === 'No autorizada') badgeColor = 'bg-soft-danger text-danger';

                    let btnDirecciones = '';
                    let yaTieneDirecciones = parseInt(cot.tiene_dir) || 0;

                    if (estatusTexto === 'Autorizada (sin dirección)' || estatusTexto === 'Por aprobar' || (estatusTexto === 'Guardado' && yaTieneDirecciones === 0)) {
                        let colorIcon = (estatusTexto === 'Por aprobar') ? 'text-primary' : 'text-warning';
                        let latido = (estatusTexto !== 'Por aprobar') ? 'style="animation: pulse 2s infinite;"' : '';

                        btnDirecciones = `<a href="finalizar_venta.php?id=${cot.id_cotizacion}&from=all" class="avatar-text avatar-md bg-soft-light border border-light" ${latido}>
                                                <abbr title="${estatusTexto === 'Por aprobar' ? 'Revisar datos del cliente' : 'Gestionar Direcciones'}" style="text-decoration:none;">
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
                                <div class="hstack gap-3">
                                    <div><a class="d-block fw-bold">#${folio}</a></div>
                                    <div class="avatar-image avatar-md rounded"><img class="img-fluid" src="assets/images/gallery/icono_cot.jpg"></div>
                                </div>
                            </td>
                            <td><span class="d-block fw-bold">${cot.fecha_cot}</span></td>
                            <td>
                                <span class="d-block fw-bold text-uppercase">${razonSoc}</span>
                                <small class="text-muted fs-11">Solicitante: ${solicitante}</small><br>
                                <small class="fs-11 fw-bold ${colorCreador}">Creado por: ${creador}</small>
                            </td>
                            <td><span class="text-dark fw-bold">${formatoMoneda.format(cot.gran_total)}</span></td>
                            <td><span class="badge ${badgeColor}">${estatusTexto}</span></td>
                            <td class="text-center">
                                <div class="hstack gap-2 justify-content-center">
                                    ${btnDirecciones}
                                    <a href="imprimir_cotizacion.php?id=${cot.id_cotizacion}" target="_blank" class="avatar-text avatar-md"><abbr title="Imprimir" style="text-decoration:none;"><i class="feather-printer"></i></abbr></a>
                                    <a href="#" class="avatar-text avatar-md btn-editar-modal" data-id="${cot.id_cotizacion}" data-folio="${folio}"><abbr title="Editar" style="text-decoration:none;"><i class="feather-edit"></i></abbr></a>
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
                        destroy: true, pageLength: 8, lengthChange: false, ordering: false, searching: false, info: true,
                        dom: "<'table-responsive'tr><'row align-items-center p-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-end'p>>",
                        drawCallback: function () {
                            $('.dataTables_paginate > .pagination').addClass('pagination-sm mb-0');
                        }
                    });
                }
            },
            error: function () { $('#tabla-cotizaciones').html('<tr><td colspan="6" class="text-center text-danger py-4">Error al cargar.</td></tr>'); }
        });
    }

    cargarTablaPrincipal();

    // 3. LÓGICA DEL MODAL DE EDICIÓN Y MATEMÁTICAS
    function construirFila(index, prod_id = '', precio = '', qty = 1, total = '', isCalib = true, esServicio = false, isDesglose = false, sucursal_destino_id = '') {
        let opciones = '<option value="">Selecciona...</option>';
        let filtroActual = $('#edit_filtro_tipo_producto').val() || 'TODOS';

        windowProductos.forEach(p => {
            // let selected = (p.id_product == prod_id) ? 'selected' : '';
            let claveM = p.clave_product.toUpperCase();
            let descM = p.descripcion_product.toUpperCase();

            let estadoBD = p.estado_product ? p.estado_product.toUpperCase().trim() : 'N/A';
            let pasaFiltro = false;

            if (filtroActual === 'TODOS') {
                pasaFiltro = true; 
            } else if (filtroActual === estadoBD) {
                pasaFiltro = true; 
            } else if (p.id_product == prod_id) {
                pasaFiltro = true; // Se respeta el producto que ya estaba guardado en la fila
            }

            if (pasaFiltro) {
                let selected = (p.id_product == prod_id) ? 'selected' : '';
                let marca = (p.marca_product && p.marca_product !== 'N/A') ? p.marca_product.toUpperCase() : '';
                let textoMarca = marca ? ` | Marca: ${marca}` : '';
                let isSrv = (estadoBD === 'CALIBRACION');
                
                opciones += `<option value="${p.id_product}" data-servicio="${isSrv}" ${selected}>[${claveM}] ${descM}${textoMarca}</option>`;
            }

           /*  let marca = (p.marca_product && p.marca_product !== 'N/A') ? p.marca_product.toUpperCase() : '';
            let textoMarca = marca ? ` | Marca: ${marca}` : '';

            let isSrv = (claveM.includes('SERVICIO') || descM.includes('SERVICIO'));
            opciones += `<option value="${p.id_product}" data-servicio="${isSrv}" ${selected}>[${claveM}] ${descM}${textoMarca}</option>`; */
        });

        let checkedAttr = (isCalib && !esServicio) ? 'checked' : '';
        let disabledAttr = esServicio ? 'disabled' : '';
        let checkedDesglose = (isDesglose && !esServicio) ? 'checked' : '';
        let valDesglose = (isDesglose && !esServicio) ? 'Y' : 'N';
        let displayStyle = isEditMultiSucursal ? '' : 'style="display: none;"';

        let tdSucursal = `
            <td class="align-middle col-edit-multisucursal" ${displayStyle}>
                <select class="form-select form-select-sm select-sucursal-fila-edit" name="sucursal_fila[]" data-selected-suc="${sucursal_destino_id}">
                    ${windowSucursalesOpcionesEdit}
                </select>
            </td>
        `;

        return `
            <tr id="edit_addr${index}" class="fila-producto">
                <td class="text-center align-middle fila-numero">${index + 1}</td>
                <td class="align-middle"><input type="number" name="cantidad_cot[]" class="form-control edit-qty" step="1" min="1" value="${qty}" required></td>
                <td class="align-middle"><select class="form-control select-prod-modal" name="productos[]" required>${opciones}</select></td>
                ${tdSucursal}
                <td class="align-middle">
                    <div class="modulo-config">
                        <div class="form-check mb-2 d-flex justify-content-center align-items-center gap-2">
                            <input class="form-check-input m-0 border-primary chk-incluir chk-config" type="checkbox" id="edit_chk_incluir_${index}" ${checkedAttr} ${disabledAttr} style="cursor: pointer;">
                            <label class="form-check-label fs-12 fw-bold text-dark text-start" for="edit_chk_incluir_${index}" style="cursor: pointer; padding-top: 2px;">
                                Incluir Calibración
                            </label>
                        </div>
                        <div class="form-check d-flex justify-content-center align-items-center gap-2">
                            <input type="hidden" name="desglosar[]" class="hidden-desglose" value="${valDesglose}">
                            <input class="form-check-input m-0 border-secondary chk-desglosar chk-config" type="checkbox" id="edit_chk_desglosar_${index}" ${checkedDesglose} ${disabledAttr} style="cursor: pointer;">
                            <label class="form-check-label fs-11 text-muted text-start" for="edit_chk_desglosar_${index}" style="cursor: pointer; padding-top: 2px;">
                                Desglosar
                            </label>
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

    // ✨ BLINDAJE 1: Destruimos y reconstruimos Select2 para Sucursales
    function cargarSucursales(usuarioId, preseleccion_suc = null) {
        let $selectSuc = $('#edit_select_sucursal');
        
        if ($selectSuc.hasClass('select2-hidden-accessible')) {
            $selectSuc.select2('destroy');
        }
        $selectSuc.html('<option value="">Cargando...</option>');

        if (usuarioId) {
            $.ajax({
                url: 'api/api_cotizador.php?action=get_sucursales_usuario&usuario_id=' + usuarioId,
                method: 'GET', dataType: 'json',
                success: function(data) {
                    $selectSuc.html('');
                    windowSucursalesOpcionesEdit = '<option value="">Selecciona destino...</option>';

                    if(data.length === 0) {
                        $selectSuc.append('<option value="" disabled>Sin sucursales asignadas</option>');
                        windowSucursalesOpcionesEdit = '<option value="" disabled>Sin sucursales asignadas</option>';
                    } else {
                        $selectSuc.append('<option value="">Selecciona la sucursal...</option>');
                        data.forEach(suc => {
                            $selectSuc.append(`<option value="${suc.id_sucursal}">${suc.nombre_sucursal} (${suc.estado})</option>`);
                            windowSucursalesOpcionesEdit += `<option value="${suc.id_sucursal}">${suc.nombre_sucursal}</option>`;
                        });
                        
                        if (preseleccion_suc) {
                            $selectSuc.val(preseleccion_suc);
                        }
                    }

                    $selectSuc.select2({ dropdownParent: $('#modalEditarCotizacion') });

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
            $selectSuc.html('<option value="">Selecciona un solicitante primero...</option>');
            $selectSuc.select2({ dropdownParent: $('#modalEditarCotizacion') });
        }
    }

    // ✨ BLINDAJE 2: Destruimos y reconstruimos Select2 para Solicitantes
    function cargarSolicitantes(id_empresa, preseleccion = null, isReadOnly = false, preseleccion_suc = null) {
        let $selSol = $('#edit_select_solicitante');
        
        if ($selSol.hasClass('select2-hidden-accessible')) {
            $selSol.select2('destroy');
        }
        $selSol.html('<option value="">Cargando...</option>');

        $.ajax({
            url: 'api/api_cotizador.php?action=get_usuarios&empresa_id=' + id_empresa,
            method: 'GET',
            success: function (users) {
                $selSol.html('<option value="">Selecciona...</option>');
                users.forEach(u => { $selSol.append(`<option value="${u.id_usuario}">${u.nombre} ${u.apellido_pat} ${u.apellido_mat}</option>`); });

                if (preseleccion) {
                    $selSol.data('old', preseleccion.toString()).val(preseleccion);
                    cargarSucursales(preseleccion, preseleccion_suc);
                }

                $selSol.select2({ dropdownParent: $('#modalEditarCotizacion') });

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

    // ✨ BLINDAJE 3: Evitamos los "Ghost Clicks" de Select2 comparando con la memoria (data-old)
    $('#edit_select_empresa').on('change', function () { 
        let val = $(this).val();
        if (!val || $(this).data('old') === val) return;
        $(this).data('old', val);
        cargarSolicitantes(val); 
    });

    $('#edit_select_solicitante').on('change', function() {
        let val = $(this).val();
        if (!val || $(this).data('old') === val) return;
        $(this).data('old', val);
        cargarSucursales(val, null);
    });

    let previousTipoPrecio = '';
    $('#tipo_precio').on('focus click', function () {
        previousTipoPrecio = $(this).val();
    }).on('change', function () {
        let nuevoPrecio = $(this).val();
        if (previousTipoPrecio && nuevoPrecio && previousTipoPrecio !== nuevoPrecio) {
            if(confirm("ATENCIÓN: Cambiar la lista de precios recalculará de forma automática todas las partidas. ¿Deseas continuar?")) {
                previousTipoPrecio = nuevoPrecio;
                $('#tab_logic_edit tbody tr.fila-producto').each(function () {
                    calculateRowEdit($(this));
                });
                calcEditTotal();
            } else {
                $(this).val(previousTipoPrecio); 
            }
        }
    });

    // Abrir Modal
    $(document).on('click', '.btn-editar-modal', function (e) {
        e.preventDefault();
        let id_cot = $(this).data('id');
        $('#modal_folio_badge').text('#' + $(this).data('folio'));

        $.ajax({
            url: 'api/api_ver_cotizaciones.php?action=get_cotizacion&id=' + id_cot,
            method: 'GET',
            success: function (res) {
                let cot = res.cotizacion; let dets = res.detalles;

                let sucId = cot.Sucursal_id;
                isEditMultiSucursal = (!sucId || sucId == 0 || sucId === '0' || sucId === 'null');
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

                $('#edit_estatus').data('tiene-dir', cot.tiene_dir ? parseInt(cot.tiene_dir) : 0);

                let estatusBD = cot.estatus ? cot.estatus : 'Guardado';
                if (estatusBD === 'Autorizada (sin dirección)') { 
                    estatusBD = 'Autorizada (información completa)'; 
                }
                $('#edit_estatus').val(estatusBD).trigger('change');

                let $selEmp = $('#edit_select_empresa');
                if ($selEmp.hasClass('select2-hidden-accessible')) {
                    $selEmp.select2('destroy');
                }
                $selEmp.html('<option value="">Selecciona un cliente...</option>');
                windowEmpresas.forEach(emp => { $selEmp.append(`<option value="${emp.id_empresa}">${emp.razon_social}</option>`); });
                
                // Le pasamos el valor a la memoria (data-old) antes de construir Select2
                $selEmp.data('old', cot.Empresa_id.toString()).val(cot.Empresa_id);
                $selEmp.select2({ dropdownParent: $('#modalEditarCotizacion') });

                let $colSucursal = $('#edit_select_sucursal').closest('div[class^="col-"]');
                if (isEditMultiSucursal) {
                    $colSucursal.hide();
                    $('#edit_select_sucursal').prop('required', false);
                    $('.col-edit-multisucursal').show();
                } else {
                    $colSucursal.show();
                    $('#edit_select_sucursal').prop('required', true);
                    $('.col-edit-multisucursal').hide();
                }

                cargarSolicitantes(cot.Empresa_id, cot.Usuario_empresa_id, isReadOnly, cot.Sucursal_id);

                let $tbody = $('#edit_tbody_productos');
                $tbody.empty(); rowCount = 0;

                let estadosEncontrados = new Set();

                dets.forEach(item => {
                    if (preciosProductos[item.Product_id]) {
                        let estadoBD = preciosProductos[item.Product_id].estado_product || 'N/A';
                        estadosEncontrados.add(estadoBD.toUpperCase().trim());
                    }
                });

                if (estadosEncontrados.size === 1) {
                    let estadoUnico = Array.from(estadosEncontrados)[0];
                    if (['NUEVO', 'USADO', 'CALIBRACION'].includes(estadoUnico)) {
                        $('#edit_filtro_tipo_producto').val(estadoUnico);
                    } else {
                        $('#edit_filtro_tipo_producto').val('TODOS');
                    }
                } else {
                    $('#edit_filtro_tipo_producto').val('TODOS'); 
                }

                dets.forEach((item, index) => {
                    let isCalibIncluida = true;
                    let esServicio = false;

                    if (preciosProductos[item.Product_id]) {
                        let pData = preciosProductos[item.Product_id];
                        let precioSoloEquipo = (cot.tipo_precio === 'Farmacia') ? parseFloat(pData.pf_equipo) : parseFloat(pData.pp_equipo);
                        let precioGuardado = parseFloat(item.precio_unitario);

                        if (Math.abs(precioGuardado - precioSoloEquipo) < 0.01) {
                            isCalibIncluida = false;
                        }

                        let claveM = pData.clave_product.toUpperCase();
                        let descM = pData.descripcion_product.toUpperCase();
                        if (claveM.includes('SERVICIO') || descM.includes('SERVICIO')) {
                            esServicio = true;
                            isCalibIncluida = false;
                        }
                    }

                    $tbody.append(construirFila(index, item.Product_id, item.precio_unitario, item.cantidad, item.precio_extendido, isCalibIncluida, esServicio, item.desglosar === 'Y', item.sucursal_destino_id ));
                    calculateRowEdit($(`#edit_addr${index}`));
                    rowCount++;
                });

                $('.select-prod-modal').select2({ dropdownParent: $('#modalEditarCotizacion') });

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

    $("#edit_add_row").click(function () {
        $("#edit_tbody_productos").append(construirFila(rowCount, '', '', 1, '', false, false, false, ''));
        $(`#edit_chk_incluir_${rowCount}`).prop('checked', true);

        let filtroActual = $('#edit_filtro_tipo_producto').val();
        if (filtroActual === 'NUEVO' || filtroActual === 'USADO') {
            $(`#edit_chk_incluir_${rowCount}`).prop('checked', true);
        }

        $(`#edit_addr${rowCount} .select-prod-modal`).select2({ dropdownParent: $('#modalEditarCotizacion') });
        rowCount++; recalcularNumerosFila();
    });

    $(document).on('click', '.btn-eliminar-fila-unica', function (e) {
        e.preventDefault();
        if ($('#edit_tbody_productos tr.fila-producto').length > 1) {
            $(this).closest('tr').remove(); recalcularNumerosFila(); calcEditTotal();
        } else { alert("La cotización debe tener al menos un producto."); }
    });

    function recalcularNumerosFila() { $('#edit_tbody_productos tr.fila-producto').each(function (index) { $(this).find('.fila-numero').text(index + 1); }); }

    $(document).on('change', '.select-prod-modal, .chk-config', function () {
        let row = $(this).closest('tr');
        calculateRowEdit(row);
        calcEditTotal();
    });

    $(document).on("keyup change", ".edit-qty, #edit_tax", function () { 
        let row = $(this).closest('tr');
        if(row.length > 0) calculateRowEdit(row);
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

        if(!tipoPrecio) {
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

    // 4. GUARDAR CAMBIOS
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
                    
                    cargarTablaPrincipal();
                    alert(res.message);
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
                if (nuevoFiltro === 'TODOS') { pasaFiltro = true; } 
                else if (nuevoFiltro === estadoBD) { pasaFiltro = true; } 
                else if (p.id_product == idProductoActual) { pasaFiltro = true; }

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
            $selectProd.html(opcionesActualizadas).val(idProductoActual);
            $selectProd.select2({ dropdownParent: $('#modalEditarCotizacion') });
        });
    });
});