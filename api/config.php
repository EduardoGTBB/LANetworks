<?php
// Credenciales para la conexión
/* Archivo para la conexión a la BD.*/
declare(strict_types=1);

define('DB_HOST','localhost');
define('DB_NAME','la_networks');
define('DB_USER', 'root');
define('DB_PASS','root');
define('DB_CHARSET','utf8mb4');
define('SUCURSAL_MATRIZ_NOMBRE', 'SIN SUCURSAL');

// Configuración de PDO

$CPDO = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET ;

$options = [
    PDO::ATTR_ERRMODE               => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE    => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES      => false,
];

try{
    $pdo = new PDO($CPDO, DB_USER , DB_PASS, $options);
}catch(Exception $e){
    // Error grave de conexión. No podemos continuar.
    http_response_code(500); 

    // En producción, nunca muestres el error detallado al usuario.
    // Regístralo en un log.
    error_log("Error de conexión a BD: " . $e->getMessage()); //

    // Mensaje genérico para el cliente
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor. No se pudo conectar a la base de datos.'
    ]); //
}

?>