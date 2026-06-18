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

    // ==========================================
    // METODO GET: Cargar selects
    // ==========================================
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? '';
        switch ($action) {
            case 'get_empresas':
                echo json_encode(obtenerClientes($pdo));
                break;
            case 'get_productos':
                echo json_encode(obtenerProduct($pdo));
                break;
            case 'get_usuarios':
                $empresa_id = (int) ($_GET['empresa_id'] ?? 0);
                echo json_encode(obtenerUsuariosPorEmpresa($pdo, $empresa_id));
                break;
            case 'get_sucursales_usuario': // <-- NUEVO ENDPOINT AGREGADO
                $usuario_id = (int) ($_GET['usuario_id'] ?? 0);
                echo json_encode(obtenerSucursalesPorUsuario($pdo, $usuario_id));
                break;
            default:
                echo json_encode(['status' => 'error', 'message' => 'Acción GET no válida']);
        }
        exit;
    }

    // ==========================================
    // METODO POST: Guardar la Cotización
    // ==========================================
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'crear') {

        $empresa_id = (int)($_POST['Empresa_id'] ?? 0);
        $usuario_id = (int)($_POST['Usuario_id'] ?? 0);
        $sucursal_id = (int)($_POST['Sucursal_id'] ?? 0);
        $division    = trim($_POST['division'] ?? '');
        $tipo_precio = trim($_POST['tipo_precio'] ?? '');

        $categoria_raw = trim($_POST['categoria'] ?? 'TODOS');
        $categoria_limpia = 'Nuevo'; // Por defecto si mandan TODOS
        
        if ($categoria_raw === 'USADO') {
            $categoria_limpia = 'Usado';
        } elseif ($categoria_raw === 'CALIBRACION') {
            $categoria_limpia = 'Calibracion';
        }

        /* //& Prueba */
        $tipo_sucursal_flujo = $_POST['tipo_sucursal_flujo'] ?? 'unica';

        if ($tipo_sucursal_flujo === 'multisucursal') {
            $sucursal_id = null;
        } else {
            $sucursal_id = !empty($_POST['Sucursal_id']) ? (int)$_POST['Sucursal_id'] : null;
        }
        /* //& Prueba */

        /* //° if ($empresa_id === 0 || $usuario_id === 0 || $sucursal_id === 0) {
            echo json_encode(['status' => 'error', 'message' => 'Debes seleccionar un Cliente, un Solicitante y la Sucursal de destino..']);
            exit;
        } */

        if ($empresa_id === 0 && $tipo_sucursal_flujo !== 'multisucursal') {
            echo json_encode(['status' => 'error', 'message' => 'Falta seleccionar el Cliente.']);
            exit;
        }

        // Exigimos sucursal SOLO si el flujo es 'unica'
        if (empty($sucursal_id) && $tipo_sucursal_flujo !== 'multisucursal') {
            echo json_encode(['status' => 'error', 'message' => 'Falta seleccionar la Sucursal de destino.']);
            exit;
        }

        /* //° if (empty($division) || empty($tipo_precio)) {
            echo json_encode(['status' => 'error', 'message' => 'Debes seleccionar una División y un Tipo de Precio.']);
            exit;
        } */

        if (empty($division) || empty($tipo_precio)) {
            echo json_encode(['status' => 'error', 'message' => 'Debes seleccionar una División y un Tipo de Precio.']);
            exit;
        }


        $id_user_admin = isset($_SESSION['id_user_admin']) ? (int)$_SESSION['id_user_admin'] : null;
        $es_cliente = isset($_SESSION['id_usuario_cliente']);

        // Datos principales
        $datosCotizacion = [
            'empresa_id'    => $empresa_id,
            'sucursal_id'   => $sucursal_id,
            'id_user_admin' => $id_user_admin,
            'usuario_id'    => $usuario_id,
            'fecha_cot'     => $_POST['fecha_cot'] ?? date('Y-m-d'),
            'importe_total' => (float)($_POST['sub_total'] ?? 0),
            'comentarios'   => trim($_POST['comentarios'] ?? ''),
            'precio_iva'    => (float)($_POST['total_amount'] ?? 0),
            'porcentaje_iva' => (float)($_POST['porcentaje_iva'] ?? 0),
            'categoria'     => $categoria_limpia,
            'tipo_precio'   => $tipo_precio,
            'division'      => $division,
            'estatus'        => $es_cliente ? 'Guardado' : 'Guardado'

        ];

        // Procesar productos
        $productos_ids = $_POST['productos'] ?? [];
        $cantidades    = $_POST['cantidad_cot'] ?? [];
        $unitarios     = $_POST['unitario'] ?? [];
        $totales       = $_POST['total'] ?? [];
        $desglosar_arr = $_POST['desglosar'] ?? [];
        /* //& Prueba */
        $sucursales_fila = $_POST['sucursal_fila'] ?? [];
        /* //& Prueba */
        $detalles      = [];

        for ($i = 0; $i < count($productos_ids); $i++) {
            if (!empty($productos_ids[$i]) && (int)$cantidades[$i] > 0) {
                /* //& Prueba */
                $sucursal_destino = ($tipo_sucursal_flujo === 'multisucursal' && !empty($sucursales_fila[$i])) ? (int)$sucursales_fila[$i] : null;
                if ($tipo_sucursal_flujo === 'multisucursal' && empty($sucursal_destino)) {
                    echo json_encode(['status' => 'error', 'message' => 'Falta seleccionar la Sucursal Destino para uno o más productos en la tabla.']);
                    exit;
                }
                /* //& Prueba */

                $detalles[] = [
                    'producto_id'      => (int)$productos_ids[$i],
                    'cantidad'         => (int)$cantidades[$i],
                    'precio_unitario'  => (float)$unitarios[$i],
                    'precio_extendido' => (float)$totales[$i],
                    'desglosar'        => $desglosar_arr[$i] ?? 'N',
                    /* //& Prueba */
                    'sucursal_destino_id' => $sucursal_destino
                    /* //& Prueba */
                ];
            }
        }

        if (count($detalles) === 0) {
            echo json_encode(['status' => 'error', 'message' => 'Debes agregar al menos un producto con cantidad válida.']);
            exit;
        }

        $nuevo_folio = saveCotizacion($pdo, $datosCotizacion, $detalles);
        echo json_encode(['status' => 'success', 'message' => "La cotización #$nuevo_folio se guardó correctamente.", 'id_cotizacion' => $nuevo_folio]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error en el servidor: ' . $e->getMessage()]);
}
