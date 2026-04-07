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

    // GET: Leer direcciones previas y/o el domicilio original de la empresa
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id_cotizacion'])) {
        $id_cot = (int)$_GET['id_cotizacion'];

        $stmtStatus = $pdo->prepare("SELECT estatus FROM cotizacion WHERE id_cotizacion = ?");
        $stmtStatus->execute([$id_cot]);
        $cotData = $stmtStatus->fetch(PDO::FETCH_ASSOC);
        
        // 1. Buscamos si ya tiene direcciones guardadas (Por si LAN la está editando)
        $direcciones = obtenerDireccionesCotizacion($pdo, $id_cot);
        
        // 2. Traemos la dirección original de la empresa para rellenar "Fiscal"
        $empresaDefault = obtenerDomicilioPorCotizacion($pdo, $id_cot);
        $direcciones['estatus_cotizacion'] = $cotData['estatus'] ?? 'Guardado'; // Agregamos el estatus
        
        // Unimos todo en un solo paquete JSON
        $direcciones['empresa_default'] = $empresaDefault;

        echo json_encode(['status' => 'success', 'data' => $direcciones]);
        exit;
    }

    // POST: Guardar los 3 formularios
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $id_cot = (int)($_POST['id_cotizacion'] ?? 0);
        if ($id_cot === 0) exit(json_encode(['status' => 'error', 'message' => 'ID inválido.']));

        $fiscal = ['calle' => $_POST['f_calle'], 'colonia' => $_POST['f_colonia'], 'localidad' => $_POST['f_localidad'], 'cp' => $_POST['f_cp'], 'municipio' => $_POST['f_municipio'], 'estado' => $_POST['f_estado']];
        $cert   = ['calle' => $_POST['c_calle'], 'colonia' => $_POST['c_colonia'], 'localidad' => $_POST['c_localidad'], 'cp' => $_POST['c_cp'], 'municipio' => $_POST['c_municipio'], 'estado' => $_POST['c_estado']];
        $envio  = ['calle' => $_POST['e_calle'], 'colonia' => $_POST['e_colonia'], 'localidad' => $_POST['e_localidad'], 'cp' => $_POST['e_cp'], 'municipio' => $_POST['e_municipio'], 'estado' => $_POST['e_estado']];

        // NUEVO: Detectar si el usuario activo es un cliente
        $es_cliente = isset($_SESSION['id_usuario_cliente']);

        // Pasamos el nuevo parámetro a la función
        formalizarVenta($pdo, $id_cot, $fiscal, $cert, $envio, $es_cliente);
        
        echo json_encode(['status' => 'success', 'message' => '¡Direcciones guardadas correctamente!']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
}
?>