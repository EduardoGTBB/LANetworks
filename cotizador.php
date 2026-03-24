<?php
// cotizador.php
session_start();

if (!isset($_SESSION['id_user_admin']) && !isset($_SESSION['id_usuario_cliente'])) {
    header('Location: index.php');
    exit;
}

$fecha_hoy = date('Y-m-d');

// Simplemente cargamos la vista. ¡Cero lógica de base de datos aquí!
require 'views/nueva_cotizacion_lan.view.php';
?>