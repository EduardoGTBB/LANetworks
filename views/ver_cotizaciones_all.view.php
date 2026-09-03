<?php include('views/include/head.php'); ?>

<body>
    <?php include('views/include/sidebar.php'); ?>
    <?php include('views/include/header.php'); ?>
    <!--! [Start] Main Content !-->
    <!--! ================================================================ !-->
    <main class="nxl-container">
        <div class="nxl-content">
            <!-- [ page-header ] start --
            <div class="page-header">
                <div class="page-header-left d-flex align-items-center">
                    <div class="page-header-title">
                        <h5 class="m-b-10">Todas las cotizaciones</h5>
                    </div>
                    <ul class="breadcrumb">
                        <li class="breadcrumb-item"><a href="inicio.php">Inicio</a></li>
                        <li class="breadcrumb-item">Cotizaciones</li>
                        <li class="breadcrumb-item">Todas las cotizaciones</li>
                    </ul>
                </div>
                <div class="page-header-right ms-auto">
                    <div class="page-header-right-items">
                        <div class="d-flex d-md-none">
                            <a href="javascript:void(0)" class="page-header-right-close-toggle">
                                <i class="feather-arrow-left me-2"></i>
                                <span>Back</span>
                            </a>
                        </div>
                        !--<div class="d-flex align-items-center gap-2 page-header-right-items-wrapper">
                            <div class="dropdown filter-dropdown">
                                <a class="btn btn-md btn-light-brand" data-bs-toggle="dropdown" data-bs-offset="0, 10" data-bs-auto-close="outside">
                                    <i class="feather-filter me-2"></i>
                                    <span>Filter</span>
                                </a>
                                <div class="dropdown-menu dropdown-menu-end">
                                    <div class="dropdown-item">
                                        <div class="custom-control custom-checkbox">
                                            <input type="checkbox" class="custom-control-input" id="Role" checked="checked">
                                            <label class="custom-control-label c-pointer" for="Role">Role</label>
                                        </div>
                                    </div>
                                    <div class="dropdown-item">
                                        <div class="custom-control custom-checkbox">
                                            <input type="checkbox" class="custom-control-input" id="Team" checked="checked">
                                            <label class="custom-control-label c-pointer" for="Team">Team</label>
                                        </div>
                                    </div>
                                    <div class="dropdown-item">
                                        <div class="custom-control custom-checkbox">
                                            <input type="checkbox" class="custom-control-input" id="Email" checked="checked">
                                            <label class="custom-control-label c-pointer" for="Email">Email</label>
                                        </div>
                                    </div>
                                    <div class="dropdown-item">
                                        <div class="custom-control custom-checkbox">
                                            <input type="checkbox" class="custom-control-input" id="Member" checked="checked">
                                            <label class="custom-control-label c-pointer" for="Member">Member</label>
                                        </div>
                                    </div>
                                    <div class="dropdown-item">
                                        <div class="custom-control custom-checkbox">
                                            <input type="checkbox" class="custom-control-input" id="Recommendation" checked="checked">
                                            <label class="custom-control-label c-pointer" for="Recommendation">Recommendation</label>
                                        </div>
                                    </div>
                                    <div class="dropdown-divider"></div>
                                    <a href="javascript:void(0);" class="dropdown-item">
                                        <i class="feather-plus me-3"></i>
                                        <span>Create New</span>
                                    </a>
                                    <a href="javascript:void(0);" class="dropdown-item">
                                        <i class="feather-filter me-3"></i>
                                        <span>Manage Filter</span>
                                    </a>
                                </div>
                            </div>
                            <a href="javascript:void(0);" class="btn btn-md btn-primary">
                                <i class="feather-plus me-2"></i>
                                <span>Add widget</span>
                            </a>
                        </div>--
                    </div>
                    <div class="d-md-none d-flex align-items-center">
                        <a href="javascript:void(0)" class="page-header-right-open-toggle">
                            <i class="feather-align-right fs-20"></i>
                        </a>
                    </div>
                </div>
            </div>
            !-- [ page-header ] end -->

            <?php
            $page_title = "Todas las cotizaciones";
            $breadcrumb_items = [
                "Cotizaciones",
                "Todas las cotizaciones"
            ];
            // $hide_new_quote_btn = true; // Descomenta esta línea en las páginas donde NO quieras el botón
            include('views/include/page_header.php');
            ?>


            <!-- [ Main Content ] start -->
            <div class="main-content">
                <div class="row">
                    <div class="col-lg-12">
                        <div class="card stretch stretch-full">

                            <div class="card-header">
                                <!-- ⬅️ ARRIBA IZQUIERDA: Título -->
                                <div class="d-flex align-items-center gap-3">
                                    <h5 class="card-title mb-0">Lista de cotizaciones</h5>
                                </div>

                                <div class="card-header-action pe-md-3">
                                    <div class="d-flex align-items-center justify-content-end gap-3 flex-wrap">

                                        <!-- 1. ✨ EXPORTAR (Visible siempre para Admins) -->
                                        <div class="dropdown">
                                            <!-- UX: Reducido a 34px y fuente 12px -->
                                            <button class="btn fw-bold d-flex align-items-center shadow-sm dropdown-toggle text-white px-3" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="height: 34px; font-size: 12px; border-radius: 6px; background-color: #2b3d5b; border-color: #2b3d5b;">
                                                <i class="feather-download me-2"></i> EXPORTAR
                                            </button>
                                            <ul class="dropdown-menu shadow-lg border-0">
                                                <li>
                                                    <h6 class="dropdown-header text-uppercase text-muted" style="font-size: 10px;">Formatos Excel</h6>
                                                </li>
                                                <li>
                                                    <!-- ✨ UX/Seguridad: Scope "todas" -->
                                                    <a class="dropdown-item fw-bold text-dark py-2 btn-exportar-filtrado" href="#" data-tipo="comercial" data-scope="todas">
                                                        <i class="feather-dollar-sign text-success me-2"></i> Reporte Comercial
                                                    </a>
                                                </li>
                                                <li>
                                                    <!-- ✨ UX/Seguridad: Scope "todas" -->
                                                    <a class="dropdown-item fw-bold text-dark py-2 btn-exportar-filtrado" href="#" data-tipo="laboratorio" data-scope="todas">
                                                        <i class="feather-thermometer text-info me-2"></i> Reporte Laboratorio
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>

                                        <!-- 2. ✨ FILTRO DE ESTATUS -->
                                        <div class="d-flex align-items-center gap-2">
                                            <i class="feather-filter text-primary" style="font-size: 1rem;"></i>
                                            <!-- UX: Reducido a 34px y fuente 12px -->
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
                                <table class="table table-hover mb-0 w-100" id="tableAllCotizaciones" style="table-layout: auto;">
                                    <thead>
                                        <tr>
                                            <th width="15%" class="text-center">Cotización</th>
                                            <th width="40%" class="text-center">Cliente / Detalles</th>
                                            <th width="15%" class="text-center">Importe</th>
                                            <th width="15%" class="text-center">Estatus</th>
                                            <th class="d-none">Categoría</th> <!-- 4 (Oculta) -->
                                            <th width="15%" class="text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tabla-cotizaciones">
                                        <tr>
                                            <td colspan="5">
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
                                <!-- <table class="table table-hover mb-0 w-100" id="tableAllCotizaciones">
                                    <thead>
                                        <tr>
                                            <th>Folio #</th>
                                            <th>Fecha</th>
                                            <th>Cliente</th>
                                            <th>Importe</th>
                                            <th>Estatus</th>
                                            <th class="text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tabla-cotizaciones">
                                        <tr>
                                            <td>
                                                <div class="hstack gap-3">
                                                    <div class="spinner-border text-primary mt-3" role="status">
                                                        <span class="visually-hidden">Cargando...</span>
                                                    </div>
                                                    <p class="mt-2">Cargando cotizaciones...</p>
                                                </div>
                                            </td>
                                            !--<td>
                                                    03/02/2026
                                                </td>
                                                <td>
                                                    COMERCIALIZADORA FARMACEUTICA DE CHIAPAS
                                                </td>
                                                <td class="text-dark fw-bold">$6,085.82</td>
                                                <td>
                                                    <span class="badge bg-soft-success text-success">Aprobado</span>
                                                </td>
                                                <td class="text-center">
                                                    <div class="hstack gap-2 justify-content-center">
                                                        <a href="#" class="avatar-text avatar-md">
                                                            <abbr title="Imprimir cotización" style="text-decoration:none;"><i class="feather-printer"></i></abbr>
                                                        </a>
                                                        <a href="#" class="avatar-text avatar-md">
                                                            <abbr title="Editar cotización" style="text-decoration:none;"><i class="feather-edit"></i></abbr>
                                                        </a>
                                                        <a href="#" class="avatar-text avatar-md">
                                                            <abbr title="Eliminar" style="text-decoration:none;"><i class="feather-trash-2"></i></abbr>
                                                        </a>
                                                    </div>
                                                </td> --
                                        </tr>
                                    </tbody>
                                </table> -->

                            </div>
                        </div>
                    </div>
                    <!-- [Recent Orders] end -->
                    <!-- [] start -->
                </div>
            </div>
            <!-- [ Main Content ] end -->
        </div>

        <?php include('views/include/footer.php'); ?>
    </main>

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

                    <!-- ✨ FIX CIBERSEGURIDAD: Input necesario para que no se borre el estatus al editar -->
                    <input type="hidden" name="estatus" id="edit_estatus" value="">

                    <div class="row mb-4">
                        <!-- ✨ TARJETA 1: DATOS COMERCIALES (AZUL) -->
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

                        <!-- ✨ TARJETA 2: PARÁMETROS DE COTIZACIÓN (VERDE) -->
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
                                        <label class="form-label text-dark fw-bold"><i class="feather-map-pin me-1 text-success"></i>Certificado <span class="text-danger">*</span></label>
                                        <select class="form-control border-success" id="edit_select_sucursal" name="Sucursal_id" data-select2-selector="status" required>
                                            <option value="">Esperando al solicitante...</option>
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
                                    <!-- <button type="button" id="edit_delete_row" class="btn btn-sm bg-soft-danger text-danger">Eliminar último</button> -->
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

                    <div class="row mb-4 "><!-- d-flex justify-content-end -->
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
                                            <!-- <input type="number" name="sub_total" class="form-control border-0 bg-transparent p-0" id="edit_sub_total" readonly> -->
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
                                            <!-- <input type="number" name="total_amount" id="edit_total_amount" class="form-control border-0 bg-transparent p-0 fw-700 text-dark" readonly> -->
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

    <!-- Modal Ver Orden de Compra (Exclusivo Administradores) -->
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
                        <!-- El atributo download y target="_blank" permiten previsualizar o descargar el PDF -->
                        <a href="#" id="btn_descargar_oc" target="_blank" class="btn btn-success fw-bold text-uppercase">
                            <i class="feather-download-cloud me-2"></i>Ver PDF
                        </a>
                        <button type="button" class="btn btn-light text-muted fw-bold" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!--! ================================================================ !-->
    <!--! [End] Main Content !-->
    <!--! ================================================================ !-->
    <!--! ================================================================ !-->
    <!--! [Start] Search Modal !-->
    <!--! ================================================================ !-->
    <div class="modal fade-scale" id="searchModal" aria-hidden="true" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-top modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header search-form py-0">
                    <div class="input-group">
                        <span class="input-group-text">
                            <i class="feather-search fs-4 text-muted"></i>
                        </span>
                        <input type="text" class="form-control search-input-field" placeholder="Search...">
                        <span class="input-group-text">
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </span>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="searching-for mb-5">
                        <h4 class="fs-13 fw-normal text-gray-600 mb-3">I'm searching for...</h4>
                        <div class="row g-1">
                            <div class="col-md-4 col-xl-2">
                                <a href="javascript:void(0);" class="d-flex align-items-center gap-2 px-3 lh-lg border rounded-pill">
                                    <i class="feather-compass"></i>
                                    <span>Recent</span>
                                </a>
                            </div>
                            <div class="col-md-4 col-xl-2">
                                <a href="javascript:void(0);" class="d-flex align-items-center gap-2 px-3 lh-lg border rounded-pill">
                                    <i class="feather-command"></i>
                                    <span>Command</span>
                                </a>
                            </div>
                            <div class="col-md-4 col-xl-2">
                                <a href="javascript:void(0);" class="d-flex align-items-center gap-2 px-3 lh-lg border rounded-pill">
                                    <i class="feather-users"></i>
                                    <span>Peoples</span>
                                </a>
                            </div>
                            <div class="col-md-4 col-xl-2">
                                <a href="javascript:void(0);" class="d-flex align-items-center gap-2 px-3 lh-lg border rounded-pill">
                                    <i class="feather-file"></i>
                                    <span>Files</span>
                                </a>
                            </div>
                            <div class="col-md-4 col-xl-2">
                                <a href="javascript:void(0);" class="d-flex align-items-center gap-2 px-3 lh-lg border rounded-pill">
                                    <i class="feather-video"></i>
                                    <span>Medias</span>
                                </a>
                            </div>
                            <div class="col-md-4 col-xl-2">
                                <a href="javascript:void(0);" class="d-flex align-items-center gap-2 px-3 lh-lg border rounded-pill">
                                    <span>More</span>
                                    <i class="feather-chevron-down"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="recent-result mb-5">
                        <h4 class="fs-13 fw-normal text-gray-600 mb-3">Recnet <span class="badge small bg-gray-200 rounded ms-1 text-dark">3</span></h4>
                        <div class="d-flex align-items-center justify-content-between mb-4">
                            <a href="javascript:void(0);" class="d-flex align-items-start gap-3">
                                <i class="feather-airplay fs-5"></i>
                                <div class="fs-13 fw-semibold">CRM dashboard redesign</div>
                            </a>
                            <a href="javascript:void(0);" class="badge border rounded text-dark">/<i class="feather-command ms-1 fs-12"></i></a>
                        </div>
                        <div class="d-flex align-items-center justify-content-between mb-4">
                            <a href="javascript:void(0);" class="d-flex align-items-start gap-3">
                                <i class="feather-file-plus fs-5"></i>
                                <div class="fs-13 fw-semibold">Create new eocument</div>
                            </a>
                            <a href="javascript:void(0);" class="badge border rounded text-dark">N /<i class="feather-command ms-1 fs-12"></i></a>
                        </div>
                        <div class="d-flex align-items-center justify-content-between">
                            <a href="javascript:void(0);" class="d-flex align-items-start gap-3">
                                <i class="feather-user-plus fs-5"></i>
                                <div class="fs-13 fw-semibold">Invite project colleagues</div>
                            </a>
                            <a href="javascript:void(0);" class="badge border rounded text-dark">P /<i class="feather-command ms-1 fs-12"></i></a>
                        </div>
                    </div>
                    <div class="command-result mb-5">
                        <h4 class="fs-13 fw-normal text-gray-600 mb-3">Command <span class="badge small bg-gray-200 rounded ms-1 text-dark">5</span></h4>
                        <div class="d-flex align-items-center justify-content-between mb-4">
                            <a href="javascript:void(0);" class="d-flex align-items-start gap-3">
                                <i class="feather-user fs-5"></i>
                                <div class="fs-13 fw-semibold">My profile</div>
                            </a>
                            <a href="javascript:void(0);" class="badge border rounded text-dark">P /<i class="feather-command ms-1 fs-12"></i></a>
                        </div>
                        <div class="d-flex align-items-center justify-content-between mb-4">
                            <a href="javascript:void(0);" class="d-flex align-items-start gap-3">
                                <i class="feather-users fs-5"></i>
                                <div class="fs-13 fw-semibold">Team profile</div>
                            </a>
                            <a href="javascript:void(0);" class="badge border rounded text-dark">T /<i class="feather-command ms-1 fs-12"></i></a>
                        </div>
                        <div class="d-flex align-items-center justify-content-between mb-4">
                            <a href="javascript:void(0);" class="d-flex align-items-start gap-3">
                                <i class="feather-user-plus fs-5"></i>
                                <div class="fs-13 fw-semibold">Invite colleagues</div>
                            </a>
                            <a href="javascript:void(0);" class="badge border rounded text-dark">I /<i class="feather-command ms-1 fs-12"></i></a>
                        </div>
                        <div class="d-flex align-items-center justify-content-between mb-4">
                            <a href="javascript:void(0);" class="d-flex align-items-start gap-3">
                                <i class="feather-briefcase fs-5"></i>
                                <div class="fs-13 fw-semibold">Create new project</div>
                            </a>
                            <a href="javascript:void(0);" class="badge border rounded text-dark">CP /<i class="feather-command ms-1 fs-12"></i></a>
                        </div>
                        <div class="d-flex align-items-center justify-content-between">
                            <a href="javascript:void(0);" class="d-flex align-items-start gap-3">
                                <i class="feather-life-buoy fs-5"></i>
                                <div class="fs-13 fw-semibold">Support center</div>
                            </a>
                            <a href="javascript:void(0);" class="badge border rounded text-dark">SC /<i class="feather-command ms-1 fs-12"></i></a>
                        </div>
                    </div>
                    <div class="file-result mb-4">
                        <h4 class="fs-13 fw-normal text-gray-600 mb-3">Files <span class="badge small bg-gray-200 rounded ms-1 text-dark">3</span></h4>
                        <div class="d-flex align-items-center justify-content-between mb-4">
                            <a href="javascript:void(0);" class="d-flex align-items-start gap-3">
                                <i class="feather-folder-plus fs-5"></i>
                                <div class="fs-13 fw-semibold">CRM Desing Project <span class="fs-12 fw-normal text-muted">(56.74 MB)</span></div>
                            </a>
                            <a href="javascript:void(0);" class="file-download"><i class="feather-download"></i></a>
                        </div>
                        <div class="d-flex align-items-center justify-content-between mb-4">
                            <a href="javascript:void(0);" class="d-flex align-items-start gap-3">
                                <i class="feather-folder-plus fs-5"></i>
                                <div class="fs-13 fw-semibold">Admin Dashboard Project <span class="fs-12 fw-normal text-muted">(46.83 MB)</span></div>
                            </a>
                            <a href="javascript:void(0);" class="file-download"><i class="feather-download"></i></a>
                        </div>
                        <div class="d-flex align-items-center justify-content-between">
                            <a href="javascript:void(0);" class="d-flex align-items-start gap-3">
                                <i class="feather-folder-plus fs-5"></i>
                                <div class="fs-13 fw-semibold">CRM Dashboard Project <span class="fs-12 fw-normal text-muted">(68.59 MB)</span></div>
                            </a>
                            <a href="javascript:void(0);" class="file-download"><i class="feather-download"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!--! ================================================================ !-->
    <!--! [End] Search Modal !-->
    <!--! ================================================================ !-->
    <!--! ================================================================ !-->
    <!--! [Start] Language Select !-->
    <!--! ================================================================ !-->
    <div class="modal fade-scale" id="languageSelectModal" aria-hidden="true" aria-labelledby="languageSelectModalLabel" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="languageSelectModalLabel">Select Language</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/sa.svg" alt="" class="img-fluid"></div>
                                <span>Arabic </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/bd.svg" alt="" class="img-fluid"></div>
                                <span>Bengali </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/ch.svg" alt="" class="img-fluid"></div>
                                <span>Chinese </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/hr.svg" alt="" class="img-fluid"></div>
                                <span>Croatian </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/dk.svg" alt="" class="img-fluid"></div>
                                <span>Danish </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/nl.svg" alt="" class="img-fluid"></div>
                                <span>Dutch </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select active">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/us.svg" alt="" class="img-fluid"></div>
                                <span>English </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/fi.svg" alt="" class="img-fluid"></div>
                                <span>Filipino </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/fr.svg" alt="" class="img-fluid"></div>
                                <span>French </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/de.svg" alt="" class="img-fluid"></div>
                                <span>German </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/il.svg" alt="" class="img-fluid"></div>
                                <span>Hebrew </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/in.svg" alt="" class="img-fluid"></div>
                                <span>Hindi </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/id.svg" alt="" class="img-fluid"></div>
                                <span>Indonesian </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/it.svg" alt="" class="img-fluid"></div>
                                <span>Italian </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/jp.svg" alt="" class="img-fluid"></div>
                                <span>Japanese </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/kr.svg" alt="" class="img-fluid"></div>
                                <span>Korean </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/ir.svg" alt="" class="img-fluid"></div>
                                <span>Persian </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/pt.svg" alt="" class="img-fluid"></div>
                                <span>Portuguese </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/ru.svg" alt="" class="img-fluid"></div>
                                <span>Russian </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/es.svg" alt="" class="img-fluid"></div>
                                <span>Spanish </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/sv.svg" alt="" class="img-fluid"></div>
                                <span>Swedish </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/tr.svg" alt="" class="img-fluid"></div>
                                <span>Turkish </span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/pk.svg" alt="" class="img-fluid"></div>
                                <span>Urdo</span>
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 language_select">
                            <a href="javascript:void(0);" class="d-flex align-items-center gap-2">
                                <div class="avatar-image avatar-sm"><img src="assets/vendors/img/flags/1x1/vi.svg" alt="" class="img-fluid"></div>
                                <span>Vietnamese</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!--! ================================================================ !-->
    <!--! [End] Language Select !-->
    <!--! ================================================================ !-->
    <!--! ================================================================ !-->
    <!--! BEGIN: Downloading Toast !-->
    <!--! ================================================================ !-->
    <div class="position-fixed" style="right: 5px; bottom: 5px; z-index: 999999">
        <div id="toast" class="toast bg-black hide" data-bs-delay="3000" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header px-3 bg-transparent d-flex align-items-center justify-content-between border-bottom border-light border-opacity-10">
                <div class="text-white mb-0 mr-auto">Downloading...</div>
                <a href="javascript:void(0)" class="ms-2 mb-1 close fw-normal" data-bs-dismiss="toast" aria-label="Close">
                    <span class="text-white">&times;</span>
                </a>
            </div>
            <div class="toast-body p-3 text-white">
                <h6 class="fs-13 text-white">Project.zip</h6>
                <span class="text-light fs-11">4.2mb of 5.5mb</span>
            </div>
            <div class="toast-footer p-3 pt-0 border-top border-light border-opacity-10">
                <div class="progress mt-3" style="height: 5px">
                    <div class="progress-bar progress-bar-striped progress-bar-animated w-75 bg-dark" role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>
        </div>
    </div>
    <!--! ================================================================ !-->
    <!--! END: Downloading Toast !-->
    <!--! ================================================================ !-->
    <!--! ================================================================ !-->
    <!--! BEGIN: Theme Customizer !-->
    <!--! ================================================================ !-->
    <!-- <div class="theme-customizer">
        <div class="customizer-handle">
            <a href="javascript:void(0);" class="cutomizer-open-trigger bg-primary">
                <i class="feather-settings"></i>
            </a>
        </div>
        <div class="customizer-sidebar-wrapper">
            <div class="customizer-sidebar-header px-4 ht-80 border-bottom d-flex align-items-center justify-content-between">
                <h5 class="mb-0">Theme Settings</h5>
                <a href="javascript:void(0);" class="cutomizer-close-trigger d-flex">
                    <i class="feather-x"></i>
                </a>
            </div>
            <div class="customizer-sidebar-body position-relative p-4" data-scrollbar-target="#psScrollbarInit">
                !--! BEGIN: [Navigation] !--
                <div class="position-relative px-3 pb-3 pt-4 mt-3 mb-5 border border-gray-2 theme-options-set">
                    <label class="py-1 px-2 fs-8 fw-bold text-uppercase text-muted text-spacing-2 bg-white border border-gray-2 position-absolute rounded-2 options-label" style="top: -12px">Navigation</label>
                    <div class="row g-2 theme-options-items app-navigation" id="appNavigationList">
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-navigation-light" name="app-navigation" value="1" data-app-navigation="app-navigation-light" checked>
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-navigation-light">Light</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-navigation-dark" name="app-navigation" value="2" data-app-navigation="app-navigation-dark">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-navigation-dark">Dark</label>
                        </div>
                    </div>
                </div>
                !--! END: [Navigation] !--
                !--! BEGIN: [Header] !--
                <div class="position-relative px-3 pb-3 pt-4 mt-3 mb-5 border border-gray-2 theme-options-set mt-5">
                    <label class="py-1 px-2 fs-8 fw-bold text-uppercase text-muted text-spacing-2 bg-white border border-gray-2 position-absolute rounded-2 options-label" style="top: -12px">Header</label>
                    <div class="row g-2 theme-options-items app-header" id="appHeaderList">
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-header-light" name="app-header" value="1" data-app-header="app-header-light" checked>
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-header-light">Light</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-header-dark" name="app-header" value="2" data-app-header="app-header-dark">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-header-dark">Dark</label>
                        </div>
                    </div>
                </div>
                !--! END: [Header] !--
                !--! BEGIN: [Skins] !--
                <div class="position-relative px-3 pb-3 pt-4 mt-3 mb-5 border border-gray-2 theme-options-set">
                    <label class="py-1 px-2 fs-8 fw-bold text-uppercase text-muted text-spacing-2 bg-white border border-gray-2 position-absolute rounded-2 options-label" style="top: -12px">Skins</label>
                    <div class="row g-2 theme-options-items app-skin" id="appSkinList">
                        <div class="col-6 text-center position-relative single-option light-button active">
                            <input type="radio" class="btn-check" id="app-skin-light" name="app-skin" value="1" data-app-skin="app-skin-light">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-skin-light">Light</label>
                        </div>
                        <div class="col-6 text-center position-relative single-option dark-button">
                            <input type="radio" class="btn-check" id="app-skin-dark" name="app-skin" value="2" data-app-skin="app-skin-dark">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-skin-dark">Dark</label>
                        </div>
                    </div>
                </div>
                !--! END: [Skins] !--
                !--! BEGIN: [Typography] !--
                <div class="position-relative px-3 pb-3 pt-4 mt-3 mb-0 border border-gray-2 theme-options-set">
                    <label class="py-1 px-2 fs-8 fw-bold text-uppercase text-muted text-spacing-2 bg-white border border-gray-2 position-absolute rounded-2 options-label" style="top: -12px">Typography</label>
                    <div class="row g-2 theme-options-items font-family" id="fontFamilyList">
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-lato" name="font-family" value="1" data-font-family="app-font-family-lato">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-lato">Lato</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-rubik" name="font-family" value="2" data-font-family="app-font-family-rubik">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-rubik">Rubik</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-inter" name="font-family" value="3" data-font-family="app-font-family-inter" checked>
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-inter">Inter</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-cinzel" name="font-family" value="4" data-font-family="app-font-family-cinzel">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-cinzel">Cinzel</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-nunito" name="font-family" value="6" data-font-family="app-font-family-nunito">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-nunito">Nunito</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-roboto" name="font-family" value="7" data-font-family="app-font-family-roboto">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-roboto">Roboto</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-ubuntu" name="font-family" value="8" data-font-family="app-font-family-ubuntu">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-ubuntu">Ubuntu</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-poppins" name="font-family" value="9" data-font-family="app-font-family-poppins">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-poppins">Poppins</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-raleway" name="font-family" value="10" data-font-family="app-font-family-raleway">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-raleway">Raleway</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-system-ui" name="font-family" value="11" data-font-family="app-font-family-system-ui">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-system-ui">System UI</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-noto-sans" name="font-family" value="12" data-font-family="app-font-family-noto-sans">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-noto-sans">Noto Sans</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-fira-sans" name="font-family" value="13" data-font-family="app-font-family-fira-sans">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-fira-sans">Fira Sans</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-work-sans" name="font-family" value="14" data-font-family="app-font-family-work-sans">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-work-sans">Work Sans</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-open-sans" name="font-family" value="15" data-font-family="app-font-family-open-sans">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-open-sans">Open Sans</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-maven-pro" name="font-family" value="16" data-font-family="app-font-family-maven-pro">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-maven-pro">Maven Pro</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-quicksand" name="font-family" value="17" data-font-family="app-font-family-quicksand">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-quicksand">Quicksand</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-montserrat" name="font-family" value="18" data-font-family="app-font-family-montserrat">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-montserrat">Montserrat</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-josefin-sans" name="font-family" value="19" data-font-family="app-font-family-josefin-sans">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-josefin-sans">Josefin Sans</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-ibm-plex-sans" name="font-family" value="20" data-font-family="app-font-family-ibm-plex-sans">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-ibm-plex-sans">IBM Plex Sans</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-source-sans-pro" name="font-family" value="5" data-font-family="app-font-family-source-sans-pro">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-source-sans-pro">Source Sans Pro</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-montserrat-alt" name="font-family" value="21" data-font-family="app-font-family-montserrat-alt">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-montserrat-alt">Montserrat Alt</label>
                        </div>
                        <div class="col-6 text-center single-option">
                            <input type="radio" class="btn-check" id="app-font-family-roboto-slab" name="font-family" value="22" data-font-family="app-font-family-roboto-slab">
                            <label class="py-2 fs-9 fw-bold text-dark text-uppercase text-spacing-1 border border-gray-2 w-100 h-100 c-pointer position-relative options-label" for="app-font-family-roboto-slab">Roboto Slab</label>
                        </div>
                    </div>
                </div>
                !--! END: [Typography] !--
            </div>
            <div class="customizer-sidebar-footer px-4 ht-60 border-top d-flex align-items-center gap-2">
                <div class="flex-fill w-50">
                    <a href="javascript:void(0);" class="btn btn-danger" data-style="reset-all-common-style">Reset</a>
                </div>
                <div class="flex-fill w-50">
                    <a href="https://www.themewagon.com/themes/Duralux-admin" target="_blank" class="btn btn-primary">Download</a>
                </div>
            </div>
        </div>
    </div> -->

    <!--! ================================================================ !-->
    <!--! [End] Theme Customizer !-->
    <!--! ================================================================ !-->
    <!--! ================================================================ !-->
    <!--! Footer Script !-->
    <!--! ================================================================ !-->
    <!--! BEGIN: Vendors JS !-->
    <script src="assets/vendors/js/vendors.min.js"></script>
    <!-- vendors.min.js {always must need to be top} -->
    <script src="assets/vendors/js/apexcharts.min.js"></script>
    <script src="assets/vendors/js/dataTables.min.js"></script>
    <script src="assets/vendors/js/dataTables.bs5.min.js"></script>
    <script src="assets/vendors/js/select2.min.js"></script>
    <script src="assets/vendors/js/select2-active.min.js"></script>
    <script src="assets/vendors/js/jquery.time-to.min.js "></script>
    <!--! END: Vendors JS !-->
    <!--! BEGIN: Apps Init  !-->
    <script src="assets/js/common-init.min.js"></script>
    <script src="assets/js/widgets-tables-init.min.js"></script>
    <!--! END: Apps Init !-->
    <!--! BEGIN: Theme Customizer  !-->
    <!-- <script src="assets/js/theme-customizer-init.min.js"></script> -->
    <!--! END: Theme Customizer !-->
    <!-- <script src="js/utils_sucursales.js"></script> -->
    <script src="js/ver_cotizaciones_all.js"></script>

    <!-- <script>
        const ES_CLIENTE_PORTAL = ?php echo isset($_SESSION['id_usuario_cliente']) ? 'true' : 'false'; ?>;
    </script> -->
</body>

</html>