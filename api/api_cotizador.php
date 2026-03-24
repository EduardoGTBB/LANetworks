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
            default:
                echo json_encode(['status' => 'error', 'message' => 'Acción GET no válida']);
        }
        exit;
    }

    // ==========================================
    // METODO POST: Guardar la Cotización
    // ==========================================
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        
        $empresa_id = (int)($_POST['Empresa_id'] ?? 0);
        $usuario_id = (int)($_POST['Usuario_id'] ?? 0);
        $division    = trim($_POST['division'] ?? '');
        $tipo_precio = trim($_POST['tipo_precio'] ?? '');
        
        if ($empresa_id === 0 || $usuario_id === 0) {
            echo json_encode(['status' => 'error', 'message' => 'Debes seleccionar un Cliente y un Solicitante.']);
            exit;
        }
        
        if (empty($division) || empty($tipo_precio)) {
            echo json_encode(['status' => 'error', 'message' => 'Debes seleccionar una División y un Tipo de Precio.']);
            exit;
        }

        $id_user_admin = isset($_SESSION['id_user_admin']) ? (int)$_SESSION['id_user_admin'] : null;

        // Datos principales
        $datosCotizacion = [
            'empresa_id'    => $empresa_id,
            // 'id_user_admin' => (int)$_SESSION['id_user_admin'],
            'id_user_admin' => $id_user_admin,
            'usuario_id'    => $usuario_id,
            'fecha_cot'     => $_POST['fecha_cot'] ?? date('Y-m-d'),
            'importe_total' => (float)($_POST['sub_total'] ?? 0),
            'comentarios'   => '',
            'precio_iva'    => (float)($_POST['total_amount'] ?? 0),
            'porcentaje_iva'=> (float)($_POST['porcentaje_iva'] ?? 0),
            'tipo_precio'   => $tipo_precio,
            'division'      => $division
        ];

        // Procesar productos
        $productos_ids = $_POST['productos'] ?? [];
        $cantidades    = $_POST['cantidad_cot'] ?? [];
        $unitarios     = $_POST['unitario'] ?? [];
        $totales       = $_POST['total'] ?? [];
        $detalles      = [];

        for ($i = 0; $i < count($productos_ids); $i++) {
            if (!empty($productos_ids[$i]) && (int)$cantidades[$i] > 0) {
                $detalles[] = [
                    'producto_id'      => (int)$productos_ids[$i],
                    'cantidad'         => (int)$cantidades[$i],
                    'precio_unitario'  => (float)$unitarios[$i],
                    'precio_extendido' => (float)$totales[$i]
                ];
            }
        }

        if (count($detalles) === 0) {
            echo json_encode(['status' => 'error', 'message' => 'Debes agregar al menos un producto con cantidad válida.']);
            exit;
        }

        $nuevo_folio = saveCotizacion($pdo, $datosCotizacion, $detalles);
        echo json_encode(['status' => 'success', 'message' => "La cotización #$nuevo_folio se guardó correctamente."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error en el servidor: ' . $e->getMessage()]);
}
?>