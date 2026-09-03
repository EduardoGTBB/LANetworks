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

// ✨ PRODUCCIÓN: Recibe un ARREGLO de correos y hace 1 sola petición SMTP
function enviarCorreoFacturacionUnico(array $correos_admins, string $folio, string $recepcion, string $nombre_cliente) {
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

        $mail->setFrom(SMTP_USER, 'LA Networks SAC');

        // ====================================================================
        // 🚀 CIBERSEGURIDAD PRODUCCIÓN: Múltiples destinos ocultos (BCC)
        // ====================================================================
        
        // Usamos el correo del sistema como fachada (To) para evitar rebotes o bloqueos de SPAM
        $mail->addAddress(SMTP_USER, 'Equipo Administrativo LAN'); 
        
        // Agregamos a todos los administradores (Facturación/Ventas) de la lista en Copia Oculta (BCC)
        foreach ($correos_admins as $correo) {
            if (filter_var($correo, FILTER_VALIDATE_EMAIL)) {
                $mail->addBCC($correo);
            }
        }

        $mail->isHTML(true);
        $mail->Subject = "✅ OC Recibida - Cotización #{$folio} Lista para Facturar";
        
        $mail->Body = <<<HTML
            <div style='font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 20px; border-radius: 8px;'>
                <div style='text-align: center; margin-bottom: 20px;'>
                    <h2 style='color: #0d6efd; margin-bottom: 0;'>Documentación Completada</h2>
                </div>
                <p style='font-size: 16px;'>Hola <strong>Equipo Administrativo</strong>,</p>
                <p>El cliente <strong>{$nombre_cliente}</strong> ha subido exitosamente su Orden de Compra y ha capturado su número de recepción para la cotización <strong>#{$folio}</strong>.</p>
                
                <div style='background-color: #f8f9fa; border-left: 4px solid #0d6efd; padding: 15px; margin: 20px 0;'>
                    <p style='margin: 5px 0;'><strong>Cotización:</strong> #{$folio}</p>
                    <p style='margin: 5px 0;'><strong>No. de Recepción:</strong> {$recepcion}</p>
                </div>
                
                <p style='margin: 0; font-size: 15px;'>Puedes ingresar al panel administrativo de LAN para descargar el archivo PDF y proceder con la facturación correspondiente.</p>
                
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='https://cotizador.la-analitical-mx.net/' style='background-color: #0d6efd; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Ir al Panel de Administración</a>
                </div>
            </div>
HTML;

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Error Email Facturación Unico: {$mail->ErrorInfo}");
        return false;
    }
}
?>