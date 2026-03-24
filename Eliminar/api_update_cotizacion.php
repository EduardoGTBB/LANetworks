<?php
// api/api_editar_cotizacion.php
declare(strict_types=1);
session_start();

if (!isset($_SESSION['id_user_admin'])) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Acceso denegado']);
    exit;
}

require_once 'config.php';
require_once '../lib/funciones_db.php';
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    $id_cotizacion = (int)($_POST['id_cotizacion'] ?? 0);
    $empresa_id    = (int)($_POST['Empresa_id'] ?? 0);
    $usuario_id    = (int)($_POST['Usuario_id'] ?? 0);
    $sub_total     = (float)($_POST['sub_total'] ?? 0);
    $total_iva     = (float)($_POST['total_amount'] ?? 0);

    // Validar datos básicos
    if ($id_cotizacion === 0 || $empresa_id === 0 || $usuario_id === 0) {
        echo json_encode(['status' => 'error', 'message' => 'Faltan datos obligatorios (Cliente o Solicitante).']);
        exit;
    }

    // Procesar los productos enviados
    $productos_ids = $_POST['productos'] ?? [];
    $cantidades    = $_POST['cantidad_cot'] ?? [];
    $unitarios     = $_POST['unitario'] ?? [];
    $totales       = $_POST['total'] ?? [];

    $detalles = [];
    for ($i = 0; $i < count($productos_ids); $i++) {
        if (!empty($productos_ids[$i]) && (int)$cantidades[$i] > 0) {
            $detalles[] = [
                'producto_id'      => (int) $productos_ids[$i],
                'cantidad'         => (int) $cantidades[$i],
                'precio_unitario'  => (float) $unitarios[$i],
                'precio_extendido' => (float) $totales[$i]
            ];
        }
    }

    if (count($detalles) === 0) {
        echo json_encode(['status' => 'error', 'message' => 'Debes agregar al menos un producto con cantidad mayor a 0.']);
        exit;
    }

    // Empaquetar y enviar al modelo
    $datosCotizacion = [
        'empresa_id'    => $empresa_id,
        'usuario_id'    => $usuario_id,
        'importe_total' => $sub_total,
        'precio_iva'    => $total_iva 
    ];

    try {
        updateCotizacion($pdo, $id_cotizacion, $datosCotizacion, $detalles);
        echo json_encode(['status' => 'success', 'message' => 'Cotización actualizada correctamente.']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error de base de datos: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
}
?>