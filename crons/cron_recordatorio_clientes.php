<?php
    declare(strict_types=1);
    
    require __DIR__ . '/../api/config.php'; 
    require __DIR__ . '/../lib/funciones_db.php';

    // Verificamos el objeto $pdo generado en config.php
    if(!isset($pdo)){
        error_log("[" . date('Y-m-d H:i:s') . "] CRON ERROR: Sin conexión BD en recordatorio clientes.");
        exit;
    }

    // Obtenemos clientes con cotizaciones pendientes de hace 2 días o más
    $clientes_pendientes = obtenerClientesCotizacionesPendientes($pdo, 7);
    
    if(!empty($clientes_pendientes)){
        require __DIR__ . '/../mails/mail_recordatorio_clientes.php';
    } else {
        echo "CRON OK: Sin pendientes para clientes.\n";
    }
?>