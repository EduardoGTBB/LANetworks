<?php

declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once 'config.php';
require_once '../lib/funciones_db.php';

// Verificación de sesión de administrador
if (!isset($_SESSION['id_user_admin'])) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Acceso denegado. Sesión no válida.']);
    exit;
}

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ==========================================
    // MÉTODO GET: Obtener lista o un producto
    // ==========================================
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? 'leer';

        if ($action === 'leer_uno' && isset($_GET['id'])) {
            $id = (int)$_GET['id'];
            $producto = obtenerProductPorId($pdo, $id);
            echo json_encode($producto ?: null);
        } else {
            $productos = obtenerProduct($pdo);
            echo json_encode($productos ?: []);
        }
        exit;
    }

    // ==========================================
    // MÉTODO POST: Crear, Editar o Eliminar
    // ==========================================
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? 'crear';
        $id_evaluar = (int)($_POST['id_product'] ?? 0);

        // --- BLINDAJE 1: Forzar Edición ---
        if ($id_evaluar > 0 && $action !== 'eliminar') {
            $action = 'editar';
        }

        if ($action === 'crear' || $action === 'editar') {
            $clave_evaluar = trim($_POST['clave_product'] ?? '');

            // Validar clave duplicada
            $id_check = ($action === 'editar') ? $id_evaluar : 0;
            $sql_check = "SELECT id_product FROM productos WHERE clave_product = ? AND id_product != ?";
            $stmt_ch = $pdo->prepare($sql_check);
            $stmt_ch->execute([$clave_evaluar, $id_check]);
            
            if ($stmt_ch->fetch()) {
                echo json_encode(['status' => 'error', 'message' => 'La clave del producto ya existe.']);
                exit;
            }

            // --- BLINDAJE 2: RESCATAR FOTO ORIGINAL ---
            $foto_final = 'producto.png'; // Por defecto
            if ($action === 'editar' && $id_evaluar > 0) {
                // Buscamos el producto en BD para no perder su foto actual
                $producto_bd = obtenerProductPorId($pdo, $id_evaluar);
                if ($producto_bd && !empty($producto_bd['foto_product'])) {
                    $foto_final = $producto_bd['foto_product'];
                }
            }

            // Si el usuario subió una foto NUEVA, entonces sí la reemplazamos
            if (isset($_FILES['foto_product']) && $_FILES['foto_product']['error'] === UPLOAD_ERR_OK) {
                $fileTmpPath = $_FILES['foto_product']['tmp_name'];
                $fileName = $_FILES['foto_product']['name'];
                $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                $newFileName = 'prod_' . uniqid() . '.' . $fileExtension;
                
                $uploadFileDir = '../assets/images/productos/';
                if (move_uploaded_file($fileTmpPath, $uploadFileDir . $newFileName)) {
                    // Borramos la viejita si existía y no era la genérica
                    if ($foto_final !== 'producto.png' && file_exists($uploadFileDir . $foto_final)) {
                        unlink($uploadFileDir . $foto_final);
                    }
                    $foto_final = $newFileName;
                }
            }

            $marca_p = trim($_POST['marca_product'] ?? '');
            if($marca_p === '') $marca_p = 'N/A';

            $datos = [
                'clave_product'       => $clave_evaluar,
                'descripcion_product' => trim($_POST['descripcion_product'] ?? ''),
                'marca_product'       => $marca_p,
                'tipo_product'        => trim($_POST['tipo_product'] ?? 'N/A'),
                'estado_product'      => trim($_POST['estado_product'] ?? 'N/A'),
                'pf_equipo'           => (float)($_POST['pf_equipo'] ?? 0),
                'pf_calib'            => (float)($_POST['pf_calib'] ?? 0),
                'pp_equipo'           => (float)($_POST['pp_equipo'] ?? 0),
                'pp_calib'            => (float)($_POST['pp_calib'] ?? 0),
                'estatus'             => isset($_POST['estatus']) ? 'Y' : 'N',
                'foto_product'        => $foto_final
            ];

            if ($action === 'editar') {
                $datos['id_product'] = $id_evaluar;
                actualizarProduct($pdo, $datos);
                echo json_encode(['status' => 'success', 'message' => 'Producto actualizado correctamente.']);
            } else {
                insertarProduct($pdo, $datos);
                echo json_encode(['status' => 'success', 'message' => 'Producto agregado correctamente.']);
            }
            exit;
            
        } elseif ($action === 'eliminar') {
            $id = (int)($_POST['id_product'] ?? 0);
            $resultado = eliminarProduct($pdo, $id);
            $status = ($resultado === 'inactivado') ? 'warning' : 'success';
            $msg = ($resultado === 'inactivado') ? 'Producto inactivado (tiene cotizaciones).' : 'Producto eliminado permanentemente.';
            echo json_encode(['status' => $status, 'message' => $msg]);
            exit;
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
}