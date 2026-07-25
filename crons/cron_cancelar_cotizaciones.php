<?php
declare(strict_types=1);

// 1. Requerir los archivos correctos del sistema actual
require __DIR__ . '/../api/config.php'; 
require __DIR__ . '/../lib/funciones_db.php';

// 2. config.php genera automáticamente la variable $pdo
if(!isset($pdo)){
    error_log("[" . date('Y-m-d H:i:s') . "] CRON ERROR: Sin conexión BD en cancelación.");
    exit("Error de conexión a la BD.\n");
}

try {
    // 3. Ejecuta la función pasando el objeto $pdo
    // El segundo parámetro son los días de tolerancia (ej. 30 días)
    $afectadas = cancelarCotizacionesAntiguas($pdo, 1); 
    
    $mensaje = "CRON OK: $afectadas cotizaciones expiradas fueron canceladas.";
    echo $mensaje . "\n";
    error_log("[" . date('Y-m-d H:i:s') . "] " . $mensaje);

} catch (Exception $e) {
    error_log("[" . date('Y-m-d H:i:s') . "] CRON EXCEPTION: " . $e->getMessage());
    echo "CRON ERROR: Revisa el log de errores.\n";
}
?>