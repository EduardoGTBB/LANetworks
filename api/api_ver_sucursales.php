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
            echo json_encode(obtenerAllSucursales($pdo));
        } 
        elseif ($action === 'get_sucursal') {
            $id = (int)$_GET['id'];
            $stmt = $pdo->prepare("SELECT * FROM sucursales WHERE id_sucursal = ?");
            $stmt->execute([$id]);
            $sucursal = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($sucursal) {
                $stmtPlaza = $pdo->prepare("SELECT Plaza_id FROM sucursal_plaza WHERE Sucursal_id = ?");
                $stmtPlaza->execute([$id]);
                $sucursal['plazas_ids'] = $stmtPlaza->fetchAll(PDO::FETCH_COLUMN);

                echo json_encode(['status' => 'success', 'data' => $sucursal]);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Sucursal no encontrada']);
            }
        }elseif ($action === 'get_next_sae') { // ✨ NUEVO: Endpoint para obtener el siguiente ID SAE automáticamente
            // CAST convierte valores de texto a número (ej. "828") de forma segura para buscar el más alto
            $stmt = $pdo->query("SELECT MAX(CAST(id_sae AS UNSIGNED)) FROM sucursales");
            $max_sae = (int)$stmt->fetchColumn();
            
            // Si hay registros sumamos 1, si la tabla está vacía empezamos en 1
            $next_sae = $max_sae > 0 ? $max_sae + 1 : 1;
            
            echo json_encode(['status' => 'success', 'next_sae' => $next_sae]);
        }
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? '';
        
        if (($action === 'crear' || $action === 'editar') && !empty($_POST['id_sae'])) {
            $id_check = ($action === 'editar') ? (int)$_POST['id_sucursal'] : 0;
            $sql = "SELECT id_sucursal FROM sucursales WHERE id_sae = ? AND id_sucursal != ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([trim($_POST['id_sae']), $id_check]);
            if ($stmt->fetch()) {
                exit(json_encode(['status' => 'error', 'message' => 'El ID SAE ingresado ya pertenece a otra sucursal.']));
            }
        }

        if ($action === 'crear') {
            insertarSucursal($pdo, $_POST);
            echo json_encode(['status' => 'success', 'message' => 'Sucursal creada exitosamente.']);
        } 
        elseif ($action === 'editar') {
            $_POST['estatus'] = isset($_POST['estatus']) ? 'Y' : 'N';
            actualizarSucursal($pdo, $_POST);
            echo json_encode(['status' => 'success', 'message' => 'Sucursal actualizada exitosamente.']);
        } 
        elseif ($action === 'eliminar') {
            $res = eliminarSucursal($pdo, (int)$_POST['id_sucursal']);
            $msg = ($res === 'eliminada') ? 'Sucursal eliminada permanentemente.' : 'Sucursal inactivada por tener cotizaciones ligadas.';
            echo json_encode(['status' => 'success', 'message' => $msg]);
        }
        exit;
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error BD: ' . $e->getMessage()]);
}
?>