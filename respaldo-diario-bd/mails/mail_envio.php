<?php 

date_default_timezone_set('America/Mexico_City');

// Incluir la libreria PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

$email_user = "hola@avisos.lupware.com";
$email_password = "*x6kp6HLxBCz";//ACNURjavier2023
$from_name = utf8_decode("LPW Backups");

$asunto = utf8_decode("[Respaldo] LAN-SAC");
//$enviar_a = "javier@lupware.com; paola@lupware.com";
$enviar_a = "sistemas@lupware.com";
$array_enviar = explode(";", $enviar_a);

//$path = "domains/womi.lupware.com/public_html/respaldo-diario-bd/womi.sql.gz";
$path = __DIR__ . '/../lan-sac.sql.gz';

// Inicio
$mail = new PHPMailer;

try {
    // Configuracion SMTP
    $mail->isSMTP();// Activar envio SMTP
    $mail->SMTPDebug = 0;// Poner 2 va a mostrar salida y posibles errores (Desactivar en producción con 0)
    $mail->Host  = 'mail.avisos.lupware.com';//Servidor SMTP
    $mail->Port  = 465;//25, 465 o 587
    $mail->SMTPSecure = 'ssl';
    $mail->SMTPAuth  = true;// Identificacion SMTP
    $mail->Username  = $email_user;// Usuario SMTP
    $mail->Password  = $email_password;// Contraseña SMTP
    $mail->setFrom($email_user, 'LPW Backups');// Remitente del correo
    
    // Destinatarios
    foreach ($array_enviar as $enviar_a) {
        $mail->addAddress($enviar_a, 'LPW Backups');  // Email y nombre del destinatario
    }

    // Contenido del correo
    $mail->isHTML(true);
    $mail->Subject = $asunto;
    $mail->Body =utf8_decode("<h1 style='color:#043C3C;'>LPW Backups</h1>
    	<h3>¡Hola! Se ha generado un respaldo de la base de datos.</h3>
        <p></p>
        <p></p>
        <p>El respaldo se generó satisfactoriamente, por favor, descarga el archivo adjunto.</p>
        <p></p>
        <p></p>
		<p>Atentamente,</p>
		<p><strong>LPW Backups.</strong></p>
        <p></p>
        <p>Actualizado a las: ".date("H:i:s")." hrs.</p>
        <p>*Por favor no conteste a éste correo, ingrese al sistema para dar seguimiento a sus solicitudes.</p>
    ");
    $mail->AddAttachment($path); //Adds an attachment from a path on the filesystem
    $mail->send();
    echo 'El mensaje se ha enviado';
} catch (Exception $e) {
    echo "El mensaje no se ha enviado. Mailer Error: {$mail->ErrorInfo}";
}

 ?>