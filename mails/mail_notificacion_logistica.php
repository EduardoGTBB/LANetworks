<?php
// 🛡️ Ciberseguridad: Prevenir ejecución directa desde el navegador
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    http_response_code(403);
    exit('Acceso denegado. Este script solo puede ser ejecutado por el servidor.');
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';

function enviarCorreoLogistica($destinatario, $nombre_cliente, $folio, $paqueteria, $numero_guia, $fecha_envio) {
    $mail = new PHPMailer(true);

    try {
        // ⚙️ Configuración del Servidor SMTP PRODUCCIÓN
        $mail->isSMTP();
        $mail->SMTPDebug  = 0; 
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

        // 👤 Remitente y Destinatario
        $mail->setFrom(SMTP_USER, 'LA Networks SAC');
        $mail->addAddress($correo_final, htmlspecialchars($nombre_cliente, ENT_QUOTES, 'UTF-8'));

        // ✉️ Contenido del Correo
        $mail->isHTML(true);
        $mail->Subject = "📦 Información de Envío - Cotización #{$folio}";
        
        $mail->Body = <<<HTML
            <div style='font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 20px; border-radius: 8px;'>
                <div style='text-align: center; margin-bottom: 20px;'>
                    <img src='https://cotizador.la-analitical-mx.net/assets/images/logo-head.png' alt='LA Networks' style='max-width: 150px;'>
                </div>
                <h2 style='color: #0d6efd;'>Estimado cliente,</h2>
                <p>Te compartimos la información actualizada sobre el envío de tus equipos correspondientes a la cotización <strong>#{$folio}</strong>.</p>
                
                <div style='background-color: #f8f9fa; border-left: 4px solid #0d6efd; padding: 15px; margin: 20px 0;'>
                    <p style='margin: 5px 0;'><strong>🚚 Paquetería:</strong> {$paqueteria}</p>
                    <p style='margin: 5px 0;'><strong>📅 Fecha programada:</strong> {$fecha_envio}</p>
                    <p style='margin: 5px 0; font-size: 18px;'><strong>🔢 Número de Guía:</strong> <span style='color: #0d6efd; font-weight: bold;'>{$numero_guia}</span></p>
                </div>
                
                <p style='font-size: 14px; color: #666;'><em>* Puedes utilizar este número de guía en el portal web de la paquetería para rastrear tu paquete.</em></p>
                <hr style='border: none; border-top: 1px solid #eee; margin-top: 30px;'>
                <small style='color: #999; text-align: center; display: block;'>LA Networks & Smart Technologies SA de CV</small>
            </div>
HTML;

        // 🚀 Ejecutar envío
        $mail->send();
        return true;

    } catch (Exception $e) {
        error_log("[" . date('Y-m-d H:i:s') . "] Error PHPMailer Logística (Cot #{$folio}): {$mail->ErrorInfo}");
        return false;
    }
}
?>