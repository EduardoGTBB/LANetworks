<?php
// 1. Iniciar el manejo de sesiones (Debe ir siempre hasta arriba)
session_start();

if (!isset($_SESSION['id_user_admin']) || $_SESSION['perfil'] !== 'admin' ) {
    header('Location: index.php');
    exit;
}

require 'views/ver_cotizaciones_all.view.php';
?>