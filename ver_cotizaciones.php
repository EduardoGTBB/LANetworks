<?php
// 1. Iniciar el manejo de sesiones (Debe ir siempre hasta arriba)
session_start();

/* if (!isset($_SESSION['id_user_admin']) && !isset($_SESSION['id_usuario_cliente'])) {
    header('Location: index.php');
    exit;
} */
if (!isset($_SESSION['id_user_admin']) && !isset($_SESSION['id_usuario_cliente'])) {
    
    // 🛡️ UX y Ciberseguridad: Capturamos la URL exacta que intentó visitar 
    // antes de enviarlo al login (Ej. /ver_cotizaciones.php o /ver_cotizaciones.php?filtro=activos)
    $_SESSION['redirect_url'] = $_SERVER['REQUEST_URI'];
    
    // Ahora sí, lo enviamos al login
    header('Location: index.php');
    exit;
}

require 'views/ver_cotizaciones.view.php';
?>