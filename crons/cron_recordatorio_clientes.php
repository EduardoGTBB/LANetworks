<?php
    declare(strict_types=1);
    
    require __DIR__ . '/../api/config.php'; 
    require __DIR__ . '/../lib/funciones_db.php';

    // Verificamos el objeto $pdo generado en config.php
    if(!isset($pdo)){
        error_log("[" . date('Y-m-d H:i:s') . "] CRON ERROR: Sin conexión BD en recordatorio clientes.");
        exit;
    }

    // 🛡️ CORRECCIÓN: Quitamos el parámetro (7)
    // Pedimos al sistema TODO el universo de clientes con pendientes
    $clientes_pendientes = obtenerClientesCotizacionesPendientes($pdo);
    
    if(!empty($clientes_pendientes)){
        require __DIR__ . '/../mails/mail_recordatorio_clientes.php';
    } else {
        echo "CRON OK: Sin pendientes para clientes.\n";
    }
?>