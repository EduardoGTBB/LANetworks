<?php
// 🛡️ Ciberseguridad: Prevenir ejecución directa desde el navegador
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    http_response_code(403);
    exit('Acceso denegado.');
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../PHPMailer/src/Exception.php';
require_once __DIR__ . '/../PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../PHPMailer/src/SMTP.php';

if (!empty($empleados_pendientes)) {
    
    foreach ($empleados_pendientes as $empleado) {
        $mail = new PHPMailer(true);

        try {
            // ⚙️ Configuración del Servidor SMTP
            $mail->isSMTP();
            $mail->SMTPDebug  = 0;
            $mail->Host       = SMTP_HOST;
            $mail->Port       = 465;
            $mail->SMTPSecure = 'ssl';
            $mail->SMTPAuth   = true;
            $mail->Username   = SMTP_USER;
            $mail->Password   = SMTP_PASS;
            $mail->CharSet    = 'UTF-8';

            // 👤 Destinatario e Información
            $destinatario = $empleado['email'];
            $nombre = $empleado['nombre'];
            $cantidad_pendientes = (int)$empleado['total_pendientes'];

            $mail->setFrom(SMTP_USER, 'LA Networks - Sistema Interno');
            $mail->addAddress($destinatario, $nombre);

            // ✉️ Contenido del Correo
            $mail->isHTML(true);
            $mail->Subject = "⚠️ Recordatorio: Tienes {$cantidad_pendientes} cotizaciones pendientes";
            
            $mail->Body = <<<HTML
                <div style='font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 20px; border-radius: 8px;'>
                    <h2 style='color: #0d6efd;'>Hola {$nombre},</h2>
                    <p>El sistema ha detectado que tienes <strong>{$cantidad_pendientes} cotizaciones</strong> en estatus 'Guardado' o 'Por Aprobar' que no han sido actualizadas recientemente.</p>
                    <p>Te invitamos a ingresar al sistema para darles seguimiento, gestionar las direcciones o cancelarlas si ya no están vigentes.</p>
                    <br>
                    <div style='text-align: center;'>
                        <a href='https://tudominio.com/ver_cotizaciones.php' style='background-color: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Ir a Mis Cotizaciones</a>
                    </div>
                    <hr style='border: none; border-top: 1px solid #eee; margin-top: 30px;'>
                    <small style='color: #999;'>Este es un mensaje automático del sistema, por favor no respondas a este correo.</small>
                </div>
HTML;

            $mail->send();
            echo "CRON OK: Recordatorio enviado al empleado -> {$destinatario}\n";

        } catch (Exception $e) {
            error_log("[" . date('Y-m-d H:i:s') . "] Error al enviar correo al empleado {$destinatario}: {$mail->ErrorInfo}");
        }
    }
}
?>