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

    // GET
    /* //°if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] == 'get') {
        $id_cot = (int)$_GET['id_cotizacion'];
        $direcciones = obtenerDireccionesCotizacion($pdo, $id_cot) ?: [];
        $direcciones['detalles'] = obtenerDetallesParaFinalizarVenta($pdo, $id_cot); 

        $direcciones['empresa_default'] = obtenerDomicilioPorCotizacion($pdo, $id_cot);
        
        echo json_encode(['status' => 'success', 'data' => $direcciones]);
        exit;
    } */

    // GET
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] == 'get') {
        $id_cot = (int)$_GET['id_cotizacion'];
        
        $direcciones = obtenerDireccionesCotizacion($pdo, $id_cot) ?: [];
        $direcciones['detalles'] = obtenerDetallesParaFinalizarVenta($pdo, $id_cot); 
        $direcciones['empresa_default'] = obtenerDomicilioPorCotizacion($pdo, $id_cot);
        
        // ✨ LÓGICA MVC: Extraemos la sucursal de destino general
        $sucursal_global = obtenerSucursalGlobalPorCotizacion($pdo, $id_cot);
        
        // Si hay una sucursal_global, NO es multisucursal
        $direcciones['es_multisucursal'] = empty($sucursal_global);
        $direcciones['sucursal_global'] = $sucursal_global;
        
        echo json_encode(['status' => 'success', 'data' => $direcciones]);
        exit;
    }
    
    // POST
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true); 

        $id_cot = (int)($datos['id_cotizacion'] ?? 0);
        $fiscal = $datos['fiscal'] ?? []; 
        $equipos = $datos['equipos'] ?? [];

        if ($id_cot === 0 || empty($equipos)) {
            exit(json_encode(['status' => 'error', 'message' => 'Datos inválidos.']));
        }

        formalizarVentaEquipos($pdo, $id_cot, $fiscal, $equipos);
        
        echo json_encode(['status' => 'success', 'message' => '¡Direcciones enlazadas correctamente!']);
        exit;
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error BD: ' . $e->getMessage()]);
}
?>