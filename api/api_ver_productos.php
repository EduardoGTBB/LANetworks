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

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo json_encode(obtenerProduct($pdo));
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? '';

        if ($action === 'crear' || $action === 'editar') {
            $foto_product = '';
            if (isset($_FILES['foto_product']) && $_FILES['foto_product']['error'] === UPLOAD_ERR_OK) {
                $ext = strtolower(pathinfo($_FILES['foto_product']['name'], PATHINFO_EXTENSION));
                $permitidos = ['jpg', 'jpeg', 'png', 'webp'];
                
                if (in_array($ext, $permitidos)) {
                    $nuevo_nombre = uniqid('prod_') . '.' . $ext;
                    $ruta_destino = '../assets/images/productos/' . $nuevo_nombre;
                    
                    if (move_uploaded_file($_FILES['foto_product']['tmp_name'], $ruta_destino)) {
                        $foto_product = $nuevo_nombre;

                        if ($action === 'editar') {
                            $id_product = (int)$_POST['id_product'];
                            $stmt = $pdo->prepare("SELECT foto_product FROM productos WHERE id_product = :id");
                            $stmt->execute([':id' => $id_product]);
                            $oldProd = $stmt->fetch(PDO::FETCH_ASSOC);

                            if ($oldProd && !empty($oldProd['foto_product']) && $oldProd['foto_product'] !== 'producto.png') {
                                $ruta_vieja = '../assets/images/productos/' . $oldProd['foto_product'];
                                if (file_exists($ruta_vieja)) { unlink($ruta_vieja); }
                            }
                        }
                    }
                }
            }

            $datos = [
                'descripcion_product' => trim($_POST['descripcion_product'] ?? ''),
                'clave_product'       => trim($_POST['clave_product'] ?? ''),
                'precio_farmacia'     => (float)($_POST['precio_farmacia'] ?? 0),
                'precio_publico'      => (float)($_POST['precio_publico'] ?? 0),
                'estatus'             => ($action === 'crear') ? 'Y' : (isset($_POST['estatus']) ? 'Y' : 'N'),
                'foto_product'        => $foto_product
            ];

            if ($action === 'editar') {
                $datos['id_product'] = (int)$_POST['id_product'];
                actualizarProduct($pdo, $datos);
                echo json_encode(['status' => 'success', 'message' => 'Producto actualizado correctamente']);
            } else {
                insertarProduct($pdo, $datos);
                echo json_encode(['status' => 'success', 'message' => 'Producto agregado correctamente']);
            }
        } elseif ($action === 'eliminar') {
            $id = (int)$_POST['id_product'];
            $resultado = eliminarProduct($pdo, $id);
            
            if ($resultado === 'inactivado') {
                echo json_encode(['status' => 'warning', 'message' => 'El producto no se puede eliminar porque está en una cotización. Se ha cambiado su estatus a INACTIVO.']);
            } else {
                echo json_encode(['status' => 'success', 'message' => 'Producto eliminado permanentemente de la base de datos.']);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Acción no válida']);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor: ' . $e->getMessage()]);
}