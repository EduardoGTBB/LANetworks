<?php
session_start();

if (!isset($_SESSION['id_user_admin'])) {
    header('Location: index.php');
    exit;
}

// 🛡️ CIBERSEGURIDAD: Si es operativo, validamos que tenga permiso explícito
if ($_SESSION['perfil'] !== 'admin') {
    require_once 'api/config.php';
    // ✨ CAMBIO: Ahora consultamos mp_ver_todas_cotiz
    $stmt = $pdo->prepare("SELECT mp_ver_todas_cotiz FROM usuarios_admin WHERE id_user_admin = ?");
    $stmt->execute([$_SESSION['id_user_admin']]);
    $permiso = $stmt->fetchColumn();

    if ($permiso !== 'Activado') {
        // Si no tiene permiso, lo pateamos amablemente a sus propias cotizaciones
        header('Location: ver_cotizaciones.php'); 
        exit;
    }
}

require 'views/ver_cotizaciones_all.view.php';
?>