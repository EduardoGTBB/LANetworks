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
            $sql = "SELECT e.id_empresa, e.nombre_empresa, e.razon_social, e.rfc, e.dias_credito, e.estatus,
                           d.calle_numero, d.colonia, d.localidad, d.codigo_postal, d.municipio, d.estado, d.pais
                    FROM empresa e
                    LEFT JOIN domicilio_empresa d ON e.id_empresa = d.Empresa_id
                    WHERE e.id_empresa = ?";
            $stmt = $pdo->prepare($sql);
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
        
        // Empaquetar los datos
        $datos = [
            'id_empresa'     => (int)($_POST['id_empresa'] ?? 0),
            'nombre_empresa' => trim($_POST['nombre_empresa'] ?? ''),
            'razon_social'   => trim($_POST['razon_social'] ?? ''),
            'rfc'            => trim($_POST['rfc'] ?? ''),
            'dias_credito'   => (int)($_POST['dias_credito'] ?? 0),
            
            // Datos del domicilio
            'calle_numero'   => trim($_POST['calle_numero'] ?? ''),
            'colonia'        => trim($_POST['colonia'] ?? ''),
            'localidad'      => trim($_POST['localidad'] ?? ''),
            'codigo_postal'  => trim($_POST['codigo_postal'] ?? ''),
            'municipio'      => trim($_POST['municipio'] ?? ''),
            'estado'         => trim($_POST['estado'] ?? ''),
            'pais'           => trim($_POST['pais'] ?? 'México')
        ];

        if ($action === 'crear') {
            // Validación que no exista un duplicado antes de insertar
            $error_duplicado = verificarEmpresaExistente($pdo, $datos['nombre_empresa'], $datos['razon_social'], $datos['rfc']);

            if ($error_duplicado) {
                echo json_encode(['status' => 'error', 'message' => $error_duplicado]);
                exit;
            }

            insertarEmpresa($pdo, $datos);
            echo json_encode(['status' => 'success', 'message' => 'Empresa creada exitosamente.']);
        } 
        elseif ($action === 'editar') {
            // 🛡️ CIBERSEGURIDAD: Aseguramos que se pase el ID al validar para excluir la empresa actual
            $error_duplicado = verificarEmpresaExistente($pdo, $datos['nombre_empresa'], $datos['razon_social'], $datos['rfc'], $datos['id_empresa']);
            
            if ($error_duplicado) {
                echo json_encode(['status' => 'error', 'message' => $error_duplicado]);
                exit;
            }

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