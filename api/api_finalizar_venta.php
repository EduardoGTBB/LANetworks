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
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] == 'get') {
        $id_cot = (int)$_GET['id_cotizacion'];
        
        $direcciones = obtenerDireccionesCotizacion($pdo, $id_cot) ?: [];
        $direcciones['detalles'] = obtenerDetallesParaFinalizarVenta($pdo, $id_cot); 
        $direcciones['empresa_default'] = obtenerDomicilioPorCotizacion($pdo, $id_cot);
        
        // LÓGICA MVC: Extraemos la sucursal de destino general
        $sucursal_global = obtenerSucursalGlobalPorCotizacion($pdo, $id_cot);
        
        // Si hay una sucursal_global, NO es multisucursal
        $direcciones['es_multisucursal'] = empty($sucursal_global);
        $direcciones['sucursal_global'] = $sucursal_global;

        // Datos base de la cotización
        $stmtF = $pdo->prepare("SELECT folio_especial, Usuario_empresa_id, Empresa_id FROM cotizacion WHERE id_cotizacion = ?");
        $stmtF->execute([$id_cot]);
        $cotRow = $stmtF->fetch(PDO::FETCH_ASSOC);
        $direcciones['folio_especial'] = $cotRow['folio_especial'];

        // ✨ MAGIA: 1. Extraemos TODAS las direcciones de las PLAZAS del Solicitante
        $stmtUsrDom = $pdo->prepare("
            SELECT pd.*, p.nombre_plaza 
            FROM plaza_domicilio pd 
            JOIN plazas p ON pd.Plaza_id = p.id_plaza 
            JOIN usuario_plaza up ON p.id_plaza = up.Plaza_id 
            WHERE up.Usuario_id = ? AND pd.estatus = 'Y'
        ");
        $stmtUsrDom->execute([$cotRow['Usuario_empresa_id']]);
        $direcciones['domicilios_solicitante'] = $stmtUsrDom->fetchAll(PDO::FETCH_ASSOC);

        // ✨ MAGIA: 2. Extraemos TODAS las direcciones de la SUCURSAL MATRIZ de su Empresa
        $stmtMatrizDom = $pdo->prepare("
            SELECT pd.*, p.nombre_plaza 
            FROM plaza_domicilio pd 
            JOIN plazas p ON pd.Plaza_id = p.id_plaza 
            JOIN sucursal_plaza sp ON p.id_plaza = sp.Plaza_id 
            JOIN sucursales s ON sp.Sucursal_id = s.id_sucursal 
            WHERE s.id_sae = 1 AND s.Empresa_id = ? AND pd.estatus = 'Y'
        ");
        $stmtMatrizDom->execute([$cotRow['Empresa_id']]);
        $direcciones['domicilios_matriz'] = $stmtMatrizDom->fetchAll(PDO::FETCH_ASSOC);

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

<!-- ?php
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
    * //°if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] == 'get') {
        $id_cot = (int)$_GET['id_cotizacion'];
        $direcciones = obtenerDireccionesCotizacion($pdo, $id_cot) ?: [];
        $direcciones['detalles'] = obtenerDetallesParaFinalizarVenta($pdo, $id_cot); 

        $direcciones['empresa_default'] = obtenerDomicilioPorCotizacion($pdo, $id_cot);
        
        echo json_encode(['status' => 'success', 'data' => $direcciones]);
        exit;
    } *

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

        $stmtF = $pdo->prepare("SELECT folio_especial FROM cotizacion WHERE id_cotizacion = ?");
        $stmtF->execute([$id_cot]);
        $direcciones['folio_especial'] = $stmtF->fetchColumn();
        
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
?> -->