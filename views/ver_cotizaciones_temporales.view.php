<?php include('views/include/head.php'); ?>

<body>
    <?php include('views/include/sidebar.php'); ?>
    <?php include('views/include/header.php'); ?>
    
    <main class="nxl-container">
        <div class="nxl-content">
            
            <?php
            $page_title = "Cotizaciones Temporales";
            $breadcrumb_items = [
                "Cotizaciones",
                "Cotizaciones Temporales"
            ];
            include('views/include/page_header.php');
            ?>

            <div class="main-content">
                <div class="row">
                    <div class="col-lg-12">
                        <div class="card stretch stretch-full border-warning">
                            
                            <!-- Cabecera y Buscador -->
                            <div class="card-header p-0 border-bottom-0 w-100 d-block">
                                <div class="d-flex justify-content-between align-items-center w-100 px-4 py-3 bg-warning bg-opacity-10">
                                    <h5 class="card-title mb-0 text-warning fw-bolder"><i class="feather-clock me-2"></i>Cotizaciones Temporales (Sin Destino)</h5>
                                    <div id="contenedor-buscador-dt"></div>
                                </div>

                                <!-- Filtros (Sin Botón Exportar ya que son temporales) -->
                                <div class="px-4 pb-3 pt-3 border-bottom bg-light-subtle">
                                    <div class="d-flex flex-row align-items-center justify-content-end gap-3 flex-wrap w-100">
                                        
                                        <!-- FILTRO DE FECHAS AVANZADO -->
                                        <div class="dropdown">
                                            <button class="btn btn-light bg-white border-warning fw-bold text-dark shadow-sm d-flex align-items-center gap-2 px-3" type="button" id="btnFiltroPeriodo" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false" style="height: 34px; font-size: 12px; border-radius: 6px;">
                                                <i class="feather-calendar text-warning"></i> 
                                                <span id="texto_periodo">Periodo: Todos</span>
                                                <i class="feather-chevron-down ms-1 text-muted"></i>
                                            </button>
                                            
                                            <div class="dropdown-menu shadow-lg border-0 p-4" style="min-width: 440px; border-radius: 12px; z-index: 1060; right: auto;">
                                                <div class="d-flex justify-content-between align-items-center mb-4">
                                                    <h6 class="text-dark fw-bolder mb-0" style="font-size: 15px;">Filtrar por:</h6>
                                                    <button type="button" class="btn btn-sm btn-light text-warning fw-bold border px-2" id="btn_limpiar_periodo" style="font-size: 11px; background-color: #f8f9fa; transition: none !important; transform: none !important; box-shadow: none !important;">
                                                        <i class="feather-refresh-cw me-1"></i>LIMPIAR
                                                    </button>
                                                </div>
                                                
                                                <div class="form-check mb-4 d-flex align-items-center ps-4">
                                                    <input class="form-check-input mt-0 me-3 border-warning" type="radio" name="tipo_filtro_fecha" id="radio_mes" value="mes" checked style="cursor:pointer; width: 18px; height: 18px; margin-left: -1.5rem;">
                                                    <label class="form-check-label text-dark fw-bold mb-0 flex-grow-1 fs-13" style="cursor:pointer;" for="radio_mes">Mes específico</label>
                                                    <input type="month" class="form-control form-control-sm fw-bold shadow-sm" id="input_mes_filtro" style="width: 160px; cursor:pointer; color: #495057; border: 1px solid #ced4da; height: 38px;">
                                                </div>
                                                
                                                <div class="form-check mb-3 d-flex align-items-center ps-4">
                                                    <input class="form-check-input mt-0 me-3 border-warning" type="radio" name="tipo_filtro_fecha" id="radio_rango" value="rango" style="cursor:pointer; width: 18px; height: 18px; margin-left: -1.5rem;">
                                                    <label class="form-check-label text-dark fw-bold mb-0 fs-13" style="cursor:pointer;" for="radio_rango">Rango de fechas</label>
                                                </div>
                                                
                                                <div class="d-flex align-items-center justify-content-between mb-4 ps-4 pe-2 gap-3">
                                                    <input type="date" class="form-control form-control-sm bg-light border-0 fw-bold text-center px-2" id="fecha_inicio_filtro" disabled style="cursor:not-allowed; color: #6c757d; width: 160px; height: 38px;">
                                                    <span class="text-muted fw-bold">a</span>
                                                    <input type="date" class="form-control form-control-sm bg-light border-0 fw-bold text-center px-2" id="fecha_fin_filtro" disabled style="cursor:not-allowed; color: #6c757d; width: 160px; height: 38px;">
                                                </div>
                                                
                                                <div class="d-flex justify-content-end gap-2 mt-2 pt-2 border-top">
                                                    <button type="button" class="btn btn-sm btn-light fw-bold text-muted border px-4 py-2" id="btn_cancelar_periodo" style="background-color: #f8f9fa;">CANCELAR</button>
                                                    <button type="button" class="btn btn-sm fw-bold text-dark px-4 py-2 bg-warning" id="btn_aceptar_periodo" style="border: 1px solid #ffc107;">APLICAR</button>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- ESTATUS -->
                                        <div class="d-flex align-items-center gap-2">
                                            <i class="feather-filter text-warning" style="font-size: 1rem;"></i>
                                            <select id="filtro_estatus_tabla" class="form-select border-warning fw-bold text-dark shadow-sm px-3" style="height: 34px; padding-top: 0; padding-bottom: 0; line-height: 32px; font-size: 12px; border-radius: 6px; cursor: pointer; min-width: 230px;">
                                                <option value="">Mostrar todos los estatus</option>
                                                <option value="Guardado para aprobación">Guardado para aprobación</option>
                                                <option value="Autorizada">Autorizadas (Aprobadas)</option>
                                                <option value="No autorizada">No autorizadas (Rechazadas)</option>
                                            </select>
                                        </div>

                                        <!-- TOTAL -->
                                        <div id="contenedor-badge-total" class="flex-shrink-0"></div>

                                    </div>
                                </div>
                            </div>

                            <!-- Pestañas de Filtrado Naranjas -->
                            <template id="template-tabs-cotizaciones">
                                <div class="px-4 pt-3 pb-3 w-100" style="display: block; clear: both;">
                                    <ul class="nav nav-pills nav-justified w-100 gap-3 mb-0" role="tablist">
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link active fw-bold py-2 tab-filtro-cat custom-temp-tab shadow-sm w-100" data-categoria="TODOS" type="button" role="tab" aria-selected="true"><i class="feather-layers me-2"></i>Todas</button>
                                        </li>
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link fw-bold py-2 tab-filtro-cat custom-temp-tab shadow-sm w-100" data-categoria="NUEVO" type="button" role="tab" aria-selected="false"><i class="feather-star me-2"></i>Nuevos</button>
                                        </li>
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link fw-bold py-2 tab-filtro-cat custom-temp-tab shadow-sm w-100" data-categoria="USADO" type="button" role="tab" aria-selected="false"><i class="feather-tool me-2"></i>Usados</button>
                                        </li>
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link fw-bold py-2 tab-filtro-cat custom-temp-tab shadow-sm w-100" data-categoria="CANCELADAS" type="button" role="tab" aria-selected="false"><i class="feather-x-circle me-2 text-danger"></i>Canceladas</button>
                                        </li>
                                    </ul>
                                </div>
                            </template>

                            <div class="card-body custom-card-action p-0">
                                <table class="table table-hover mb-0 w-100" id="tableCotizacionesTemporales" style="table-layout: auto;">
                                    <thead>
                                        <tr>
                                            <th width="15%" class="text-center">Cotización TEMP</th>
                                            <th width="40%" class="text-center">Cliente / Detalles</th>
                                            <th width="15%" class="text-center">Importe</th>
                                            <th width="15%" class="text-center">Estatus</th>
                                            <th class="d-none">Categoría</th>
                                            <th class="d-none">Mes</th>
                                            <th width="15%" class="text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tabla-cotizaciones">
                                        <tr>
                                            <td colspan="7">
                                                <div class="hstack gap-3 justify-content-center">
                                                    <div class="spinner-border text-warning mt-3" role="status">
                                                        <span class="visually-hidden">Cargando...</span>
                                                    </div>
                                                    <p class="mt-2 text-warning fw-bold">Buscando cotizaciones temporales...</p>
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
        </div>
        <?php include('views/include/footer.php'); ?>
    </main>

    <!-- Modal Editar (Reutilizado para convertir a Cotización Normal) -->
    <div class="modal fade-scale" id="modalEditarCotizacionTemp" tabindex="-1" aria-hidden="true">
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
                    <input type="hidden" name="estatus" id="edit_estatus" value="">

                    <!-- ✨ NUEVO: Selector de Naturaleza (Mantener Temporal Primero) -->
                    <div class="mb-4 p-3 rounded shadow-sm mx-3 mt-3" style="background-color: #fff3cd; border: 1px solid #ffe69c;">
                        <label class="form-label text-dark fw-bold mb-2"><i class="feather-clock me-1 text-warning"></i>Importante: Aún no determinas la sucursal a la que va dirigida la cotización</label>
                        <div class="d-flex flex-column flex-md-row gap-3 mt-1">
                            <!-- Opción 1: Temporal (A la izquierda, preseleccionado) -->
                            <div class="form-check">
                                <input class="form-check-input border-warning" type="radio" name="es_temporal" id="edit_rad_temporal" value="Y" checked style="cursor: pointer;">
                                <label class="form-check-label fw-bold text-dark" for="edit_rad_temporal" style="cursor: pointer;">Mantener Temporal (Sin destino)</label>
                            </div>
                            <!-- Opción 2: Normal (A la derecha) -->
                            <div class="form-check">
                                <input class="form-check-input border-primary" type="radio" name="es_temporal" id="edit_rad_normal" value="N" style="cursor: pointer;">
                                <label class="form-check-label fw-bold text-muted" for="edit_rad_normal" style="cursor: pointer;">Convertir a Normal (Asignar destino)</label>
                            </div>
                        </div>
                    </div>

                    <div class="row mb-4 px-3">
                        <!-- TARJETA 1: DATOS COMERCIALES (AZUL) -->
                        <div class="col-lg-6 mb-4 mb-lg-0">
                            <div class="card border-primary h-100 shadow-sm">
                                <div class="card-header bg-primary text-white py-3">
                                    <h6 class="mb-0 text-white fw-bold"><i class="feather-user me-2"></i>Datos Comerciales</h6>
                                </div>
                                <div class="card-body">
                                    <div class="mb-4">
                                        <label class="form-label text-dark fw-bold"><i class="feather-briefcase me-1 text-primary"></i>División de LAN</label>
                                        <select class="form-control border-primary bg-light" id="division_visual" disabled>
                                            <option value="LA NETWORKS & SMART TECHNOLOGIES" selected>LA NETWORKS & SMART TECHNOLOGIES SA DE CV</option>
                                        </select>
                                        <input type="hidden" name="division" id="division" value="LA NETWORKS & SMART TECHNOLOGIES">
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

                                    <!-- ✨ NUEVO: Determinar tipo de sucursal (Oculto por defecto, se muestra al convertir a Normal) -->
                                    <div class="mt-4 pt-3 border-top" id="fila_tipo_sucursal_edit" style="display: none;">
                                        <label class="form-label text-dark fw-bold"><i class="feather-share-2 me-1 text-primary"></i>Determinar tipo de sucursal</label>
                                        <div class="d-flex flex-column flex-md-row gap-4 mt-2">
                                            <div class="form-check">
                                                <input class="form-check-input border-primary" type="radio" name="tipo_sucursal_flujo_edit" id="edit_rad_unica" value="unica" checked style="cursor: pointer;">
                                                <label class="form-check-label fw-bold text-dark" for="edit_rad_unica" style="cursor: pointer;"><i class="feather-file-text me-1 text-primary"></i>🏢 Sucursal Única</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input border-primary" type="radio" name="tipo_sucursal_flujo_edit" id="edit_rad_multi" value="multisucursal" style="cursor: pointer;">
                                                <label class="form-check-label fw-bold text-dark" for="edit_rad_multi" style="cursor: pointer;"><i class="feather-package me-1 text-primary"></i>📦 Multi-sucursal (Masivo)</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- TARJETA 2: PARÁMETROS DE COTIZACIÓN (VERDE) -->
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
                                    <div class="mb-2" id="wrapper_selector_sucursal_edit" style="display: none;">
                                        <label class="form-label text-dark fw-bold"><i class="feather-map-pin me-1 text-success"></i>Certificado <span class="text-danger">*</span></label>
                                        <select class="form-control border-success" id="edit_select_sucursal" name="Sucursal_id" data-select2-selector="status" required>
                                            <option value="">Esperando al solicitante...</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr class="mt-0 mb-3 mx-3">

                    <div class="row mb-4 px-3">
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

                    <div class="row mb-4 px-3">
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

                    <div class="row mt-3 mx-2 mb-3">
                        <div class="col-lg-12 d-flex justify-content-end gap-2">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Actualizar Cambios</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Scripts de DataTables y UI -->
    <script src="assets/vendors/js/vendors.min.js"></script>
    <script src="assets/vendors/js/apexcharts.min.js"></script>
    <script src="assets/vendors/js/dataTables.min.js"></script>
    <script src="assets/vendors/js/dataTables.bs5.min.js"></script>
    <script src="assets/vendors/js/select2.min.js"></script>
    <script src="assets/vendors/js/select2-active.min.js"></script>
    <script src="assets/js/common-init.min.js"></script>

    <script>
        const ES_CLIENTE_PORTAL = false;
        const USER_PERFIL = "<?php echo $_SESSION['perfil'] ?? 'admin'; ?>";
    </script>
    
    <script src="js/ver_cotizaciones_temporales.js"></script>
</body>
</html>