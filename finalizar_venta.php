<?php
declare(strict_types=1);
session_start();

if (!isset($_SESSION['id_user_admin']) && !isset($_SESSION['id_usuario_cliente'])) {
    header('Location: index.php');
    exit;
}

// CIBERSEGURIDAD: Validar y sanitizar que el ID sea estrictamente un número entero
$id_cotizacion = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

// Si manipularon la URL y pusieron texto en vez de número, lo ignoramos por seguridad
if ($id_cotizacion === false || $id_cotizacion === null || $id_cotizacion <= 0) {
    header('Location: inicio.php');
    exit;
}

// ✨ UX/CIBERSEGURIDAD: Interceptar el origen para la redirección
// Limpiamos los caracteres especiales para evitar inyecciones XSS
$from = filter_input(INPUT_GET, 'from', FILTER_SANITIZE_SPECIAL_CHARS) ?? 'mis_cotizaciones';

// Evaluamos de dónde viene de forma estricta (Soporta 'all' o 'todas_cotizaciones')
if ($from === 'all' || $from === 'todas_cotizaciones') {
    // Si viene de la vista global de admins
    $url_origen = 'ver_cotizaciones_all.php';
} else {
    // Si viene de las cotizaciones propias (o manipularon el parámetro)
    $url_origen = 'ver_cotizaciones.php';
}

/* if (!isset($_GET['id'])) {
    header('Location: ver_cotizaciones.php');
    exit;
}

$url_origen = (isset($_GET['from']) && $_GET['from'] === 'all') ? 'ver_cotizaciones_all.php' : 'ver_cotizaciones.php';

$id_cotizacion = (int)$_GET['id']; */
require 'views/finalizar_venta.view.php';

?>
