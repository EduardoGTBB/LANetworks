<?php
    require __DIR__ . '/../admin_config.php';
    require __DIR__ . '/../admin_funciones.php';

    $conexion = conexion($bd_config);
    if(!$conexion){
        error_log("[" . date('Y-m-d H:i:s') . "] CRON ERROR: Sin conexión BD en cancelación.");
        exit; // Usamos exit en lugar de header() para scripts de consola
    }

    // Ejecuta la función (que crearemos en admin_funciones.php)
    $afectadas = cancelarCotizacionesAntiguas($conexion, 1);
    // $afectadas = cancelarCotizacionesAntiguas($conexion, 30);
    echo "CRON OK: $afectadas cotizaciones canceladas.";
?>