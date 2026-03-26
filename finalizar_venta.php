<?php
session_start();
if (!isset($_SESSION['id_user_admin']) && !isset($_SESSION['id_usuario_cliente'])) {
    header('Location: index.php');
    exit;
}
if (!isset($_GET['id'])) {
    header('Location: ver_cotizaciones.php');
    exit;
}

$id_cotizacion = (int)$_GET['id'];
require 'views/finalizar_venta.view.php';

?>
