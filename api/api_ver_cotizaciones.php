<?php

declare(strict_types=1);
session_start();

if (!isset($_SESSION['id_user_admin']) && !isset($_SESSION['id_usuario_cliente'])) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Acceso denegado']);
    exit;
}

require_once 'config.php';
require_once '../lib/funciones_db.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $es_cliente = isset($_SESSION['id_usuario_cliente']);

    // ==========================================
    // GET: Leer lista o buscar cotización específica
    // ==========================================
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? 'leer';

        if ($action === 'leer') {
            if ($es_cliente) {
                $cliente_id = (int)$_SESSION['id_usuario_cliente'];
                echo json_encode(obtenerCotizacionesCliente($pdo, $cliente_id));
            } else {
                $admin_id = (int)$_SESSION['id_user_admin'];
                echo json_encode(obtenerCotizaciones($pdo, $admin_id));
            }
        } elseif ($action === 'leer_todas') {
            if (isset($_SESSION['perfil']) && $_SESSION['perfil'] === 'admin') {
                echo json_encode(obtenerTodasLasCotizaciones($pdo));
            } else {
                echo json_encode([]);
            }
        } elseif ($action === 'get_cotizacion') {
            $id = (int)($_GET['id'] ?? 0);
            $cotizacion = editarCotizacionporID($pdo, $id);
            $detalles = obtenerdetallesCotizacionID($pdo, $id);

            echo json_encode(['status' => 'success', 'cotizacion' => $cotizacion, 'detalles' => $detalles]);
        }
        exit;
    }

    // ==========================================
    // POST: Editar, Eliminar, Logística o Cambiar Estatus
    // ==========================================
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? '';

        if ($action === 'editar') {
            $id_cotizacion = (int)($_POST['id_cotizacion'] ?? 0);
            $empresa_id    = (int)($_POST['Empresa_id'] ?? 0);
            $usuario_id    = (int)($_POST['Usuario_id'] ?? 0);
            $sucursal_id   = (int)($_POST['Sucursal_id'] ?? 0);
            $plaza_id      = !empty($_POST['Plaza_id']) ? (int)$_POST['Plaza_id'] : null;

            $is_multi      = ($_POST['is_multisucursal'] ?? '0') === '1';

            if ($id_cotizacion === 0 || $empresa_id === 0 || $usuario_id === 0) {
                echo json_encode(['status' => 'error', 'message' => 'Faltan datos obligatorios (Cliente o Solicitante).']);
                exit;
            }

            if (!$is_multi && $sucursal_id === 0) {
                echo json_encode(['status' => 'error', 'message' => 'Falta seleccionar la Sucursal Destino global.']);
                exit;
            }

            if ($is_multi) $sucursal_id = null;

            $cotizacion_actual = editarCotizacionporID($pdo, $id_cotizacion);
            if ($cotizacion_actual && in_array($cotizacion_actual['estatus'], ['Autorizada (información completa)', 'No autorizada'])) {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Operación denegada. Las cotizaciones marcadas como Ganadas o Perdidas no pueden ser modificadas.'
                ]);
                exit;
            }

            $ids_detalles  = $_POST['id_detalle'] ?? [];
            $productos_ids = $_POST['productos'] ?? [];
            $cantidades    = $_POST['cantidad_cot'] ?? [];
            $unitarios     = $_POST['unitario'] ?? [];
            $totales       = $_POST['total'] ?? [];
            $desglosar_arr = $_POST['desglosar'] ?? [];
            $sucursales_fila = $_POST['sucursal_fila'] ?? [];
            $equipos_ids   = $_POST['equipo_id'] ?? [];

            $detalles = [];
            for ($i = 0; $i < count($productos_ids); $i++) {
                if (!empty($productos_ids[$i]) && (int)$cantidades[$i] > 0) {
                    $sucursal_destino = ($is_multi && !empty($sucursales_fila[$i])) ? (int)$sucursales_fila[$i] : null;
                    if ($is_multi && empty($sucursal_destino)) {
                        echo json_encode(['status' => 'error', 'message' => 'Falta seleccionar la Sucursal Destino para uno o más productos en la tabla.']);
                        exit;
                    }
                    $detalles[] = [
                        'id_detalle'       => (int)($ids_detalles[$i] ?? 0),
                        'producto_id'      => (int)$productos_ids[$i],
                        'cantidad'         => (int)$cantidades[$i],
                        'precio_unitario'  => (float)str_replace(',', '', $unitarios[$i] ?? '0'),
                        'precio_extendido' => (float)$totales[$i],
                        'desglosar'        => $desglosar_arr[$i] ?? 'N',
                        'sucursal_destino_id' => $sucursal_destino,
                        'equipo_id'        => trim($equipos_ids[$i] ?? '')
                    ];
                }
            }

            $estatus_nuevo = trim($_POST['estatus'] ?? 'Guardado para aprobación');

            // 🔒 CANDADO CIBERSEGURIDAD ESTRICTO EN EDICIÓN
            if (strpos($estatus_nuevo, 'Autorizada') !== false) {
                $stmtCheckDir = $pdo->prepare("SELECT COUNT(*) FROM domicilio_fiscal WHERE Cotizacion_id = ?");
                $stmtCheckDir->execute([$id_cotizacion]);
                $tieneFiscal = $stmtCheckDir->fetchColumn();

                $stmtCheckEquipos = $pdo->prepare("SELECT COUNT(*) FROM detalle_cotizacion WHERE Cotizacion_id = ? AND (id_dom_cert IS NULL OR id_dom_envio IS NULL)");
                $stmtCheckEquipos->execute([$id_cotizacion]);
                $equiposIncompletos = $stmtCheckEquipos->fetchColumn();

                if ($tieneFiscal == 0 || $equiposIncompletos > 0) {
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'ACCESO DENEGADO: No se puede autorizar. Falta la dirección fiscal o hay equipos sin direcciones de envío/certificado.'
                    ]);
                    exit;
                }
            }

            $datosCotizacion = [
                'empresa_id'    => $empresa_id,
                'usuario_id'    => $usuario_id,
                'sucursal_id'   => $sucursal_id,
                'plaza_id'      => $plaza_id,
                'importe_total' => (float)($_POST['sub_total'] ?? 0),
                'precio_iva'    => (float)($_POST['total_amount'] ?? 0),
                'division'      => trim($_POST['division'] ?? ''),
                'tipo_precio'   => trim($_POST['tipo_precio'] ?? ''),
                'porcentaje_iva' => (float)($_POST['porcentaje_iva'] ?? 16),
                'estatus'       => $estatus_nuevo,
                'comentarios'   => trim($_POST['comentarios'] ?? '')
            ];

            updateCotizacion($pdo, $id_cotizacion, $datosCotizacion, $detalles);
            echo json_encode(['status' => 'success', 'message' => 'Cotización actualizada.']);

        } elseif ($action === 'eliminar') {
            $id = (int)($_POST['id_cotizacion'] ?? 0);
            $cotizacion_actual = editarCotizacionporID($pdo, $id);

            if ($cotizacion_actual) {
                $estatus_actual = $cotizacion_actual['estatus'];
                if (strpos($estatus_actual, 'Autorizada') !== false || $estatus_actual === 'No autorizada') {
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Operación denegada. No puedes eliminar una cotización que ya está Autorizada o Rechazada.'
                    ]);
                    exit;
                }
            }

            borrarCotizacion($pdo, $id);
            echo json_encode(['status' => 'success', 'message' => 'Cotización eliminada permanentemente.']);

        } elseif ($action === 'guardar_logistica') {
            $id_cotizacion = (int)($_POST['id_cotizacion_logistica'] ?? 0);
            $paqueteria = trim($_POST['paqueteria'] ?? '');
            $numero_guia = trim($_POST['numero_guia'] ?? '');
            $fecha_envio = !empty($_POST['fecha_envio']) ? $_POST['fecha_envio'] : null;

            if ($id_cotizacion === 0 || empty($paqueteria) || empty($numero_guia) || empty($fecha_envio)) {
                echo json_encode(['status' => 'error', 'message' => 'Faltan datos de envío.']);
                exit;
            }

            // A. Guardamos la logística en Base de Datos
            $guardado = guardarLogisticaCotizacion($pdo, $id_cotizacion, $paqueteria, $numero_guia, $fecha_envio);

            if ($guardado) {
                // B. Extraemos los datos del cliente
                $datosCliente = obtenerDatosClientePorCotizacion($pdo, $id_cotizacion);

                if ($datosCliente && !empty($datosCliente['correo'])) {
                    $folio = $datosCliente['folio_especial'] ? $datosCliente['folio_especial'] : str_pad((string)$id_cotizacion, 5, '0', STR_PAD_LEFT);
                    
                    // C. Inyectamos la capa de correos (Aislada por seguridad MVC)
                    $ruta_mail = __DIR__ . '/../mails/mail_notificacion_logistica.php';
                    
                    if (file_exists($ruta_mail)) {
                        require_once $ruta_mail;
                        enviarCorreoLogistica(
                            $datosCliente['correo'], 
                            $datosCliente['nombre'], 
                            $folio, 
                            $paqueteria, 
                            $numero_guia, 
                            $fecha_envio
                        );
                    } else {
                        error_log("Ciberseguridad: No se encontró el archivo de correo: " . $ruta_mail);
                    }
                }

                echo json_encode(['status' => 'success', 'message' => 'Datos de logística actualizados y cliente notificado.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'No se pudo guardar la información de envío.']);
            }
            exit;
        } elseif ($action === 'cambiar_estatus') {
            $id_cotizacion = (int)($_POST['id_cotizacion'] ?? 0);
            $nuevo_estatus = trim($_POST['estatus'] ?? '');
            
            if ($id_cotizacion === 0 || empty($nuevo_estatus)) {
                echo json_encode(['status' => 'error', 'message' => 'Datos inválidos.']);
                exit;
            }

            // 🔒 CANDADO CIBERSEGURIDAD ESTRICTO EN EL ONE-CLICK
            if (strpos($nuevo_estatus, 'Autorizada') !== false) {
                $stmtCheckDir = $pdo->prepare("SELECT COUNT(*) FROM domicilio_fiscal WHERE Cotizacion_id = ?");
                $stmtCheckDir->execute([$id_cotizacion]);
                $tieneFiscal = $stmtCheckDir->fetchColumn();

                $stmtCheckEquipos = $pdo->prepare("SELECT COUNT(*) FROM detalle_cotizacion WHERE Cotizacion_id = ? AND (id_dom_cert IS NULL OR id_dom_envio IS NULL)");
                $stmtCheckEquipos->execute([$id_cotizacion]);
                $equiposIncompletos = $stmtCheckEquipos->fetchColumn();

                if ($tieneFiscal == 0 || $equiposIncompletos > 0) {
                    echo json_encode([
                        'status' => 'error', 
                        'message' => 'ACCESO DENEGADO SERVIDOR: La cotización tiene equipos sin dirección o le falta la dirección fiscal. Usa el botón del mapa para completarla.'
                    ]);
                    exit;
                }
            }

            $stmtUpdate = $pdo->prepare("UPDATE cotizacion SET estatus = ? WHERE id_cotizacion = ?");
            $stmtUpdate->execute([$nuevo_estatus, $id_cotizacion]);

            echo json_encode(['status' => 'success', 'message' => 'El estatus se ha actualizado correctamente.']);
            
        }elseif ($action === 'marcar_entregado') {
            $id_cotizacion = (int)($_POST['id_cotizacion'] ?? 0);
            
            if ($id_cotizacion === 0) {
                echo json_encode(['status' => 'error', 'message' => 'Datos inválidos.']);
                exit;
            }

            // A. Actualizamos la base de datos (se inserta fecha_entrega actual)
            if (marcarEquipoEntregado($pdo, $id_cotizacion)) {
                
                // B. Traemos al cliente para mandarle su correo automático
                $datosCliente = obtenerDatosClientePorCotizacion($pdo, $id_cotizacion);
                
                if ($datosCliente && !empty($datosCliente['correo'])) {
                    $folio = $datosCliente['folio_especial'] ? $datosCliente['folio_especial'] : str_pad((string)$id_cotizacion, 5, '0', STR_PAD_LEFT);
                    
                    // C. Inyectamos motor de correos de forma segura (MVC)
                    $ruta_mail = __DIR__ . '/../mails/mail_solicitud_oc.php';
                    
                    if (file_exists($ruta_mail)) {
                        require_once $ruta_mail;
                        enviarCorreoSolicitudOC($datosCliente['correo'], $datosCliente['nombre'], $folio);
                    } else {
                        error_log("Ciberseguridad: No se encontró el mail: " . $ruta_mail);
                    }
                }
                echo json_encode(['status' => 'success', 'message' => 'Equipo marcado como entregado. El sistema ha enviado un correo solicitando la OC al cliente.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'No se pudo actualizar el estatus en la Base de Datos.']);
            }
            exit;
        }elseif ($action === 'subir_oc') {
            
            // 🛡️ ZERO TRUST: Prevenir subidas si no es un cliente
            if (!$es_cliente) {
                echo json_encode(['status' => 'error', 'message' => 'Acceso denegado: Solo los clientes B2B pueden subir o editar Órdenes de Compra.']);
                exit;
            }

            $id_cotizacion = (int)($_POST['id_cotizacion_oc'] ?? 0);
            $numero_recepcion = trim(filter_input(INPUT_POST, 'numero_recepcion', FILTER_SANITIZE_SPECIAL_CHARS) ?? '');

            if ($id_cotizacion === 0 || empty($numero_recepcion)) {
                echo json_encode(['status' => 'error', 'message' => 'Faltan datos obligatorios.']);
                exit;
            }

            if (strlen($numero_recepcion) !== 10) {
                echo json_encode(['status' => 'error', 'message' => 'El número de recepción debe tener exactamente 10 caracteres.']);
                exit;
            }

            // ✨ 1. CIBERSEGURIDAD Y LÓGICA DE NEGOCIO: Evaluamos el estado ANTES de guardar
            $stmt = $pdo->prepare("SELECT ruta_oc, oc_cargada FROM cotizacion WHERE id_cotizacion = ?");
            $stmt->execute([$id_cotizacion]);
            $datos_actuales = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $ruta_anterior = $datos_actuales['ruta_oc'] ?? null;
            $es_primera_carga = ($datos_actuales['oc_cargada'] !== 'Y'); // Si no estaba en 'Y', es la primera vez
            
            $ruta_final = $ruta_anterior; // Mantenemos la actual por defecto

            // 2. Proceso de validación y destrucción del archivo viejo (Se mantiene igual)
            if (isset($_FILES['archivo_oc']) && $_FILES['archivo_oc']['error'] === UPLOAD_ERR_OK) {
                $archivo = $_FILES['archivo_oc'];
                $max_size = 2 * 1024 * 1024; // 2 MB

                if ($archivo['size'] > $max_size) {
                    echo json_encode(['status' => 'error', 'message' => 'El archivo supera el límite de 2MB. Intenta comprimirlo.']);
                    exit;
                }

                $mime_permitido = 'application/pdf';
                $mime_real = '';

                if (function_exists('finfo_open')) {
                    $finfo = finfo_open(FILEINFO_MIME_TYPE);
                    $mime_real = finfo_file($finfo, $archivo['tmp_name']);
                    finfo_close($finfo);
                } elseif (function_exists('mime_content_type')) {
                    $mime_real = mime_content_type($archivo['tmp_name']);
                } else {
                    $mime_real = $mime_permitido;
                }

                if ($mime_real !== $mime_permitido) {
                    echo json_encode(['status' => 'error', 'message' => 'ALERTA DE SEGURIDAD: El archivo no es un PDF válido.']);
                    exit;
                }

                // Destrucción física del archivo anterior
                if (!empty($ruta_anterior) && file_exists(__DIR__ . "/../" . $ruta_anterior)) {
                    unlink(__DIR__ . "/../" . $ruta_anterior);
                }

                // Crear nombre seguro y subir el nuevo PDF
                $nombre_seguro = "OC_" . $id_cotizacion . "_" . time() . ".pdf";
                $ruta_relativa = "uploads/ocs/" . $nombre_seguro;
                $ruta_absoluta = __DIR__ . "/../" . $ruta_relativa;

                if (move_uploaded_file($archivo['tmp_name'], $ruta_absoluta)) {
                    $ruta_final = $ruta_relativa;
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'Error de permisos al guardar el archivo en el servidor.']);
                    exit;
                }
            } elseif (empty($ruta_anterior)) {
                echo json_encode(['status' => 'error', 'message' => 'Debes adjuntar el archivo PDF de la Orden de Compra.']);
                exit;
            }

            // 3. Actualizamos la BD
            $sql = "UPDATE cotizacion SET numero_recepcion = ?, ruta_oc = ?, oc_cargada = 'Y' WHERE id_cotizacion = ?";
            if ($pdo->prepare($sql)->execute([$numero_recepcion, $ruta_final, $id_cotizacion])) {
                
                // ✨ 4. OPTIMIZACIÓN DE CORREO: Solo dispara si es la PRIMERA VEZ
                if ($es_primera_carga) {
                    $datosCliente = obtenerDatosClientePorCotizacion($pdo, $id_cotizacion);
                    $folio_real = ($datosCliente && !empty($datosCliente['folio_especial'])) ? $datosCliente['folio_especial'] : str_pad((string)$id_cotizacion, 5, '0', STR_PAD_LEFT);
                    $nombre_cliente_real = ($datosCliente && !empty($datosCliente['nombre'])) ? $datosCliente['nombre'] : ($_SESSION['nombre'] ?? 'Cliente');

                    $admins = obtenerCorreosAdministradoresLAN($pdo);
                    
                    if (!empty($admins)) {
                        $ruta_mail = __DIR__ . '/../mails/mail_notificacion_admins_oc.php';
                        if (file_exists($ruta_mail)) {
                            require_once $ruta_mail;
                            
                            // Extraemos SOLO los correos en un arreglo plano ['admin1@lan.com', 'admin2@lan.com']
                            $lista_correos_admins = array_column($admins, 'correo');
                            
                            // Disparamos una sola función con todo el arreglo
                            enviarCorreoFacturacionUnico($lista_correos_admins, $folio_real, $numero_recepcion, $nombre_cliente_real);
                        }
                    }
                }
                echo json_encode(['status' => 'success', 'message' => 'Orden de compra guardada/actualizada correctamente.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Error al guardar los datos en BD.']);
            }
            exit;
        }

        exit;
    }
}catch (\Throwable $e) { // 🛡️ \Throwable atrapa tanto Exceptions como Errores Fatales en PHP 8+
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Falla en el servidor: ' . $e->getMessage() . ' (Línea ' . $e->getLine() . ')'
    ]);
}/* catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error BD: ' . $e->getMessage()]);
} */