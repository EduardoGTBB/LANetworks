$(document).ready(function () {
    // Inicialización de Select2 en Modal
    $('#tipo_precio, #edit_filtro_tipo_producto').each(function () {
        if ($(this).hasClass('select2-hidden-accessible')) {
            $(this).select2('destroy');
        }
        $(this).select2({
            theme: 'bootstrap-5',
            dropdownParent: $('#modalEditarCotizacion'),
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

    window.windowSucursalesOpcionesEdit = '<option value="">Selecciona destino...</option>';
    let isEditMultiSucursal = false;
    let sucursalesCacheEdit = [];

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

    $(document).on('change', '.chk-desglosar', function () {
        $(this).siblings('.hidden-desglose').val($(this).is(':checked') ? 'Y' : 'N');
    });

    $(document).on('change', '.select-sucursal-fila-edit', function () {
        $(this).attr('data-selected-suc', $(this).val());
    });

    //>>> ==============================================
    //>>> 2. CARGAR TABLA PRINCIPAL CON DATATABLES
    //>>> ==============================================
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

                let conteo_pendientes_oc = 0;

                data.forEach(function (cot) {
                    let folioVisual = cot.folio_especial ? cot.folio_especial : cot.id_cotizacion.toString().padStart(5, '0');
                    let nombreSol = cot.nombre ? cot.nombre : 'Admin';
                    let apellidoSol = cot.apellido_pat ? cot.apellido_pat : '';
                    let solicitante = `${nombreSol} ${apellidoSol}`.trim();
                    let razonSoc = cot.razon_social ? cot.razon_social : 'Sin Empresa';
                    let nombrePlaza = cot.nombre_plaza ? cot.nombre_plaza.toUpperCase() : 'SIN ESPECIFICAR';

                    let badgeColor = 'bg-soft-primary text-primary';
                    let estatusTexto = cot.estatus ? cot.estatus : 'Guardado para aprobación';

                    // 2. EVALUAR SI ESTÁ PENDIENTE DE ORDEN DE COMPRA
                    if (estatusTexto === 'Autorizada (información completa)' && cot.numero_guia && cot.fecha_entrega && cot.oc_cargada === 'N') {
                        conteo_pendientes_oc++;
                    }

                    if (estatusTexto === 'Autorizada (sin dirección)') badgeColor = 'bg-soft-warning text-warning';
                    if (estatusTexto === 'Autorizada (información completa)') badgeColor = 'bg-soft-success text-success';
                    if (estatusTexto === 'No autorizada') badgeColor = 'bg-soft-danger text-danger';

                    // ✨ 1. LOGÍSTICA INTELIGENTE
                    let btnLogisticaRapida = '';
                    if (estatusTexto === 'Autorizada (información completa)') {
                        if (!cot.numero_guia || cot.numero_guia.trim() === '') {
                            btnLogisticaRapida = `<a href="#" class="avatar-text avatar-md bg-soft-danger text-danger border border-danger btn-logistica-modal" style="animation: pulse 1.5s infinite;" data-id="${cot.id_cotizacion}" data-paqueteria="" data-guia="" data-fecha=""><abbr title="¡URGENTE! Añadir Guía" style="text-decoration:none;"><i class="feather-truck"></i></abbr></a>`;
                        } else {
                            btnLogisticaRapida = `<a href="#" class="avatar-text avatar-md bg-soft-success text-success border border-success border-opacity-25 btn-logistica-modal" data-id="${cot.id_cotizacion}" data-paqueteria="${cot.paqueteria}" data-guia="${cot.numero_guia}" data-fecha="${cot.fecha_envio}"><abbr title="Ver/Actualizar Guía" style="text-decoration:none;"><i class="feather-truck"></i></abbr></a>`;
                        }
                    }

                    // ✨ 2. MAPA (DIRECCIONES)
                    let btnCompletarVenta = '';
                    let yaTieneDirecciones = parseInt(cot.tiene_dir) || 0;
                    let equiposSinDir = parseInt(cot.equipos_sin_dir) || 0;

                    if (estatusTexto !== 'Autorizada (información completa)' && estatusTexto !== 'No autorizada' && estatusTexto !== 'Ganada' && estatusTexto !== 'Perdida') {
                        let urgeDireccion = (estatusTexto === 'Autorizada (sin dirección)' || (estatusTexto === 'Guardado para aprobación' && yaTieneDirecciones === 0));
                        let alertaEdicionIncompleta = (yaTieneDirecciones > 0 && equiposSinDir > 0);

                        let colorIcon = 'text-dark';
                        let latido = '';
                        let claseFondo = 'bg-soft-secondary';
                        let textoTooltip = 'Gestionar Direcciones';

                        if (alertaEdicionIncompleta) {
                            // 🚨 Faltan equipos por asignar (Rojo parpadeante)
                            colorIcon = 'text-danger'; latido = 'style="animation: pulse 1.5s infinite;"'; claseFondo = 'bg-soft-danger border border-danger'; textoTooltip = '¡Alerta! Equipos sin dirección.';
                        } else if (urgeDireccion) {
                            // ⚠️ No tiene absolutamente ninguna dirección (Amarillo parpadeante)
                            colorIcon = 'text-warning'; latido = 'style="animation: pulse 2s infinite;"'; claseFondo = 'bg-soft-warning border border-warning'; textoTooltip = '¡Faltan Direcciones! Haz clic aquí.';
                        } else if (yaTieneDirecciones > 0) {
                            // ✅ TAREA COMPLETADA (Azul corporativo)
                            colorIcon = 'text-primary'; claseFondo = 'bg-soft-primary'; textoTooltip = 'Ver/Editar Direcciones (Registro Completo)';
                        }

                        btnCompletarVenta = `<a href="finalizar_venta.php?id=${cot.id_cotizacion}&from=mis_cotizaciones" class="avatar-text avatar-md ${claseFondo} ${colorIcon}" ${latido}><abbr title="${textoTooltip}" style="text-decoration:none;"><i class="feather-map-pin"></i></abbr></a>`;
                    }

                    // ✨ 3. LÓGICA DUAL: BOTÓN EQUIPO ENTREGADO / SUBIR OC / VER OC
                    let btnOC_Entregado = '';
                    
                    if (estatusTexto === 'Autorizada (información completa)' && cot.numero_guia && cot.numero_guia.trim() !== '') {
                        
                        if (!cot.fecha_entrega) {
                            // ⏳ FASE 1: AÚN NO ENTREGADO AL CLIENTE
                            if (typeof ES_CLIENTE_PORTAL !== 'undefined' && !ES_CLIENTE_PORTAL) {
                                btnOC_Entregado = `<a href="javascript:void(0);" class="avatar-text avatar-md bg-soft-primary text-primary border border-primary btn-marcar-entregado" data-id="${cot.id_cotizacion}" data-folio="${folioVisual}"><abbr title="Marcar como Entregado y Solicitar Orden de Compra" style="text-decoration:none;"><i class="feather-box"></i></abbr></a>`;
                            }
                        } else {
                            // 📦 FASE 2 y 3: EQUIPO ENTREGADO
                            if (cot.oc_cargada === 'N') {
                                if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
                                    btnOC_Entregado = `<a href="javascript:void(0);" class="avatar-text avatar-md bg-soft-danger text-danger border border-danger btn-subir-oc" data-id="${cot.id_cotizacion}" data-folio="${folioVisual}" style="animation: pulse 1.5s infinite;"><abbr title="¡ACCIÓN REQUERIDA! Subir Orden de Compra" style="text-decoration:none;"><i class="feather-upload-cloud"></i></abbr></a>`;
                                } else {
                                    btnOC_Entregado = `<a href="javascript:void(0);" class="avatar-text avatar-md bg-soft-warning text-warning border border-warning" style="animation: pulse 2s infinite;"><abbr title="Esperando OC del cliente. (Entregado: ${cot.fecha_entrega})" style="text-decoration:none;"><i class="feather-clock"></i></abbr></a>`;
                                }
                            } else {
                                // ✅ FASE 3: ORDEN DE COMPRA SUBIDA
                                // ¡AMBOS (Cliente y Admin) verán el botón para EDITAR el documento!
                                btnOC_Entregado = `<a href="javascript:void(0);" class="avatar-text avatar-md bg-success text-white border border-success btn-editar-oc" data-id="${cot.id_cotizacion}" data-recepcion="${cot.numero_recepcion}" data-ruta="${cot.ruta_oc}"><abbr title="Ver PDF o Editar Número de Recepción" style="text-decoration:none;"><i class="feather-edit-3"></i></abbr></a>`;
                            }
                        }
                    }

                    // ✨ 4. EDITAR, ELIMINAR Y PDFs
                    let btnEditar = `<a href="#" class="avatar-text avatar-md bg-soft-primary text-primary btn-editar-modal" data-id="${cot.id_cotizacion}" data-folio="${folioVisual}"><abbr title="Ver Detalles / Editar" style="text-decoration:none;"><i class="feather-edit"></i></abbr></a>`;

                    let btnEliminar = '';
                    if (!estatusTexto.includes('Autorizada') && estatusTexto !== 'No autorizada' && estatusTexto !== 'Ganada' && estatusTexto !== 'Perdida') {
                        btnEliminar = `<a href="javascript:void(0);" class="avatar-text avatar-md bg-soft-danger text-danger btn-borrar-cot" data-id="${cot.id_cotizacion}"><abbr title="Eliminar" style="text-decoration:none;"><i class="feather-trash-2"></i></abbr></a>`;
                    }

                    // Ocultamos el PDF de Laboratorio si es Cliente
                    let btnPdfLab = (!ES_CLIENTE_PORTAL) ? `<a href="imprimir_cotizacion.php?id=${cot.id_cotizacion}&tipo=lab" target="_blank" class="avatar-text avatar-md bg-soft-info text-info"><abbr title="PDF Laboratorio" style="text-decoration:none;"><i class="feather-thermometer"></i></abbr></a>` : '';
                    let btnPdfComercial = `<a href="imprimir_cotizacion.php?id=${cot.id_cotizacion}" target="_blank" class="avatar-text avatar-md bg-soft-dark text-dark"><abbr title="PDF Comercial" style="text-decoration:none;"><i class="feather-printer"></i></abbr></a>`;

                    // ✨ MOTOR DINÁMICO DE BOTONES (A prueba de fallos)
                    let botonesActivos = [];
                    if (btnCompletarVenta) botonesActivos.push(btnCompletarVenta);
                    if (btnPdfComercial) botonesActivos.push(btnPdfComercial);
                    if (btnPdfLab) botonesActivos.push(btnPdfLab);
                    if (btnLogisticaRapida) botonesActivos.push(btnLogisticaRapida);
                    
                    // ✨ Inyectamos nuestro botón Inteligente Dual
                    if (btnOC_Entregado) botonesActivos.push(btnOC_Entregado); 
                    
                    if (btnEditar) botonesActivos.push(btnEditar);
                    if (btnEliminar) botonesActivos.push(btnEliminar);

                    let filasHTML = '';
                    for (let i = 0; i < botonesActivos.length; i += 3) {
                        let rowBotones = botonesActivos.slice(i, i + 3).join('');
                        let marginClass = (i === 0 && botonesActivos.length > 3) ? 'mb-1' : '';
                        filasHTML += `<div class="d-flex justify-content-center gap-1 ${marginClass}">${rowBotones}</div>`;
                    }

                    let contenedorAcciones = `
                        <div class="d-flex flex-column align-items-center justify-content-center mx-auto">
                            ${filasHTML}
                        </div>
                    `;

                    /* // ✨ 3. EDITAR, ELIMINAR Y PDFs
                    let btnEditar = `<a href="#" class="avatar-text avatar-md bg-soft-primary text-primary btn-editar-modal" data-id="${cot.id_cotizacion}" data-folio="${folioVisual}"><abbr title="Editar información" style="text-decoration:none;"><i class="feather-edit"></i></abbr></a>`;
                    
                    let btnEliminar = '';
                    if (!estatusTexto.includes('Autorizada') && estatusTexto !== 'No autorizada' && estatusTexto !== 'Ganada' && estatusTexto !== 'Perdida') {
                        btnEliminar = `<a href="javascript:void(0);" class="avatar-text avatar-md bg-soft-danger text-danger btn-borrar-cot" data-id="${cot.id_cotizacion}"><abbr title="Eliminar" style="text-decoration:none;"><i class="feather-trash-2"></i></abbr></a>`;
                    }

                    let btnPdfLab = (!ES_CLIENTE_PORTAL) ? `<a href="imprimir_cotizacion.php?id=${cot.id_cotizacion}&tipo=lab" target="_blank" class="avatar-text avatar-md bg-soft-info text-info"><abbr title="PDF Laboratorio" style="text-decoration:none;"><i class="feather-thermometer"></i></abbr></a>` : '';
                    let btnPdfComercial = `<a href="imprimir_cotizacion.php?id=${cot.id_cotizacion}" target="_blank" class="avatar-text avatar-md bg-soft-dark text-dark"><abbr title="PDF Comercial" style="text-decoration:none;"><i class="feather-printer"></i></abbr></a>`;

                    // ✨ 4. LÓGICA INTELIGENTE (FILAS EXPLÍCITAS A PRUEBA DE BALAS)
                    let botonesActivos = [];
                    
                    // Recolectamos los botones que realmente van a existir en esta fila
                    if (btnCompletarVenta) botonesActivos.push(btnCompletarVenta);
                    if (btnPdfComercial) botonesActivos.push(btnPdfComercial);
                    if (btnPdfLab) botonesActivos.push(btnPdfLab);
                    if (btnLogisticaRapida) botonesActivos.push(btnLogisticaRapida);
                    if (btnEditar) botonesActivos.push(btnEditar);
                    if (btnEliminar) botonesActivos.push(btnEliminar);

                    let cantidadBotones = botonesActivos.length;
                    let filasHTML = '';

                    // Forzamos el acomodo matemático dividiendo los botones en "renglones" fijos (divs separados)
                    if (cantidadBotones === 4) {
                        // 2 arriba, 2 abajo
                        filasHTML += `<div class="d-flex justify-content-center gap-1 mb-1">${botonesActivos[0]}${botonesActivos[1]}</div>`;
                        filasHTML += `<div class="d-flex justify-content-center gap-1">${botonesActivos[2]}${botonesActivos[3]}</div>`;
                    } else if (cantidadBotones === 5) {
                        // 3 arriba, 2 abajo centrados
                        filasHTML += `<div class="d-flex justify-content-center gap-1 mb-1">${botonesActivos[0]}${botonesActivos[1]}${botonesActivos[2]}</div>`;
                        filasHTML += `<div class="d-flex justify-content-center gap-1">${botonesActivos[3]}${botonesActivos[4]}</div>`;
                    } else if (cantidadBotones === 6) {
                        // 3 arriba, 3 abajo
                        filasHTML += `<div class="d-flex justify-content-center gap-1 mb-1">${botonesActivos[0]}${botonesActivos[1]}${botonesActivos[2]}</div>`;
                        filasHTML += `<div class="d-flex justify-content-center gap-1">${botonesActivos[3]}${botonesActivos[4]}${botonesActivos[5]}</div>`;
                    } else {
                        // 1, 2 o 3 botones (Todo en 1 fila)
                        filasHTML += `<div class="d-flex justify-content-center gap-1">${botonesActivos.join('')}</div>`;
                    }

                    // ✨ CONTENEDOR UNIFICADO Y RENDERIZADO
                    let contenedorAcciones = `
                        <div class="d-flex flex-column align-items-center justify-content-center mx-auto">
                            ${filasHTML}
                        </div>
                    `; */

                    // ✨ 5. COLUMNA DE ESTATUS (Interactivo - Ciberseguridad: Oculto para Clientes B2B)
                    let colEstatusHTML = `<span class="badge ${badgeColor}">${estatusTexto}</span>`;

                    // 🛡️ REGLA ZERO TRUST FRONTEND: Solo mostramos el botón si NO es cliente
                    if (estatusTexto === 'Guardado para aprobación' && !ES_CLIENTE_PORTAL) {
                        colEstatusHTML = `
                            <div class="d-flex align-items-center justify-content-center gap-2">
                                <span class="badge ${badgeColor}">${estatusTexto}</span>
                                <div class="dropdown">
                                    <a href="javascript:void(0);" class="btn btn-sm btn-primary d-flex align-items-center justify-content-center shadow-sm" data-bs-toggle="dropdown" aria-expanded="false" title="Evaluar Cotización" style="width: 30px; height: 30px; padding: 0; border-radius: 6px;">
                                        <i class="feather-check-circle" style="font-size: 15px;"></i>
                                    </a>
                                    <ul class="dropdown-menu shadow-lg border-0 mt-2">
                                        <li><h6 class="dropdown-header text-muted text-uppercase fw-bold" style="font-size: 10px;">Tomar decisión</h6></li>
                                        <li><a class="dropdown-item btn-cambiar-estatus fw-bold text-success py-2" href="#" data-id="${cot.id_cotizacion}" data-estatus="Autorizada (información completa)" data-tienedir="${yaTieneDirecciones}" data-folio="${folioVisual}"><i class="feather-check-circle me-2"></i> Autorizar</a></li>
                                        <li><a class="dropdown-item btn-cambiar-estatus fw-bold text-danger py-2" href="#" data-id="${cot.id_cotizacion}" data-estatus="No autorizada" data-tienedir="1" data-folio="${folioVisual}"><i class="feather-x-circle me-2"></i> Rechazar</a></li>
                                    </ul>
                                </div>
                            </div>
                        `;
                    }

                    // ✨ 6. CONSTRUCCIÓN DE LA FILA FINAL
                    /* let tr = `
                        <tr>
                            <td class="align-middle">
                                <div class="d-flex flex-column align-items-center justify-content-center text-center">
                                    <div class="avatar-image avatar-sm rounded bg-soft-light d-flex align-items-center justify-content-center mb-1">
                                        <img class="img-fluid" src="assets/images/gallery/icono_cot.jpg" style="max-height: 24px;">
                                    </div>
                                    <a class="d-block fw-bold mb-0 text-dark fs-14">${folioVisual}</a>
                                    <span class="fs-11 text-muted d-block mt-1">
                                        <i class="feather-calendar me-1"></i>${cot.fecha_cot}
                                    </span>
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
                                    <span class="text-primary fw-bold" style="font-size: 11px;">
                                        Plaza: ${nombrePlaza}
                                    </span>
                                </div>
                            </td>
                            
                            <td class="align-middle text-center"><span class="text-dark fw-bold">${formatoMoneda.format(cot.gran_total)}</span></td>
                            <td class="align-middle text-center">
                                ${colEstatusHTML}
                            </td>
                            
                            <td class="text-center align-middle" style="min-width: 155px;">
                                ${contenedorAcciones}
                            </td>
                        </tr>
                    `; */

                    let tr = `
                        <tr>
                            <td class="align-middle">
                                <div class="d-flex flex-column align-items-center justify-content-center text-center">
                                    <div class="avatar-image avatar-sm rounded bg-soft-light d-flex align-items-center justify-content-center mb-1">
                                        <img class="img-fluid" src="assets/images/gallery/icono_cot.jpg" style="max-height: 24px;">
                                    </div>
                                    <a class="d-block fw-bold mb-0 text-dark fs-14">${folioVisual}</a>
                                    <span class="fs-11 text-muted d-block mt-1">
                                        <i class="feather-calendar me-1"></i>${cot.fecha_cot}
                                    </span>
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
                                    <span class="text-primary fw-bold" style="font-size: 11px;">
                                        Plaza: ${nombrePlaza}
                                    </span>
                                </div>
                            </td>
                            
                            <td class="align-middle text-center"><span class="text-dark fw-bold">${formatoMoneda.format(cot.gran_total)}</span></td>
                            
                            <td class="align-middle text-center">
                                <span class="d-none">${estatusTexto}</span>
                                ${colEstatusHTML}
                            </td>

                            <!-- ✨ COLUMNA OCULTA PARA EL FILTRO DE TABS -->
                            <td class="d-none">${cot.categoria ? cot.categoria.toUpperCase() : 'NUEVO'}</td>
                            
                            <td class="text-center align-middle" style="min-width: 155px;">
                                ${contenedorAcciones}
                            </td>
                        </tr>
                    `;
                    tbody.append(tr);
                });

                // ✨ 3. CONTROL DEL BANNER: Mostrar solo a clientes si hay pendientes
                if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL && conteo_pendientes_oc > 0) {
                    $('#contador_oc_pendientes').text(conteo_pendientes_oc);
                    $('#banner_oc_pendientes').slideDown('fast');
                } else {
                    $('#banner_oc_pendientes').slideUp('fast');
                }

                if ($.fn.DataTable) {
                    $tabla.DataTable({
                        language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' },
                        destroy: true,
                        pageLength: 8,
                        lengthChange: false,
                        ordering: false,
                        searching: true,
                        info: true,
                        // ✨ UX: Agregamos 'm-0' a las filas (row) para eliminar márgenes negativos y evitar que la línea se desborde.
                        // También añadimos 'border-bottom' a la primera fila para crear una línea separadora perfecta.
                        // ✨ UX: Eliminamos el contenedor del total de aquí, ya que ahora vive en la cabecera PHP
                        dom: "<'row m-0 px-4 pt-4 pb-3 border-bottom'<'col-12 d-flex justify-content-start align-items-center'f>>" +
                             "<'row m-0'<'col-12 p-0'<'#contenedor-tabs-datatables'>>>" +
                             "<'table-responsive'tr>" +
                             "<'row m-0 align-items-center p-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-end'p>>",

                        // ✨ INYECTAMOS EL TEMPLATE HTML CUANDO LA TABLA ESTÉ LISTA
                        initComplete: function() {
                            let tabsHtml = $('#template-tabs-cotizaciones').html();
                            $('#contenedor-tabs-datatables').html(tabsHtml).css({'width': '100%', 'display': 'block'});
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

                            // 🎯 Ubicamos el contenedor inyectado por DataTables
                            let $badgeContainer = $('#contenedor-badge-total');

                            if (total > 0) {
                                let filtroActivo = $('#filtro_estatus_tabla').val();
                                
                                // Definimos los colores corporativos exactos para la caja
                                let bordeBox = '#dee2e6';
                                let bordeLateral = '#6c757d';
                                let claseTexto = 'text-secondary';

                                if (filtroActivo === 'Guardado para aprobación') {
                                    bordeBox = '#b8daff'; bordeLateral = '#0d6efd'; claseTexto = 'text-primary';
                                } else if (filtroActivo === 'Autorizada') {
                                    bordeBox = '#c3e6cb'; bordeLateral = '#28a745'; claseTexto = 'text-success';
                                } else if (filtroActivo === 'No autorizada') {
                                    bordeBox = '#f5c6cb'; bordeLateral = '#dc3545'; claseTexto = 'text-danger';
                                }

                                // ✨ UX: Diseño idéntico al mockup (Compacto, elegante y delineado)
                                let badgeHTML = `
                                    <div class="d-flex align-items-center bg-white shadow-sm px-3" style="height: 34px; border-radius: 6px; border: 1px solid ${bordeBox}; border-left: 4px solid ${bordeLateral};">
                                        <span class="text-muted fw-bold text-uppercase me-2" style="font-size: 10px;">Total:</span>
                                        <span class="fw-bolder ${claseTexto}" style="font-size: 13px;">${formatoMoneda.format(total)}</span>
                                    </div>`;
                                $badgeContainer.html(badgeHTML);
                                // ✨ UX: Le damos el mismo ancho mínimo (260px) y lo centramos internamente
                                /* let badgeHTML = `
                                    <div style="min-width: 260px;" class="d-flex justify-content-end mb-2">
                                        <span class="badge ${colorFondoTexto} fs-13 py-2 px-3 shadow-sm w-100 d-flex justify-content-center align-items-center" style="border: 1px solid ${colorBorde};">
                                            Total acumulado: <strong class="ms-1">${formatoMoneda.format(total)}</strong>
                                        </span>
                                    </div>`;
                                $badgeContainer.html(badgeHTML); */
                            } else {
                                $badgeContainer.empty(); // Limpiamos si no hay total
                            }
                        }
                    });

                    $('#filtro_estatus_tabla').trigger('change');

                    // ✨ RE-APLICAMOS EL FILTRO Y MARCAMOS EL TAB ACTIVO (RETENCIÓN DE ESTADO)
                    if (window.pestanaActivaCotizaciones !== 'TODOS') {
                        aplicarFiltroCategoria(window.pestanaActivaCotizaciones);
                        // Aseguramos que se repinte el Tab
                        setTimeout(() => {
                            $('.tab-filtro-cat').removeClass('active').attr('aria-selected', 'false');
                            $(`.tab-filtro-cat[data-categoria="${window.pestanaActivaCotizaciones}"]`).addClass('active').attr('aria-selected', 'true');
                        }, 50);
                    }

                }
            },
            error: function () {
                $('#tabla-cotizaciones').html('<tr><td colspan="6" class="text-center text-danger py-4">Error al cargar las cotizaciones.</td></tr>');
            }
        });
    }

    // EVENTO PARA FILTRAR POR ESTATUS
    $(document).on('change', '#filtro_estatus_tabla', function () {
        let valor = $(this).val();
        let $tablaDT = $('#tableMisCotizaciones').DataTable();

        if (valor) {
            let regex = '^\\s*' + valor;
            $tablaDT.column(3).search(regex, true, false).draw();
        } else {
            $tablaDT.column(3).search('', true, false).draw();
        }
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

    /* function cargarSucursalesEdicion(usuarioId, preseleccion_suc = null, preseleccion_plaza = null) {
        let $selectSuc = $('#edit_select_sucursal');
        let $infoPlaza = $('#edit_info_plaza');
        let $wrapperPlaza = $('#wrapper_info_plaza_edit');

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
                    window.windowSucursalesOpcionesEdit = '<option value="">Selecciona destino...</option>';

                    if (data.length === 0) {
                        $selectSuc.append('<option value="" disabled>Sin sucursales asignadas</option>');
                        window.windowSucursalesOpcionesEdit = '<option value="" disabled>Sin sucursales asignadas</option>';
                    } else {
                        $selectSuc.append('<option value="">Selecciona la sucursal...</option>');
                        let sucursalesAgregadas = new Set();

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

                    if ($selectSuc.hasClass('select2-hidden-accessible')) $selectSuc.select2('destroy');
                    $selectSuc.select2({ theme: 'bootstrap-5', dropdownParent: $('#modalEditarCotizacion'), width: '100%', placeholder: "Selecciona Sucursal..." });

                    // BLOQUEO PARA SUCURSAL SI ESTÁ AUTORIZADA
                    if (isReadOnly) {
                        $selectSuc.prop('disabled', true);
                    }

                    $('.select-sucursal-fila-edit').each(function() {
                        let valToSelect = $(this).attr('data-selected-suc');
                        $(this).html(window.windowSucursalesOpcionesEdit);
                        if (valToSelect) $(this).val(valToSelect);
                        
                        if ($(this).hasClass('select2-hidden-accessible')) $(this).select2('destroy');
                        if (isEditMultiSucursal) {
                            $(this).select2({ theme: 'bootstrap-5', dropdownParent: $('#modalEditarCotizacion'), width: '100%', placeholder: "Selecciona Sucursal..." });

                            // Bloqueamos también los selects internos si es multisucursal
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
                    $infoPlaza.empty().removeClass('form-select').addClass('form-control').css({'pointer-events': '', 'background-image': '', 'appearance': ''});

                    if (plazasUnicas.size === 0) {
                        $infoPlaza.append('<option value="">El usuario no tiene plazas ligadas</option>');
                        $infoPlaza.prop('disabled', true).removeClass('bg-white').addClass('bg-light').css('pointer-events', 'none');
                    } else if (plazasUnicas.size === 1) {
                        let plazaActiva = Array.from(plazasUnicas.entries())[0];
                        $infoPlaza.append(`<option value="${plazaActiva[0]}" selected>${plazaActiva[1]}</option>`);
                        $infoPlaza.prop('disabled', false).removeClass('bg-white').addClass('bg-light').css('pointer-events', 'none');
                    } else {
                        $infoPlaza.append('<option value="">Selecciona la plaza...</option>');
                        plazasUnicas.forEach((nombre, id) => { $infoPlaza.append(`<option value="${id}">${nombre}</option>`); });
                        $infoPlaza.prop('disabled', false).removeClass('bg-light').addClass('bg-white').css('pointer-events', 'auto');
                        
                        // CORRECCIÓN DE CIBERSEGURIDAD: Evaluamos isReadOnly antes de liberar el candado
                        if (isReadOnly) {
                            $infoPlaza.prop('disabled', true).removeClass('bg-white').addClass('bg-light').css('pointer-events', 'none');
                        } else {
                            $infoPlaza.prop('disabled', false).removeClass('bg-light').addClass('bg-white').css('pointer-events', 'auto');
                        }

                        if (typeof preseleccion_plaza !== 'undefined' && preseleccion_plaza) $infoPlaza.val(preseleccion_plaza.toString());
                        if ($.fn.select2) $infoPlaza.select2({ theme: 'bootstrap-5', width: '100%', minimumResultsForSearch: Infinity });
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
    } */

    // ✨ 1. Modificamos la función para que reciba el parámetro "isReadOnly"
    function cargarSucursalesEdicion(usuarioId, preseleccion_suc = null, preseleccion_plaza = null, isReadOnly = false) {
        let $selectSuc = $('#edit_select_sucursal');
        let $infoPlaza = $('#edit_info_plaza');
        let $wrapperPlaza = $('#wrapper_info_plaza_edit');

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
                    window.windowSucursalesOpcionesEdit = '<option value="">Selecciona destino...</option>';

                    if (data.length === 0) {
                        $selectSuc.append('<option value="" disabled>Sin sucursales asignadas</option>');
                        window.windowSucursalesOpcionesEdit = '<option value="" disabled>Sin sucursales asignadas</option>';
                    } else {
                        $selectSuc.append('<option value="">Selecciona la sucursal...</option>');
                        let sucursalesAgregadas = new Set();

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

                    if ($selectSuc.hasClass('select2-hidden-accessible')) $selectSuc.select2('destroy');
                    $selectSuc.select2({ theme: 'bootstrap-5', dropdownParent: $('#modalEditarCotizacion'), width: '100%', placeholder: "Selecciona Sucursal..." });

                    // ✨ BLOQUEO PARA SUCURSAL SI ESTÁ AUTORIZADA
                    if (isReadOnly) {
                        $selectSuc.prop('disabled', true);
                    }

                    $('.select-sucursal-fila-edit').each(function () {
                        let valToSelect = $(this).attr('data-selected-suc');
                        $(this).html(window.windowSucursalesOpcionesEdit);
                        if (valToSelect) $(this).val(valToSelect);

                        if ($(this).hasClass('select2-hidden-accessible')) $(this).select2('destroy');
                        if (isEditMultiSucursal) {
                            $(this).select2({ theme: 'bootstrap-5', dropdownParent: $('#modalEditarCotizacion'), width: '100%', placeholder: "Selecciona Sucursal..." });
                            // ✨ Bloqueamos también los selects internos si es multisucursal
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
                        plazasUnicas.forEach((nombre, id) => { $infoPlaza.append(`<option value="${id}">${nombre}</option>`); });

                        if (typeof preseleccion_plaza !== 'undefined' && preseleccion_plaza) $infoPlaza.val(preseleccion_plaza.toString());
                        if ($.fn.select2) $infoPlaza.select2({ theme: 'bootstrap-5', width: '100%', minimumResultsForSearch: Infinity });
                    }

                    // ✨ CORRECCIÓN DE CIBERSEGURIDAD: Evaluamos isReadOnly antes de liberar el candado
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

    /* function cargarSolicitantes(id_empresa, preseleccion = null, isReadOnly = false, preseleccion_suc = null, preseleccion_plaza = null) {
        $.ajax({
            url: 'api/api_cotizador.php?action=get_usuarios&empresa_id=' + id_empresa,
            method: 'GET',
            success: function (users) {
                let $selSol = $('#edit_select_solicitante');
                $selSol.empty().append('<option value="">Selecciona...</option>');
                users.forEach(u => { $selSol.append(`<option value="${u.id_usuario}">${u.nombre} ${u.apellido_pat} ${u.apellido_mat}</option>`); });

                if (preseleccion) {
                    $selSol.data('old', preseleccion.toString());
                    $selSol.val(preseleccion);
                    cargarSucursalesEdicion(preseleccion, preseleccion_suc, preseleccion_plaza, isReadOnly);
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

    $('#edit_select_solicitante').on('change', function () {
        let val = $(this).val();
        if (!val || $(this).data('old') === val) return;
        $(this).data('old', val);
        cargarSucursalesEdicion(val, null, null, false);
    }); */

    // ✨ 2. Aseguramos que cargarSolicitantes transmita la orden de Bloqueo
    function cargarSolicitantes(id_empresa, preseleccion = null, isReadOnly = false, preseleccion_suc = null, preseleccion_plaza = null) {
        $.ajax({
            url: 'api/api_cotizador.php?action=get_usuarios&empresa_id=' + id_empresa,
            method: 'GET',
            success: function (users) {
                let $selSol = $('#edit_select_solicitante');
                $selSol.empty().append('<option value="">Selecciona...</option>');
                users.forEach(u => { $selSol.append(`<option value="${u.id_usuario}">${u.nombre} ${u.apellido_pat} ${u.apellido_mat}</option>`); });

                if (preseleccion) {
                    $selSol.data('old', preseleccion.toString());
                    $selSol.val(preseleccion);
                    // ✨ PASAMOS EL PARÁMETRO isReadOnly AQUÍ
                    cargarSucursalesEdicion(preseleccion, preseleccion_suc, preseleccion_plaza, isReadOnly);
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

    $('#edit_select_solicitante').on('change', function () {
        let val = $(this).val();
        if (!val || $(this).data('old') === val) return;
        $(this).data('old', val);
        cargarSucursalesEdicion(val, null, null, false); // Manual siempre es false (editable)
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

    $(document).on('click', '.btn-editar-modal', function (e) {
        e.preventDefault();
        window.productoAgregadoEnEdicion = false;
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

                let $selEmp = $('#edit_select_empresa');
                $selEmp.empty().append('<option value="">Selecciona un cliente...</option>');
                windowEmpresas.forEach(emp => { $selEmp.append(`<option value="${emp.id_empresa}">${emp.razon_social}</option>`); });
                $selEmp.val(cot.Empresa_id).select2({ dropdownParent: $('#modalEditarCotizacion') });

                let estatusBD = cot.estatus ? cot.estatus : 'Guardado para aprobación';
                if (estatusBD === 'Autorizada (sin dirección)') estatusBD = 'Autorizada (información completa)';
                $('#edit_estatus').val(estatusBD);

                let $wrapSucursal = $('#wrapper_selector_sucursal_edit');
                let $wrapPrecio = $('#tipo_precio').closest('.mb-4');
                $wrapPrecio.show(); $selEmp.prop('disabled', false);

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
                    $selEmp.prop('disabled', true);
                    if ($('#hidden_edit_empresa').length === 0) {
                        $('#formEditarCotizacion').append(`<input type="hidden" id="hidden_edit_empresa" name="Empresa_id" value="${cot.Empresa_id}">`);
                        $('#formEditarCotizacion').append(`<input type="hidden" id="hidden_edit_precio" name="tipo_precio" value="${cot.tipo_precio}">`);
                    } else {
                        $('#hidden_edit_empresa').val(cot.Empresa_id);
                        $('#hidden_edit_precio').val(cot.tipo_precio);
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
                $('#edit_filtro_tipo_producto').css({ 'pointer-events': 'none', 'background-color': '#e9ecef', 'opacity': '1' });

                let $tbody = $('#edit_tbody_productos');
                $tbody.empty(); rowCount = 0;

                dets.forEach((item, index) => {
                    let esServicio = false;
                    if (preciosProductos[item.Product_id]) {
                        let pData = preciosProductos[item.Product_id];
                        let claveM = pData.clave_product.toUpperCase();
                        let descM = pData.descripcion_product.toUpperCase();
                        let estadoBD = pData.estado_product ? pData.estado_product.toUpperCase().trim() : '';
                        if (estadoBD === 'CALIBRACION' || claveM.includes('SERVICIO') || descM.includes('SERVICIO')) esServicio = true;
                    }

                    $tbody.append(construirFila(index, item.id_detalle_cot, item.Product_id, item.precio_unitario, item.cantidad, item.precio_extendido, esServicio, item.desglosar === 'Y', item.sucursal_destino_id, item.equipo_id));
                    calculateRowEdit($(`#edit_addr${index}`));
                    rowCount++;
                });

                verificarBotonFondoEdicion();

                $('.select-prod-modal').select2({ theme: 'bootstrap-5', dropdownParent: $('#modalEditarCotizacion'), width: '100%' });

                if (isReadOnly) {
                    $('#formEditarCotizacion input, #formEditarCotizacion select, #formEditarCotizacion textarea').prop('disabled', true);
                    $('#edit_add_row').hide();
                    $('#edit_btn_add_row_bottom').hide();
                    $('.btn-eliminar-fila-unica').hide();
                    $('#formEditarCotizacion button[type="submit"]').hide();
                } else {
                    verificarBotonFondoEdicion();
                }

                $('#modalEditarCotizacion').modal('show');
            }
        });
    });

    $("#edit_add_row, #edit_btn_add_row_bottom").click(function () {
        $("#edit_tbody_productos").append(construirFila(rowCount, 0, '', '', 1, '', false, false, '', ''));
        window.productoAgregadoEnEdicion = true;

        $(`#edit_addr${rowCount} .select-prod-modal`).select2({ theme: 'bootstrap-5', dropdownParent: $('#modalEditarCotizacion'), width: '100%' });
        $(`#edit_addr${rowCount} .select-sucursal-fila-edit`).select2({ theme: 'bootstrap-5', dropdownParent: $('#modalEditarCotizacion'), width: '100%', placeholder: "Selecciona Sucursal..." });
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
            $puntosWrapper.slideUp('fast').empty();
            $inputID.hide().prop('required', false).val('');
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
                $inputID.hide().prop('required', false).val('');
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

        // let tax = parseFloat($("#edit_tax").val()) || 0;
        let tax = 16;

        let monto_iva = (sub / 100) * tax;

        let totalFinal = sub + monto_iva;

        /* $("#edit_total_amount").val((sub + monto_iva).toFixed(2));
        $("#edit_total_amount_visual").val(formatoMoneda.format(sub + monto_iva)); */
        $("#edit_total_amount").val(totalFinal.toFixed(2));
        $("#edit_total_amount_visual").val(formatoMoneda.format(totalFinal));
    }

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
                        window.location.href = 'finalizar_venta.php?id=' + $('#edit_id_cotizacion').val() + '&editado=1&from=mis_cotizaciones';
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
            let $row = $(this);
            let $selectProd = $row.find('.select-prod-modal');
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

            if ($selectProd.hasClass('select2-hidden-accessible')) $selectProd.select2('destroy');
            $selectProd.html(opcionesActualizadas).val(idProductoActual);
            $selectProd.select2({ theme: 'bootstrap-5', dropdownParent: $('#modalEditarCotizacion'), width: '100%' });
        });
    });

    let $modalContainer = $('#modalEditarCotizacion');
    let $modalScroll = $('#formEditarCotizacion');
    let $btnTopModal = $('#btnBackToTopModal');

    if ($btnTopModal.length) {
        $modalScroll.on('scroll', function () {
            if ($(this).scrollTop() > 200) $btnTopModal.css('display', 'flex');
            else $btnTopModal.css('display', 'none');
        });

        $btnTopModal.on('click', function () {
            $modalScroll[0].scrollTo({ top: 0, behavior: 'smooth' });
        });

        $modalContainer.on('hidden.bs.modal', function () {
            $btnTopModal.css('display', 'none');
        });
    }

    // >>>============================================== 
    // >>> 6. NAVEGACIÓN STATEFUL (AUTO-ABRIR MODAL)
    // >>>============================================== 
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('reopen_edit')) {
        let idToOpen = urlParams.get('reopen_edit');
        let cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);

        setTimeout(() => {
            let $btnEdit = $('.btn-editar-modal[data-id="' + idToOpen + '"]');
            if ($btnEdit.length) $btnEdit.trigger('click');
        }, 800);
    }

    // >>>============================================== 
    // >>> 7. MÓDULO LOGÍSTICO (MODAL Y GUARDADO)
    // >>>============================================== 
    $(document).on('click', '.btn-logistica-modal', function (e) {
        e.preventDefault();

        // 1. Extraemos de forma segura los datos incrustados en el botón
        let id = $(this).data('id');
        let paq = $(this).data('paqueteria');
        let guia = $(this).data('guia');
        let fecha = $(this).data('fecha');

        // 2. Limpiamos el formulario antes de abrirlo
        $('#formLogistica')[0].reset();

        // 3. Inyectamos los datos
        $('#logistica_id_cotizacion').val(id);
        if (paq) $('#logistica_paqueteria').val(paq);
        if (guia) $('#logistica_guia').val(guia);

        // ✨ UX: Si ya hay fecha registrada, la mostramos. Si no, ponemos la fecha de HOY por defecto.
        if (fecha) {
            $('#logistica_fecha').val(fecha);
        } else {
            let hoy = new Date().toISOString().split('T')[0];
            $('#logistica_fecha').val(hoy);
        }

        // ✨ CIBERSEGURIDAD B2B: Bloquear formulario si es cliente
        if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL === true) {
            // Deshabilita los inputs para evitar escritura y los pinta de gris (bg-light)
            $('#formLogistica select, #formLogistica input').prop('disabled', true).addClass('bg-light');
            // Oculta el botón azul de "Guardar y Notificar"
            $('#formLogistica button[type="submit"]').hide();
            // Cambia el texto del botón de Cancelar a "Cerrar"
            $('#formLogistica button[data-bs-dismiss="modal"]').text('Cerrar');
        } else {
            // Aseguramos que el admin sí pueda editar si venimos de un perfil B2B cruzado
            $('#formLogistica select, #formLogistica input').prop('disabled', false).removeClass('bg-light');
            $('#formLogistica button[type="submit"]').show();
            $('#formLogistica button[data-bs-dismiss="modal"]').text('Cancelar');
        }

        // 4. Mostramos el modal
        $('#modalLogistica').modal('show');
    });
    $('#formLogistica').on('submit', function (e) {
        e.preventDefault();
        let $btn = $(this).find('button[type="submit"]');
        let originalText = $btn.text();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Procesando...');

        $.ajax({
            url: 'api/api_ver_cotizaciones.php',
            type: 'POST',
            data: $(this).serialize(),
            dataType: 'json',
            success: function (res) {
                if (res.status === 'success') {
                    $('#modalLogistica').modal('hide');
                    alert(res.message);
                    cargarTablaPrincipal();
                } else {
                    alert("Error: " + res.message);
                }
            },
            error: function (xhr) {
                let errorMsg = "Error interno del servidor. Revisa la consola.";
                if (xhr.responseJSON && xhr.responseJSON.message) errorMsg = xhr.responseJSON.message;
                alert(errorMsg);
            },
            complete: function () {
                $btn.prop('disabled', false).text(originalText);
            }
        });
    });

    // >>>============================================== 
    // >>> 8. FLUJO DE AUTORIZAR / RECHAZAR (ONE-CLICK)
    // >>>============================================== 
    $(document).on('click', '.btn-cambiar-estatus', function (e) {
        e.preventDefault();
        let id_cot = $(this).data('id');
        let nuevo_estatus = $(this).data('estatus');
        let tiene_dir = parseInt($(this).data('tienedir'));
        let folio = $(this).data('folio');

        let verbo = (nuevo_estatus.includes('Autorizada')) ? 'AUTORIZAR' : 'RECHAZAR';

        if (nuevo_estatus.includes('Autorizada') && tiene_dir === 0) {
            alert("⚠️ Acción denegada: La cotización #" + folio + " no tiene direcciones registradas.\n\nPor favor, da clic en el ícono del mapa antes de autorizarla.");
            return;
        }

        if (confirm(`¿Estás seguro de que deseas ${verbo} la cotización #${folio}?`)) {
            $.ajax({
                url: 'api/api_ver_cotizaciones.php',
                type: 'POST',
                data: { action: 'cambiar_estatus', id_cotizacion: id_cot, estatus: nuevo_estatus },
                dataType: 'json',
                success: function (res) {
                    if (res.status === 'success') {
                        cargarTablaPrincipal();
                    } else {
                        alert("Error: " + res.message);
                    }
                },
                error: function () {
                    alert("Error de red al actualizar el estatus.");
                }
            });
        }
    });

    // Eliminar Cotización
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

    // ✨ EVENTO PARA EL BUSCADOR CUSTOM (Mis Cotizaciones)
    $(document).on('keyup', '#buscador_custom', function () {
        let valor = $(this).val();
        $('#tableMisCotizaciones').DataTable().search(valor).draw();
    });

    // >>>============================================== 
    // >>> 9. FLUJO OPERATIVO: MARCAR EQUIPO COMO ENTREGADO
    // >>>============================================== 
    $(document).on('click', '.btn-marcar-entregado', function(e) {
        e.preventDefault();
        let id_cot = $(this).data('id');
        let folio = $(this).data('folio');

        if (confirm(`Al marcar la cotización #${folio} como Entregada, se habilitará la opción para que el cliente suba su Orden de Compra y se le notificará por correo.\n\n¿Deseas proceder?`)) {
            let $btn = $(this);
            $btn.css('pointer-events', 'none').css('opacity', '0.5');

            $.ajax({
                url: 'api/api_ver_cotizaciones.php',
                type: 'POST',
                data: { action: 'marcar_entregado', id_cotizacion: id_cot },
                dataType: 'json',
                success: function(res) {
                    if (res.status === 'success') {
                        alert(res.message);
                        cargarTablaPrincipal(); // El botón cambiará automáticamente al reloj amarillo
                    } else {
                        alert("Error: " + res.message);
                        $btn.css('pointer-events', '').css('opacity', '1');
                    }
                },
                error: function() { 
                    alert("Error de red. Por favor intenta de nuevo."); 
                    $btn.css('pointer-events', '').css('opacity', '1');
                }
            });
        }
    });

    // >>>============================================== 
    // >>> MODULO: SUBIR / EDITAR ORDEN DE COMPRA (AJAX)
    // >>>============================================== 
    
    // Abrir Modal para NUEVA carga
    $(document).off('click', '.btn-subir-oc').on('click', '.btn-subir-oc', function (e) {
        e.preventDefault();
        $('#formSubirOC')[0].reset();
        $('#oc_id_cotizacion').val($(this).data('id'));
        $('#archivo_oc').prop('required', true); // Obligatorio el PDF
        $('#modalSubirOC .alert-warning').html('Tu equipo ha sido entregado. Por favor, sube tu Orden de Compra para iniciar la facturación.');
        $('#modalSubirOC').modal('show');
    });

    // Abrir Modal para EDITAR carga
    $(document).off('click', '.btn-editar-oc').on('click', '.btn-editar-oc', function (e) {
        e.preventDefault();
        $('#formSubirOC')[0].reset();
        $('#oc_id_cotizacion').val($(this).data('id'));
        $('#oc_recepcion').val($(this).data('recepcion'));
        $('#archivo_oc').prop('required', false); // Opcional (por si solo quiere cambiar el num recepción)
        
        let rutaPdf = $(this).data('ruta');
        let enlaceActual = rutaPdf ? `<div class="mt-2 text-center"><a href="${rutaPdf}" target="_blank" class="fw-bold text-success text-decoration-underline"><i class="feather-download-cloud me-1"></i>Ver PDF Actual</a></div>` : '';

        $('#modalSubirOC .alert-warning').html(`<b>Modo Edición:</b> Corrige el Número de Recepción o sube un nuevo PDF para reemplazar el actual.${enlaceActual}`);
        $('#modalSubirOC').modal('show');
    });

    // ✨ CIBERSEGURIDAD FRONTEND: .off('submit') DESTRUYE PETICIONES DUPLICADAS EN MEMORIA
    $(document).off('submit', '#formSubirOC').on('submit', '#formSubirOC', function (e) {
        e.preventDefault();
        let $btn = $(this).find('button[type="submit"]');
        let originalText = $btn.text();

        let fileInput = $('#archivo_oc')[0].files[0];
        
        if (fileInput) {
            if (fileInput.size > 2 * 1024 * 1024) {
                alert("El archivo es demasiado grande. El máximo permitido es 2MB.");
                return;
            }
            if (fileInput.type !== "application/pdf") {
                alert("Solo se permiten archivos en formato PDF.");
                return;
            }
        } else if ($('#archivo_oc').prop('required')) {
            alert("Por favor selecciona un archivo PDF.");
            return;
        }

        let formData = new FormData(this);
        
        // 🛡️ Bloqueo estricto del botón para que el usuario no pueda hacer "Doble Clic" rápido
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Guardando...');

        $.ajax({
            url: 'api/api_ver_cotizaciones.php',
            type: 'POST',
            data: formData,
            contentType: false, 
            processData: false, 
            dataType: 'json',
            success: function (res) {
                if (res.status === 'success') {
                    $('#modalSubirOC').modal('hide');
                    alert(res.message);
                    cargarTablaPrincipal();
                } else {
                    alert("Error: " + res.message);
                }
            },
            error: function (xhr) {
                let errorMsg = "Error interno del servidor.";
                if (xhr.responseJSON && xhr.responseJSON.message) errorMsg = xhr.responseJSON.message;
                alert(errorMsg);
            },
            complete: function () {
                $btn.prop('disabled', false).text(originalText);
            }
        });
    });
    // Acción: Primera vez que sube la OC
    /* $(document).on('click', '.btn-subir-oc', function (e) {
        e.preventDefault();
        $('#formSubirOC')[0].reset();
        $('#oc_id_cotizacion').val($(this).data('id'));
        $('#archivo_oc').prop('required', true); // Obligatorio
        $('#modalSubirOC .alert-warning').html('Tu equipo ha sido entregado. Por favor, sube tu Orden de Compra para iniciar la facturación.');
        $('#modalSubirOC').modal('show');
    }); */

    // Acción: Editar / Ver OC existente (Botón Verde)
    /* $(document).on('click', '.btn-editar-oc', function (e) {
        e.preventDefault();
        $('#formSubirOC')[0].reset();
        $('#oc_id_cotizacion').val($(this).data('id'));
        $('#oc_recepcion').val($(this).data('recepcion'));
        $('#archivo_oc').prop('required', false); // Opcional por si solo quiere cambiar el num

        let rutaPdf = $(this).data('ruta');
        let enlaceActual = rutaPdf ? `<div class="mt-2 text-center"><a href="${rutaPdf}" target="_blank" class="fw-bold text-success text-decoration-underline"><i class="feather-download-cloud me-1"></i>Ver PDF Actual</a></div>` : '';

        $('#modalSubirOC .alert-warning').html(`<b>Modo Edición:</b> Corrige el Número de Recepción o sube un nuevo PDF para reemplazar el actual.${enlaceActual}`);
        $('#modalSubirOC').modal('show');
    }); */

    /* $('#formSubirOC').on('submit', function (e) {
        e.preventDefault();
        let $btn = $(this).find('button[type="submit"]');
        let originalText = $btn.text();

        let fileInput = $('#archivo_oc')[0].files[0];
        
        if (fileInput) {
            if (fileInput.size > 2 * 1024 * 1024) {
                alert("El archivo es demasiado grande. El máximo permitido es 2MB.");
                return;
            }
            if (fileInput.type !== "application/pdf") {
                alert("Solo se permiten archivos en formato PDF.");
                return;
            }
        } else if ($('#archivo_oc').prop('required')) {
            alert("Por favor selecciona un archivo PDF.");
            return;
        }

        let formData = new FormData(this);
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Guardando...');

        $.ajax({
            url: 'api/api_ver_cotizaciones.php',
            type: 'POST',
            data: formData,
            contentType: false, 
            processData: false, 
            dataType: 'json',
            success: function (res) {
                if (res.status === 'success') {
                    $('#modalSubirOC').modal('hide');
                    alert(res.message);
                    cargarTablaPrincipal(); 
                } else {
                    alert("Error: " + res.message);
                }
            },
            error: function (xhr) {
                let errorMsg = "Error interno del servidor.";
                if (xhr.responseJSON && xhr.responseJSON.message) errorMsg = xhr.responseJSON.message;
                alert(errorMsg);
            },
            complete: function () {
                $btn.prop('disabled', false).text(originalText);
            }
        });
    }); */

    // >>>============================================== 
    // >>> MODULO: CLIENTE SUBE ORDEN DE COMPRA (AJAX)
    // >>>============================================== 
    /* $(document).on('click', '.btn-subir-oc', function (e) {
        e.preventDefault();
        $('#formSubirOC')[0].reset();
        $('#oc_id_cotizacion').val($(this).data('id'));
        $('#modalSubirOC').modal('show');
    }); */

    
    /* // Abrir Modal para NUEVA carga
    $(document).on('click', '.btn-subir-oc', function (e) {
        e.preventDefault();
        $('#formSubirOC')[0].reset();
        $('#oc_id_cotizacion').val($(this).data('id'));
        $('#archivo_oc').prop('required', true); // Obligatorio el PDF
        $('#modalSubirOC .alert-warning').html('Tu equipo ha sido entregado. Por favor, sube tu Orden de Compra para iniciar la facturación.');
        $('#modalSubirOC').modal('show');
    }); */

    // Abrir Modal para EDITAR carga
    /* $(document).on('click', '.btn-editar-oc', function (e) {
        e.preventDefault();
        $('#formSubirOC')[0].reset();
        $('#oc_id_cotizacion').val($(this).data('id'));
        $('#oc_recepcion').val($(this).data('recepcion'));
        $('#archivo_oc').prop('required', false); // Opcional (por si solo quiere cambiar el num recepción)
        $('#modalSubirOC .alert-warning').html('<b>Modo Edición:</b> Corrige el Número de Recepción o sube un nuevo PDF para reemplazar el actual.');
        $('#modalSubirOC').modal('show');
    }); */

    /* $('#formSubirOC').on('submit', function (e) {
        e.preventDefault();
        let $btn = $(this).find('button[type="submit"]');
        let originalText = $btn.text();

        let fileInput = $('#archivo_oc')[0].files[0];
        
        if (fileInput) {
            if (fileInput.size > 2 * 1024 * 1024) {
                alert("El archivo es demasiado grande. El máximo permitido es 2MB.");
                return;
            }
            if (fileInput.type !== "application/pdf") {
                alert("Solo se permiten archivos en formato PDF.");
                return;
            }
        } else if ($('#archivo_oc').prop('required')) {
            alert("Por favor selecciona un archivo PDF.");
            return;
        }

        let formData = new FormData(this);
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Guardando...');

        $.ajax({
            url: 'api/api_ver_cotizaciones.php',
            type: 'POST',
            data: formData,
            contentType: false, 
            processData: false, 
            dataType: 'json',
            success: function (res) {
                if (res.status === 'success') {
                    $('#modalSubirOC').modal('hide');
                    alert(res.message);
                    cargarTablaPrincipal();
                } else {
                    alert("Error: " + res.message);
                }
            },
            error: function (xhr) {
                let errorMsg = "Error interno del servidor.";
                if (xhr.responseJSON && xhr.responseJSON.message) errorMsg = xhr.responseJSON.message;
                alert(errorMsg);
            },
            complete: function () {
                $btn.prop('disabled', false).text(originalText);
            }
        });
    }); */

    // >>>============================================== 
    // >>> ✨ MODULO UNIVERSAL: VER ORDEN DE COMPRA
    // >>>============================================== 
    /* $(document).on('click', '.btn-ver-oc', function(e) {
        e.preventDefault();
        
        let recepcion = $(this).data('recepcion');
        let ruta_pdf = $(this).data('ruta');
        
        // 🛡️ Práctica Senior: Si la vista PHP no tiene el modal, lo inyectamos dinámicamente
        if ($('#modalVerOC').length === 0) {
            let modalHTML = `
            <div class="modal fade" id="modalVerOC" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content border-0 shadow-lg">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title fw-bold text-white"><i class="feather-file-text me-2"></i>Documentos del Cliente</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <div class="mb-4">
                                <label class="form-label text-dark fw-bold">Número de Recepción</label>
                                <input type="text" class="form-control border-success text-center fw-bold fs-16 bg-light text-dark" id="ver_oc_recepcion" readonly>
                            </div>
                            <div class="d-grid gap-2">
                                <a href="#" id="btn_descargar_oc" target="_blank" class="btn btn-success fw-bold text-uppercase">
                                    <i class="feather-download-cloud me-2"></i>Ver PDF
                                </a>
                                <button type="button" class="btn btn-light text-muted fw-bold" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
            $('body').append(modalHTML);
        }

        // Llenamos los datos y abrimos la ventana
        $('#ver_oc_recepcion').val(recepcion);
        $('#btn_descargar_oc').attr('href', ruta_pdf);
        $('#modalVerOC').modal('show');
    }); */


    // >>>============================================== 
    // >>> ✨ SISTEMA DE PESTAÑAS Y RETENCIÓN DE ESTADO (NAV-TABS)
    // >>>============================================== 
    
    // 1. Variable Global para recordar en qué pestaña estaba el usuario
    window.pestanaActivaCotizaciones = 'TODOS';

    // 2. Evento: Clic en las Pestañas (Nuevos, Usados, Calibración)
    $(document).on('click', '.tab-filtro-cat', function (e) {
        e.preventDefault();
        
        // Quitar la clase active de todas las pestañas y ponérsela a la clickeada
        $('.tab-filtro-cat').removeClass('active').attr('aria-selected', 'false');
        $(this).addClass('active').attr('aria-selected', 'true');

        // Leer la categoría que le pusimos en el HTML (data-categoria)
        let categoria = $(this).data('categoria');
        
        // Guardar el estado para cuando recarguen o editen la tabla
        window.pestanaActivaCotizaciones = categoria;

        // Mandar la orden a DataTables
        aplicarFiltroCategoria(categoria);
    });

    // 3. Función auxiliar para disparar el filtro en DataTables
    function aplicarFiltroCategoria(categoria) {
        let $tablaDT = $('#tableMisCotizaciones').DataTable();
        
        if (categoria === 'TODOS') {
            // Limpia el filtro de la columna 4 (La oculta que creamos)
            $tablaDT.column(4).search('').draw();
        } else {
            // Busca la palabra exacta ('NUEVO', 'USADO', 'CALIBRACION')
            let regex = '^\\s*' + categoria + '\\s*$';
            $tablaDT.column(4).search(regex, true, false).draw();
        }
    }

    // >>>============================================== 
    // >>> ✨ MOTOR DE EXPORTACIÓN INTELIGENTE
    // >>>============================================== 
    $(document).on('click', '.btn-exportar-filtrado', function(e) {
        e.preventDefault();
        
        let tipo = $(this).data('tipo');
        let scope = $(this).data('scope') || 'todas'; // ✨ Capturamos el alcance (Mis cotizaciones vs Todas)
        let estatus = $('#filtro_estatus_tabla').val();
        let categoria = window.pestanaActivaCotizaciones === 'TODOS' ? '' : window.pestanaActivaCotizaciones;
        let busqueda = $('#tableMisCotizaciones').DataTable().search();

        // Armamos la URL inyectando los filtros y el Scope
        let url = `api/api_exportar_excel.php?tipo=${tipo}&scope=${scope}&estatus=${encodeURIComponent(estatus)}&categoria=${encodeURIComponent(categoria)}&search=${encodeURIComponent(busqueda)}`;
        
        // Abrimos la descarga en una nueva pestaña
        window.open(url, '_blank');
    });
});