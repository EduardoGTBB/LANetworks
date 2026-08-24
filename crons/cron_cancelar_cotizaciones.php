<?php
declare(strict_types=1);

// 1. Requerir los archivos correctos del sistema actual
require __DIR__ . '/../api/config.php'; 
require __DIR__ . '/../lib/funciones_db.php';

// 2. config.php genera automáticamente la variable $pdo
if(!isset($pdo)){
    // Esto es un error real, usamos error_log (va a STDERR) y exit(1) para decirle a Linux que falló
    error_log("[" . date('Y-m-d H:i:s') . "] CRON ERROR: Sin conexión BD en cancelación.");
    exit(1); 
}

try {
    // 3. Ejecuta la función pasando el objeto
    $afectadas = cancelarCotizacionesAntiguas($pdo, 30); 
    
    // El éxito se imprime con echo (va a STDOUT).
    $mensaje = "CRON OK: $afectadas cotizaciones expiradas fueron canceladas.";
    echo $mensaje . "\n";

} catch (Exception $e) {
    // Esto es un error real, usamos error_log para alertar a Plesk
    error_log("[" . date('Y-m-d H:i:s') . "] CRON EXCEPTION: " . $e->getMessage());
    exit(1);
}
?>