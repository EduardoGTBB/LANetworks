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

    // Identificamos si la sesión actual es de un cliente
    $es_cliente = isset($_SESSION['id_usuario_cliente']);
    // $admin_id = (int)$_SESSION['id_user_admin'];

    // ==========================================
    // GET: Leer lista o buscar cotización específica
    // ==========================================
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? 'leer';

        if ($action === 'leer') {
            // Evaluamos a quién le estamos respondiendo
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
                echo json_encode([]); // Si se cuela un operativo, mandamos vacío
            }
        } elseif ($action === 'get_cotizacion') {
            // Buscamos al padre y a los hijos para rellenar el modal
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

            if ($id_cotizacion === 0 || $empresa_id === 0 || $usuario_id === 0) {
                echo json_encode(['status' => 'error', 'message' => 'Faltan datos obligatorios.']);
                exit;
            }

            $cotizacion_actual = editarCotizacionporID($pdo, $id_cotizacion);
            if ($cotizacion_actual && in_array($cotizacion_actual['estatus'], ['Ganada', 'Perdida'])) {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Operación denegada. Las cotizaciones marcadas como Ganadas o Perdidas no pueden ser modificadas.'
                ]);
                exit;
            }

            // Mapeamos los arrays
            $productos_ids = $_POST['productos'] ?? [];
            $cantidades    = $_POST['cantidad_cot'] ?? [];
            $unitarios     = $_POST['unitario'] ?? [];
            $totales       = $_POST['total'] ?? [];
            $detalles = [];

            for ($i = 0; $i < count($productos_ids); $i++) {
                if (!empty($productos_ids[$i]) && (int)$cantidades[$i] > 0) {
                    $detalles[] = [
                        'producto_id'      => (int)$productos_ids[$i],
                        'cantidad'         => (int)$cantidades[$i],
                        'precio_unitario'  => (float)$unitarios[$i],
                        'precio_extendido' => (float)$totales[$i],
                    ];
                }
            }

            $datosCotizacion = [
                'empresa_id'    => $empresa_id,
                'usuario_id'    => $usuario_id,
                'importe_total' => (float)($_POST['sub_total'] ?? 0),
                'precio_iva'    => (float)($_POST['total_amount'] ?? 0),
                'division'      => trim($_POST['division'] ?? ''),
                'tipo_precio'   => trim($_POST['tipo_precio'] ?? ''),
                'porcentaje_iva' => (float)($_POST['porcentaje_iva'] ?? 16),
                'estatus'       => trim($_POST['estatus'] ?? 'Guardada')
            ];

            updateCotizacion($pdo, $id_cotizacion, $datosCotizacion, $detalles);
            echo json_encode(['status' => 'success', 'message' => 'Cotización actualizada.']);
        } elseif ($action === 'eliminar') {
            $id = (int)($_POST['id_cotizacion'] ?? 0);

            // --- NUEVO CANDADO DE ELIMINACIÓN ---
            $cotizacion_actual = editarCotizacionporID($pdo, $id);
            if ($cotizacion_actual && in_array($cotizacion_actual['estatus'], ['Ganada', 'Perdida'])) {
                // Verificamos si el usuario activo NO es un administrador
                $es_admin = isset($_SESSION['perfil']) && $_SESSION['perfil'] === 'admin';

                if (!$es_admin) {
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Operación denegada. Las cotizaciones Ganadas o Perdidas solo pueden ser eliminadas por un Administrador.'
                    ]);
                    exit;
                }
            }
            // ------------------------------------

            borrarCotizacion($pdo, $id);
            echo json_encode(['status' => 'success', 'message' => 'Cotización eliminada permanentemente.']);
        }
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error BD: ' . $e->getMessage()]);
}
