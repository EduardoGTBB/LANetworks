$(document).ready(function () {

    $('#edit_estatus, #tipo_precio, #edit_filtro_tipo_producto').each(function() {
        // Destruimos la inicialización automática del template
        if ($(this).hasClass('select2-hidden-accessible')) {
            $(this).select2('destroy');
        }
        // Reconstruimos forzando que se rendericen dentro del modal
        $(this).select2({
            theme: 'bootstrap-5',
            dropdownParent: $('#modalEditarCotizacion'),
            width: '100%'
        });
    });
    
    const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    const formatoInput = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // ✨ MÁSCARAS DE UX PARA EL PRECIO UNITARIO
    $(document).on('blur', '.precio-mask', function() {
        let valor = String($(this).val()).replace(/,/g, '');
        if(valor !== '' && !isNaN(valor)) {
            $(this).val(formatoInput.format(valor));
        } else {
            $(this).val('');
        }
    });

    $(document).on('focus', '.precio-mask', function() {
        let valor = String($(this).val()).replace(/,/g, '');
        $(this).val(valor);
    });
    
    $(document).on('input', '.precio-mask', function() {
        this.value = this.value.replace(/[^0-9.,]/g, '');
    });

    let windowEmpresas = [];
    let windowProductos = [];
    let preciosProductos = {};
    let rowCount = 0;

    window.windowSucursalesOpcionesEdit = '<option value="">Selecciona certificado...</option>';
    let isEditMultiSucursal = false;
    let sucursalesCacheEdit = []; 

    //>>>==========================================
    //>>> 1. CARGA INICIAL DE DATOS MAESTROS
    //>>>==========================================
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

    //>>> ==============================================
    //>>> 2. CARGAR TABLA PRINCIPAL CON DATATABLES
    //>>> ==============================================
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
                    let folioVisual = cot.folio_especial ? cot.folio_especial : cot.id_cotizacion.toString().padStart(5, '0');
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
                    let equiposSinDir = parseInt(cot.equipos_sin_dir) || 0;

                    if (estatusTexto !== 'Autorizada (información completa)' && estatusTexto !== 'No autorizada' && estatusTexto !== 'Ganada' && estatusTexto !== 'Perdida') {
                        let urgeDireccion = (estatusTexto === 'Autorizada (sin dirección)' || ((estatusTexto === 'Por aprobar' || estatusTexto === 'Guardado') && yaTieneDirecciones === 0));
                        let alertaEdicionIncompleta = (yaTieneDirecciones > 0 && equiposSinDir > 0);

                        let colorIcon = 'text-primary';
                        let latido = '';
                        let claseFondo = 'bg-soft-light border border-light';
                        let textoTooltip = 'Gestionar Direcciones';

                        if (alertaEdicionIncompleta) {
                            colorIcon = 'text-danger';
                            latido = 'style="animation: pulse 1.5s infinite;"';
                            claseFondo = 'bg-soft-danger border border-danger';
                            textoTooltip = '¡Alerta! Equipos nuevos sin dirección. Haz clic aquí para corregir.';
                        } else if (urgeDireccion) {
                            colorIcon = 'text-warning';
                            latido = 'style="animation: pulse 2s infinite;"';
                            claseFondo = 'bg-soft-warning border border-warning';
                            textoTooltip = '¡Faltan Direcciones! Haz clic aquí.';
                        }

                        btnDirecciones = `<a href="finalizar_venta.php?id=${cot.id_cotizacion}&from=all" class="avatar-text avatar-md ${claseFondo}" ${latido}>
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
                    
                    let btnPdfLab = `
                        <a href="imprimir_cotizacion.php?id=${cot.id_cotizacion}&tipo=lab" target="_blank" class="avatar-text avatar-md">
                            <abbr title="Generar PDF Laboratorio (Sin Precios)" style="text-decoration:none;">
                                <i class="feather-thermometer text-info" style="font-size: 1.1rem;"></i>
                            </abbr>
                        </a>`;

                    let contenedorAcciones = `
                        <div class="d-flex flex-column align-items-center gap-2">
                            <!-- Primera Fila (3 Botones: Direcciones, Imprimir, Lab) -->
                            <div class="d-flex justify-content-center gap-2">
                                ${btnDirecciones}
                                <a href="imprimir_cotizacion.php?id=${cot.id_cotizacion}" target="_blank" class="avatar-text avatar-md">
                                    <abbr title="Imprimir PDF (Cotización Comercial)" style="text-decoration:none;"><i class="feather-printer"></i></abbr>
                                </a>
                                ${btnPdfLab}
                            </div>
                            <!-- Segunda Fila (2 Botones: Editar, Eliminar) -->
                            <div class="d-flex justify-content-center gap-2">
                                <a href="#" class="avatar-text avatar-md btn-editar-modal" data-id="${cot.id_cotizacion}" data-folio="${folioVisual}">
                                    <abbr title="Editar" style="text-decoration:none;"><i class="feather-edit"></i></abbr>
                                </a>
                                ${btnEliminar}
                            </div>
                        </div>
                    `;

                    let tr = `
                        <tr>
                            <td>
                                <div class="d-flex flex-column align-items-center justify-content-center gap-1 text-center">
                                    <div class="avatar-image avatar-sm rounded bg-soft-light d-flex align-items-center justify-content-center">
                                        <img class="img-fluid" src="assets/images/gallery/icono_cot.jpg" style="max-height: 24px;">
                                    </div>
                                    <a class="d-block fw-bold mb-0 text-dark fs-14">${folioVisual}</a>
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
                                    ${contenedorAcciones}
                                </div>
                            </td>
                        </tr>
                    `;
                    tbody.append(tr);
                });

                if ($.fn.DataTable) {
                    $tabla.DataTable({
                        language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' },
                        destroy: true, pageLength: 8, lengthChange: false, ordering: false, searching: true, info: true,
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

    // ✨ EVENTO PARA FILTRAR POR ESTATUS (TODAS LAS COTIZACIONES)
    $(document).on('change', '#filtro_estatus_tabla', function() {
        let valor = $(this).val();
        let $tablaDT = $('#tableAllCotizaciones').DataTable();

        let regex = valor ? '^' + valor : '';
        $tablaDT.column(4).search(regex, true, false).draw();
    });

    cargarTablaPrincipal();

    //>>>============================================== 
    //>>>           3. MODAL DE EDICIÓN
    //>>>============================================== 
    function verificarBotonFondoEdicion() {
        let cantidadFilas = $('#tab_logic_edit tbody tr.fila-producto').length;
        if (cantidadFilas >= 4) {
            $('#edit_btn_add_row_bottom').slideDown('fast');
        } else {
            $('#edit_btn_add_row_bottom').slideUp('fast');
        }
    }

    // ✨ CARGA LAS SUCURSALES Y PLAZAS (INDEPENDIENTES Y USANDO SEPARADOR ||)
    function cargarSucursalesEdicion(usuarioId, preseleccion_suc = null, preseleccion_plaza = null) {
        let $selectSuc = $('#edit_select_sucursal');
        let $infoPlaza = $('#edit_info_plaza');
        let $wrapperPlaza = $('#wrapper_info_plaza_edit');

        if ($selectSuc.hasClass('select2-hidden-accessible')) {
            $selectSuc.select2('destroy');
        }
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
                    
                    // --- LLENAR SUCURSALES ---
                    $selectSuc.empty();
                    window.windowSucursalesOpcionesEdit = '<option value="">Selecciona destino...</option>';

                    if (data.length === 0) {
                        $selectSuc.append('<option value="" disabled>Sin sucursales asignadas</option>');
                        window.windowSucursalesOpcionesEdit = '<option value="" disabled>Sin sucursales asignadas</option>';
                    } else {
                        $selectSuc.append('<option value="">Selecciona la sucursal...</option>');
                        
                        let sucursalesAgregadas = new Set(); // ✨ ESCUDO CONTRA DUPLICADOS

                        data.forEach(suc => {
                            if (!sucursalesAgregadas.has(suc.id_sucursal)) {
                                sucursalesAgregadas.add(suc.id_sucursal);
                                let nombreVisual = suc.nombre_listo_para_mostrar;
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

                    $selectSuc.select2({ dropdownParent: $('#modalEditarCotizacion'), theme: 'bootstrap-5', width: '100%' });

                    $('.select-sucursal-fila-edit').each(function() {
                        let valToSelect = $(this).attr('data-selected-suc') || $(this).val();
                        $(this).html(window.windowSucursalesOpcionesEdit);
                        if (valToSelect) $(this).val(valToSelect);
                        
                        if ($(this).hasClass('select2-hidden-accessible')) {
                            $(this).trigger('change.select2');
                        } else if (isEditMultiSucursal && $.fn.select2) {
                            $(this).select2({ theme: 'bootstrap-5', dropdownParent: $('#modalEditarCotizacion'), width: '100%', placeholder: "Selecciona destino..." });
                        }
                    });

                    // --- LLENAR PLAZAS (Independientes de la sucursal) ---
                    /* let plazasUnicas = new Map();
                    data.forEach(suc => {
                        if (suc.id_sae == 1) return; // Matriz no aporta plazas aquí
                        if (suc.ids_plazas && suc.nombres_plazas) {
                            let ids = suc.ids_plazas.toString().split('||');
                            let nombres = suc.nombres_plazas.split('||');
                            for(let i = 0; i < ids.length; i++) {
                                let idPlaza = ids[i].trim();
                                let nomPlaza = nombres[i].trim();
                                if(idPlaza && nomPlaza) plazasUnicas.set(idPlaza, nomPlaza);
                            }
                        }
                    }); */

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

                    // 🧹 Limpiamos Select2 previo y quitamos la clase form-select problemática
                    if ($infoPlaza.hasClass('select2-hidden-accessible')) {
                        $infoPlaza.select2('destroy');
                    }
                    $infoPlaza.empty().removeClass('form-select').addClass('form-control').css({'pointer-events': '', 'background-image': '', 'appearance': ''});

                    if (plazasUnicas.size === 0) {
                        $infoPlaza.append('<option value="">El usuario no tiene plazas ligadas</option>');
                        $infoPlaza.prop('disabled', true).removeClass('bg-white').addClass('bg-light').css('pointer-events', 'none');
                    } else if (plazasUnicas.size === 1) {
                        // ✨ 1 Sola Plaza: Bloqueo visual, sin plugin
                        let plazaActiva = Array.from(plazasUnicas.entries())[0];
                        $infoPlaza.append(`<option value="${plazaActiva[0]}" selected>${plazaActiva[1]}</option>`);
                        $infoPlaza.prop('disabled', false).removeClass('bg-white').addClass('bg-light').css('pointer-events', 'none');
                    } else {
                        // ✨ 2+ Plazas: Inicializamos Select2 sobre form-control para que se vea idéntico
                        $infoPlaza.append('<option value="">Selecciona la plaza...</option>');
                        plazasUnicas.forEach((nombre, id) => {
                            $infoPlaza.append(`<option value="${id}">${nombre}</option>`);
                        });
                        $infoPlaza.prop('disabled', false).removeClass('bg-light').addClass('bg-white').css('pointer-events', 'auto');
                        
                        // Solo aplica para las vistas de edición (no rompe el cotizador nuevo)
                        if (typeof preseleccion_plaza !== 'undefined' && preseleccion_plaza) {
                            $infoPlaza.val(preseleccion_plaza.toString());
                        }

                        if ($.fn.select2) {
                            $infoPlaza.select2({
                                theme: 'bootstrap-5',
                                width: '100%',
                                minimumResultsForSearch: Infinity // Evita que salga la caja de búsqueda interna
                            });
                        }
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

    // ✨ CONSTRUCTOR DE FILA AJUSTADO (SOMBREADO AZUL Y CIBERSEGURIDAD ID EQUIPO)
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
                    <!-- ✨ CAMPO ID DEL EQUIPO OCULTO POR DEFECTO -->
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
                        <!-- ✨ VISUAL EN MXN -->
                        <input type="text" class="form-control edit-total-visual text-end fw-bold" readonly value="">
                        <!-- ✨ CRUDA PARA LA BASE DE DATOS -->
                        <input type="hidden" name="total[]" class="edit-total-hidden" value="${total}">
                        <a href="#" class="text-danger btn-eliminar-fila-unica" title="Eliminar fila" style="font-size: 1.2rem;"><i class="feather-trash-2"></i></a>
                    </div>
                </td>
            </tr>
        `;
    }

    function cargarSolicitantes(id_empresa, preseleccion = null, isReadOnly = false, preseleccion_suc = null, preseleccion_plaza = null) {
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
                    cargarSucursalesEdicion(preseleccion, preseleccion_suc, preseleccion_plaza);
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

    $('#edit_select_solicitante').on('change', function () {
        let val = $(this).val();
        if (!val || $(this).data('old') === val) return;
        $(this).data('old', val);
        cargarSucursalesEdicion(val, null, null);
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
                
                // ✨ Inyectamos el valor oculto y el visual formateado
                $('#edit_sub_total').val(cot.importe_total);
                $('#edit_sub_total_visual').val(formatoMoneda.format(cot.importe_total));
                
                $('#edit_total_amount').val(cot.precio_iva);
                $('#edit_total_amount_visual').val(formatoMoneda.format(cot.precio_iva));
                
                let $selEmp = $('#edit_select_empresa');
                if ($selEmp.hasClass('select2-hidden-accessible')) {
                    $selEmp.select2('destroy');
                }
                $selEmp.html('<option value="">Selecciona un cliente...</option>');
                windowEmpresas.forEach(emp => { $selEmp.append(`<option value="${emp.id_empresa}">${emp.razon_social}</option>`); });
                
                $selEmp.data('old', cot.Empresa_id.toString()).val(cot.Empresa_id);
                $selEmp.select2({ dropdownParent: $('#modalEditarCotizacion') });

                $('#edit_estatus').data('tiene-dir', cot.tiene_dir ? parseInt(cot.tiene_dir) : 0);

                let estatusBD = cot.estatus ? cot.estatus : 'Guardado';
                if (estatusBD === 'Autorizada (sin dirección)') estatusBD = 'Autorizada (información completa)';
                $('#edit_estatus').val(estatusBD).trigger('change');

                let $wrapSucursal = $('#wrapper_selector_sucursal_edit');
                let $wrapPrecio   = $('#tipo_precio').closest('.mb-4');
                let $wrapEstatus  = $('#fila_estatus_lan');

                $wrapPrecio.show();
                $wrapEstatus.show();
                $selEmp.prop('disabled', false);

                if (isEditMultiSucursal) {
                    $wrapSucursal.hide();
                    $('#edit_select_sucursal').prop('required', false);
                    $('.col-edit-multisucursal').show();
                } else {
                    $wrapSucursal.show();
                    $('#edit_select_sucursal').prop('required', true);
                    $('.col-edit-multisucursal').hide();
                }

                if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
                    $wrapPrecio.hide();
                    $wrapEstatus.hide();
                    $selEmp.prop('disabled', true);

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

                let id_plaza_db = cot.Plaza_id ? cot.Plaza_id : null;
                cargarSolicitantes(cot.Empresa_id, cot.Usuario_empresa_id, isReadOnly, cot.Sucursal_id, id_plaza_db);

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
                    let esServicio = false;

                    if (preciosProductos[item.Product_id]) {
                        let pData = preciosProductos[item.Product_id];
                        let claveM = pData.clave_product.toUpperCase();
                        let descM = pData.descripcion_product.toUpperCase();
                        let estadoBD = pData.estado_product ? pData.estado_product.toUpperCase().trim() : '';
                        
                        if (estadoBD === 'CALIBRACION' || claveM.includes('SERVICIO') || descM.includes('SERVICIO')) {
                            esServicio = true;
                        }
                    }

                    $tbody.append(construirFila(index, item.id_detalle_cot, item.Product_id, item.precio_unitario, item.cantidad, item.precio_extendido, esServicio, item.desglosar === 'Y', item.sucursal_destino_id, item.equipo_id));
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
                    $('#edit_btn_add_row_bottom').hide();
                    $('.btn-eliminar-fila-unica').hide();
                    $('#formEditarCotizacion button[type="submit"]').hide();
                }else {
                    verificarBotonFondoEdicion();
                }

                $('#modalEditarCotizacion').modal('show');
            }
        });
    });

    //>>>==============================================
    //>>>  4. MATEMÁTICAS Y FILAS DINÁMICAS EN MODAL
    //>>>==============================================
    $("#edit_add_row, #edit_btn_add_row_bottom").click(function () {
        $("#edit_tbody_productos").append(construirFila(rowCount, 0, '', '', 1, '', false, false, '', ''));
        window.productoAgregadoEnEdicion = true; 
        
        $(`#edit_addr${rowCount} .select-prod-modal`).select2({ 
            theme: 'bootstrap-5', dropdownParent: $('#modalEditarCotizacion'), width: '100%'
        });
        $(`#edit_addr${rowCount} .select-sucursal-fila-edit`).select2({ 
            theme: 'bootstrap-5', dropdownParent: $('#modalEditarCotizacion'), width: '100%', placeholder: "Selecciona certificado..." 
        });
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

    // ✨ CONTROL DEL ERROR 1111 USANDO SPAN
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

    // ✨ CÁLCULO DE FILA Y CONTROL DE ID DE EQUIPO
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
            $puntosWrapper.slideUp('fast').empty();
            $inputID.hide().prop('required', false).val('');
            row.find('.chk-desglosar').prop('disabled', false);
            calcEditTotal();
            return;
        }

        let ptos = pData.puntos_calibracion;
        if (ptos !== null && ptos !== undefined && String(ptos).trim() !== '' && String(ptos).trim() !== 'null') {
            let puntosFormateados = String(ptos).trim().replace(/\n/g, '<br>');
            $puntosWrapper.html(`
                <span class="badge bg-soft-success text-success px-2 py-1 fs-11 w-100 shadow-sm mt-1" style="white-space: normal; text-align: left; line-height: 1.4; border-left: 3px solid #28a745;">
                    <i class="feather-target me-1 fw-bold"></i> Ptos de calibración: ${puntosFormateados}
                </span>
            `).slideDown('fast');
        } else {
            $puntosWrapper.hide().empty();
        }

        let estadoBD = pData.estado_product ? pData.estado_product.toUpperCase().trim() : '';
        let esServicio = (estadoBD === 'CALIBRACION');

        // ✨ APLICACIÓN DE REGLAS DE VISIBILIDAD DE ID (USADO vs NUEVO vs CLIENTE PORTAL)
        if (esServicio) {
            $inputID.hide().prop('required', false).val('');
            row.find('.chk-desglosar').prop('checked', false).prop('disabled', true);
        } else {
            row.find('.chk-desglosar').prop('disabled', false);

            if (estadoBD === 'USADO') {
                $inputID.show().prop('readonly', false).removeClass('bg-light').prop('required', true).attr('placeholder', 'ID del equipo (Obligatorio)');
            } else {
                $inputID.prop('required', false).attr('placeholder', 'ID del equipo (Opcional)');
                
                if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
                    if ($inputID.val() && $inputID.val().trim() !== '') {
                        $inputID.show().prop('readonly', true).addClass('bg-light');
                    } else {
                        $inputID.hide();
                    }
                } else {
                    $inputID.show().prop('readonly', false).removeClass('bg-light');
                }
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
            row.find('.price').val(pEquipo.toFixed(2));
            textoInformativo = `<small class="text-info d-block fw-bold mt-1">Servicio (${formatoMoneda.format(pEquipo)})</small>`;
        } else {
            // El precio unitario general siempre será la suma total (precio antes de IVA)
            row.find('.price').val(pAntesIva.toFixed(2));
            
            if (desglosar) {
                // Invertimos visualmente los valores si es usado
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

        // ✨ CALCULAR IGNORANDO LAS COMAS VISUALES
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

        let tax = parseFloat($("#edit_tax").val()) || 0;
        let monto_iva = (sub / 100) * tax;
        
        $("#edit_total_amount").val((sub + monto_iva).toFixed(2));
        $("#edit_total_amount_visual").val(formatoMoneda.format(sub + monto_iva));
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

                    let estatusSeleccionado = $('#edit_estatus').val();

                    if (estatusSeleccionado.includes('Autorizada') || window.productoAgregadoEnEdicion) {
                        alert("Cambios guardados. Serás redirigido para verificar las direcciones de los equipos.");
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

            $selectProd.html(opcionesActualizadas).val(idProductoActual);
            $selectProd.select2({ 
                theme: 'bootstrap-5', 
                dropdownParent: $('#modalEditarCotizacion'),
                width: '100%'
            });
        });
    });

    let $modalContainer = $('#modalEditarCotizacion');
    let $modalScroll = $('#formEditarCotizacion');
    let $btnTopModal = $('#btnBackToTopModal');
    
    if ($btnTopModal.length) {
        $modalScroll.on('scroll', function() {
            if ($(this).scrollTop() > 200) {
                $btnTopModal.css('display', 'flex');
            } else {
                $btnTopModal.css('display', 'none');
            }
        });

        $btnTopModal.on('click', function() {
            $modalScroll[0].scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        $modalContainer.on('hidden.bs.modal', function () {
            $btnTopModal.css('display', 'none');
        });
    }
});