<?php
    //Establecemos todos los permisos desactivados por defecto por seguridad 
    $permisos = [
        'mp_cotizador' => 'Desactivado',
        'mp_ver_cotiz' => 'Desactivado',
        'mp_ver_clientes' => 'Desactivado',
        'mp_ver_productos' => 'Desactivado',
        'mp_ver_usuarios' => 'Desactivado',
        'mp_ver_all_cotiz' => 'Desactivado',
        'mp_ver_reportes' => 'Desactivado'
    ];

    $es_cliente = isset($_SESSION['id_usuario_cliente']);
    $es_admin_maestro = (isset($_SESSION['perfil']) && $_SESSION['perfil'] === 'admin');

    if ($es_cliente) {
        // Si es cliente, forzamos que SOLO vea el cotizador
        $permisos['mp_cotizador'] = 'Activado';
        $permisos['mp_ver_cotiz'] = 'Activado';
    } else {
        // Si es administrador/operativo de LAN, leemos sus permisos reales de la BD
        try {
            include_once 'api/config.php'; 
            
            if (isset($pdo) && isset($_SESSION['id_user_admin'])) {
                $stmt_permisos = $pdo->prepare("SELECT mp_cotizador, mp_ver_cotiz, mp_ver_clientes, mp_ver_productos, mp_ver_usuarios FROM usuarios_admin WHERE id_user_admin = :id");
                $stmt_permisos->execute([':id' => $_SESSION['id_user_admin']]);
                $resultado = $stmt_permisos->fetch(PDO::FETCH_ASSOC);
                
                if ($resultado) {
                    // $permisos = $resultado;
                    $permisos = array_merge($permisos, $resultado);
                }
                
                $permisos['mp_ver_all_cotiz'] = $es_admin_maestro ? 'Activado' : 'Desactivado';
                $permisos['mp_ver_reportes'] = $es_admin_maestro ? 'Activado' : 'Desactivado';
                
            }
        } catch (Exception $e) {
            error_log("Error permisos: " . $e->getMessage());
        }
    }
?>

<nav class="nxl-navigation">
    <div class="navbar-wrapper">
        <div class="m-header">
            <a href="inicio.php" class="b-brand">
                <img src="assets/images/logo-head.png" alt="" class="logo logo-lg" />
                <img src="assets/images/logo-head.png" alt="" class="logo logo-sm" />
            </a>
        </div>
        <div class="navbar-content">
            <ul class="nxl-navbar">
                <li class="nxl-item nxl-caption">
                    <label>Menú</label>
                </li>
                
                <li class="nxl-item nxl-hasmenu">
                    <a href="inicio.php" class="nxl-link">
                        <span class="nxl-micon"><i class="feather-airplay"></i></span>
                        <span class="nxl-mtext">Inicio</span>
                    </a>
                </li>
                
                <?php if($permisos['mp_cotizador'] === 'Activado' || $permisos['mp_ver_cotiz'] === 'Activado'): ?>
                <li class="nxl-item nxl-hasmenu">
                    <a href="javascript:void(0);" class="nxl-link">
                        <span class="nxl-micon"><i class="feather-dollar-sign"></i></span>
                        <span class="nxl-mtext">Cotizaciones</span><span class="nxl-arrow"><i class="feather-chevron-right"></i></span>
                    </a>
                    <ul class="nxl-submenu">
                        <?php if($permisos['mp_cotizador'] === 'Activado'): ?>
                        <li class="nxl-item"><a class="nxl-link" href="cotizador.php">Cotizador</a></li>
                        <?php endif; ?>
                        
                        <?php if($permisos['mp_ver_cotiz'] === 'Activado'): ?>
                        <li class="nxl-item"><a class="nxl-link" href="ver_cotizaciones.php">Mis cotizaciones</a></li>
                        <?php endif; ?>

                        <?php if($permisos['mp_ver_all_cotiz'] === 'Activado'): ?>
                        <li class="nxl-item"><a class="nxl-link" href="ver_cotizaciones_all.php">Todas las cotizaciones</a></li>
                        <?php endif; ?>
                    </ul>
                </li>
                <?php endif; ?>

                <?php if($permisos['mp_ver_clientes'] === 'Activado'): ?>
                <li class="nxl-item nxl-hasmenu">
                    <a href="javascript:void(0);" class="nxl-link">
                        <span class="nxl-micon"><i class="feather-briefcase"></i></span>
                        <span class="nxl-mtext">Clientes</span><span class="nxl-arrow"><i class="feather-chevron-right"></i></span>
                    </a>
                    <ul class="nxl-submenu">
                        <li class="nxl-item"><a class="nxl-link" href="ver_clientes.php">Empresas</a></li>
                        <li class="nxl-item"><a class="nxl-link" href="ver_usuarios_cli.php">Usuarios</a></li>
                    </ul>
                </li>
                <?php endif; ?>

                <?php if($permisos['mp_ver_productos'] === 'Activado'): ?>
                <li class="nxl-item nxl-hasmenu">
                    <a href="javascript:void(0);" class="nxl-link">
                        <span class="nxl-micon"><i class="feather-box"></i></span>
                        <span class="nxl-mtext">Almacén</span><span class="nxl-arrow"><i class="feather-chevron-right"></i></span>
                    </a>
                    <ul class="nxl-submenu">
                        <li class="nxl-item"><a class="nxl-link" href="ver_productos.php">Productos</a></li>
                    </ul>
                </li>
                <?php endif; ?>

                <?php if($permisos['mp_ver_reportes'] === 'Activado'): ?>
                <li class="nxl-item nxl-hasmenu">
                    <a href="javascript:void(0);" class="nxl-link">
                        <span class="nxl-micon"><i class="feather-file-text"></i></span>
                        <span class="nxl-mtext">Reportes</span><span class="nxl-arrow"><i class="feather-chevron-right"></i></span>
                    </a>
                    <ul class="nxl-submenu">
                        <li class="nxl-item"><a class="nxl-link" href="#">Sales Report</a></li>
                        <li class="nxl-item"><a class="nxl-link" href="#">Leads Report</a></li>
                        <li class="nxl-item"><a class="nxl-link" href="#">Project Report</a></li>
                        <li class="nxl-item"><a class="nxl-link" href="#">Timesheets Report</a></li>
                    </ul>
                </li>
                <?php endif; ?>

                <?php if($permisos['mp_ver_usuarios'] === 'Activado'): ?>
                <li class="nxl-item nxl-hasmenu">
                    <a href="javascript:void(0);" class="nxl-link">
                        <span class="nxl-micon"><i class="feather-settings"></i></span>
                        <span class="nxl-mtext">Configuración</span><span class="nxl-arrow"><i class="feather-chevron-right"></i></span>
                    </a>
                    <ul class="nxl-submenu">
                        <li class="nxl-item"><a class="nxl-link" href="ver_usuarios.php">Empleados LAN</a></li>
                    </ul>
                </li>
                <?php endif; ?>

                <li class="nxl-item nxl-hasmenu">
                    <a href="logout.php" class="nxl-link">
                        <span class="nxl-micon"><i class="feather-log-out"></i></span>
                        <span class="nxl-mtext">Cerrar sesion</span>
                    </a>
                </li>
            </ul>
        </div>
    </div>
</nav>