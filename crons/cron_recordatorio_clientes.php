<?php
    require __DIR__ . '/../admin_config.php';
    require __DIR__ . '/../admin_funciones.php';

    $conexion = conexion($bd_config);
    if(!$conexion){
        error_log("[" . date('Y-m-d H:i:s') . "] CRON ERROR: Sin conexión BD en recordatorio clientes.");
        exit;
    }

    // Obtenemos el arreglo de clientes con pendientes
    $clientes_pendientes = obtenerClientesCotizacionesPendientes($conexion, 2);
    
    if(!empty($clientes_pendientes)){
        require __DIR__ . '/../mails/mail_recordatorio_clientes.php';
    } else {
        echo "CRON OK: Sin pendientes para clientes.";
    }
?>