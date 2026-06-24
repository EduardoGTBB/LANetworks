<?php include('views/include/head.php'); ?>

<body>
    <?php include('views/include/sidebar.php'); ?>
    <?php include('views/include/header.php'); ?>
    <main class="nxl-container">
        <div class="nxl-content">
            <div class="page-header">
                <div class="page-header-left d-flex align-items-center">
                    <div class="page-header-title">
                        <div class="page-header-title">
                            <h5 class="m-b-10">Clientes</h5>
                        </div>
                        <ul class="breadcrumb">
                            <li class="breadcrumb-item"><a href="inicio.php">Inicio</a></li>
                            <li class="breadcrumb-item">Cotizaciones</li>
                            <!-- ?php
                                // Buscamos el folio especial en la base de datos usando el ID
                                $stmtF = $pdo->prepare("SELECT folio_especial FROM cotizacion WHERE id_cotizacion = ?");
                                $stmtF->execute([$id_cotizacion]);
                                $folioEspecial = $stmtF->fetchColumn();
                                
                                // Si tiene folio con letras (ej. 00004-U) lo usa, si no, formatea el ID a 5 dígitos
                                $folioAMostrar = $folioEspecial ? $folioEspecial : str_pad((string)$id_cotizacion, 5, '0', STR_PAD_LEFT);
                            ?> -->
                            <li class="breadcrumb-item">Direcciones Cotización <strong id="breadcrumb_folio">#Cargando...</strong></li>
                            <!-- <li class="breadcrumb-item">Direcciones Cotización <strong>#?php echo $folioAMostrar; ?></strong></li> -->
                            <!-- <li class="breadcrumb-item">Direcciones Cotizacion #?php echo str_pad($id_cotizacion, 4, '0', STR_PAD_LEFT); ?></li> -->
                        </ul>
                        <!-- <h5 class="m-b-10">Formalizar Venta #?php echo str_pad($id_cotizacion, 4, '0', STR_PAD_LEFT); ?></h5> -->
                    </div>
                </div>
            </div>
            <div class="main-content">
                <form id="formFormalizar">
                    <input type="hidden" name="id_cotizacion" id="id_cotizacion" value="<?php echo $id_cotizacion; ?>">
                    <input type="hidden" id="url_origen" value="<?php echo $url_origen; ?>">

                    <div class="row">
                        <div class="col-lg-12">
                            <div class="card">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0 text-white">Dirección Fiscal</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-12 col-sm-6 col-lg-6">
                                            <span>Calle y Número:</span>
                                            <input type="text" class="form-control mb-2 f-input" name="f_calle" required readonly>
                                        </div>
                                        <div class="col-12 col-sm-6 col-lg-6">
                                            <span>Colonia:</span>
                                            <input type="text" class="form-control mb-2 f-input" name="f_colonia" required readonly>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-12 col-sm-6 col-lg-6">
                                            <span>Localidad:</span>
                                            <input type="text" class="form-control mb-2 f-input" name="f_localidad" required readonly>
                                        </div>
                                        <div class="col-12 col-sm-6 col-lg-6">
                                            <span>Municipio:</span>
                                            <input type="text" class="form-control mb-2 f-input" name="f_municipio" required readonly>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-12 col-sm-6 col-lg-6">
                                            <span>Estado:</span>
                                            <input type="text" class="form-control mb-2 f-input" name="f_estado" required readonly>
                                        </div>
                                        <div class="col-12 col-sm-6 col-lg-6">
                                            <span>Codigo Postal:</span>
                                            <input type="text" class="form-control mb-2 f-input" name="f_cp" required readonly>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="alerta_sucursal_unica" class="alert alert-warning d-none mb-4 mt-4 mx-1 border-0 border-start border-5 border-warning shadow-sm">
                        <i class="feather-alert-circle me-2"></i> <strong>Cotización de Sucursal Única:</strong> La dirección de envío y certificado aplica para todos los equipos. La dirección de envío se precargó con la <strong>Sucursal de Destino</strong> seleccionada.
                    </div>
                    <div class="row mt-4">
                        <div class="col-lg-6 transition-all" id="col_cert_gral">
                            <div class="card border-warning h-100">
                                <div class="card-header bg-warning text-white">
                                    <h5 class="mb-0 text-white"><i class="feather-award me-2"></i>Dirección de Certificado</h5>
                                </div>
                                <div class="card-body">
                                    <div class="form-check form-switch mb-4 border-bottom pb-3">
                                        <input class="form-check-input" type="checkbox" id="check_cert_igual_fiscal" style="transform: scale(1.3); margin-right: 10px;">
                                        <label class="form-check-label fw-bold text-dark h6" for="check_cert_igual_fiscal">¿Es la misma que la fiscal?</label>
                                    </div>

                                    <div class="row">
                                        <div class="col-12 col-sm-6 mb-3"><span>Calle y Número:</span><input type="text" class="form-control" id="cert_gral_calle"></div>
                                        <div class="col-12 col-sm-6 mb-3"><span>Colonia:</span><input type="text" class="form-control" id="cert_gral_colonia"></div>
                                        <div class="col-12 col-sm-6 mb-3"><span>Localidad:</span><input type="text" class="form-control" id="cert_gral_localidad"></div>
                                        <div class="col-12 col-sm-6 mb-3"><span>Municipio:</span><input type="text" class="form-control" id="cert_gral_municipio"></div>
                                        <div class="col-12 col-sm-6 mb-2"><span>Estado:</span><input type="text" class="form-control" id="cert_gral_estado"></div>
                                        <div class="col-12 col-sm-6 mb-2"><span>Código Postal:</span><input type="text" class="form-control" id="cert_gral_cp"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="col-lg-6 transition-all" id="col_envio_gral">
                            <div class="card border-success h-100">
                                <div class="card-header bg-success text-white">
                                    <h5 class="mb-0 text-white"><i class="feather-truck me-2"></i>Dirección de Envío <span id="lbl_envio_gral">(General)</span></h5>
                                </div>
                                <div class="card-body">
                                    <div class="row align-items-center mb-4 border-bottom pb-3">
                                        <div class="col-12 d-none" id="switch_envio_unica">
                                            <div class="form-check form-switch m-0">
                                                <input class="form-check-input" type="checkbox" id="check_envio_igual_cert" style="transform: scale(1.3); margin-right: 10px;">
                                                <label class="form-check-label fw-bold text-dark h6 mb-0" for="check_envio_igual_cert" style="cursor: pointer;">¿Igual a certificado?</label>
                                            </div>
                                        </div>

                                        <div class="col-12 d-none" id="div_selector_contacto_gral">
                                            <div class="d-flex align-items-center gap-2">
                                                <div class="flex-grow-1">
                                                    <select class="form-select form-select-sm border-success text-success fw-bold shadow-sm" id="selector_contacto_gral">
                                                        <option value="">Seleccionar plaza o contacto...</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="col-12 col-sm-6 col-lg-6 mb-3">
                                            <span>Calle y Número:</span>
                                            <input type="text" class="form-control mb-3" id="envio_gral_calle" placeholder="Calle y número">
                                        </div>
                                        <div class="col-12 col-sm-6 col-lg-6 mb-3">
                                            <span>Colonia:</span>
                                            <input type="text" class="form-control mb-3" id="envio_gral_colonia" placeholder="Colonia">
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-12 col-sm-6 col-lg-6 mb-3">
                                            <span>Localidad:</span>
                                            <input type="text" class="form-control mb-3" id="envio_gral_localidad" placeholder="Localidad">
                                        </div>
                                        <div class="col-12 col-sm-6 col-lg-6 mb-3">
                                            <span>Municipio:</span>
                                            <input type="text" class="form-control mb-3" id="envio_gral_municipio" placeholder="Municipio">
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-12 col-sm-6 col-lg-6 mb-2">
                                            <span>Estado:</span>
                                            <input type="text" class="form-control mb-2" id="envio_gral_estado" placeholder="Estado">
                                        </div>
                                        <div class="col-12 col-sm-6 col-lg-6 mb-2">
                                            <span>Código Postal:</span>
                                            <input type="text" class="form-control mb-2" id="envio_gral_cp" placeholder="C.P.">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row mt-5" id="seccion_desglose_equipos">
                        <div class="col-12">
                            <div class="d-flex justify-content-between align-items-end border-bottom pb-2 mb-4">
                                <div>
                                    <h5 class="fw-bold text-dark mb-1">Desglose de Direcciones por Equipo</h5>
                                    <small class="text-muted">Los datos de Certificado y Envío se pre-llenan automáticamente. Modifícalos sólo si es necesario.</small>
                                </div>
                            </div>

                            <div class="accordion" id="contenedor_equipos">
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="d-flex justify-content-center align-items-center gap-4 mt-4 mb-5 w-100">
                            <!-- <a href="ver_cotizaciones.php" class="btn btn-lg btn-secondary px-4 text-uppercase fw-bold">Dejar para después</a> -->
                            <a href="<?php echo $url_origen; ?>" id="btn_regresar" class="btn btn-lg btn-secondary px-4 text-uppercase fw-bold">Dejar para después</a>
                            <button type="submit" class="btn btn-lg btn-primary px-5 text-uppercase fw-bold">Guardar</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <?php include('views/include/footer.php'); ?>
    </main>
    <script src="assets/vendors/js/vendors.min.js"></script>
    <script src="assets/js/common-init.min.js"></script>
    <script src="js/finalizar_venta.js"></script>
</body>

</html>