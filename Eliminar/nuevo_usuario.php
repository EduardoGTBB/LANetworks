<?php
declare(strict_types=1);
session_start();

if(!isset($_SESSION['id_user_admin']))
    {
        header('Location: index.php');
        exit;
    }

require_once 'api/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Recolectamos y limpiamos los datos básicos
    $nombre    = trim($_POST['admin_nombre'] ?? '');
    $apellidos = trim($_POST['admin_apellidos'] ?? '');
    $usuario   = trim($_POST['usuario'] ?? '');
    $perfil    = trim($_POST['perfil'] ?? 'admin');
    $password  = $_POST['password'] ?? '';
    $password2 = $_POST['password2'] ?? '';

    // Validaciones de seguridad y lógica
    if (empty($nombre) || empty($apellidos) || empty($usuario) || empty($password)) {
        $mensaje_sistema = '<div class="alert alert-warning alert-dismissible fade show" role="alert">Por favor, completa todos los campos obligatorios.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
    } elseif ($password !== $password2) {
        $mensaje_sistema = '<div class="alert alert-danger alert-dismissible fade show" role="alert">Las contraseñas no coinciden. Inténtalo de nuevo.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
    } else {
        try {
            // A. Verificar si el usuario (correo) ya existe en la BD
            $stmtCheck = $pdo->prepare("SELECT id_user_admin FROM usuarios_admin WHERE usuario_lan = :usuario");
            $stmtCheck->execute([':usuario' => $usuario]);
            
            if ($stmtCheck->rowCount() > 0) {
                $mensaje_sistema = '<div class="alert alert-warning alert-dismissible fade show" role="alert">Este usuario (correo) ya está registrado en el sistema. Elige otro.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
            } else {
                // B. Insertar el nuevo usuario
                // NOTA: Por ahora la contraseña se guarda en texto plano para que sea compatible con tu login actual. 
                // En el futuro, cambiaremos esto a password_hash() por seguridad.
                $sql = "INSERT INTO usuarios_admin (usuario_lan, password, admin_nombre, admin_apell_pat, perfil, estatus) 
                        VALUES (:usuario, :password, :nombre, :apellidos, :perfil, 'Y')";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':usuario'   => $usuario,
                    ':password'  => $password, // Texto plano (solo por ahora)
                    ':nombre'    => $nombre,
                    ':apellidos' => $apellidos,
                    ':perfil'    => $perfil
                ]);

                $mensaje_sistema = '<div class="alert alert-success alert-dismissible fade show" role="alert"><strong>¡Éxito!</strong> El usuario ha sido registrado correctamente.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
            }
        } catch (Exception $e) {
            // Registramos el error en los logs del servidor
            error_log("Error al registrar usuario: " . $e->getMessage());
            $mensaje_sistema = '<div class="alert alert-danger alert-dismissible fade show" role="alert">Error interno al guardar en la base de datos.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
        }
    }
}

require 'views/nuevo_usuario.view.php';

?>