<!-- <div class="page-header d-flex flex-wrap align-items-center"> -->
<div class="page-header d-flex flex-wrap align-items-center shadow-sm" style="position: sticky; top: 80px; z-index: 99; min-height: 75px !important; padding-top: 18px !important; padding-bottom: 18px !important; margin-bottom: 25px;">
    
    <!-- Bloque Izquierdo: Título y Ruta -->
    <div class="page-header-left d-flex align-items-center">
        <div class="page-header-title">
            <h5 class="m-b-10"><?php echo $page_title ?? 'Módulo'; ?></h5>
        </div>
        <ul class="breadcrumb">
            <li class="breadcrumb-item"><a href="inicio.php">Inicio</a></li>
            <?php if (isset($breadcrumb_items) && is_array($breadcrumb_items)): ?>
                <?php foreach ($breadcrumb_items as $item): ?>
                    <li class="breadcrumb-item"><?php echo $item; ?></li>
                <?php endforeach; ?>
            <?php endif; ?>
        </ul>
    </div>
    
    <!-- ✨ NUEVO: Bloque Central Dinámico (Fechador u otros controles) -->
    <?php if (isset($custom_header_center) && !empty($custom_header_center)): ?>
        <div class="page-header-center d-none d-md-flex justify-content-center flex-grow-1 mx-3">
            <?php echo $custom_header_center; ?>
        </div>
    <?php endif; ?>

    <!-- Bloque Derecho: Controles y Botón -->
    <div class="page-header-right ms-auto d-flex align-items-center">
        <div class="page-header-right-items">
            <!-- Toggle para móvil -->
            <div class="d-flex d-md-none">
                <a href="javascript:void(0)" class="page-header-right-close-toggle">
                    <i class="feather-arrow-left me-2"></i>
                    <span>Back</span>
                </a>
            </div>
            
            <!-- Botón de Nueva Cotización -->
            <?php if (!isset($hide_new_quote_btn) || $hide_new_quote_btn === false): ?>
                <a href="cotizador.php" class="btn btn-primary btn-sm rounded-pill shadow-sm fw-bold d-flex align-items-center px-3 text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">
                    <i class="feather-plus-circle me-2 fs-14"></i> Nueva Cotización
                </a>
            <?php endif; ?>
        </div>
        
        <div class="d-md-none d-flex align-items-center ms-2">
            <a href="javascript:void(0)" class="page-header-right-open-toggle">
                <i class="feather-align-right fs-20"></i>
            </a>
        </div>
    </div>
</div>