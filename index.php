<?php
declare(strict_types=1);
session_start();

// Si ya tiene sesión, lo mandamos directo al inicio
if (isset($_SESSION['id_user_admin']) || isset($_SESSION['id_usuario_cliente'])) {
    header('Location: inicio.php');
    exit;
}

$error_msg = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Requerimos la configuración y el MODELO
    require_once 'api/config.php';
    require_once 'lib/funciones_db.php';

    $usuario = trim($_POST['usuario'] ?? '');
    $password_ingresada = trim($_POST['password'] ?? '');

    if (!empty($usuario) && !empty($password_ingresada)) {
        try {
            // 2. Primero buscamos si es un ADMINISTRADOR
            $user_admin = obtenerUsuarioPorLan($pdo, $usuario);

            if ($user_admin && password_verify($password_ingresada, $user_admin['password'])) {
                
                // ¡Éxito Admin! Guardamos datos en la sesión
                $_SESSION['id_user_admin'] = $user_admin['id_user_admin'];
                $_SESSION['nombre_completo'] = $user_admin['admin_nombre'] . ' ' . $user_admin['admin_apell_pat'];
                $_SESSION['perfil'] = $user_admin['perfil'];
                $_SESSION['usuario_lan'] = $user_admin['usuario_lan'];
                $_SESSION['foto_perfil'] = !empty($user_admin['foto_perfil']) ? $user_admin['foto_perfil'] : 'user.png';

                header('Location: inicio.php');
                exit;
                
            } else {
                // 3. Si no es admin, buscamos si es un CLIENTE del Portal B2B
                $user_cliente = obtenerUsuarioEmpresaporCorreo($pdo, $usuario);

                if ($user_cliente && password_verify($password_ingresada, $user_cliente['usuario_password'])) {
                    
                    // ¡Éxito Cliente! Guardamos sus datos específicos en la sesión
                    $_SESSION['id_usuario_cliente'] = $user_cliente['id_usuario'];
                    $_SESSION['Empresa_id'] = $user_cliente['Empresa_id']; // Vital para el cotizador
                    $_SESSION['nombre_completo'] = $user_cliente['nombre'] . ' ' . $user_cliente['apellido_pat'];
                    $_SESSION['correo'] = $user_cliente['correo'];
                    $_SESSION['foto_perfil'] = !empty($user_cliente['foto_perfil']) ? $user_cliente['foto_perfil'] : 'user.png';

                    header('Location: inicio.php');
                    exit;
                } else {
                    // Si no está en ninguna de las dos tablas, lo rechazamos
                    $error_msg = "Usuario o contraseña incorrectos, o cuenta inactiva.";
                }
            }
            
        } catch (Exception $e) {
            error_log("Error en el login: " . $e->getMessage());
            $error_msg = "Ocurrió un error en el sistema. Intenta más tarde.";
        }
    } else {
        $error_msg = "Por favor, completa todos los campos.";
    }
}

// 5. Cargar la Vista
require "views/login.view.php";
?>