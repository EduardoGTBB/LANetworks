<?php
session_start();

if(!isset($_SESSION['id_user_admin']) && !isset($_SESSION['id_usuario_cliente']))
{
    header('Location: index.php');
    exit;
}
require 'views/inicio.view.php';

?>