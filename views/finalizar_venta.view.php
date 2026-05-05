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
                            <li class="breadcrumb-item">Direcciones Cotizacion #<?php echo str_pad($id_cotizacion, 4, '0', STR_PAD_LEFT); ?></li>
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
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="card">
                                <div class="card-header bg-warning text-dark">
                                    <h5 class="mb-0 text-dark">Dirección Certificado</h5>
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

                        <div class="col-lg-6">
                            <div class="card">
                                <div class="card-header bg-success text-white">
                                    <h5 class="mb-0 text-white">Dirección de Envío</h5>
                                </div>
                                <!-- <div class="card-body">
                                    <div class="mb-4 pb-3 border-bottom">
                                        <label class="fw-bold mb-2 text-dark">Seleccionar Sucursal de Destino:</label>
                                        <select class="form-select form-select-lg border-success text-success" id="select_sucursal_final" name="Sucursal_id">
                                            <option value="">Cargando sucursales...</option>
                                        </select>
                                    </div>
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
                                </div> -->

                                <div class="card-body">
                                    <div class="bg-soft-success p-3 rounded mb-4 border border-success border-opacity-25">
                                        <div class="mb-3">
                                            <label class="fw-bold fs-12 text-uppercase text-success mb-1">Elegir Sucursal:</label>
                                            <select class="form-select border-success" id="select_sucursal_final" name="Sucursal_id">
                                                <option value="">Cargando sucursales...</option>
                                            </select>
                                        </div>
                                        <hr class="border-success border-opacity-25 my-2">
                                        <div class="form-check mt-2">
                                            <input class="form-check-input" type="checkbox" id="check_envio_igual">
                                            <label class="form-check-label fw-bold text-dark" for="check_envio_igual">O copiar Dir. de Certificado</label>
                                        </div>
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
                        <!-- <a href="ver_cotizaciones.php" class="btn btn-lg btn-secondary px-4 text-uppercase fw-bold">Dejar para después</a> -->
                        <a href="<?php echo $url_origen; ?>" id="btn_regresar" class="btn btn-lg btn-secondary px-4 text-uppercase fw-bold">Dejar para después</a>
                        <button type="submit" class="btn btn-lg btn-primary px-5 text-uppercase fw-bold">Guardar</button>
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