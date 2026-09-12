<?php
declare(strict_types=1);
session_start();

// 🛡️ ZERO TRUST: Validar sesión activa (Solo Admins LAN permitidos)
if (!isset($_SESSION['id_user_admin']) || isset($_SESSION['id_usuario_cliente'])) {
    http_response_code(403);
    exit('Acceso denegado. Función exclusiva para personal de LAN.');
}

require_once 'config.php';
require_once '../lib/funciones_db.php';

try {

    // ✨ 1. CAPTURAR FILTROS EXACTOS DEL JAVASCRIPT
    $tipo_reporte = $_GET['tipo'] ?? 'comercial'; 
    $scope = $_GET['scope'] ?? 'todas'; 
    $estatus = $_GET['estatus'] ?? '';
    $categoria = $_GET['categoria'] ?? '';
    $fecha_inicio = trim($_GET['fecha_inicio'] ?? ''); // 🚀 RANGO INICIO
    $fecha_fin = trim($_GET['fecha_fin'] ?? '');       // 🚀 RANGO FIN
    $busqueda = $_GET['search'] ?? '';

    // Ciberseguridad: Extraemos el ID exacto de la sesión
    $id_admin = isset($_SESSION['id_user_admin']) ? (int)$_SESSION['id_user_admin'] : 0;
    $id_cliente = isset($_SESSION['id_usuario_cliente']) ? (int)$_SESSION['id_usuario_cliente'] : 0;
    
    // 2. EXTRAER DATOS CON LOS FILTROS APLICADOS
    $datos = obtenerReporteExportacion($pdo, $estatus, $categoria, $busqueda, $scope, $id_admin, $id_cliente, $fecha_inicio, $fecha_fin);
    
    $fecha_actual = date('Y-m-d_H-i');
    $nombre_archivo = "Reporte_" . ucfirst($tipo_reporte) . "_LAN_{$fecha_actual}.csv";

    // 🚀 3. CABECERAS HTTP PARA FORZAR EXCEL
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $nombre_archivo . '"');
    header('Pragma: no-cache');
    header('Expires: 0');

    $salida = fopen('php://output', 'w');
    // BOM UTF-8 para que Excel lea acentos sin problemas
    fputs($salida, $bom = (chr(0xEF) . chr(0xBB) . chr(0xBF)));

    if ($tipo_reporte === 'laboratorio') {
        fputcsv($salida, ['CANTIDAD', 'FOLIO', 'FECHA ELABORACION', 'RAZON SOCIAL', 'CANTIDAD', 'CLAVE', 'DESCRIPCION', 'SUCURSAL', 'DOM SUCURSAL', 'PLAZA']);
    } else {
        fputcsv($salida, ['CANTIDAD', 'FOLIO', 'FECHA ELABORACION', 'RAZON SOCIAL', 'CANTIDAD', 'CLAVE', 'DESCRIPCION', 'PRECIO UNITARIO', 'SUBTOTAL', 'IVA', 'TOTAL', 'PLAZA']);
    }

    // ✨ 4. LÓGICA DE AGRUPACIÓN (Respeta los filtros porque $datos ya viene filtrado)
    $cotizaciones_agrupadas = [];
    foreach ($datos as $row) {
        $id = $row['id_cotizacion'];
        if (!isset($cotizaciones_agrupadas[$id])) {
            $cotizaciones_agrupadas[$id] = [];
        }
        $cotizaciones_agrupadas[$id][] = $row;
    }

    // ✨ 5. ITERACIÓN Y CÁLCULO DE TOTALES
    foreach ($cotizaciones_agrupadas as $id_cotizacion => $filas) {
        // Optimizamos memoria: Ya solo necesitamos acumular el Gran Total
        $suma_total = 0;
        $folio_actual = '';

        foreach ($filas as $row) {
            $folio_actual = $row['folio_especial'] ? $row['folio_especial'] : str_pad((string)$row['id_cotizacion'], 5, '0', STR_PAD_LEFT);
            $fecha_cot = $row['fecha_cot'];
            $empresa = $row['razon_social'];
            $cantidad = $row['cantidad'];
            $clave = $row['clave_product'];
            $plaza = $row['nombre_plaza'] ?? 'N/A';
            
            $descripcion = $row['descripcion_product'];
            $ptos_calib = trim($row['puntos_calibracion'] ?? '');
            $equipo_id = trim($row['equipo_id'] ?? '');

            if ($tipo_reporte === 'laboratorio') {
                if (!empty($ptos_calib)) $descripcion .= " - PTOS CALIBRACION: " . str_replace("\n", " ", $ptos_calib);
                if (!empty($equipo_id)) $descripcion .= " - ID: " . $equipo_id;

                $sucursal = $row['nombre_sucursal'] ?? 'N/A';
                
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

                $domicilio = !empty($partes_domicilio) ? implode(', ', $partes_domicilio) : 'N/A';

                fputcsv($salida, [$cantidad, $folio_actual, $fecha_cot, $empresa, $cantidad, $clave, $descripcion, $sucursal, $domicilio, $plaza]);

            } else {
                $p_unitario = (float)$row['precio_unitario'];
                $subtotal = (float)$row['precio_extendido'];
                $pct_iva = (float)$row['porcentaje_iva'];
                $iva = $subtotal * ($pct_iva / 100);
                $total = $subtotal + $iva;

                // Acumulamos SOLO el Gran Total para el folio en curso
                $suma_total += $total;

                $fmt_unitario = '$' . number_format($p_unitario, 2);
                $fmt_subtotal = '$' . number_format($subtotal, 2);
                $fmt_iva = '$' . number_format($iva, 2);
                $fmt_total = '$' . number_format($total, 2);

                fputcsv($salida, [$cantidad, $folio_actual, $fecha_cot, $empresa, $cantidad, $clave, $descripcion, $fmt_unitario, $fmt_subtotal, $fmt_iva, $fmt_total, $plaza]);
            }
        } // Fin de filas internas del grupo

        // ✨ IMPRESIÓN DEL TOTAL ESTRATÉGICO AL FINAL DE CADA FOLIO
        if ($tipo_reporte !== 'laboratorio') {
            fputcsv($salida, [
                '', // CANTIDAD
                '', // FOLIO
                '', // FECHA
                '', // RAZON SOCIAL
                '', // CANTIDAD
                '', // CLAVE
                '', // DESCRIPCION
                '', // PRECIO UNITARIO
                '▶ TOTAL FOLIO ' . $folio_actual . ':', // Lo colocamos en la columna SUBTOTAL para acercarlo al resultado
                '', // IVA (Se deja vacío)
                '$' . number_format($suma_total, 2), // TOTAL (Solo mostramos esta suma)
                ''  // PLAZA
            ]);
            // Separador en blanco entre cotizaciones para limpieza visual
            fputcsv($salida, []);
        }

    } // Fin agrupaciones generales

    fclose($salida);
    exit;

} catch (\Throwable $e) {
    http_response_code(500);
    exit("Error al generar el Excel: " . $e->getMessage());
}