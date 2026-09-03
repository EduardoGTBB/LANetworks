<?php
declare(strict_types=1);
session_start();

// 🛡️ ZERO TRUST: Validar sesión activa (Solo Admins)
if (!isset($_SESSION['id_user_admin'])) {
    http_response_code(403);
    exit('Acceso denegado. Solo personal LAN.');
}

require_once 'config.php';
require_once '../lib/funciones_db.php';

try {

    // Capturamos los filtros que envía el Javascript
    $tipo_reporte = $_GET['tipo'] ?? 'comercial'; 
    $scope = $_GET['scope'] ?? 'todas'; // ✨ Recibimos el scope
    $estatus = $_GET['estatus'] ?? '';
    $categoria = $_GET['categoria'] ?? '';
    $busqueda = $_GET['search'] ?? '';

    // ✨ Ciberseguridad: Extraemos el ID exacto de la sesión
    $id_admin = isset($_SESSION['id_user_admin']) ? (int)$_SESSION['id_user_admin'] : 0;
    $id_cliente = isset($_SESSION['id_usuario_cliente']) ? (int)$_SESSION['id_usuario_cliente'] : 0;
    
    // Le enviamos los parámetros a la Base de Datos
    $datos = obtenerReporteExportacion($pdo, $estatus, $categoria, $busqueda, $scope, $id_admin, $id_cliente);
    
    $fecha_actual = date('Y-m-d_H-i');
    $nombre_archivo = "Reporte_" . ucfirst($tipo_reporte) . "_LAN_{$fecha_actual}.csv";

    // 🚀 Cabeceras HTTP para forzar descarga como Excel
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $nombre_archivo . '"');
    header('Pragma: no-cache');
    header('Expires: 0');

    $salida = fopen('php://output', 'w');
    // 💡 TRUCO SENIOR: BOM UTF-8 para que Excel lea la 'Ñ' y los acentos sin problemas
    fputs($salida, $bom = (chr(0xEF) . chr(0xBB) . chr(0xBF)));

    // Definir cabeceras según el tipo de reporte
    if ($tipo_reporte === 'laboratorio') {
        fputcsv($salida, ['CANTIDAD', 'FOLIO', 'FECHA ELABORACION', 'RAZON SOCIAL', 'CANTIDAD', 'CLAVE', 'DESCRIPCION', 'SUCURSAL', 'DOM SUCURSAL', 'PLAZA']);
    } else {
        fputcsv($salida, ['CANTIDAD', 'FOLIO', 'FECHA ELABORACION', 'RAZON SOCIAL', 'CANTIDAD', 'CLAVE', 'DESCRIPCION', 'PRECIO UNITARIO', 'SUBTOTAL', 'IVA', 'TOTAL', 'PLAZA']);
    }

    // Llenar datos
    foreach ($datos as $row) {
        $folio = $row['folio_especial'] ? $row['folio_especial'] : str_pad((string)$row['id_cotizacion'], 5, '0', STR_PAD_LEFT);
        $fecha = $row['fecha_cot'];
        $empresa = $row['razon_social'];
        $cantidad = $row['cantidad'];
        $clave = $row['clave_product'];
        $plaza = $row['nombre_plaza'] ?? 'N/A';
        
        // Construir la Descripción Avanzada
        $descripcion = $row['descripcion_product'];
        $ptos_calib = trim($row['puntos_calibracion'] ?? '');
        $equipo_id = trim($row['equipo_id'] ?? '');

        if ($tipo_reporte === 'laboratorio') {
            // ✨ Lógica Condicional: Solo se agregan las etiquetas si realmente hay datos en la BD
            if (!empty($ptos_calib)) {
                $descripcion .= " - PTOS CALIBRACION: " . str_replace("\n", " ", $ptos_calib);
            }
            
            if (!empty($equipo_id)) {
                $descripcion .= " - ID: " . $equipo_id;
            }

            // Nombre de sucursal
            $sucursal = $row['nombre_sucursal'] ?? 'N/A';
            
            // Armar Domicilio Completo Inteligente
            $calle = trim($row['calle'] ?? '');
            $num_ext = trim($row['num_ext'] ?? '');
            $num_int = trim($row['num_int'] ?? '');
            $colonia = trim($row['colonia'] ?? '');
            $municipio = trim($row['municipio'] ?? '');
            $estado = trim($row['estado'] ?? '');
            $cp = trim($row['cp'] ?? '');

            $partes_domicilio = [];
            
            if (!empty($calle)) {
                $direccion_calle = $calle;
                if (!empty($num_ext)) $direccion_calle .= " " . $num_ext;
                if (!empty($num_int)) $direccion_calle .= " Int. " . $num_int;
                $partes_domicilio[] = $direccion_calle;
            }
            
            if (!empty($colonia)) $partes_domicilio[] = "Col. " . $colonia;
            if (!empty($municipio)) $partes_domicilio[] = $municipio;
            if (!empty($estado)) $partes_domicilio[] = $estado;
            if (!empty($cp)) $partes_domicilio[] = "C.P. " . $cp;

            // Unimos todas las partes con comas
            $domicilio = !empty($partes_domicilio) ? implode(', ', $partes_domicilio) : 'N/A';

            fputcsv($salida, [$cantidad, $folio, $fecha, $empresa, $cantidad, $clave, $descripcion, $sucursal, $domicilio, $plaza]);

        } else {
            // ✨ Comercial: Se exporta LA DESCRIPCIÓN PURA (Se eliminó la concatenación dura)
            
            $p_unitario = (float)$row['precio_unitario'];
            $subtotal = (float)$row['precio_extendido'];
            $pct_iva = (float)$row['porcentaje_iva'];
            $iva = $subtotal * ($pct_iva / 100);
            $total = $subtotal + $iva;

            // Formato de moneda para Excel
            $fmt_unitario = '$' . number_format($p_unitario, 2);
            $fmt_subtotal = '$' . number_format($subtotal, 2);
            $fmt_iva = '$' . number_format($iva, 2);
            $fmt_total = '$' . number_format($total, 2);

            fputcsv($salida, [$cantidad, $folio, $fecha, $empresa, $cantidad, $clave, $descripcion, $fmt_unitario, $fmt_subtotal, $fmt_iva, $fmt_total, $plaza]);
        }
    }

    fclose($salida);
    exit;

} catch (\Throwable $e) {
    http_response_code(500);
    exit("Error al generar el Excel: " . $e->getMessage());
}