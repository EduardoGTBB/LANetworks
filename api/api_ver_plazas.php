<?php

declare(strict_types=1);
session_start();

if (!isset($_SESSION['id_user_admin'])) {
    http_response_code(403);
    exit(json_encode(['status' => 'error', 'message' => 'Acceso denegado']));
}

require_once 'config.php';
require_once '../lib/funciones_db.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? 'leer';

        if ($action === 'leer') {
            echo json_encode(obtenerAllPlazasAgrupadas($pdo));
        } elseif ($action === 'get_plaza') {
            $id = (int)$_GET['id'];
            echo json_encode(['status' => 'success', 'data' => getPlazaCompletaPorId($pdo, $id)]);
        }
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? '';

        if ($action === 'guardar') {
            guardarPlazaAgrupada($pdo, $_POST);
            echo json_encode(['status' => 'success', 'message' => 'Plaza procesada exitosamente.']);
        } elseif ($action === 'eliminar') {
            eliminarPlazaCompleta($pdo, (int)$_POST['id_plaza']);
            echo json_encode(['status' => 'success', 'message' => 'Plaza eliminada del catálogo.']);
        }
        exit;
    }
} catch (Throwable $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error BD: ' . $e->getMessage()]);
}
