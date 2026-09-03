<?php
// 🛡️ Zero Trust: Prevenir ejecución directa
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    http_response_code(403);
    exit('Acceso denegado.');
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';

function enviarCorreoSolicitudOC($destinatario, $nombre_cliente, $folio) {
    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST; 
        $mail->Port       = 465;
        $mail->SMTPSecure = 'ssl';
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        $mail->CharSet    = 'UTF-8';

        // ====================================================================
        // 🚀 CIBERSEGURIDAD PRODUCCIÓN: ENVIAR A CLIENTE REAL
        // ====================================================================
        $correo_final = $destinatario; // Desbloqueado para VPS

        $mail->setFrom(SMTP_USER, 'LA Networks SAC');
        $mail->addAddress($correo_final, htmlspecialchars($nombre_cliente, ENT_QUOTES, 'UTF-8'));

        $mail->isHTML(true);
        $mail->Subject = "⚠️ Acción Requerida: Orden de Compra - Cotización #{$folio}";
        
        $mail->Body = <<<HTML
            <div style='font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 20px; border-radius: 8px;'>
                <div style='text-align: center; margin-bottom: 20px;'>
                    <h2 style='color: #28a745; margin-bottom: 0;'>¡Tu equipo ha sido entregado!</h2>
                </div>
                <p style='font-size: 16px;'>Hola <strong>{$nombre_cliente}</strong>,</p>
                <p>Nuestro sistema indica que los equipos correspondientes a la cotización <strong>#{$folio}</strong> han sido recibidos exitosamente en tus instalaciones.</p>
                
                <div style='background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;'>
                    <p style='margin: 0; font-size: 15px;'>Para poder concluir el proceso y proceder con la facturación, te pedimos de favor que ingreses a tu portal para capturar tu <strong>Número de Recepción (10 dígitos)</strong> y adjuntar tu <strong>Orden de Compra en formato PDF (Máx. 2 hojas)</strong>.</p>
                </div>
                
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='https://cotizador.la-analitical-mx.net/ver_cotizaciones.php' style='background-color: #0d6efd; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Subir mis Documentos</a>
                </div>
                <hr style='border: none; border-top: 1px solid #eee; margin-top: 30px;'>
                <small style='color: #999; text-align: center; display: block;'>LA Networks & Smart Technologies SA de CV</small>
            </div>
HTML;

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Error Email OC: {$mail->ErrorInfo}");
        return false;
    }
}
?>