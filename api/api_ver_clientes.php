<?php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once 'config.php';
require_once '../lib/funciones_db.php';

if (!isset($_SESSION['id_user_admin'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Acceso denegado']);
    exit;
}

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // GET: Leer Empresas
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo json_encode(obtenerAllempresas($pdo));
        exit;
    }

    // POST: Crear, Editar o Eliminar
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? '';

        if ($action === 'crear' || $action === 'editar') {

            $nombre_evaluar = trim($_POST['nombre_empresa'] ?? '');
            $razon_evaluar  = mb_strtoupper(trim($_POST['razon_social'] ?? ''), 'UTF-8');
            $rfc_evaluar    = mb_strtoupper(trim($_POST['rfc'] ?? ''), 'UTF-8');
            $id_evaluar     = ($action === 'editar') ? (int)($_POST['id_empresa'] ?? 0) : 0;

            // Verificamos si la empresa ya existe en la BD
            $error_duplicado = verificarEmpresaExistente($pdo, $nombre_evaluar, $razon_evaluar, $rfc_evaluar, $id_evaluar);
            if ($error_duplicado !== false) {
                // Si existe, detenemos el proceso y mandamos el error al JS
                echo json_encode(['status' => 'error', 'message' => $error_duplicado]);
                exit;
            }

            $datos = [
                'nombre_empresa' => trim($_POST['nombre_empresa'] ?? ''),
                'razon_social'   => mb_strtoupper(trim($_POST['razon_social'] ?? ''), 'UTF-8'),
                'rfc'            => mb_strtoupper(trim($_POST['rfc'] ?? ''), 'UTF-8'),
                'telefono'       => trim($_POST['telefono'] ?? ''),
                'correo'         => trim($_POST['correo'] ?? ''),
                'calle_numero'   => trim($_POST['calle_numero'] ?? ''),
                'colonia'        => trim($_POST['colonia'] ?? ''),
                'localidad'      => trim($_POST['localidad'] ?? ''),
                'codigo_postal'  => trim($_POST['codigo_postal'] ?? ''),
                'municipio'      => trim($_POST['municipio'] ?? ''),
                'estado'         => trim($_POST['estado'] ?? ''),
                'pais'           => trim($_POST['pais'] ?? 'México'),
                'estatus'        => ($action === 'crear') ? 'Y' : (isset($_POST['estatus']) ? 'Y' : 'N')
            ];

            if ($action === 'editar') {
                $datos['id_empresa'] = (int)$_POST['id_empresa'];
                actualizarEmpresa($pdo, $datos);
                echo json_encode(['status' => 'success', 'message' => 'Empresa actualizada correctamente']);
            } else {
                insertarEmpresa($pdo, $datos);
                echo json_encode(['status' => 'success', 'message' => 'Empresa agregada correctamente']);
            }
        } 
        elseif ($action === 'eliminar') {
            $id = (int)$_POST['id_empresa'];
            $resultado = eliminarEmpresa($pdo, $id);
            
            if ($resultado === 'inactivada') {
                echo json_encode(['status' => 'warning', 'message' => 'La empresa no se puede eliminar porque tiene usuarios enlazados. Se cambió su estatus a INACTIVA.']);
            } else {
                echo json_encode(['status' => 'success', 'message' => 'Empresa eliminada permanentemente.']);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Acción no válida']);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor: ' . $e->getMessage()]);
}
?>