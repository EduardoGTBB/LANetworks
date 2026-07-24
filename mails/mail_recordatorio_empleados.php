<?php
// 🛡️ Ciberseguridad: Prevenir ejecución directa desde el navegador (Zero Trust)
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    http_response_code(403);
    exit('Acceso denegado. Este script solo puede ser ejecutado por el servidor.');
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Incluir librerías nativas de PHPMailer (Ajusta la ruta si tu carpeta se llama distinto)
require_once __DIR__ . '/../PHPMailer/src/Exception.php';
require_once __DIR__ . '/../PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../PHPMailer/src/SMTP.php';

// Validamos que el arreglo exista y tenga datos
if (!empty($empleados_pendientes)) {
    
    foreach ($empleados_pendientes as $empleado) {
        $mail = new PHPMailer(true); // Instanciamos dentro del bucle para limpiar la memoria por cada envío

        try {
            // ⚙️ Configuración del Servidor SMTP
            $mail->isSMTP();
            $mail->SMTPDebug  = 0; // 0 en producción para evitar fuga de información
            $mail->Host       = $smtp_host; // Variable global desde admin_config.php
            $mail->Port       = 465;
            $mail->SMTPSecure = 'ssl';
            $mail->SMTPAuth   = true;
            $mail->Username   = $smtp_user; // Variable global
            $mail->Password   = $smtp_pass; // Variable global
            $mail->CharSet    = 'UTF-8';    // Soporte nativo para acentos y "ñ"

            // 👤 Destinatario e Información
            $destinatario = $empleado['email'];
            $nombre = $empleado['nombre'];
            $cantidad_pendientes = (int)$empleado['total_pendientes'];

            $mail->setFrom($smtp_user, 'LA Networks - Sistema Interno');
            $mail->addAddress($destinatario, $nombre);

            // ✉️ Contenido del Correo
            $mail->isHTML(true);
            $mail->Subject = "⚠️ Recordatorio: Tienes $cantidad_pendientes cotizaciones pendientes";
            
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 20px; border-radius: 8px;'>
                    <h2 style='color: #0d6efd;'>Hola $nombre,</h2>
                    <p>El sistema ha detectado que tienes <strong>$cantidad_pendientes cotizaciones</strong> en estatus 'Guardado' o 'Por Aprobar' que no han sido actualizadas recientemente.</p>
                    <p>Te invitamos a ingresar al sistema para darles seguimiento, gestionar las direcciones o cancelarlas si ya no están vigentes.</p>
                    <br>
                    <div style='text-align: center;'>
                        <a href='https://tudominio.com/ver_cotizaciones.php' style='background-color: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Ir a Mis Cotizaciones</a>
                    </div>
                    <hr style='border: none; border-top: 1px solid #eee; margin-top: 30px;'>
                    <small style='color: #999;'>Este es un mensaje automático del sistema, por favor no respondas a este correo.</small>
                </div>
            ";

            // 🚀 Ejecutar envío
            $mail->send();
            echo "CRON OK: Recordatorio enviado al empleado -> $destinatario \n";

        } catch (Exception $e) {
            // Manejo de errores silencioso para no detener el CRON si un correo falla
            error_log("[" . date('Y-m-d H:i:s') . "] Error al enviar correo al empleado $destinatario: {$mail->ErrorInfo}");
        }
    }
}
?>