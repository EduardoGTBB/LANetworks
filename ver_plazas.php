<?php
session_start();

if (!isset($_SESSION['id_user_admin'])) {
    header('Location: index.php');
    exit;
}

require 'views/ver_plazas.view.php';

?>