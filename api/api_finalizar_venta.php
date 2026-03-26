<?php
declare(strict_types=1);
session_start();

if (!isset($_SESSION['id_user_admin']) && !isset($_SESSION['id_usuario_cliente'])) {
    http_response_code(403);
    exit(json_encode(['status' => 'error', 'message' => 'Acceso denegado']));
}

require_once 'config.php';
require_once '../lib/funciones_db.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // GET: Leer el domicilio original de la empresa
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id_cotizacion'])) {
        $domicilio = obtenerDomicilioPorCotizacion($pdo, (int)$_GET['id_cotizacion']);
        echo json_encode(['status' => 'success', 'data' => $domicilio]);
        exit;
    }

    // POST: Guardar los 3 formularios
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $id_cot = (int)($_POST['id_cotizacion'] ?? 0);
        if ($id_cot === 0) exit(json_encode(['status' => 'error', 'message' => 'ID inválido.']));

        $fiscal = ['calle' => $_POST['f_calle'], 'colonia' => $_POST['f_colonia'], 'localidad' => $_POST['f_localidad'], 'cp' => $_POST['f_cp'], 'municipio' => $_POST['f_municipio'], 'estado' => $_POST['f_estado']];
        $cert   = ['calle' => $_POST['c_calle'], 'colonia' => $_POST['c_colonia'], 'localidad' => $_POST['c_localidad'], 'cp' => $_POST['c_cp'], 'municipio' => $_POST['c_municipio'], 'estado' => $_POST['c_estado']];
        $envio  = ['calle' => $_POST['e_calle'], 'colonia' => $_POST['e_colonia'], 'localidad' => $_POST['e_localidad'], 'cp' => $_POST['e_cp'], 'municipio' => $_POST['e_municipio'], 'estado' => $_POST['e_estado']];

        formalizarVenta($pdo, $id_cot, $fiscal, $cert, $envio);
        
        echo json_encode(['status' => 'success', 'message' => '¡Venta formalizada exitosamente!']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
}
?>