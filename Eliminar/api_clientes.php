<?php
// api/api_clientes.php
declare(strict_types=1);

session_start();

require_once 'config.php';
require_once '../lib/funciones_db.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['id_user_admin'])) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Acceso denegado']);
    exit;
}

try {
    // ¡LA CLAVE DE LA SOLUCIÓN! Forzamos a que cualquier error SQL lance una excepción y no se oculte
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ==========================================
    // MÉTODO GET: Leer clientes para la tabla
    // ==========================================
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? '';
        
        if ($action === 'leer') {
            $empresas = obtenerAllempresas($pdo);
            echo json_encode($empresas);
        } else {
            echo json_encode(['error' => 'Acción GET no válida']);
        }
        exit;
    }

    // ==========================================
    // MÉTODO POST: Crear, Editar o Eliminar
    // ==========================================
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? '';

        if ($action === 'crear' || $action === 'editar') {
            // Recolectamos y limpiamos los datos con trim()
            $datos = [
                'nombre_empresa' => trim($_POST['nombre_empresa'] ?? ''),
                'razon_social'   => trim($_POST['razon_social'] ?? ''),
                'rfc'            => trim($_POST['rfc'] ?? ''),
                'telefono'       => trim($_POST['telefono'] ?? ''),
                'correo'         => trim($_POST['correo'] ?? ''),
                'calle_numero'   => trim($_POST['calle_numero'] ?? ''),
                'colonia'        => trim($_POST['colonia'] ?? ''),
                'localidad'      => trim($_POST['localidad'] ?? ''),
                'codigo_postal'  => trim($_POST['codigo_postal'] ?? ''),
                'municipio'      => trim($_POST['municipio'] ?? ''),
                'estado'         => trim($_POST['estado'] ?? ''),
                'pais'           => trim($_POST['pais'] ?? 'México'),
            ];

            if ($action === 'editar') {
                $datos['id_empresa'] = (int)$_POST['id_empresa'];
                actualizarEmpresa($pdo, $datos);
                echo json_encode(['status' => 'success', 'message' => 'Cliente actualizado correctamente']);
            } else {
                insertarEmpresa($pdo, $datos);
                echo json_encode(['status' => 'success', 'message' => 'Cliente agregado correctamente']);
            }
        }
        elseif ($action === 'eliminar') {
            $id = (int)$_POST['id_empresa'];
            eliminarEmpresa($pdo, $id);
            echo json_encode(['status' => 'success', 'message' => 'Cliente eliminado']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Acción POST no válida']);
        }
    }

} catch (Exception $e) {
    http_response_code(500);
    // Ahora, si la base de datos falla, la alerta te dirá EXACTAMENTE qué falló
    echo json_encode(['status' => 'error', 'message' => 'Error BD: ' . $e->getMessage()]);
}
?>