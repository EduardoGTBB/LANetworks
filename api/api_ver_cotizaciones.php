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
    // POST: Editar o Eliminar
    // ==========================================
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? '';

        if ($action === 'editar') {
            $id_cotizacion = (int)($_POST['id_cotizacion'] ?? 0);
            $empresa_id    = (int)($_POST['Empresa_id'] ?? 0);
            $usuario_id    = (int)($_POST['Usuario_id'] ?? 0);
            $sucursal_id   = (int)($_POST['Sucursal_id'] ?? 0);

            $is_multi      = ($_POST['is_multisucursal'] ?? '0') === '1';

            if ($id_cotizacion === 0 || $empresa_id === 0 || $usuario_id === 0) {
                echo json_encode(['status' => 'error', 'message' => 'Faltan datos obligatorios (Cliente o Solicitante).']);
                exit;
            }

            if (!$is_multi && $sucursal_id === 0) {
                echo json_encode(['status' => 'error', 'message' => 'Falta seleccionar la Sucursal Destino global.']);
                exit;
            }

            if ($is_multi) {
                $sucursal_id = null;
            }

            $cotizacion_actual = editarCotizacionporID($pdo, $id_cotizacion);
            if ($cotizacion_actual && in_array($cotizacion_actual['estatus'], ['Autorizada (información completa)', 'No autorizada'])) {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Operación denegada. Las cotizaciones marcadas como Ganadas o Perdidas no pueden ser modificadas.'
                ]);
                exit;
            }

            // ✨ AQUÍ CAPTURAMOS EL RASTREADOR OCULTO
            $ids_detalles  = $_POST['id_detalle'] ?? []; 
            
            $productos_ids = $_POST['productos'] ?? [];
            $cantidades    = $_POST['cantidad_cot'] ?? [];
            $unitarios     = $_POST['unitario'] ?? [];
            $totales       = $_POST['total'] ?? [];
            $desglosar_arr = $_POST['desglosar'] ?? [];
            $sucursales_fila = $_POST['sucursal_fila'] ?? [];

            $detalles = [];

            for ($i = 0; $i < count($productos_ids); $i++) {
                if (!empty($productos_ids[$i]) && (int)$cantidades[$i] > 0) {

                    $sucursal_destino = ($is_multi && !empty($sucursales_fila[$i])) ? (int)$sucursales_fila[$i] : null;
                    if ($is_multi && empty($sucursal_destino)) {
                        echo json_encode(['status' => 'error', 'message' => 'Falta seleccionar la Sucursal Destino para uno o más productos en la tabla.']);
                        exit;
                    }

                    $detalles[] = [
                        'id_detalle'       => (int)($ids_detalles[$i] ?? 0), // ✨ LO INYECTAMOS AL ARRAY
                        'producto_id'      => (int)$productos_ids[$i],
                        'cantidad'         => (int)$cantidades[$i],
                        'precio_unitario'  => (float)$unitarios[$i],
                        'precio_extendido' => (float)$totales[$i],
                        'desglosar'        => $desglosar_arr[$i] ?? 'N', 
                        'sucursal_destino_id' => $sucursal_destino
                    ];
                }
            }

            $estatus_nuevo = trim($_POST['estatus'] ?? 'Guardado');

            // --- CANDADO DE DIRECCIONES ---
            if ($estatus_nuevo === 'Autorizada (información completa)') {
                $stmtCheckDir = $pdo->prepare("SELECT COUNT(*) FROM domicilio_fiscal WHERE Cotizacion_id = ?");
                $stmtCheckDir->execute([$id_cotizacion]);
                if ($stmtCheckDir->fetchColumn() == 0) {
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'No puedes autorizar una cotización que aún no tiene direcciones de certificado y envío.'
                    ]);
                    exit;
                }
            }

            $datosCotizacion = [
                'empresa_id'    => $empresa_id,
                'usuario_id'    => $usuario_id,
                'sucursal_id'   => $sucursal_id,
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
                        'message' => 'Operación denegada. No puedes eliminar una cotización que ya se encuentra Autorizada.'
                    ]);
                    exit;
                }
            }

            borrarCotizacion($pdo, $id);
            echo json_encode(['status' => 'success', 'message' => 'Cotización eliminada permanentemente.']);
        }
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error BD: ' . $e->getMessage()]);
}
?>