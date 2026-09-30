<?php
// 1. Iniciar el manejo de sesiones
session_start();

if (!isset($_SESSION['id_user_admin'])) {
    header('Location: index.php');
    exit;
}

// 🛡️ Extraemos la configuración para revisar si está habilitado el Feature Flag
require_once 'api/config.php';

if (!defined('HABILITAR_COTS_TEMPORALES') || !HABILITAR_COTS_TEMPORALES) {
    echo "El módulo de cotizaciones temporales se encuentra deshabilitado.";
    exit;
}

require 'views/ver_cotizaciones_temporales.view.php';
?>