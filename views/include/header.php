<!--! [Start] Header !-->
<!--! ================================================================ !-->
<header class="nxl-header">
    <!-- ✨ Usamos d-flex, align-items-center y h-100 para forzar el centrado vertical perfecto -->
    <div class="header-wrapper d-flex align-items-center justify-content-between w-100 px-3" style="height: 100%;">
        
        <!--! [Start] Header Left !-->
        <div class="header-left d-flex align-items-center gap-3">
            <!--! [Start] nxl-head-mobile-toggler !-->
            <a href="javascript:void(0);" class="nxl-head-mobile-toggler" id="mobile-collapse">
                <div class="hamburger hamburger--arrowturn">
                    <div class="hamburger-box">
                        <div class="hamburger-inner"></div>
                    </div>
                </div>
            </a>
            
            <!--! [Start] nxl-navigation-toggle !-->
            <div class="nxl-navigation-toggle border-end pe-3">
                <a href="javascript:void(0);" id="menu-mini-button">
                    <i class="feather-align-left"></i>
                </a>
                <a href="javascript:void(0);" id="menu-expend-button" style="display: none">
                    <i class="feather-arrow-right"></i>
                </a>
            </div>

            <!--! [Start] nxl-lavel-mega-menu-toggle !-->
            <div class="nxl-lavel-mega-menu-toggle d-flex d-lg-none">
                <a href="javascript:void(0);" id="nxl-lavel-mega-menu-open">
                    <i class="feather-align-left"></i>
                </a>
            </div>
        </div>
        <!--! [End] Header Left !-->

        <!-- ✨ CENTRO: Perfil de Usuario (Estilo Chrome) ✨ -->
        <!-- flex-grow-1 empuja los laterales a los bordes y mantiene esto al centro exacto -->
        <div class="d-none d-sm-flex align-items-center justify-content-center" style="flex-grow: 1;">
            <div class="dropdown nxl-h-item m-0">
                <a href="javascript:void(0);" data-bs-toggle="dropdown" role="button" data-bs-auto-close="outside" class="d-flex align-items-center gap-2 bg-light p-1 pe-3 shadow-sm border border-light-subtle" style="border-radius: 50px; text-decoration: none; transition: all 0.2s;">
                    <img src="assets/images/avatar/<?php echo htmlspecialchars($_SESSION['foto_perfil'] ?? 'user.png'); ?>" alt="user-image" class="rounded-circle border border-white shadow-sm" style="width: 35px; height: 35px; object-fit: cover;" />
                    <span class="text-dark fw-bolder fs-12 text-uppercase">
                        <?php 
                            $nombre_completo = $_SESSION['nombre_completo'] ?? 'Usuario';
                            $primer_nombre = explode(' ', trim($nombre_completo))[0];
                            echo htmlspecialchars($primer_nombre); 
                        ?>
                    </span>
                </a>
                
                <div class="dropdown-menu dropdown-menu-center nxl-h-dropdown nxl-user-dropdown mt-2 shadow-lg border-0" style="min-width: 260px;">
                    <div class="dropdown-header pb-3">
                        <div class="d-flex align-items-center">
                            <img src="assets/images/avatar/<?php echo htmlspecialchars($_SESSION['foto_perfil'] ?? 'user.png'); ?>" alt="user-image" class="rounded-circle me-3 border border-2 border-primary" style="width: 55px; height: 55px; object-fit: cover;" />
                            <div>
                                <h6 class="text-dark mb-0 fw-bolder">
                                    <?php echo htmlspecialchars($_SESSION['nombre_completo'] ?? 'Usuario'); ?>
                                </h6>
                                <span class="fs-12 fw-medium text-muted">
                                    <?php 
                                        if(isset($_SESSION['correo'])) {
                                            echo htmlspecialchars($_SESSION['correo']);
                                        } else {
                                            echo htmlspecialchars($_SESSION['usuario_lan'] ?? 'admin');
                                        }
                                    ?>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="p-2">
                        <a href="logout.php" class="dropdown-item text-danger fw-bold rounded d-flex align-items-center py-2" style="background-color: #fff5f5;">
                            <i class="feather-log-out me-2"></i>
                            <span>Cerrar Sesión</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <!-- ✨ FIN CENTRO -->

        <!--! [Start] Header Right !-->
        <div class="header-right d-flex align-items-center">
            <!-- ✨ LOGOTIPO DERECHO: Analytical -->
            <div class="d-none d-lg-flex align-items-center border-start ps-3 h-100 py-2">
                <img src="assets/images/logo/Logo-LaAnalitical.png" alt="Analytical for a better life" style="max-height: 45px; object-fit: contain;">
            </div>
        </div>
        <!--! [End] Header Right !-->

    </div>
</header>
<!--! ================================================================ !-->
<!--! [End] Header !-->
<!--! ================================================================ !-->