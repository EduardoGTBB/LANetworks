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

    // 1. CAPTURAR FILTROS EXACTOS DEL JAVASCRIPT
    $tipo_reporte = $_GET['tipo'] ?? 'comercial'; 
    $scope = $_GET['scope'] ?? 'todas'; 
    $estatus = $_GET['estatus'] ?? '';
    $categoria = $_GET['categoria'] ?? '';
    
    // Filtros de fecha
    $fecha_inicio = trim($_GET['fecha_inicio'] ?? '');
    $fecha_fin = trim($_GET['fecha_fin'] ?? '');       
    
    // Filtros de Rango de Pedidos (Folio)
    $pedido_inicio = (int)($_GET['pedido_inicio'] ?? 0);
    $pedido_fin = (int)($_GET['pedido_fin'] ?? 0);

    $busqueda = $_GET['search'] ?? '';
    
    //Captura del Laboratorio Seleccionado (evamsa o 4p)
    $laboratorio_req = $_GET['laboratorio'] ?? 'evamsa'; 

    $id_admin = isset($_SESSION['id_user_admin']) ? (int)$_SESSION['id_user_admin'] : 0;
    $id_cliente = isset($_SESSION['id_usuario_cliente']) ? (int)$_SESSION['id_usuario_cliente'] : 0;
    
    // 2. EXTRAER DATOS
    $datos = obtenerReporteExportacion($pdo, $estatus, $categoria, $busqueda, $scope, $id_admin, $id_cliente, $fecha_inicio, $fecha_fin, $pedido_inicio, $pedido_fin);
    
    $fecha_actual = date('Y-m-d_H-i');
    $nombre_lab_sufijo = ($tipo_reporte === 'laboratorio') ? "_LAB_" . strtoupper($laboratorio_req) : "";
    $nombre_archivo = "Reporte_" . ucfirst($tipo_reporte) . "_LAN" . $nombre_lab_sufijo . "_{$fecha_actual}.csv";

    // 🚀 3. CABECERAS HTTP PARA FORZAR EXCEL
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $nombre_archivo . '"');
    header('Pragma: no-cache');
    header('Expires: 0');

    $salida = fopen('php://output', 'w');
    fputs($salida, $bom = (chr(0xEF) . chr(0xBB) . chr(0xBF)));

    // CABECERAS: Añadimos COSTO LAB entre CLAVE y DESCRIPCION si es reporte de laboratorio
    if ($tipo_reporte === 'laboratorio') {
        $titulo_lab = ($laboratorio_req === 'evamsa') ? 'COSTO EVAMSA' : 'COSTO 4PLAB';
        fputcsv($salida, ['CANTIDAD', 'FOLIO', 'FECHA ELABORACION', 'RAZON SOCIAL', 'CLAVE', $titulo_lab, 'DESCRIPCION', 'PTOS CALIBRACION', 'ID EQUIPO', 'SUCURSAL', 'DOM SUCURSAL', 'PLAZA']);
    } elseif ($tipo_reporte === 'modelos') {
        // ✨ NUEVO: REPORTE RESUMEN POR MODELOS CON CONDICIÓN
        fputcsv($salida, ['CLAVE / MODELO', 'CONDICIÓN (NUEVO/USADO)', 'DESCRIPCION', 'CANTIDAD TOTAL VENDIDA', 'SUBTOTAL ACUMULADO', 'IVA ACUMULADO', 'TOTAL ACUMULADO']);
    } else {
        fputcsv($salida, ['CANTIDAD', 'FOLIO', 'FECHA ELABORACION', 'RAZON SOCIAL', 'CLAVE', 'DESCRIPCION', 'PRECIO UNITARIO', 'SUBTOTAL', 'IVA', 'TOTAL', 'TOTAL PEDIDO', 'PLAZA']);
    }

    // ==========================================
    //   PROCESAMIENTO: REPORTE POR MODELOS
    // ==========================================
    if ($tipo_reporte === 'modelos') {
        
        // ✨ UX/BI: Título dinámico para que el Excel indique qué se filtró
        $titulo_filtro = "TODOS LOS REGISTROS";
        if ($pedido_inicio > 0 && $pedido_fin > 0) {
            $titulo_filtro = "RANGO DE FOLIOS (PEDIDOS): " . $pedido_inicio . " AL " . $pedido_fin;
        } elseif (!empty($fecha_inicio) && !empty($fecha_fin)) {
            $titulo_filtro = "PERIODO: " . $fecha_inicio . " AL " . $fecha_fin;
        }

        // Imprimimos la cabecera informativa en el Excel
        fputcsv($salida, ['REPORTE DE VENTAS POR MODELO DE EQUIPO']);
        fputcsv($salida, ['FILTRO APLICADO:', $titulo_filtro]);
        fputcsv($salida, []); // Fila vacía visual

        // Cabeceras de la tabla
        fputcsv($salida, ['CLAVE / MODELO', 'CONDICIÓN (NUEVO/USADO)', 'DESCRIPCION', 'CANTIDAD TOTAL VENDIDA', 'SUBTOTAL ACUMULADO', 'IVA ACUMULADO', 'TOTAL ACUMULADO']);
        
        $agrupado_modelos = [];

        foreach ($datos as $row) {
            $clave = trim($row['clave_product']);
            
            // Si el modelo no existe en el arreglo temporal, lo inicializamos
            if (!isset($agrupado_modelos[$clave])) {
                // Priorizamos el estado nativo del producto, si no, tomamos la categoría de la cotización
                $condicion_equipo = trim($row['estado_product'] ?? $row['categoria'] ?? 'N/A');

                $agrupado_modelos[$clave] = [
                    'clave'       => $clave,
                    'condicion'   => strtoupper($condicion_equipo), // Forzamos a MAYÚSCULAS por estética de Excel
                    'descripcion' => trim($row['descripcion_product']),
                    'cantidad'    => 0,
                    'subtotal'    => 0,
                    'iva'         => 0,
                    'total'       => 0
                ];
            }

            // Realizamos la sumatoria de este modelo
            $qty = (int)$row['cantidad'];
            $sub = (float)$row['precio_extendido'];
            $iva = $sub * ((float)$row['porcentaje_iva'] / 100);

            $agrupado_modelos[$clave]['cantidad'] += $qty;
            $agrupado_modelos[$clave]['subtotal'] += $sub;
            $agrupado_modelos[$clave]['iva']      += $iva;
            $agrupado_modelos[$clave]['total']    += ($sub + $iva);
        }

        // Ordenamos de mayor a menor ventas
        usort($agrupado_modelos, function($a, $b) {
            return $b['cantidad'] <=> $a['cantidad'];
        });

        // Volcamos la data consolidada al CSV
        foreach ($agrupado_modelos as $item) {
            fputcsv($salida, [
                $item['clave'],
                $item['condicion'], // Imprimimos la nueva columna aquí
                $item['descripcion'],
                $item['cantidad'],
                '$' . number_format($item['subtotal'], 2),
                '$' . number_format($item['iva'], 2),
                '$' . number_format($item['total'], 2)
            ]);
        }

        fclose($salida);
        exit;
    }

    $cotizaciones_agrupadas = [];
    foreach ($datos as $row) {
        $id = $row['id_cotizacion'];
        if (!isset($cotizaciones_agrupadas[$id])) $cotizaciones_agrupadas[$id] = [];
        $cotizaciones_agrupadas[$id][] = $row;
    }

    foreach ($cotizaciones_agrupadas as $id_cotizacion => $filas) {
        $suma_total = 0;
        $folio_actual = '';
        $total_items = count($filas);

        if ($tipo_reporte !== 'laboratorio') {
            foreach ($filas as $row) {
                $subtotal_calc = (float)$row['precio_extendido'];
                $pct_iva_calc = (float)$row['porcentaje_iva'];
                $iva_calc = $subtotal_calc * ($pct_iva_calc / 100);
                $suma_total += ($subtotal_calc + $iva_calc);
            }
        }

        foreach ($filas as $index => $row) {
            $folio_actual = $row['folio_especial'] ? $row['folio_especial'] : str_pad((string)$row['id_cotizacion'], 5, '0', STR_PAD_LEFT);
            $fecha_cot = $row['fecha_cot'];
            $empresa = $row['razon_social'];
            $cantidad = $row['cantidad'];
            $clave = $row['clave_product'];
            $plaza = $row['nombre_plaza'] ?? 'N/A';
            
            $descripcion = trim($row['descripcion_product']);
            $ptos_calib = trim($row['puntos_calibracion'] ?? '');
            $equipo_id = trim($row['equipo_id'] ?? '');

            if ($tipo_reporte === 'laboratorio') {
                // (Dentro del if ($tipo_reporte === 'laboratorio') { ... )
                $ptos_calib_format = !empty($ptos_calib) ? str_replace("\n", " ", $ptos_calib) : 'N/A';
                
                if (str_ends_with((string)$folio_actual, '-N')) {
                    $equipo_id_format = '';
                } else {
                    $equipo_id_format = !empty($equipo_id) ? $equipo_id : 'N/A';
                }

                // NUEVA LÓGICA: Multiplicar el costo unitario del laboratorio por la cantidad de equipos
                $costo_lab_unitario = ($laboratorio_req === 'evamsa') ? (float)$row['pl_evamsa'] : (float)$row['pl_4p'];
                
                // Extraemos la cantidad de equipos de la fila actual
                $cantidad_equipos = (int)$row['cantidad'];
                
                // Calculamos el costo total para el laboratorio
                $costo_lab_total = $costo_lab_unitario * $cantidad_equipos;
                
                // Formateamos como moneda ($0.00)
                $costo_lab_format = '$' . number_format($costo_lab_total, 2);

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

                // Inyectamos el costo entre CLAVE y DESCRIPCION
                fputcsv($salida, [$cantidad, $folio_actual, $fecha_cot, $empresa, $clave, $costo_lab_format, $descripcion, $ptos_calib_format, $equipo_id_format, $sucursal, $domicilio, $plaza]);

            } else {
                $p_unitario = (float)$row['precio_unitario'];
                $subtotal = (float)$row['precio_extendido'];
                $pct_iva = (float)$row['porcentaje_iva'];
                $iva = $subtotal * ($pct_iva / 100);
                $total = $subtotal + $iva;
                
                $fmt_unitario = '$' . number_format($p_unitario, 2);
                $fmt_subtotal = '$' . number_format($subtotal, 2);
                $fmt_iva = '$' . number_format($iva, 2);
                $fmt_total = '$' . number_format($total, 2);

                $val_total_pedido = ($index === $total_items - 1) ? '$' . number_format($suma_total, 2) : '';

                fputcsv($salida, [$cantidad, $folio_actual, $fecha_cot, $empresa, $clave, $descripcion, $fmt_unitario, $fmt_subtotal, $fmt_iva, $fmt_total, $val_total_pedido, $plaza]);
            }
        } 

        if ($tipo_reporte !== 'laboratorio') {
            fputcsv($salida, [
                '', '', '', '', '', '', '',
                '▶ FIN DEL FOLIO ' . $folio_actual, 
                '', '', '', ''
            ]);
            fputcsv($salida, []);
        }

    } 

    fclose($salida);
    exit;

} catch (\Throwable $e) {
    http_response_code(500);
    exit("Error al generar el Excel: " . $e->getMessage());
}