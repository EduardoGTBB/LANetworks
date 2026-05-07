<?php
declare(strict_types=1);
session_start();

if (!isset($_SESSION['id_user_admin']) && !isset($_SESSION['id_usuario_cliente'])) {
    http_response_code(403);
    exit(json_encode(['status' => 'error', 'message' => 'Acceso denegado']));
}

require_once 'config.php';
require_once '../lib/funciones_db.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // GET: Leer direcciones previas y el domicilio de la empresa
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id_cotizacion'])) {
        $id_cot = (int)$_GET['id_cotizacion'];

        // Obtenemos los IDs relevantes de la cotización
        $stmtStatus = $pdo->prepare("SELECT estatus, Usuario_empresa_id, Sucursal_id FROM cotizacion WHERE id_cotizacion = ?");
        $stmtStatus->execute([$id_cot]);
        $cotData = $stmtStatus->fetch(PDO::FETCH_ASSOC);
        
        $direcciones = obtenerDireccionesCotizacion($pdo, $id_cot);
        $empresaDefault = obtenerDomicilioPorCotizacion($pdo, $id_cot);
        
        $direcciones['empresa_default'] = $empresaDefault;
        $direcciones['estatus_cotizacion'] = $cotData['estatus'] ?? 'Guardado'; 
        
        // Enviamos al JS el ID del solicitante y la sucursal guardada (si existe)
        $direcciones['Usuario_empresa_id'] = $cotData['Usuario_empresa_id'];
        $direcciones['Sucursal_id'] = $cotData['Sucursal_id'];

        echo json_encode(['status' => 'success', 'data' => $direcciones]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_sucursales') {
        $usuario_id = (int)$_GET['usuario_id'];
        echo json_encode(obtenerSucursalesPorUsuario($pdo, $usuario_id));
        exit;
    }

    // POST: Guardar los 3 formularios
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $id_cot = (int)($_POST['id_cotizacion'] ?? 0);
        if ($id_cot === 0) exit(json_encode(['status' => 'error', 'message' => 'ID inválido.']));

        // Blindaje anti Error 500: Si un input falta, se envía un texto vacío ('')
        $fiscal = [
            'calle' => $_POST['f_calle'] ?? '', 'colonia' => $_POST['f_colonia'] ?? '', 
            'localidad' => $_POST['f_localidad'] ?? '', 'cp' => $_POST['f_cp'] ?? '', 
            'municipio' => $_POST['f_municipio'] ?? '', 'estado' => $_POST['f_estado'] ?? ''
        ];
        
        $cert = [
            'calle' => $_POST['c_calle'] ?? '', 'colonia' => $_POST['c_colonia'] ?? '', 
            'localidad' => $_POST['c_localidad'] ?? '', 'cp' => $_POST['c_cp'] ?? '', 
            'municipio' => $_POST['c_municipio'] ?? '', 'estado' => $_POST['c_estado'] ?? ''
        ];
        
        $envio = [
            'calle' => $_POST['e_calle'] ?? '', 'colonia' => $_POST['e_colonia'] ?? '', 
            'localidad' => $_POST['e_localidad'] ?? '', 'cp' => $_POST['e_cp'] ?? '', 
            'municipio' => $_POST['e_municipio'] ?? '', 'estado' => $_POST['e_estado'] ?? ''
        ];

        // Se envía a la base de datos (Nota: Eliminamos el parámetro $sucursal_id que causaba conflicto)
        formalizarVenta($pdo, $id_cot, $fiscal, $cert, $envio);
        
        echo json_encode(['status' => 'success', 'message' => '¡Direcciones guardadas correctamente!']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
}
?>