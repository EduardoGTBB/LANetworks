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

    // ==========================================
    // GET: Leer usuarios y Leer empresas
    // ==========================================
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? '';

        if ($action === 'leer') {
            echo json_encode(obtenerAllusers($pdo));
        } elseif ($action === 'empresas') {
            echo json_encode(obtenerClientes($pdo));
        } else {
            echo json_encode(['error' => 'Acción GET no válida']);
        }
        exit;
    }

    // ==========================================
    // POST: Crear, Editar o Eliminar
    // ==========================================
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // ¡LA CORRECCIÓN MÁS IMPORTANTE! Leer la acción del formulario
        $action = $_POST['action'] ?? '';

        if ($action === 'crear' || $action === 'editar') {
            $correo_evaluar = trim($_POST['correo'] ?? '');
            $id_evaluar = ($action === 'editar') ? (int)($_POST['id_usuario'] ?? 0) : 0;

            // Verificamos si el correo ya existe en la BD
            $error_duplicado = verificarUsuarioClienteExistente($pdo, $correo_evaluar, $id_evaluar);
            if ($error_duplicado !== false) {
                // Si existe, detenemos el proceso y mandamos el error al JS
                echo json_encode(['status' => 'error', 'message' => $error_duplicado]);
                exit;
            }
            $foto_perfil = '';
            if (isset($_FILES['foto_perfil']) && $_FILES['foto_perfil']['error'] === UPLOAD_ERR_OK) {
                $ext = strtolower(pathinfo($_FILES['foto_perfil']['name'], PATHINFO_EXTENSION));
                $permitidos = ['jpg', 'jpeg', 'png', 'webp'];

                if (in_array($ext, $permitidos)) {
                    $nuevo_nombre = uniqid('cli_') . '.' . $ext;
                    $ruta_destino = '../assets/images/avatar/' . $nuevo_nombre;

                    if (move_uploaded_file($_FILES['foto_perfil']['tmp_name'], $ruta_destino)) {
                        $foto_perfil = $nuevo_nombre;

                        // Borrar la foto vieja solo al editar
                        if ($action === 'editar') {
                            $id_usuario = (int)$_POST['id_usuario'];
                            $stmt = $pdo->prepare("SELECT foto_perfil FROM usuarios WHERE id_usuario = :id");
                            $stmt->execute([':id' => $id_usuario]);
                            $oldUsr = $stmt->fetch(PDO::FETCH_ASSOC);

                            if ($oldUsr && !empty($oldUsr['foto_perfil']) && $oldUsr['foto_perfil'] !== 'user.png') {
                                $ruta_vieja = '../assets/images/avatar/' . $oldUsr['foto_perfil'];
                                if (file_exists($ruta_vieja)) {
                                    unlink($ruta_vieja);
                                }
                            }
                        }
                    }
                }
            }

            // ¡CORRECCIÓN! Atrapar la contraseña antes de encriptarla
            $pass_plana = trim($_POST['usuario_password'] ?? '');

            $datos = [
                'nombre'           => trim($_POST['nombre'] ?? ''),
                'apellido_pat'     => trim($_POST['apellido_pat'] ?? ''),
                'apellido_mat'     => trim($_POST['apellido_mat'] ?? ''),
                'correo'           => trim($_POST['correo'] ?? ''),
                'usuario_password' => !empty($pass_plana) ? password_hash($pass_plana, PASSWORD_DEFAULT) : '',
                'Empresa_id'       => (int)($_POST['Empresa_id'] ?? 0),
                'foto_perfil'      => $foto_perfil,

                'activo'           => ($action === 'crear') ? 'true' : (isset($_POST['activo']) ? 'true' : 'false')
            ];

            if ($datos['Empresa_id'] === 0) {
                echo json_encode(['status' => 'error', 'message' => 'Debes seleccionar una empresa válida.']);
                exit;
            }

            if ($action === 'editar') {
                $datos['id_usuario'] = (int)$_POST['id_usuario'];
                actualizarUsuario($pdo, $datos);
                echo json_encode(['status' => 'success', 'message' => 'Usuario actualizado correctamente.']);
            } else {
                if(empty($pass_plana)){
                    echo json_encode(['status' => 'error', 'message' => 'La contraseña es obligatoria para usuarios nuevos.']);
                    exit;
                }
                insertarUsuario($pdo, $datos);
                echo json_encode(['status' => 'success', 'message' => 'Usuario agregado correctamente.']);
            }
        } 
        elseif ($action === 'eliminar') {
            $id = (int)$_POST['id_usuario'];
            $resultado = eliminarUsuario($pdo, $id);
            
            if ($resultado === 'inactivado') {
                echo json_encode(['status' => 'warning', 'message' => 'El usuario no se puede eliminar porque está enlazado a una cotización. Se cambió su estatus a INACTIVO.']);
            } else {
                echo json_encode(['status' => 'success', 'message' => 'Usuario eliminado permanentemente.']);
            }
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error BD: ' . $e->getMessage()]);
}
?>