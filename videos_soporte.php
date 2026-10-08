<?php
session_start();

// 1. Validar sesión
if (!isset($_SESSION['id_user_admin']) && !isset($_SESSION['id_usuario_cliente'])) {
    header("Location: index.php");
    exit;
}

require_once 'api/config.php';
$es_cliente = isset($_SESSION['id_usuario_cliente']);

include('views/include/head.php'); 
?>

<body>
    <?php include('views/include/sidebar.php'); ?>
    <?php include('views/include/header.php'); ?>
    
    <main class="nxl-container">
        <div class="nxl-content">
            
            <?php
            $page_title = "Videos de Apoyo";
            $breadcrumb_items = [
                "Soporte",
                "Videos de Apoyo"
            ];
            include('views/include/page_header.php');
            ?>

            <div class="main-content">
                <div class="row">
                    <div class="col-12">
                        <div class="card stretch stretch-full border-primary">
                            <div class="card-header bg-soft-primary p-4 border-bottom border-primary border-opacity-10">
                                <h5 class="card-title text-primary fw-bolder mb-1"><i class="feather-video me-2"></i>Centro de Capacitación</h5>
                                <p class="text-muted fs-13 mb-0">Selecciona el módulo en el que necesitas ayuda para ver los tutoriales disponibles.</p>
                            </div>
                            
                            <div class="card-body p-4">
                                
                                <!-- ============================================== -->
                                <!-- 👔 VIDEOS PARA EMPLEADOS (LAN)                 -->
                                <!-- ============================================== -->
                                <?php if (!$es_cliente): ?>
                                
                                    <!-- ✨ SECCIÓN GLOBAL: Fuera de las pestañas -->
                                    <div class="mb-5">
                                        <h6 class="fw-bolder text-primary mb-3"><i class="feather-monitor me-2"></i>Fundamentos del Sistema</h6>
                                        <div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
                                            <!-- EDITAR, ELIMINAR SISTEMA (GLOBAL) -->
                                            <div class="col">
                                                <div class="card h-100 shadow-sm border-0 bg-light border-start border-primary border-4">
                                                    <div class="ratio ratio-16x9 rounded-top overflow-hidden position-relative btn-play-video" data-videoid="1y5dR2QcWkocGJ8tu7bzQPQq5YwCc7ygb" data-title="8. SAC - Editar & Eliminar">
                                                        <div class="w-100 h-100 d-flex align-items-center justify-content-center" style="background-image: url('assets/images/banner/Portadas/EdiciónGoblal.jpg'); background-size: cover; background-position: center; background-repeat: no-repeat;">
                                                            <div class="position-absolute top-0 start-0 w-100 h-100" style="background-color: rgba(30, 41, 59, 0.4);"></div>
                                                            <i class="feather-play-circle text-white opacity-90 icon-play position-relative" style="font-size: 4rem; transition: transform 0.2s; z-index: 2; text-shadow: 0px 4px 10px rgba(0,0,0,0.5);"></i>
                                                        </div>
                                                    </div>
                                                    <div class="card-body">
                                                        <h6 class="fw-bold text-dark mb-2">SAC - Editar & Eliminar (Global)</h6>
                                                        <p class="fs-12 text-muted mb-0">Aprende la dinámica general para editar, guardar cambios o eliminar cualquier registro dentro del sistema.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <hr class="mb-4 border-secondary border-opacity-25">
                                    <h6 class="fw-bolder text-dark mb-3"><i class="feather-layers me-2 text-primary"></i>Videos Específicos por Módulo</h6>

                                    <!-- ✨ Navegación por Pestañas (Tabs) -->
                                    <ul class="nav nav-pills nav-justified mb-4 gap-2 border-bottom pb-3" id="videoTabs" role="tablist">
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link active fw-bold border" id="cotizaciones-tab" data-bs-toggle="pill" data-bs-target="#tab-cotizaciones" type="button" role="tab" aria-selected="true">
                                                <i class="feather-dollar-sign me-2"></i>Cotizaciones
                                            </button>
                                        </li>
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link fw-bold border" id="clientes-tab" data-bs-toggle="pill" data-bs-target="#tab-clientes" type="button" role="tab" aria-selected="false">
                                                <i class="feather-briefcase me-2"></i>Clientes
                                            </button>
                                        </li>
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link fw-bold border" id="productos-tab" data-bs-toggle="pill" data-bs-target="#tab-productos" type="button" role="tab" aria-selected="false">
                                                <i class="feather-box me-2"></i>Productos
                                            </button>
                                        </li>
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link fw-bold border" id="configuracion-tab" data-bs-toggle="pill" data-bs-target="#tab-configuracion" type="button" role="tab" aria-selected="false">
                                                <i class="feather-settings me-2"></i>Configuración
                                            </button>
                                        </li>
                                    </ul>

                                    <div class="tab-content" id="videoTabsContent">
                                        <!-- 💰 PESTAÑA: COTIZACIONES -->
                                        <div class="tab-pane fade show active" id="tab-cotizaciones" role="tabpanel" tabindex="0">
                                            <div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
                                                <!-- COTIZADOR -->
                                                <div class="col">
                                                    <div class="card h-100 shadow-sm border-0 bg-light">
                                                        <div class="ratio ratio-16x9 rounded-top overflow-hidden position-relative btn-play-video" data-videoid="1AfvIJUKhauz9Xucn1O3IKcG12ZTtWfsy" data-title="SAC - Cotizador">
                                                            <div class="w-100 h-100 d-flex align-items-center justify-content-center" style="background-image: url('assets/images/banner/Portadas/Cotizador_LAN.jpg'); background-size: cover; background-position: center; background-repeat: no-repeat;">
                                                                <div class="position-absolute top-0 start-0 w-100 h-100" style="background-color: rgba(30, 41, 59, 0.4);"></div>
                                                                <i class="feather-play-circle text-white opacity-90 icon-play position-relative" style="font-size: 4rem; transition: transform 0.2s; z-index: 2; text-shadow: 0px 4px 10px rgba(0,0,0,0.5);"></i>
                                                            </div>
                                                        </div>
                                                        <div class="card-body">
                                                            <h6 class="fw-bold text-dark mb-2">SAC - Cotizador</h6>
                                                            <p class="fs-12 text-muted mb-0">Pasos para generar una nueva cotización en el sistema como administrador.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <!-- EDITARCOTIZADOR -->
                                                <div class="col">
                                                    <div class="card h-100 shadow-sm border-0 bg-light">
                                                        <div class="ratio ratio-16x9 rounded-top overflow-hidden position-relative btn-play-video" data-videoid="1jG9KRAHdw52dgQdC6bIzS6L58Pc3cKrz" data-title="SAC - Editar Cotizaciones">
                                                            <div class="w-100 h-100 d-flex align-items-center justify-content-center" style="background-image: url('assets/images/banner/Portadas/EditarCotizaciones_LAN.jpg'); background-size: cover; background-position: center; background-repeat: no-repeat;">
                                                                <div class="position-absolute top-0 start-0 w-100 h-100" style="background-color: rgba(30, 41, 59, 0.4);"></div>
                                                                <i class="feather-play-circle text-white opacity-90 icon-play position-relative" style="font-size: 4rem; transition: transform 0.2s; z-index: 2; text-shadow: 0px 4px 10px rgba(0,0,0,0.5);"></i>
                                                            </div>
                                                        </div>
                                                        <div class="card-body">
                                                            <h6 class="fw-bold text-dark mb-2">SAC - Editar Cotizaciones</h6>
                                                            <p class="fs-12 text-muted mb-0">Cómo editar y modificar los datos de una cotización ya generada.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>    

                                        <!-- 👥 PESTAÑA: CLIENTES -->
                                        <div class="tab-pane fade" id="tab-clientes" role="tabpanel" tabindex="0">
                                            <div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
                                                <!-- ENPRESAS -->
                                                <div class="col">
                                                    <div class="card h-100 shadow-sm border-0 bg-light">
                                                        <div class="ratio ratio-16x9 rounded-top overflow-hidden position-relative btn-play-video" data-videoid="1IMk-z4gs7rbJxGlf_zzACsRFsO_XNRK7" data-title="SAC - Empresas">
                                                            <div class="w-100 h-100 d-flex align-items-center justify-content-center" style="background-image: url('assets/images/banner/Portadas/Empresas.jpg'); background-size: cover; background-position: center; background-repeat: no-repeat;">
                                                                <div class="position-absolute top-0 start-0 w-100 h-100" style="background-color: rgba(30, 41, 59, 0.4);"></div>
                                                                <i class="feather-play-circle text-white opacity-90 icon-play position-relative" style="font-size: 4rem; transition: transform 0.2s; z-index: 2; text-shadow: 0px 4px 10px rgba(0,0,0,0.5);"></i>
                                                            </div>
                                                        </div>
                                                        <div class="card-body">
                                                            <h6 class="fw-bold text-dark mb-2">SAC - Empresas</h6>
                                                            <p class="fs-12 text-muted mb-0">Aprende a registrar y administrar las empresas clientes.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <!-- PERSONAL FARMACIAS -->
                                                <div class="col">
                                                    <div class="card h-100 shadow-sm border-0 bg-light">
                                                        <div class="ratio ratio-16x9 rounded-top overflow-hidden position-relative btn-play-video" data-videoid="13bkJMMASGrD6JtykHrrEJ8uLSlo9F65o" data-title=" SAC - Agregar Usuarios (Personal Farmacias)">
                                                            <div class="w-100 h-100 d-flex align-items-center justify-content-center" style="background-image: url('assets/images/banner/Portadas/Usuarios_CLI.jpg'); background-size: cover; background-position: center; background-repeat: no-repeat;">
                                                                <div class="position-absolute top-0 start-0 w-100 h-100" style="background-color: rgba(30, 41, 59, 0.4);"></div>
                                                                <i class="feather-play-circle text-white opacity-90 icon-play position-relative" style="font-size: 4rem; transition: transform 0.2s; z-index: 2; text-shadow: 0px 4px 10px rgba(0,0,0,0.5);"></i>
                                                            </div>
                                                        </div>
                                                        <div class="card-body">
                                                            <h6 class="fw-bold text-dark mb-2">SAC - Agregar Usuarios (Personal Farmacias)</h6>
                                                            <p class="fs-12 text-muted mb-0">Cómo registrar un nuevo usuario y enlazarlo a la empresa correspondiente.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <!-- PLAZAS -->
                                                <div class="col">
                                                    <div class="card h-100 shadow-sm border-0 bg-light">
                                                        <div class="ratio ratio-16x9 rounded-top overflow-hidden position-relative btn-play-video" data-videoid="1nruvPvUZ8iBCtSusc6u5v4jXaCNYzlqu" data-title="SAC - Plazas">
                                                            <div class="w-100 h-100 d-flex align-items-center justify-content-center" style="background-image: url('assets/images/banner/Portadas/Plazas.jpg'); background-size: cover; background-position: center; background-repeat: no-repeat;">
                                                                <div class="position-absolute top-0 start-0 w-100 h-100" style="background-color: rgba(30, 41, 59, 0.4);"></div>
                                                                <i class="feather-play-circle text-white opacity-90 icon-play position-relative" style="font-size: 4rem; transition: transform 0.2s; z-index: 2; text-shadow: 0px 4px 10px rgba(0,0,0,0.5);"></i>
                                                            </div>
                                                        </div>
                                                        <div class="card-body">
                                                            <h6 class="fw-bold text-dark mb-2">SAC - Plazas</h6>
                                                            <p class="fs-12 text-muted mb-0">Alta de plazas logísticas y agrupación masiva de domicilios.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <!-- SUCURSALES -->
                                                <div class="col">
                                                    <div class="card h-100 shadow-sm border-0 bg-light">
                                                        <div class="ratio ratio-16x9 rounded-top overflow-hidden position-relative btn-play-video" data-videoid="17wszZFaj4YFcpFR4yejNXB4U7JsrwCfa" data-title="SAC - Sucursales">
                                                            <div class="w-100 h-100 d-flex align-items-center justify-content-center" style="background-image: url('assets/images/banner/Portadas/Sucursales.jpg'); background-size: cover; background-position: center; background-repeat: no-repeat;">
                                                                <div class="position-absolute top-0 start-0 w-100 h-100" style="background-color: rgba(30, 41, 59, 0.4);"></div>
                                                                <i class="feather-play-circle text-white opacity-90 icon-play position-relative" style="font-size: 4rem; transition: transform 0.2s; z-index: 2; text-shadow: 0px 4px 10px rgba(0,0,0,0.5);"></i>
                                                            </div>
                                                        </div>
                                                        <div class="card-body">
                                                            <h6 class="fw-bold text-dark mb-2">SAC - Sucursales</h6>
                                                            <p class="fs-12 text-muted mb-0">Alta de sucursales operativas y asignación a sus plazas respectivas.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 📦 PESTAÑA: PRODUCTOS -->
                                        <div class="tab-pane fade" id="tab-productos" role="tabpanel" tabindex="0">
                                            <div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
                                                <!-- PRODUCTOS -->
                                                <div class="col">
                                                    <div class="card h-100 shadow-sm border-0 bg-light">
                                                        <div class="ratio ratio-16x9 rounded-top overflow-hidden position-relative btn-play-video" data-videoid="10wS-iTu1tWalqrJbd1cvqCZ5M6TmavHK" data-title="4. SAC - Productos">
                                                            <div class="w-100 h-100 d-flex align-items-center justify-content-center" style="background-image: url('assets/images/banner/Portadas/Productos.jpg'); background-size: cover; background-position: center; background-repeat: no-repeat;">
                                                                <div class="position-absolute top-0 start-0 w-100 h-100" style="background-color: rgba(30, 41, 59, 0.4);"></div>
                                                                <i class="feather-play-circle text-white opacity-90 icon-play position-relative" style="font-size: 4rem; transition: transform 0.2s; z-index: 2; text-shadow: 0px 4px 10px rgba(0,0,0,0.5);"></i>
                                                            </div>
                                                        </div>
                                                        <div class="card-body">
                                                            <h6 class="fw-bold text-dark mb-2">SAC - Productos</h6>
                                                            <p class="fs-12 text-muted mb-0">Cómo registrar nuevos equipos, servicios de calibración y configurar sus precios.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- ⚙️ PESTAÑA: CONFIGURACIÓN -->
                                        <div class="tab-pane fade" id="tab-configuracion" role="tabpanel" tabindex="0">
                                            <div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
                                                <!-- USUARIOS LAN -->
                                                <div class="col">
                                                    <div class="card h-100 shadow-sm border-0 bg-light">
                                                        <div class="ratio ratio-16x9 rounded-top overflow-hidden position-relative btn-play-video" data-videoid="1qSTZww9fZD8BXYgnOb8iCs9HzN97QOp9" data-title="SAC - Usuarios (Personal LAN)">
                                                            <div class="w-100 h-100 d-flex align-items-center justify-content-center" style="background-image: url('assets/images/banner/Portadas/Usuarios_LAN.jpg'); background-size: cover; background-position: center; background-repeat: no-repeat;">
                                                                <div class="position-absolute top-0 start-0 w-100 h-100" style="background-color: rgba(30, 41, 59, 0.4);"></div>
                                                                <i class="feather-play-circle text-white opacity-90 icon-play position-relative" style="font-size: 4rem; transition: transform 0.2s; z-index: 2; text-shadow: 0px 4px 10px rgba(0,0,0,0.5);"></i>
                                                            </div>
                                                        </div>
                                                        <div class="card-body">
                                                            <h6 class="fw-bold text-dark mb-2">SAC - Usuarios (Personal LAN)</h6>
                                                            <p class="fs-12 text-muted mb-0">Alta de empleados internos y gestión de sus permisos de visualización.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div> <!-- /tab-content -->

                                <!-- ============================================== -->
                                <!-- 🛒 VIDEOS PARA CLIENTES (B2B PORTAL)           -->
                                <!-- ============================================== -->
                                <?php else: ?>

                                    <!-- Los clientes B2B ven un Grid directo -->
                                    <div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
                                        <!-- COTIZADOR B2B -->
                                        <div class="col">
                                            <div class="card h-100 shadow-sm border-0 bg-light">
                                                <div class="ratio ratio-16x9 rounded-top overflow-hidden position-relative btn-play-video" data-videoid="1W9YRH6dfhBdFzjm1KENYMw6l5sP9mcWp" data-title="SAC - Cotizador">
                                                    <div class="w-100 h-100 d-flex align-items-center justify-content-center" style="background-image: url('assets/images/banner/Portadas/Cotizador_B2B.jpg'); background-size: cover; background-position: center; background-repeat: no-repeat;">
                                                        <div class="position-absolute top-0 start-0 w-100 h-100" style="background-color: rgba(30, 41, 59, 0.4);"></div>
                                                        <i class="feather-play-circle text-white opacity-90 icon-play position-relative" style="font-size: 4rem; transition: transform 0.2s; z-index: 2; text-shadow: 0px 4px 10px rgba(0,0,0,0.5);"></i>
                                                    </div>
                                                </div>
                                                <div class="card-body">
                                                    <h6 class="fw-bold text-dark mb-2">SAC - Cotizador</h6>
                                                    <p class="fs-12 text-muted mb-0">Aprende a generar y solicitar tus propias cotizaciones directamente en la plataforma.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- EDITAR COTIZACIONES B2B -->
                                        <div class="col">
                                            <div class="card h-100 shadow-sm border-0 bg-light">
                                                <div class="ratio ratio-16x9 rounded-top overflow-hidden position-relative btn-play-video" data-videoid="1dkxUHu1t5swkkEdjweJG-CZmovI7O0Jp" data-title="SAC - EditarCotizaciones">                                     
                                                    <div class="w-100 h-100 d-flex align-items-center justify-content-center" style="background-image: url('assets/images/banner/Portadas/EditarCotizaciones_B2B.jpg'); background-size: cover; background-position: center; background-repeat: no-repeat;">
                                                        <div class="position-absolute top-0 start-0 w-100 h-100" style="background-color: rgba(30, 41, 59, 0.4);"></div>
                                                        <i class="feather-play-circle text-white opacity-90 icon-play position-relative" style="font-size: 4rem; transition: transform 0.2s; z-index: 2; text-shadow: 0px 4px 10px rgba(0,0,0,0.5);"></i>
                                                    </div>
                                                </div>
                                                <div class="card-body">
                                                    <h6 class="fw-bold text-dark mb-2">SAC - Editar Cotizaciones</h6>
                                                    <p class="fs-12 text-muted mb-0">Cómo ajustar tus requerimientos antes de que sean aprobados por el administrador.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                <?php endif; ?>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
        <?php include('views/include/footer.php'); ?>
    </main>

    <!-- ✨ MODAL GLOBAL PARA REPRODUCIR VIDEOS ✨ -->
    <div class="modal fade" id="modalVideoTutorial" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-xl">
            <div class="modal-content bg-dark border-0 shadow-lg">
                <div class="modal-header border-bottom border-secondary border-opacity-25">
                    <h5 class="modal-title fw-bold text-white" id="modalVideoTitulo">Reproductor</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <!-- UX FIX: Altura anclada a 75vh para evitar Scroll en Desktop -->
                <div class="modal-body p-0 bg-black" style="border-bottom-left-radius: 0.3rem; border-bottom-right-radius: 0.3rem; overflow: hidden;">
                    <iframe id="iframeVideoReproductor" src="" allow="autoplay" allowfullscreen style="border:0; width: 100%; height: 75vh; display: block;"></iframe>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts de UI -->
    <script src="assets/vendors/js/vendors.min.js"></script>
    <script src="assets/js/common-init.min.js"></script>

    <!-- ✨ LÓGICA JAVASCRIPT DEL REPRODUCTOR -->
    <script>
    $(document).ready(function() {
        
        // Efecto Hover elegante para los botones de Play
        $('.btn-play-video').css('cursor', 'pointer').hover(
            function() {
                $(this).find('.icon-play').removeClass('opacity-75').css('transform', 'scale(1.15)');
            },
            function() {
                $(this).find('.icon-play').addClass('opacity-75').css('transform', 'scale(1)');
            }
        );

        // Evento de clic: Abrir Modal e inyectar el video
        $('.btn-play-video').on('click', function() {
            let videoId = $(this).data('videoid');
            let titulo = $(this).data('title');
            
            if(videoId && videoId !== 'TU_ID_AQUI') {
                $('#modalVideoTitulo').html(`<i class="feather-play-circle me-2 text-primary"></i>${titulo}`);
                // Inyectamos el SRC correcto con la etiqueta /preview
                $('#iframeVideoReproductor').attr('src', `https://drive.google.com/file/d/${videoId}/preview?autoplay=1`);
                $('#modalVideoTutorial').modal('show');
            } else {
                alert("Este video aún está en producción o falta colocar su ID.");
            }
        });

        // 🛡️ CIBERSEGURIDAD Y UX: Detener video al cerrar el Modal
        $('#modalVideoTutorial').on('hidden.bs.modal', function () {
            $('#iframeVideoReproductor').attr('src', '');
        });
    });
    </script>
</body>
</html>