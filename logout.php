<?php
declare(strict_types=1);
session_start();

// Vaciamos el arreglo de sesión
$_SESSION = [];

// Destruimos la sesión en el servidor
session_destroy();

// Borramos la cookie de sesión del navegador por seguridad
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Redirigimos al login
header("Location: index.php");
exit;
?>