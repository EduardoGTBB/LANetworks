<?php include('views/include/head.php'); ?>

<body>
    <?php include('views/include/sidebar.php'); ?>
    <?php include('views/include/header.php'); ?>
    <!--! [Start] Main Content !-->
    <main class="nxl-container">
        <div class="nxl-content">
            <!-- [ page-header ] start -->
            <?php
            $page_title = "Mis cotizaciones";
            $breadcrumb_items = [
                "Cotizaciones",
                "Mis cotizaciones"
            ];
            include('views/include/page_header.php');
            ?>
            <!-- [ page-header ] end -->

            <!-- [ Main Content ] start -->
            <div class="main-content">
                
                <!--  BANNER DINÁMICO DE ORDEN DE COMPRA (Oculto por defecto) -->
                <div id="banner_oc_pendientes" class="alert alert-dismissible fade show mb-4 shadow-sm" role="alert" style="display: none; border: none; border-left: 5px solid #dc3545; background-color: #fce8e6;">
                    <div class="d-flex align-items-center">
                        <div class="avatar-text avatar-md bg-transparent text-danger me-3" style="font-size: 24px;">
                            <i class="feather-alert-triangle"></i>
                        </div>
                        <div>
                            <h6 class="alert-heading mb-1 fw-bold text-danger" style="font-size: 15px;">¡Acción Requerida!</h6>
                            <p class="mb-0 text-dark" style="font-size: 13px;">
                                Detectamos <strong id="contador_oc_pendientes" class="fs-14 text-danger">0</strong> equipo(s) entregado(s) que requieren tu <strong>Orden de Compra</strong>. 
                                Por favor, localiza el ícono de la nube roja <i class="feather-upload-cloud text-danger fw-bold"></i> en la tabla inferior para subir los documentos y proceder con la facturación.
                            </p>
                        </div>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" style="top: 50%; transform: translateY(-50%);"></button>
                </div>

                <div class="row">
                    <div class="col-lg-12">
                        <div class="card stretch stretch-full">

                            <div class="card-header">

                                <div class="d-flex align-items-center gap-3">
                                    <h5 class="card-title mb-0">Lista de cotizaciones</h5>
                                </div>

                                <div class="card-header-action pe-md-3">
                                    <div class="d-flex align-items-center justify-content-end gap-3 flex-wrap">
                                        
                                        <!-- 1. ✨ CIBERSEGURIDAD: EXPORTAR (Oculto para Clientes B2B) -->
                                        <?php if (!isset($_SESSION['id_usuario_cliente'])): ?>
                                        <div class="dropdown">
                                            <!-- UX: Reducido a 34px y fuente más pequeña (fs-12) -->
                                            <button class="btn fw-bold d-flex align-items-center shadow-sm dropdown-toggle text-white px-3" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="height: 34px; font-size: 12px; border-radius: 6px; background-color: #2b3d5b; border-color: #2b3d5b;">
                                                <i class="feather-download me-2"></i> EXPORTAR
                                            </button>
                                            <ul class="dropdown-menu shadow-lg border-0">
                                                <li><h6 class="dropdown-header text-uppercase text-muted" style="font-size: 10px;">Formatos Excel</h6></li>
                                                <li>
                                                    <!-- ✨ UX/Seguridad: Agregamos data-scope -->
                                                    <a class="dropdown-item fw-bold text-dark py-2 btn-exportar-filtrado" href="#" data-tipo="comercial" data-scope="mis_cotizaciones">
                                                        <i class="feather-dollar-sign text-success me-2"></i> Reporte Comercial
                                                    </a>
                                                </li>
                                                <li>
                                                    <a class="dropdown-item fw-bold text-dark py-2 btn-exportar-filtrado" href="#" data-tipo="laboratorio" data-scope="mis_cotizaciones">
                                                        <i class="feather-thermometer text-info me-2"></i> Reporte Laboratorio
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                        <?php endif; ?>

                                        <!-- 2. ✨ FILTRO DE ESTATUS -->
                                        <div class="d-flex align-items-center gap-2">
                                            <i class="feather-filter text-primary" style="font-size: 1rem;"></i>
                                            <!-- UX: Reducido a 34px y fuente a 12px -->
                                            <select id="filtro_estatus_tabla" class="form-select border-primary fw-bold text-dark shadow-sm px-3" style="height: 34px; padding-top: 0; padding-bottom: 0; line-height: 32px; font-size: 12px; border-radius: 6px; border-color: #2b3d5b; cursor: pointer; min-width: 200px;">
                                                <option value="">Mostrar todos los estatus</option>
                                                <option value="Guardado para aprobación">Guardado para aprobación</option>
                                                <option value="Autorizada">Autorizadas (Aprobadas)</option>
                                                <option value="No autorizada">No autorizadas (Rechazadas)</option>
                                            </select>
                                        </div>

                                        <!-- 3. ✨ TOTAL ACUMULADO (El JS lo inyecta aquí) -->
                                        <div id="contenedor-badge-total"></div>

                                    </div>
                                </div>

                            </div>

                            <!-- ✨ TEMPLATE PESTAÑAS (Estilo Nav-Pills Corporativo Full-Width) -->
                            <template id="template-tabs-cotizaciones">
                                <div class="px-4 pt-3 pb-3 w-100" style="display: block; clear: both;">
                                    <ul class="nav nav-pills nav-justified w-100 gap-3 mb-0" role="tablist">
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link active fw-bold py-2 tab-filtro-cat custom-lan-tab shadow-sm w-100" data-categoria="TODOS" type="button" role="tab" aria-selected="true">
                                                <i class="feather-layers me-2"></i>Todas
                                            </button>
                                        </li>
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link fw-bold py-2 tab-filtro-cat custom-lan-tab shadow-sm w-100" data-categoria="NUEVO" type="button" role="tab" aria-selected="false">
                                                <i class="feather-star me-2"></i>Nuevos
                                            </button>
                                        </li>
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link fw-bold py-2 tab-filtro-cat custom-lan-tab shadow-sm w-100" data-categoria="USADO" type="button" role="tab" aria-selected="false">
                                                <i class="feather-tool me-2"></i>Usados
                                            </button>
                                        </li>
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link fw-bold py-2 tab-filtro-cat custom-lan-tab shadow-sm w-100" data-categoria="CALIBRACION" type="button" role="tab" aria-selected="false">
                                                <i class="feather-thermometer me-2"></i>Calibraciones
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </template>
                            
                            <div class="card-body custom-card-action p-0">
                                <!-- ✨ UX: Tabla con 5 columnas y layout fluido -->
                                <table class="table table-hover mb-0 w-100" id="tableMisCotizaciones" style="table-layout: auto;">
                                    <thead>
                                        <tr>
                                            <th class="text-center" width="15%">Cotización</th>
                                            <th class="text-center" width="40%">Cliente / Detalles</th>
                                            <th class="text-center" width="15%">Importe</th>
                                            <th class="text-center" width="15%">Estatus</th>
                                            <th class="d-none">Categoría</th>
                                            <th class="text-center" width="15%" class="text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tabla-cotizaciones">
                                        <tr>
                                            <td colspan="6">
                                                <div class="hstack gap-3 justify-content-center">
                                                    <div class="spinner-border text-primary mt-3" role="status">
                                                        <span class="visually-hidden">Cargando...</span>
                                                    </div>
                                                    <p class="mt-2">Cargando cotizaciones...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- [ Main Content ] end -->
        </div>

        <?php include('views/include/footer.php'); ?>
    </main>

    <!-- Modal Editar Cotización -->
    <div class="modal fade-scale" id="modalEditarCotizacion" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
            <div class="modal-content bg-white">
                <div class="modal-header">
                    <h5 class="modal-title fw-bold text-primary">Editar cotización <span id="modal_folio_badge" class="badge bg-soft-primary text-primary ms-2"></span></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <form id="formEditarCotizacion" class="modal-body custom-card-action">
                    <input type="hidden" name="action" value="editar">
                    <input type="hidden" name="id_cotizacion" id="edit_id_cotizacion" value="">
                    <input type="hidden" name="is_multisucursal" id="edit_is_multisucursal" value="0">
                    <!-- ✨ UX: Mantenemos el estatus oculto para proteger la edición -->
                    <input type="hidden" name="estatus" id="edit_estatus" value="">

                    <div class="row mb-4">
                        <div class="col-lg-6 mb-4 mb-lg-0">
                            <div class="card border-primary h-100 shadow-sm">
                                <div class="card-header bg-primary text-white py-3">
                                    <h6 class="mb-0 text-white fw-bold"><i class="feather-user me-2"></i>Datos Comerciales</h6>
                                </div>
                                <div class="card-body">
                                    <div class="mb-4">
                                        <label class="form-label text-dark fw-bold"><i class="feather-briefcase me-1 text-primary"></i>División de LAN</label>
                                        <select class="form-control border-primary bg-light" id="division_visual" disabled>
                                            <option value="LA NETWORKS & TECHNOLOGIES" selected>LA NETWORKS & SMART TECHNOLOGIES SA DE CV</option>
                                        </select>
                                        <input type="hidden" name="division" id="division" value="LA NETWORKS & TECHNOLOGIES">
                                    </div>
                                    <div class="mb-4">
                                        <label class="form-label text-dark fw-bold"><i class="feather-users me-1 text-primary"></i>Cliente <span class="text-danger">*</span></label>
                                        <select class="form-control border-primary" id="edit_select_empresa" name="Empresa_id" data-select2-selector="status" required>
                                            <option value="">Cargando clientes...</option>
                                        </select>
                                    </div>
                                    <div class="mb-4">
                                        <label class="form-label text-dark fw-bold"><i class="feather-user-check me-1 text-primary"></i>Solicitante <span class="text-danger">*</span></label>
                                        <select class="form-control border-primary" id="edit_select_solicitante" name="Usuario_id" data-select2-selector="status" required>
                                            <option value="">Selecciona un cliente primero...</option>
                                        </select>
                                    </div>
                                    <div class="mb-2" id="wrapper_info_plaza_edit" style="display: none;">
                                        <label class="form-label text-dark fw-bold"><i class="feather-map me-1 text-primary"></i>Plaza Asignada</label>
                                        <select class="form-control border-primary bg-light shadow-sm" id="edit_info_plaza" name="Plaza_id" disabled>
                                            <option value="">Esperando sucursal...</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="col-lg-6">
                            <div class="card border-success h-100 shadow-sm">
                                <div class="card-header bg-success text-white py-3">
                                    <h6 class="mb-0 text-white fw-bold"><i class="feather-settings me-2"></i>Parámetros de Cotización</h6>
                                </div>
                                <div class="card-body">
                                    <div class="mb-4">
                                        <label class="form-label text-dark fw-bold"><i class="feather-filter me-1 text-success"></i>¿Qué tipo de producto se cotizará?</label>
                                        <select class="form-control border-success max-select" name="categoria" id="edit_filtro_tipo_producto">
                                            <option value="TODOS" selected>Mostrar Todo el Catálogo</option>
                                            <option value="NUEVO">✨ Solo Equipos Nuevos</option>
                                            <option value="USADO">🔧 Solo Equipos Usados</option>
                                            <option value="CALIBRACION">🔬 Solo Servicios de Calibración</option>
                                        </select>
                                    </div>

                                    <div class="mb-4">
                                        <label class="form-label text-dark fw-bold"><i class="feather-tag me-1 text-success"></i>Selecciona el precio que se utilizará</label>
                                        <select class="form-control border-success" id="tipo_precio" name="tipo_precio" data-select2-selector="status" required>
                                            <option value="">Selecciona el tipo de precio...</option>
                                            <option value="Farmacia">Farmacia</option>
                                            <option value="Público">Público</option>
                                        </select>
                                    </div>

                                    <div class="mb-2" id="wrapper_selector_sucursal_edit">
                                        <label class="form-label text-dark fw-bold"><i class="feather-map-pin me-1 text-success"></i>Sucursal para certificado<span class="text-danger">*</span></label>
                                        <select class="form-control border-success" id="edit_select_sucursal" name="Sucursal_id" data-select2-selector="status" required>
                                            <option value="">Esperando Sucursal...</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr class="mt-0 mb-3">

                    <div class="row mb-4">
                        <div class="col-lg-12">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <h5 class="fw-bold mb-0">Productos cotizados:</h5>
                                    <span class="fs-12 text-muted">Edita cantidades, precios o agrega nuevos</span>
                                </div>
                                <div class="gap-2">
                                    <button type="button" id="edit_add_row" class="btn btn-sm btn-primary">Agregar producto</button>
                                </div>
                            </div>

                            <div class="table-responsive">
                                <table class="table table-bordered overflow-hidden" id="tab_logic_edit">
                                    <thead class="bg-success">
                                        <tr class="single-item">
                                            <th class="text-center text-white wd-80">Ítem</th>
                                            <th class="text-center text-white wd-150">Cantidad</th>
                                            <th class="text-center text-white wd-400">Producto</th>
                                            <th class="text-center text-white wd-250 col-edit-multisucursal" style="display:none">Sucursal Destino</th>
                                            <th class="text-center text-white wd-250">Desglose de Calibración</th>
                                            <th class="text-center text-white wd-150">Precio U.</th>
                                            <th class="text-center text-white wd-200">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody id="edit_tbody_productos">
                                    </tbody>
                                </table>
                            </div>
                            <button type="button" id="edit_btn_add_row_bottom" class="btn btn-light text-primary w-100 fw-bold mt-3 mb-4 shadow-sm" style="display: none; border: 2px dashed #0d6efd !important; border-radius: 8px;">
                                <i class="feather-plus-circle me-2 fs-14"></i>AÑADIR NUEVO PRODUCTO AQUÍ
                            </button>
                        </div>
                    </div>

                    <div class="row mb-4">
                        <div class="col-lg-8 mt-2 text-start">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Notas / Observaciones adicionales:</label>
                                <textarea name="comentarios" id="edit_comentarios" class="form-control" rows="4"></textarea>
                                <small class="text-muted">Estas notas aparecerán en el PDF de la cotización.</small>
                            </div>
                        </div>
                        <div class="col-lg-4 mt-2">
                            <table class="table table-bordered">
                                <tbody>
                                    <tr class="single-item">
                                        <th class="fs-10 text-dark text-uppercase">Sub Total</th>
                                        <td class="w-50">
                                            <input type="text" class="form-control border-0 bg-transparent p-0 text-end" id="edit_sub_total_visual" readonly placeholder="$0.00">
                                            <input type="hidden" name="sub_total" id="edit_sub_total">
                                        </td>
                                    </tr>
                                    <tr class="single-item">
                                        <th class="fs-10 text-dark text-uppercase">IVA</th>
                                        <td class="w-50">
                                            <div class="input-group mb-2 mb-sm-0">
                                                <!-- ✨ UX/SEGURIDAD: Bloqueamos la edición visualmente y forzamos el bg-light (gris) -->
                                                <input type="number" name="porcentaje_iva" id="edit_tax" class="form-control border-0 bg-light p-0 text-center" value="16" readonly style="pointer-events: none;">
                                                <div class="input-group-addon border-0 bg-light text-muted fw-bold">%</div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr class="single-item">
                                        <th class="fs-10 text-dark text-uppercase bg-gray-100">Total</th>
                                        <td class="bg-gray-100 w-50">
                                            <input type="text" id="edit_total_amount_visual" class="form-control border-0 bg-transparent p-0 fw-700 text-dark text-end fs-14" readonly placeholder="$0.00">
                                            <input type="hidden" name="total_amount" id="edit_total_amount">
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="row mt-3">
                        <div class="col-lg-12 d-flex justify-content-end gap-2">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Actualizar Cambios</button>
                        </div>
                    </div>
                </form>
                <button type="button" id="btnBackToTopModal" class="btn btn-primary" title="Volver al inicio">
                    <i class="feather-arrow-up" style="font-size: 1.2rem; font-weight: bold;"></i>
                </button>
            </div>
        </div>
    </div>

    <!-- Modal Logística y Rastreo -->
    <div class="modal fade" id="modalLogistica" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title fw-bold text-white"><i class="feather-truck me-2"></i>Datos de Envío</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="formLogistica" class="modal-body p-4">
                    <input type="hidden" name="action" value="guardar_logistica">
                    <input type="hidden" name="id_cotizacion_logistica" id="logistica_id_cotizacion" value="">

                    <div class="mb-3">
                        <label class="form-label text-dark fw-bold">Empresa de Paquetería <span class="text-danger">*</span></label>
                        <select class="form-select bg-light text-dark fw-bold border-primary" name="paqueteria" id="logistica_paqueteria" required>
                            <option value="">Selecciona paquetería...</option>
                            <option value="DHL">DHL</option>
                            <option value="FedEx">FedEx</option>
                            <option value="Estafeta">Estafeta</option>
                            <option value="UPS">UPS</option>
                            <option value="Redpack">Redpack</option>
                            <option value="Paquetexpress">Paquetexpress</option>
                            <option value="Entrega Local LAN">Entrega Local (Vehículo LAN)</option>
                            <option value="Otra">Otra...</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label text-dark fw-bold">Fecha de Envío <span class="text-danger">*</span></label>
                        <input type="date" class="form-control border-primary fw-bold" name="fecha_envio" id="logistica_fecha" required>
                    </div>

                    <div class="mb-4">
                        <label class="form-label text-dark fw-bold">Número de Guía / Rastreo <span class="text-danger">*</span></label>
                        <input type="text" class="form-control border-primary text-uppercase fw-bold" name="numero_guia" id="logistica_guia" placeholder="Ej. 773456789012" required>
                    </div>

                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-primary fw-bold text-uppercase">Guardar y Notificar</button>
                        <button type="button" class="btn btn-light text-muted fw-bold" data-bs-dismiss="modal">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Modal Subir Orden de Compra (Exclusivo Cliente B2B) -->
    <div class="modal fade" id="modalSubirOC" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title fw-bold text-white"><i class="feather-upload-cloud me-2"></i>Cargar Documentos</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <!-- 🛡️ enctype multipart/form-data es obligatorio para subir archivos -->
                <form id="formSubirOC" class="modal-body p-4" enctype="multipart/form-data">
                    <input type="hidden" name="action" value="subir_oc">
                    <input type="hidden" name="id_cotizacion_oc" id="oc_id_cotizacion" value="">

                    <div class="alert alert-warning text-dark fs-12 fw-bold p-3 mb-4" role="alert">
                        Tu equipo ha sido entregado. Por favor, sube tu Orden de Compra para iniciar la facturación.
                    </div>

                    <div class="mb-3">
                        <label class="form-label text-dark fw-bold">Número de Recepción <span class="text-danger">*</span></label>
                        <input type="text" class="form-control border-danger text-uppercase fw-bold" name="numero_recepcion" id="oc_recepcion" placeholder="Ej. 1234567890" maxlength="10" minlength="10" required>
                        <small class="text-muted fs-11">Debe contener exactamente 10 caracteres.</small>
                    </div>

                    <div class="mb-4">
                        <label class="form-label text-dark fw-bold">Orden de Compra (PDF) <span class="text-danger">*</span></label>
                        <input type="file" class="form-control border-danger" name="archivo_oc" id="archivo_oc" accept="application/pdf" required>
                        <small class="text-muted fs-11">Tamaño máximo: 2MB (Máximo 2 hojas).</small>
                    </div>

                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-danger fw-bold text-uppercase">Guardar y Enviar</button>
                        <button type="button" class="btn btn-light text-muted fw-bold" data-bs-dismiss="modal">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="assets/vendors/js/vendors.min.js"></script>
    <script src="assets/vendors/js/apexcharts.min.js"></script>
    <script src="assets/vendors/js/dataTables.min.js"></script>
    <script src="assets/vendors/js/dataTables.bs5.min.js"></script>
    <script src="assets/vendors/js/select2.min.js"></script>
    <script src="assets/vendors/js/select2-active.min.js"></script>
    <script src="assets/vendors/js/jquery.time-to.min.js "></script>
    <script src="assets/js/common-init.min.js"></script>
    <script src="assets/js/widgets-tables-init.min.js"></script>

    <script>
        const ES_CLIENTE_PORTAL = <?php echo isset($_SESSION['id_usuario_cliente']) ? 'true' : 'false'; ?>;
        const USER_PERFIL = "<?php echo $_SESSION['perfil'] ?? 'cliente'; ?>";
    </script>
    <script src="js/ver_cotizaciones.js"></script>
</body>
</html>
