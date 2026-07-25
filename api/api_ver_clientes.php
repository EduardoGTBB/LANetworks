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

    // ==========================================
    // MÉTODO GET: LEER DATOS
    // ==========================================
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? 'leer';

        if ($action === 'leer') {
            // Traer todas las empresas
            $stmt = $pdo->prepare("SELECT id_empresa, nombre_empresa, razon_social, rfc, dias_credito, estatus FROM empresa ORDER BY id_empresa DESC");
            $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } 
        elseif ($action === 'leer_uno') {
            // Traer una empresa para editar
            $id = (int)$_GET['id'];
            $stmt = $pdo->prepare("SELECT id_empresa, nombre_empresa, razon_social, rfc, dias_credito, estatus FROM empresa WHERE id_empresa = ?");
            $stmt->execute([$id]);
            $empresa = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($empresa) {
                echo json_encode(['status' => 'success', 'data' => $empresa]);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Empresa no encontrada']);
            }
        }
        exit;
    }

    // ==========================================
    // MÉTODO POST: CREAR, EDITAR, ELIMINAR
    // ==========================================
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? '';
        
        // Empaquetar solo los datos que requiere el nuevo modelo
        $datos = [
            'id_empresa'     => (int)($_POST['id_empresa'] ?? 0),
            'nombre_empresa' => trim($_POST['nombre_empresa'] ?? ''),
            'razon_social'   => trim($_POST['razon_social'] ?? ''),
            'rfc'            => trim($_POST['rfc'] ?? ''),
            'dias_credito'   => (int)($_POST['dias_credito'] ?? 0)
        ];

        if ($action === 'crear') {
            insertarEmpresa($pdo, $datos);
            echo json_encode(['status' => 'success', 'message' => 'Empresa creada exitosamente.']);
        } 
        elseif ($action === 'editar') {
            actualizarEmpresa($pdo, $datos);
            
            // Si actualizaron el estatus, lo aplicamos
            if (isset($_POST['estatus'])) {
                $estatus = $_POST['estatus'] == 'Y' ? 'Y' : 'N';
                $pdo->prepare("UPDATE empresa SET estatus = ? WHERE id_empresa = ?")->execute([$estatus, $datos['id_empresa']]);
            } else {
                $pdo->prepare("UPDATE empresa SET estatus = 'N' WHERE id_empresa = ?")->execute([$datos['id_empresa']]);
            }
            
            echo json_encode(['status' => 'success', 'message' => 'Empresa actualizada exitosamente.']);
        } 
        elseif ($action === 'eliminar') {
            $id_empresa = (int)$_POST['id_empresa'];
            
            // Revisar si la empresa tiene sucursales antes de borrar
            $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM sucursales WHERE Empresa_id = ?");
            $stmtCheck->execute([$id_empresa]);
            
            if ($stmtCheck->fetchColumn() > 0) {
                // Borrado lógico (Inactivar)
                $pdo->prepare("UPDATE empresa SET estatus = 'N' WHERE id_empresa = ?")->execute([$id_empresa]);
                echo json_encode(['status' => 'success', 'message' => 'La empresa se ha inactivado porque tiene sucursales ligadas.']);
            } else {
                // Borrado físico
                $pdo->prepare("DELETE FROM empresa WHERE id_empresa = ?")->execute([$id_empresa]);
                echo json_encode(['status' => 'success', 'message' => 'Empresa eliminada permanentemente.']);
            }
        }
        exit;
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error de Base de Datos: ' . $e->getMessage()]);
}
?>