<?php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once 'config.php';
require_once '../lib/funciones_db.php';

if (!isset($_SESSION['id_user_admin']) && !isset($_SESSION['id_usuario_cliente'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Acceso denegado']);
    exit;
}

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Identificar quién es el usuario actual
    $id_cliente = isset($_SESSION['id_usuario_cliente']) ? (int)$_SESSION['id_usuario_cliente'] : 0;
    $id_admin   = isset($_SESSION['id_user_admin']) ? (int)$_SESSION['id_user_admin'] : 0;
    $perfil     = $_SESSION['perfil'] ?? 'cliente';

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $estadisticas = obtenerEstadisticasDashboard($pdo, $id_cliente, $id_admin, $perfil);
        $recientes    = obtenerCotizacionesRecientes($pdo, $id_cliente, $id_admin, $perfil);
        $grafica      = obtenerGraficaCotizaciones($pdo, $id_cliente, $id_admin, $perfil);

        echo json_encode([
            'status' => 'success',
            'estadisticas' => $estadisticas,
            'recientes' => $recientes,
            'grafica' => $grafica
        ]);
        exit;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor: ' . $e->getMessage()]);
}
?>