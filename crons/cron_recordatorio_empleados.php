<?php
    require __DIR__ . '/../admin_config.php';
    require __DIR__ . '/../admin_funciones.php';

    $conexion = conexion($bd_config);
    if(!$conexion){
        error_log("[" . date('Y-m-d H:i:s') . "] CRON ERROR: Sin conexión BD en recordatorio empleados.");
        exit;
    }

    // Obtenemos el arreglo de empleados con pendientes
    $empleados_pendientes = obtenerEmpleadosCotizacionesPendientes($conexion, 2);
    
    // Si hay datos, disparamos el archivo de correos tal como en tu ejemplo
    if(!empty($empleados_pendientes)){
        require __DIR__ . '/../mails/mail_recordatorio_empleados.php';
    } else {
        echo "CRON OK: Sin pendientes para empleados.";
    }
?>