<?php
// 1. Iniciar el manejo de sesiones (Debe ir siempre hasta arriba)
session_start();

if (!isset($_SESSION['id_user_admin']) && !isset($_SESSION['id_usuario_cliente'])) {
    header('Location: index.php');
    exit;
}


require 'views/ver_cotizaciones.view.php';
