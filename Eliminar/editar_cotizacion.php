<?php
// editar_cotizacion.php (Controlador de Vista)
session_start();

if (!isset($_SESSION['id_user_admin'])) {
    header('Location: index.php');
    exit;
}

require_once 'api/config.php';
require_once 'lib/funciones_db.php';

// 3. Validar el ID
$id_cotizacion = (int)($_GET['id'] ?? 0);
if ($id_cotizacion === 0) {
    header('Location: ver_cotizaciones.php');
    exit;
}

$cotizacion_actual = editarCotizacionporID($pdo, $id_cotizacion);
$detalles_actuales = obtenerdetallesCotizacionID($pdo, $id_cotizacion);

if (!$cotizacion_actual) {
    die("Error: La cotización no existe.");
}

require 'views/editar_cotizacion.view.php';
?>