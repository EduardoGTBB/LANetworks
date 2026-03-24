<?php
// api/api_borrar_cotizacion.php
declare(strict_types=1);
session_start();

// 1. Validar seguridad
if (!isset($_SESSION['id_user_admin'])) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Acceso denegado']);
    exit;
}

require_once 'config.php';
require_once '../lib/funciones_db.php';
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 2. Recibir el ID a borrar
    $id_cotizacion = (int)($_POST['id_cotizacion'] ?? 0);

    if ($id_cotizacion > 0) {
        try {
            // 3. Ejecutar la función de borrado
            $resultado = borrarCotizacion($pdo, $id_cotizacion);
            
            if ($resultado) {
                echo json_encode(['status' => 'success', 'message' => 'Cotización eliminada correctamente.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'No se pudo eliminar la cotización.']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'ID inválido.']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido.']);
}
?>