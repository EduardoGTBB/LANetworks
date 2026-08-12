<?php

/**
 *  controlador: imprimir_cotizacion.php
 *  Formato: LA NETWORKS & SMART TECHNOLOGIES - Optimizado para Bootstrap 5
 */
session_start();

require 'api/config.php';
require 'lib/utilidades.php';

if (!isset($_SESSION['id_user_admin']) && !isset($_SESSION['id_usuario_cliente'])) {
    header('Location: index.php');
    exit;
}

$id_cot = obtener_id_get('id');
if (!$id_cot) {
    exit("ID Inválido");
}

// 1. Datos Generales
$sql = "SELECT c.*, e.*, dem.calle_numero, dem.colonia, dem.localidad, dem.codigo_postal, dem.municipio, dem.estado, 
        CONCAT(usu.nombre, ' ', usu.apellido_pat, ' ', usu.apellido_mat) as cliente, 
        CONCAT(u.admin_nombre, ' ', u.admin_apell_pat) as vendedor,
        s.id_sae, s.nombre_sucursal, s.estado as sucursal_estado,
        pz.nombre_plaza as plaza_guardada
    FROM cotizacion c
    JOIN empresa e ON c.Empresa_id = e.id_empresa
    JOIN domicilio_empresa dem ON e.id_empresa = dem.Empresa_id
    LEFT JOIN usuarios_admin u ON c.Usuario_admin_id = u.id_user_admin
    JOIN usuarios usu ON c.Usuario_empresa_id = usu.id_usuario
    LEFT JOIN sucursales s ON c.Sucursal_id = s.id_sucursal
    LEFT JOIN plazas pz ON c.Plaza_id = pz.id_plaza
    WHERE c.id_cotizacion = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute([$id_cot]);
$cot = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$cot) {
    exit("Cotización no encontrada");
}

$es_multisucursal = empty($cot['Sucursal_id']);

// 2. Detalles de la cotización
$sqlDet = "SELECT d.*, p.descripcion_product, p.clave_product,p.puntos_calibracion,
           pf.pf_equipo, pf.pf_calibracion,
           pp.pp_equipo, pp.pp_calibracion,
           s_dest.nombre_sucursal AS nombre_sucursal_destino,
           s_dest.estado AS estado_sucursal_destino,
           c_dir.calle_numero_cert, c_dir.entre_calle_cert, c_dir.y_calle_cert, c_dir.colonia_cert, c_dir.municipio_cert, c_dir.estado as estado_cert, c_dir.cp_cert,
           e_dir.calle_numero_envio, e_dir.entre_calle_envio, e_dir.y_calle_envio, e_dir.colonia_envio, e_dir.municipio_envio, e_dir.estado_envio, e_dir.cp_envio
           FROM detalle_cotizacion d
           JOIN productos p ON d.Product_id = p.id_product
           LEFT JOIN precios_farmacia pf ON p.id_product = pf.Producto_id
           LEFT JOIN precios_publico pp ON p.id_product = pp.Producto_id
           LEFT JOIN sucursales s_dest ON d.sucursal_destino_id = s_dest.id_sucursal
           LEFT JOIN domicilio_cert_calib c_dir ON d.id_dom_cert = c_dir.id_domicilio_cert
           LEFT JOIN domicilio_envio e_dir ON d.id_dom_envio = e_dir.id_domicilio_envio
           WHERE d.Cotizacion_id = ?";
$stmtDet = $pdo->prepare($sqlDet);
$stmtDet->execute([$id_cot]);
$detalles = $stmtDet->fetchAll(PDO::FETCH_ASSOC);

$es_laboratorio = (isset($_GET['tipo']) && $_GET['tipo'] === 'lab');

if ($es_laboratorio) {
    $titulo_cotizacion = "PDF LABORATORIO";
    if (isset($cot['categoria'])) {
        if ($cot['categoria'] == 'Nuevo') {
            $titulo_cotizacion = "PDF LABORATORIO DE EQUIPOS NUEVOS";
        } elseif ($cot['categoria'] == 'Usado') {
            $titulo_cotizacion = "PDF LABORATORIO DE EQUIPOS USADOS";
        } elseif ($cot['categoria'] == 'Calibracion') {
            $titulo_cotizacion = "PDF LABORATORIO DE SERVICIO DE CALIBRACIÓN";
        }
    }
} else {
    $titulo_cotizacion = "COTIZACIÓN";
    if (isset($cot['categoria'])) {
        if ($cot['categoria'] == 'Nuevo') {
            $titulo_cotizacion = "COTIZACIÓN DE EQUIPOS NUEVOS";
        } elseif ($cot['categoria'] == 'Usado') {
            $titulo_cotizacion = "COTIZACIÓN DE EQUIPOS USADOS";
        } elseif ($cot['categoria'] == 'Calibracion') {
            $titulo_cotizacion = "COTIZACIÓN DE SERVICIO DE CALIBRACIÓN";
        }
    }
}

$folio = !empty($cot['folio_especial']) ? $cot['folio_especial'] : str_pad((string)$cot['id_cotizacion'], 5, "0", STR_PAD_LEFT);
$serie = "COTLAN";

// Evaluamos si el vendedor es un admin
if ($cot['Usuario_admin_id'] > 0) {
    $nombre_vendedor = htmlspecialchars($cot['vendedor']);
} else {
    // Es un usuario de la empresa
    $nombre_vendedor = htmlspecialchars($cot['cliente']);
}

$dir_cert = null;
$dir_envio = null;

if (!$es_multisucursal && !empty($detalles)) {
    $d = $detalles[0];
    if (!empty($d['calle_numero_cert'])) {
        $dir_cert = $d;
    }
    if (!empty($d['calle_numero_envio'])) {
        $dir_envio = $d;
    }
}

// Generamos el consolidado de envíos único por si es multisucursal
$envios_multisucursal = [];
if ($es_multisucursal) {
    foreach ($detalles as $d) {
        if (!empty($d['calle_numero_envio'])) {
            $key_envio = trim($d['calle_numero_envio']) . '|' . trim($d['cp_envio']);
            if (!isset($envios_multisucursal[$key_envio])) {
                
                // Formateamos la dirección dinámica con "entre calle"
                $calleMulti = htmlspecialchars($d['calle_numero_envio']);
                if (!empty($d['entre_calle_envio']) && !empty($d['y_calle_envio'])) {
                    $calleMulti .= ' Entre ' . htmlspecialchars($d['entre_calle_envio']) . ' y ' . htmlspecialchars($d['y_calle_envio']);
                } elseif (!empty($d['entre_calle_envio'])) {
                    $calleMulti .= ' Entre ' . htmlspecialchars($d['entre_calle_envio']);
                }

                $envios_multisucursal[$key_envio] = [
                    'plaza' => 'DIRECCIÓN ASIGNADA',
                    'texto' => $calleMulti . ', Col. ' . htmlspecialchars($d['colonia_envio']) . ', C.P. ' . htmlspecialchars($d['cp_envio']) . ', ' . htmlspecialchars($d['municipio_envio']) . ', ' . htmlspecialchars($d['estado_envio'])
                ];
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cotización <?php echo $serie . " " . $folio; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">

    <style>
        /* Estilos personalizados para la impresión compacta de WMS */
        body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            /* Tipografía pequeña para cotizaciones formales */
            color: #000;
            background: #fff;
        }

        /* Ajustes específicos para las tablas de Bootstrap en impresión */
        .table {
            border-color: #000;
            /* Forzar bordes negros */
            font-size: 11px;
        }

        .table thead th {
            background-color: #f2f2f2 !important;
            /* Color de cabecera compatible con impresión */
            color: #000;
            border-bottom-width: 2px;
            text-transform: uppercase;
            font-size: 10px;
        }

        /* Caja de notas con diseño de borde */
        .notes-box {
            border: 1px solid #000;
            padding: 10px;
            font-weight: bold;
        }

        /* Color rojo para serie y folio en cabecera */
        .doc-info span {
            color: red;
            font-weight: bold;
        }

        /* Definición de la clase no-print para ocultar elementos en PDF/Impresora */
        @media print {
            .no-print {
                display: none !important;
            }

            body {
                padding: 0;
                margin: 0;
            }

            .container {
                width: 100% !important;
                max-width: 100% !important;
                padding: 0;
                margin: 0;
            }

            /* Asegurar que Bootstrap muestre bordes en impresión */
            .table-bordered th,
            .table-bordered td {
                border: 1px solid #000 !important;
            }
        }

        body,
        table,
        div,
        p,
        span,
        strong,
        th,
        td {
            text-transform: uppercase !important;
        }

        .table thead th {
            background-color: #00a3f0 !important;
            /* Fondo Azul corporativo */
            color: #ffffff !important;
            /* Letra blanca para máximo contraste */
            border-bottom: 2px solid #007bb5 !important;
            /* Borde inferior azul oscuro */
            text-transform: uppercase;
            font-size: 10px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        @media print {

            /* ... tus media queries actuales ... */
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>

<body>

    <div class="container pt-4">
        <div class="row no-print mb-4">
            <div class="col-12 text-end">
                <button onclick="window.print();" class="btn btn-primary btn-sm me-2">🖨️ Imprimir / Guardar PDF</button>
                <button onclick="window.close();" class="btn btn-secondary btn-sm">Cerrar</button>
            </div>
        </div>

        <?php if ($cot['division'] == 'LA NETWORKS & SMART TECHNOLOGIES'): ?>
            <div class="row align-items-center mb-3">
                <div class="col-2 text-start">
                    <img src="assets/images/logo-lan.png" alt="Logo LAN" class="img-fluid" style="max-height: 100px;">
                </div>

                <div class="col-9 text-center">
                    <h4 class="fw-bold m-0" style="font-size: 18px; color:#00a3f0;">LA NETWORKS & SMART TECHNOLOGIES, SA DE CV</h4>
                    <p class="fst-italic m-0 small" style="font-size: 10px;">Lab's and LAN's Systems for your Networks...</p>
                    <div class="small mt-1" style="font-size: 9px; line-height: 1.3;">
                        <strong>Régimen Fiscal: (601) General de Ley Personas Morales</strong><br>
                        <strong>R.F.C: N&S060721MU8</strong><br>
                        CERRADA SUR 16 A, No. 31 Int. BIS CASA C, Col. AGRICOLA ORIENTAL, C.P.: 08500, IZTACALCO, CIUDAD DE MEXICO, MEXICO
                    </div>
                </div>
            </div>
        <?php else: ?>
            <div class="row align-items-center mb-3">
                <div class="col-2 text-start">
                    <img src="assets/images/logo-lan.png" alt="Logo LAN" class="img-fluid" style="max-height: 100px;">
                </div>

                <div class="col-9 text-center">
                    <h4 class="fw-bold m-0" style="font-size: 18px; color:#00a3f0;">LA NETWORKS ANALITICAL, SA DE CV</h4>
                    <p class="fst-italic m-0 small" style="font-size: 10px;">Analitical for a better life...</p>
                    <div class="small mt-1" style="font-size: 9px; line-height: 1.3;">
                        <strong>Régimen Fiscal: (601) General de Ley Personas Morales</strong><br>
                        <strong>R.F.C: ST&050309MYA</strong><br>
                        LAGO ALBERTO NO. 416, COL. ANAHUAC II SECCION, C.P. 11320, MIGUEL HIDALGO,
                    </div>
                </div>
            </div>
        <?php endif; ?>

        <div class="row mb-4">
            <div class="col-6">
                <p class="m-0" style="font-size:16px; color:#00a3f0;"><strong><?php echo $titulo_cotizacion; ?></strong></p>
                <p class="m-0"><strong>Serie:</strong> <span><?php echo $serie; ?></span> <?php if ($cot['division'] == 'LA NETWORKS & TECHNOLOGIES'): ?> <strong>Folio:</strong> <?php else: ?> <strong>Folio:</strong> <?php endif; ?> <span><?php echo $folio; ?></span></p>
                <p class="m-0"><strong>Fecha de elaboración:</strong> <?php echo date('d/m/Y', strtotime($cot['fecha_cot'])); ?></p>
                <p class="m-0 text-danger"><strong>Fecha de vencimiento:</strong> <?php echo date('d/m/Y', strtotime($cot['fecha_cot'] . ' + 30 days')); ?></p>
                <p class="m-0"><strong>Moneda:</strong> Pesos</p>
            </div>

            <div class="col-6 text-end">
                <?php
                // ✨ OBTENEMOS ESTRICTAMENTE EL NOMBRE DE LA PLAZA GUARDADA EN LA BD
                $plaza_completa = !empty($cot['plaza_guardada']) ? mb_strtoupper(htmlspecialchars($cot['plaza_guardada']), 'UTF-8') : 'SIN ESPECIFICAR';
                ?>
                <p class="m-0"><strong>Atención a:</strong> <?php echo $cot['cliente']; ?></p>
                <p class="m-0"><strong>PLAZA:</strong><?php echo $plaza_completa; ?></p>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-12 small" style="line-height: 1.5; font-size: 10px;">
                <p class="m-0"><strong>Razón Social:</strong> <?php echo htmlspecialchars($cot['razon_social'] ?? $cot['nombre_empresa']); ?></p>

                <!-- OCULTAMOS DIRECCIÓN Y RFC SI ES LABORATORIO -->
                <?php if (!$es_laboratorio): ?>
                    <p class="m-0">
                        <strong>Dirección:</strong>
                        Calle: <?php echo htmlspecialchars($cot['calle_numero']); ?>,
                        Col. <?php echo htmlspecialchars($cot['colonia']); ?>,
                        CP: <?php echo htmlspecialchars($cot['codigo_postal']); ?>,
                        <?php echo htmlspecialchars($cot['municipio'] . ', ' . $cot['estado']); ?>
                    </p>
                    <p class="m-0"><strong>R.F.C.</strong> <?php echo htmlspecialchars($cot['rfc']); ?></p>
                <?php endif; ?>
            </div>
        </div>

        <div class="row mb-4">
            <?php if (!$es_multisucursal): ?>
                <?php if ($dir_cert): ?>
                    <div class="<?php echo $es_laboratorio ? 'col-12' : 'col-6'; ?>">
                        <div style="background-color: #f4f6f9; border-left: 4px solid #00a3f0; padding: 6px 10px; border-radius: 3px; font-size: 9px; line-height: 1.3;">
                            <p class="m-0" style="color: #00a3f0; font-size: 10px;"><strong>■ DIRECCIÓN DE CERTIFICADO</strong></p>
                            <p class="m-0 mt-1">
                                <?php 
                                    $calleCert = htmlspecialchars($dir_cert['calle_numero_cert']);
                                    if(!empty($dir_cert['entre_calle_cert']) && !empty($dir_cert['y_calle_cert'])) {
                                        $calleCert .= ' Entre ' . htmlspecialchars($dir_cert['entre_calle_cert']) . ' y ' . htmlspecialchars($dir_cert['y_calle_cert']);
                                    } elseif(!empty($dir_cert['entre_calle_cert'])) {
                                        $calleCert .= ' Entre ' . htmlspecialchars($dir_cert['entre_calle_cert']);
                                    }
                                    echo $calleCert . ', Col. ' . htmlspecialchars($dir_cert['colonia_cert']); 
                                ?><br>
                                <strong>CP:</strong> <?php echo htmlspecialchars($dir_cert['cp_cert'] . ', ' . $dir_cert['municipio_cert'] . ', ' . $dir_cert['estado_cert']); ?>
                            </p>
                        </div>
                    </div>
                <?php endif; ?>

                <!-- OCULTAMOS ENVÍO SI ES LABORATORIO -->
                <?php if ($dir_envio && !$es_laboratorio): ?>
                    <div class="col-6">
                        <div style="background-color: #f4f6f9; border-left: 4px solid #28a745; padding: 6px 10px; border-radius: 3px; font-size: 9px; line-height: 1.3;">
                            <p class="m-0 text-success" style="font-size: 10px;"><strong>■ DIRECCIÓN DE ENVÍO</strong></p>
                            <p class="m-0 mt-1">
                                <?php
                                $calleEnvio = htmlspecialchars($dir_envio['calle_numero_envio']);
                                if (!empty($dir_envio['entre_calle_envio']) && !empty($dir_envio['y_calle_envio'])) {
                                    $calleEnvio .= ' Entre ' . htmlspecialchars($dir_envio['entre_calle_envio']) . ' y ' . htmlspecialchars($dir_envio['y_calle_envio']);
                                } elseif (!empty($dir_envio['entre_calle_envio'])) {
                                    $calleEnvio .= ' Entre ' . htmlspecialchars($dir_envio['entre_calle_envio']);
                                }
                                echo $calleEnvio . ', Col. ' . htmlspecialchars($dir_envio['colonia_envio']);
                                ?><br>
                                <strong>CP:</strong> <?php echo htmlspecialchars($dir_envio['cp_envio'] . ', ' . $dir_envio['municipio_envio'] . ', ' . $dir_envio['estado_envio']); ?>
                            </p>
                        </div>
                    </div>
                <?php endif; ?>

            <?php else: ?>
                <!-- ✨ OCULTAMOS ENVÍO MULTISUCURSAL SI ES LABORATORIO -->
                <?php if (!empty($envios_multisucursal) && !$es_laboratorio): ?>
                    <div class="col-12">
                        <div style="background-color: #f4f6f9; border-left: 4px solid #28a745; padding: 8px 12px; border-radius: 4px; font-size: 9px; line-height: 1.4;">
                            <p class="m-0 text-success" style="font-size: 10px; font-weight: bold; margin-bottom: 4px;">■ Dirección de Envio</p>
                            <?php foreach ($envios_multisucursal as $ev): ?>
                                <div style="margin-bottom: 3px;">
                                    📍 <strong><?php echo $ev['plaza']; ?>:</strong> <?php echo $ev['texto']; ?>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endif; ?>
            <?php endif; ?>
        </div>

        <div class="row mb-3">
            <div class="col-12">
                <table class="table table-bordered table-sm align-middle mb-0">
                    <thead class="table-light text-center">
                        <tr>
                            <th width="10%">CANTIDAD</th>
                            <th width="10%">CLAVE</th>
                            <th width="<?php echo $es_laboratorio ? '80%' : '45%'; ?>">DESCRIPCIÓN</th>
                            <?php if (!$es_laboratorio): ?>
                                <th width="10%">P/U</th>
                                <th width="10%">IMPORTE</th>
                            <?php endif; ?>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $sumatoria_equipos = 0;
                        foreach ($detalles as $d):
                            $sumatoria_equipos += (int)$d['cantidad'];
                        ?>
                            <!-- ?php foreach ($detalles as $d): ?> -->
                            <tr>
                                <td class="text-center"><?php echo $d['cantidad']; ?></td>
                                <td class="text-center"><?php echo htmlspecialchars($d['clave_product']); ?></td>

                                <td class="text-start px-2 py-2">
                                    <?php echo nl2br(htmlspecialchars($d['descripcion_product'])); ?>

                                    <!-- ✨ ETIQUETA ID DEL EQUIPO -->
                                    <?php if (!empty($d['equipo_id'])): ?>
                                        <div style="margin-top: 4px;">
                                            <span style="display: inline-block; background-color: #f8f9fa; border: 1px solid #444; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                                                ID EQUIPO: <?php echo htmlspecialchars($d['equipo_id']); ?>
                                            </span>
                                        </div>
                                    <?php endif; ?>

                                    <!-- ✨ Puntos de Calibración SIEMPRE visibles -->
                                    <?php if (!empty($d['puntos_calibracion'])): ?>
                                        <div style="margin-top: 6px;">
                                            <div style="display: inline-block; background-color: #e6f4ea !important; color: #157347 !important; border-left: 3px solid #28a745 !important; padding: 4px 8px; border-radius: 4px; font-size: 9px; line-height: 1.4; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                                                <strong style="color: #28a745 !important; font-size: 10px;">◎ Ptos de calibración:</strong> <?php echo nl2br(htmlspecialchars($d['puntos_calibracion'])); ?>
                                            </div>
                                        </div>
                                    <?php endif; ?>

                                    <?php
                                    //  Desgloses solo visibles si NO es laboratorio
                                    if (!$es_laboratorio && isset($d['desglosar']) && $d['desglosar'] === 'Y'):
                                        $pEquipo = ($cot['tipo_precio'] === 'Farmacia') ? $d['pf_equipo'] : $d['pp_equipo'];
                                        $pCalib = ($cot['tipo_precio'] === 'Farmacia') ? $d['pf_calibracion'] : $d['pp_calibracion'];

                                        $pAntesIva = $pEquipo + $pCalib;

                                        // ✨ MAGIA: Si la cotización es de equipos usados, invertimos los valores
                                        if (isset($cot['categoria']) && $cot['categoria'] === 'Usado') {
                                            $pEquipo = 0;
                                            $pCalib = $pAntesIva;
                                        }

                                        $tEquipo = $pEquipo * $d['cantidad'];
                                        $tCalib  = $pCalib * $d['cantidad'];
                                    ?>
                                        <div style="margin-top: 6px;">
                                            <?php if ($d['cantidad'] > 1): ?>
                                                <span style="color: #0d6efd; font-weight: bold; font-size: 10px; display: block;">
                                                    Desglose Total (<?php echo $d['cantidad']; ?> pz): Equipo ($<?php echo number_format((float)$tEquipo, 2); ?>) + Calibración ($<?php echo number_format((float)$tCalib, 2); ?>)
                                                </span>
                                                <span style="color: #777; font-size: 9px; display: block; margin-top: 2px;">
                                                    <i>* Unitario (c/u): Equipo $<?php echo number_format((float)$pEquipo, 2); ?> + Calib. $<?php echo number_format((float)$pCalib, 2); ?></i>
                                                </span>
                                            <?php else: ?>
                                                <span style="color: #0d6efd; font-weight: bold; font-size: 10px; display: block;">
                                                    Desglose: Equipo ($<?php echo number_format((float)$pEquipo, 2); ?>) + Calibración ($<?php echo number_format((float)$pCalib, 2); ?>)
                                                </span>
                                            <?php endif; ?>
                                        </div>
                                    <?php endif; ?>

                                    <?php
                                    // Direcciones detalladas del equipo (Certificado Multisucursal)
                                    if ($es_multisucursal && (!empty($d['calle_numero_cert']) || (!$es_laboratorio && !empty($d['calle_numero_envio'])))):
                                    ?>
                                        <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #ccc;">
                                            <?php if (!empty($d['calle_numero_cert'])): ?>
                                                <span style="font-size: 9px; color: #444; display: block; line-height: 1.2;">
                                                    <strong style="color: #000;">📍 Certificado (<?php echo htmlspecialchars($d['nombre_sucursal_destino']); ?>):</strong>
                                                    <?php 
                                                        $calleCertDetalle = htmlspecialchars($d['calle_numero_cert']);
                                                        if (!empty($d['entre_calle_cert']) && !empty($d['y_calle_cert'])) {
                                                            $calleCertDetalle .= ' Entre ' . htmlspecialchars($d['entre_calle_cert']) . ' y ' . htmlspecialchars($d['y_calle_cert']);
                                                        } elseif (!empty($d['entre_calle_cert'])) {
                                                            $calleCertDetalle .= ' Entre ' . htmlspecialchars($d['entre_calle_cert']);
                                                        }
                                                        echo $calleCertDetalle . ', Col. ' . htmlspecialchars($d['colonia_cert']) . ', ' . htmlspecialchars($d['municipio_cert']) . ', ' . htmlspecialchars($d['estado_cert']) . ' C.P. ' . htmlspecialchars($d['cp_cert']); 
                                                    ?>
                                                </span>
                                            <?php endif; ?>
                                        </div>
                                    <?php endif; ?>
                                </td>

                                <?php if (!$es_laboratorio): ?>
                                    <td class="text-end px-2"><?php echo number_format($d['precio_unitario'], 2); ?></td>
                                    <td class="text-end px-2"><?php echo number_format($d['precio_extendido'], 2); ?></td>
                                <?php endif; ?>
                            </tr>
                        <?php endforeach; ?>
                        <!-- Fila de totales ahora es la última fila del tbody. -->
                        <tr style="-webkit-print-color-adjust: exact; print-color-adjust: exact;">
                            <td class="text-center align-middle" style="background-color: #e6f7ff !important; color: #00a3f0 !important; border: 2px solid #00a3f0 !important; font-size: 13px; font-weight: 900;">
                                <?php echo $sumatoria_equipos; ?>
                            </td>
                            <td colspan="<?php echo $es_laboratorio ? '2' : '4'; ?>" class="text-start align-middle" style="background-color: #e6f7ff !important; color: #00a3f0 !important; border: 2px solid #00a3f0 !important; font-size: 13px; font-weight: 900;">
                                ◄ PIEZA(S) TOTALES EN ESTA COTIZACIÓN
                            </td>
                        </tr>
                    </tbody>
                    <!-- <tfoot style="-webkit-print-color-adjust: exact; print-color-adjust: exact;">
                        <tr>
                            <td class="text-center align-middle" style="background-color: #e6f7ff !important; color: #00a3f0 !important; border: 2px solid #00a3f0 !important; font-size: 13px; font-weight: 900;">
                                ?php echo $sumatoria_equipos; ?>
                            </td>
                            <td colspan="?php echo $es_laboratorio ? '2' : '4'; ?>" class="text-start align-middle" style="background-color: #e6f7ff !important; color: #00a3f0 !important; border: 2px solid #00a3f0 !important; font-size: 13px; font-weight: 900;">
                                ◄ PIEZA(S) TOTALES EN ESTA COTIZACIÓN
                            </td>
                        </tr>
                    </tfoot> -->
                </table>
            </div>
        </div>

        <?php if (!empty($cot['comentarios'])): ?>
            <div class="row mt-2 mb-3">
                <div class="col-12">
                    <div class="small text-uppercase" style="font-size: 11px; line-height: 1.4;">
                        <strong>Notas / Observaciones:</strong><br>
                        <?php echo nl2br(htmlspecialchars($cot['comentarios'])); ?>
                    </div>
                </div>
            </div>
        <?php endif; ?>

        <div class="row mt-3 align-items-center">
            <?php if (!$es_laboratorio): ?>
                <div class="col-5 ms-auto">
                    <table class="table table-bordered table-striped float-end table-sm mb-0" style="width: 100%">
                        <tbody>
                            <tr>
                                <td class="text-start fw-bold px-2">Subtotal</td>
                                <td class="text-end px-2">$ <?php echo number_format($cot['importe_total'], 2); ?></td>
                            </tr>
                            <tr>
                                <td class="text-start fw-bold px-2">IVA</td>
                                <td class="text-end px-2">$ <?php echo number_format($cot['precio_iva'] - $cot['importe_total'], 2); ?></td>
                            </tr>
                            <tr style="background-color: #00a3f0 !important; color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                                <td class="text-start fw-bold px-2 border-0" style="background-color: #00a3f0 !important; color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;">Total</td>
                                <td class="text-end fw-bold px-2 border-0" style="background-color: #00a3f0 !important; color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;">$ <?php echo number_format(($cot['precio_iva']), 2); ?></td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="fw-bold small text-uppercase mt-1 text-start" style="font-size: 10px;">
                        <?php
                        $total_cotizacion = $cot['precio_iva'];
                        echo NumeroALetras::convertir($total_cotizacion) . " M.N.";
                        ?>
                    </div>
                </div>
            <?php endif; ?>
        </div>

        <div class="row">
            <div class="col-12">
                <div class="mt-2">
                    <?php if ($cot['division'] == 'LA NETWORKS & SMART TECHNOLOGIES'): ?>
                        <img src="assets/images/pdf/LAN-TECHNOLOGIES.jpeg" alt="SAC TECNOLOGIES" class="img-fluid" style="max-width: 320px;">
                    <?php else: ?>
                        <img src="assets/images/pdf/LAN-ANALITICAL.jpeg" alt="SAC ANALITICAL" class="img-fluid" style="max-width: 320px;">
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <footer class="row mt-5 pt-3 border-top border-secondary footer-system text-center small">
            <div class="col-12" style="font-size: 9px; font-weight: bold;">
                <?php if ($cot['division'] == 'LA NETWORKS & SMART TECHNOLOGIES'): ?>
                    Sistema Automatizado de Cotizaciones (SAC)<br>
                    LA Networks & Smart Technologies S.A. de C.V.
                <?php else: ?>
                    Sistema Automatizado de Cotizaciones (SAC)<br>
                    LA Networks Analitical S.A. de C.V.
                <?php endif; ?>
            </div>
        </footer>
    </div>
    <!-- </div> -->

    <script>
        window.onload = function() {
            window.print();
        }
    </script>

</body>

</html>