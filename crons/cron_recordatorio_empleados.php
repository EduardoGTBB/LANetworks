<?php
    declare(strict_types=1);
    
    require __DIR__ . '/../api/config.php'; 
    require __DIR__ . '/../lib/funciones_db.php';

    if(!isset($pdo)){
        error_log("[" . date('Y-m-d H:i:s') . "] CRON ERROR: Sin conexión BD en recordatorio empleados.");
        exit;
    }

    // Obtenemos empleados con cotizaciones pendientes
    $empleados_pendientes = obtenerEmpleadosCotizacionesPendientes($pdo, 2);
    
    if(!empty($empleados_pendientes)){
        require __DIR__ . '/../mails/mail_recordatorio_empleados.php';
    } else {
        echo "CRON OK: Sin pendientes para empleados.\n";
    }
?>