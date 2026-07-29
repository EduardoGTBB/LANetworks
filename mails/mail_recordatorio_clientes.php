<?php
// 🛡️ Ciberseguridad: Prevenir ejecución directa desde el navegador (Zero Trust)
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    http_response_code(403);
    exit('Acceso denegado. Este script solo puede ser ejecutado por el servidor.');
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../PHPMailer/src/Exception.php';
require_once __DIR__ . '/../PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../PHPMailer/src/SMTP.php';

// Validamos que el arreglo exista y tenga datos
if (!empty($clientes_pendientes)) {
    
    foreach ($clientes_pendientes as $cliente) {
        $mail = new PHPMailer(true);

        try {
            // ⚙️ Configuración del Servidor SMTP (Usando Constantes)
            $mail->isSMTP();
            $mail->SMTPDebug  = 0;
            $mail->Host       = SMTP_HOST;
            $mail->Port       = 465;
            $mail->SMTPSecure = 'ssl';
            $mail->SMTPAuth   = true;
            $mail->Username   = SMTP_USER;
            $mail->Password   = SMTP_PASS;
            $mail->CharSet    = 'UTF-8';

            // 👤 Destinatario e Información del Cliente B2B
            $destinatario = $cliente['email'];
            $empresa = $cliente['razon_social'];

            $mail->setFrom(SMTP_USER, 'LA Networks B2B');
            $mail->addAddress($destinatario, $empresa);

            // ✉️ Contenido del Correo Comercial
            $mail->isHTML(true);
            $mail->Subject = "Notificación de Cotizaciones Pendientes - LA NETWORKS";
            
            // Usando Sintaxis HEREDOC nativa de PHP para HTML limpio
            $mail->Body = <<<HTML
                <div style='font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 20px; border-radius: 8px;'>
                    <div style='text-align: center; margin-bottom: 20px;'>
                        <img src='https://lupware.com/assets/images/logo.png' alt='LA Networks' style='max-width: 150px;'>
                    </div>
                    <h2 style='color: #28a745;'>Estimado cliente ({$empresa}),</h2>
                    <p>Esperamos que se encuentre excelente.</p>
                    <p>Le informamos que tiene cotizaciones en su portal B2B que se encuentran en proceso y están próximas a su fecha de expiración.</p>
                    <p>Le invitamos a revisar su panel para autorizarlas o realizar las modificaciones necesarias y así garantizar los precios y disponibilidad de los equipos.</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='https://tudominio.com/login.php' style='background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Acceder a mi Portal B2B</a>
                    </div>
                    <p>Si necesita asistencia técnica o comercial, nuestro equipo está a su entera disposición.</p>
                    <hr style='border: none; border-top: 1px solid #eee; margin-top: 30px;'>
                    <small style='color: #999; text-align: center; display: block;'>LA Networks & Smart Technologies SA de CV</small>
                </div>
HTML;

            // 🚀 Ejecutar envío
            $mail->send();
            echo "CRON OK: Recordatorio enviado al cliente B2B -> {$destinatario}\n";

        } catch (Exception $e) {
            error_log("[" . date('Y-m-d H:i:s') . "] Error al enviar correo al cliente {$destinatario}: {$mail->ErrorInfo}");
        }
    }
}
?>