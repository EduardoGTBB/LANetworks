<?php include('views/include/head.php'); ?>

<body>
    <?php include('views/include/sidebar.php');?>
    <?php include('views/include/header.php');?>
    <main class="nxl-container">
        <div class="nxl-content">
            <div class="page-header">
                <div class="page-header-left d-flex align-items-center">
                    <div class="page-header-title">
                        <h5 class="m-b-10">Formalizar Venta #<?php echo str_pad($id_cotizacion, 4, '0', STR_PAD_LEFT); ?></h5>
                    </div>
                </div>
            </div>
            <div class="main-content">
                <form id="formFormalizar">
                    <input type="hidden" name="id_cotizacion" id="id_cotizacion" value="<?php echo $id_cotizacion; ?>">

                    <div class="row">
                        <div class="col-lg-4">
                            <div class="card">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0 text-white">1. Dirección Fiscal</h5>
                                </div>
                                <div class="card-body">
                                    <small class="text-muted d-block mb-3">
                                        Si los datos son diferentes puede cambiarlos.
                                        <small class="text-muted d-block">Datos originales de la empresa.</small>
                                    </small>

                                    <span>Calle y Número:</span>
                                    <input type="text" class="form-control mb-2 f-input" name="f_calle" required>
                                    <span>Colonia:</span>
                                    <input type="text" class="form-control mb-2 f-input" name="f_colonia" required>
                                    <span>Localidad:</span>
                                    <input type="text" class="form-control mb-2 f-input" name="f_localidad" required>
                                    <span>Municipio:</span>
                                    <input type="text" class="form-control mb-2 f-input" name="f_municipio" required>
                                    <span>Estado:</span>
                                    <input type="text" class="form-control mb-2 f-input" name="f_estado" required>
                                    <span>Codigo Postal:</span>
                                    <input type="text" class="form-control mb-2 f-input" name="f_cp" required>
                                </div>
                            </div>
                        </div>

                        <div class="col-lg-4">
                            <div class="card">
                                <div class="card-header bg-warning text-dark">
                                    <h5 class="mb-0 text-dark">2. Dir. Certificado</h5>
                                </div>
                                <div class="card-body">
                                    <div class="form-check mb-3">
                                        <input class="form-check-input" type="checkbox" id="check_cert_igual">
                                        <label class="form-check-label fw-bold" for="check_cert_igual">Usar misma Dirección Fiscal</label>
                                    </div>
                                    <span>Calle y Número:</span>
                                    <input type="text" class="form-control mb-2 c-input" name="c_calle" required>
                                    <span>Colonia:</span>
                                    <input type="text" class="form-control mb-2 c-input" name="c_colonia" required>
                                    <span>Localidad:</span>
                                    <input type="text" class="form-control mb-2 c-input" name="c_localidad" required>
                                    <span>Municipio:</span>
                                    <input type="text" class="form-control mb-2 c-input" name="c_municipio" required>
                                    <span>Estado:</span>
                                    <input type="text" class="form-control mb-2 c-input" name="c_estado" required>
                                    <span>Codigo Postal:</span>
                                    <input type="text" class="form-control mb-2 c-input" name="c_cp" required>
                                </div>
                            </div>
                        </div>

                        <div class="col-lg-4">
                            <div class="card">
                                <div class="card-header bg-success text-white">
                                    <h5 class="mb-0 text-white">3. Dirección de Envío</h5>
                                </div>
                                <div class="card-body">
                                    <div class="form-check mb-3">
                                        <input class="form-check-input" type="checkbox" id="check_envio_igual">
                                        <label class="form-check-label fw-bold" for="check_envio_igual">Usar misma Dir. de Certificado</label>
                                    </div>

                                    <span>Calle y Número:</span>
                                    <input type="text" class="form-control mb-2 e-input" name="e_calle" required>
                                    <span>Colonia:</span>
                                    <input type="text" class="form-control mb-2 e-input" name="e_colonia" required>
                                    <span>Localidad:</span>
                                    <input type="text" class="form-control mb-2 e-input" name="e_localidad" required>
                                    <span>Municipio:</span>
                                    <input type="text" class="form-control mb-2 e-input" name="e_municipio" required>
                                    <span>Estado:</span>
                                    <input type="text" class="form-control mb-2 e-input" name="e_estado" required>
                                    <span>Codigo Postal:</span>
                                    <input type="text" class="form-control mb-2 e-input" name="e_cp" required>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex justify-content-center align-items-center gap-4 mt-4 mb-5 w-100">
                        <a href="ver_cotizaciones.php" class="btn btn-lg btn-secondary px-4 text-uppercase fw-bold">Dejar para después</a>
                        <button type="submit" class="btn btn-lg btn-primary px-5 text-uppercase fw-bold">Completar Venta</button>
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