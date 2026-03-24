<?php
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
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $admin_id = (int)$_SESSION['id_user_admin'];
        echo json_encode(obtenerusuarios($pdo, $admin_id));
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? '';

        if ($action === 'crear' || $action === 'editar') {
            $password_plana = trim($_POST['password'] ?? '');
            
            $foto_perfil = '';
            if (isset($_FILES['foto_perfil']) && $_FILES['foto_perfil']['error'] === UPLOAD_ERR_OK) {
                $ext = strtolower(pathinfo($_FILES['foto_perfil']['name'], PATHINFO_EXTENSION));
                $permitidos = ['jpg', 'jpeg', 'png', 'webp'];
                
                if (in_array($ext, $permitidos)) {
                    $nuevo_nombre = uniqid('usr_') . '.' . $ext;
                    $ruta_destino = '../assets/images/avatar/' . $nuevo_nombre;
                    
                    if (move_uploaded_file($_FILES['foto_perfil']['tmp_name'], $ruta_destino)) {
                        $foto_perfil = $nuevo_nombre;
                    }
                }
            }

            $datos = [
                'usuario_lan'     => trim($_POST['usuario_lan'] ?? ''),
                'admin_nombre'    => trim($_POST['admin_nombre'] ?? ''),
                'admin_apell_pat' => trim($_POST['admin_apell_pat'] ?? ''),
                'password'        => !empty($password_plana) ? password_hash($password_plana, PASSWORD_DEFAULT) : '',
                'perfil'          => trim($_POST['perfil'] ?? 'oper'),
                'estatus'         => ($action === 'crear') ? 'Y' : (isset($_POST['estatus']) ? 'Y' : 'N'),
                
                // ¡LA LÍNEA VITAL DE LA FOTO!
                'foto_perfil'     => $foto_perfil,
                
                'mp_cotizador'    => $_POST['mp_cotizador'] ?? 'Desactivado',
                'mp_ver_cotiz'    => $_POST['mp_ver_cotiz'] ?? 'Desactivado',
                'mp_ver_clientes' => $_POST['mp_ver_clientes'] ?? 'Desactivado',
                'mp_ver_productos'=> $_POST['mp_ver_productos'] ?? 'Desactivado',
                'mp_ver_usuarios' => $_POST['mp_ver_usuarios'] ?? 'Desactivado',
            ];

            if ($action === 'editar') {
                $datos['id_user_admin'] = (int)$_POST['id_user_admin'];
                actualizarUsuarioAdmin($pdo, $datos);
                echo json_encode(['status' => 'success', 'message' => 'Administrador actualizado correctamente.']);
            } else {
                if(empty($password_plana)){
                    echo json_encode(['status' => 'error', 'message' => 'La contraseña es obligatoria para nuevos usuarios.']);
                    exit;
                }
                insertarUsuarioAdmin($pdo, $datos);
                echo json_encode(['status' => 'success', 'message' => 'Administrador agregado correctamente.']);
            }
        } 
        elseif ($action === 'eliminar') {
            $id = (int)$_POST['id_user_admin'];
            $sql = "UPDATE usuarios_admin SET estatus = 'N' WHERE id_user_admin = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':id' => $id]);
            echo json_encode(['status' => 'success', 'message' => 'Administrador inhabilitado']);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error BD: ' . $e->getMessage()]);
}
?>