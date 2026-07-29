<?php
    declare(strict_types=1);
    
    require __DIR__ . '/../api/config.php'; 
    require __DIR__ . '/../lib/funciones_db.php';

    if(!isset($pdo)){
        error_log("[" . date('Y-m-d H:i:s') . "] CRON ERROR: Sin conexión BD en recordatorio empleados.");
        exit;
    }

    // 🛡️ CORRECCIÓN: Quitamos el parámetro numérico (2 o 7)
    // El VPS ya ejecuta esto semanalmente, así que pedimos TODO lo pendiente.
    $empleados_pendientes = obtenerEmpleadosCotizacionesPendientes($pdo);
    
    if(!empty($empleados_pendientes)){
        require __DIR__ . '/../mails/mail_recordatorio_empleados.php';
    } else {
        echo "CRON OK: Sin pendientes para empleados.\n";
    }
?>