<?php

/**
 * controlador: imprimir_cotizacion.php
 * Formato: LA NETWORKS & SMART TECHNOLOGIES - Optimizado para Bootstrap 5
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

// 1. Datos Generales - Manteniendo tu lógica PDO original
$sql = "SELECT c.*, e.*, dem.calle_numero, dem.colonia, dem.localidad, dem.codigo_postal, dem.municipio, dem.estado, CONCAT(usu.nombre, ' ', usu.apellido_pat, ' ', usu.apellido_mat) as cliente, CONCAT(u.admin_nombre, ' ', u.admin_apell_pat) as vendedor
    FROM cotizacion c
    JOIN empresa e ON c.Empresa_id = e.id_empresa
    -- JOIN domicilio_empresa dem ON e.id_empresa = dem.id_domicilio_empresa
    JOIN domicilio_empresa dem ON e.id_empresa = dem.Empresa_id
    LEFT JOIN usuarios_admin u ON c.Usuario_admin_id = u.id_user_admin
    JOIN usuarios usu ON c.Usuario_empresa_id = usu.id_usuario
    WHERE c.id_cotizacion = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute([$id_cot]);
$cot = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$cot) {
    exit("Cotización no encontrada");
}

// 2. Detalles de la cotización - Manteniendo tu lógica PDO original
$sqlDet = "SELECT d.*, p.descripcion_product, p.clave_product
           FROM detalle_cotizacion d
           JOIN productos p ON d.Product_id = p.id_product
           WHERE d.Cotizacion_id = ?";
$stmtDet = $pdo->prepare($sqlDet);
$stmtDet->execute([$id_cot]);
$detalles = $stmtDet->fetchAll(PDO::FETCH_ASSOC);

$folio = $cot['id_cotizacion']; // O usar str_pad($cot['id_cotizacion'], 4, "0", STR_PAD_LEFT);
$serie = "COTLAN";

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

        <?php if ($cot['division'] == 'LA NETWORKS & TECHNOLOGIES'): ?>
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
                    <img src="assets/images/LAN_Analitica.png" alt="Logo LAN" class="img-fluid" style="max-height: 100px;">
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
                <p class="m-0" style="font-size:16px;"><strong>COTIZACIÓN</strong></p>
                <p class="m-0"><strong>Serie:</strong> <span><?php echo $serie; ?></span> <?php if ($cot['division'] == 'LA NETWORKS & TECHNOLOGIES'): ?> <strong>Folio:</strong> <?php else: ?> <strong>No.</strong> <?php endif; ?> <span><?php echo $folio; ?></span></p>
                <p class="m-0"><strong>Fecha de elaboración:</strong> <?php echo date('d/m/Y', strtotime($cot['fecha_cot'])); ?></p>
                <p class="m-0 text-danger"><strong>Fecha de vencimiento:</strong> <?php echo date('d/m/Y', strtotime($cot['fecha_cot'] . ' + 30 days')); ?></p>
                <p class="m-0"><strong>Moneda:</strong> Pesos</p>
            </div>
            <div class="col-6 text-end">
                <?php if ($cot['division'] == 'LA NETWORKS & TECHNOLOGIES'): ?>
                    <p class="m-0"><strong>PLAZA:</strong> Sin especificar<?php //echo htmlspecialchars($cot['municipio']); 
                                                                            ?> <?php //echo htmlspecialchars($cot['vendedor']); 
                                                                                ?></p>
                <?php else: ?>
                    <p class="m-0"><strong>Atención a:</strong> <?php echo $cot['cliente']; ?></p>
                    <p class="m-0"><strong>PLAZA:</strong> Sin especificar</p>
                <?php endif; ?>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-12 small" style="line-height: 1.5; font-size: 10px;">
                <!--<p class="m-0"><strong>PLAZA:</strong> PACHUCA, <?php //echo htmlspecialchars($cot['vendedor']); 
                                                                    ?></p>-->
                <p class="m-0"><strong>Razón Social:</strong> <?php echo htmlspecialchars($cot['razon_social'] ?? $cot['nombre_empresa']); ?></p>
                <p class="m-0">
                    <strong>Dirección:</strong>
                    Calle: <?php echo htmlspecialchars($cot['calle_numero']); ?>,
                    Col. <?php echo htmlspecialchars($cot['colonia']); ?>,
                    CP: <?php echo htmlspecialchars($cot['codigo_postal']); ?>,
                    <?php echo htmlspecialchars($cot['municipio'] . ', ' . $cot['estado']); ?>
                </p>
                <p class="m-0"><strong>R.F.C.</strong> <?php echo htmlspecialchars($cot['rfc']); ?></p>
            </div>
        </div>

        <div class="row mb-3">
            <div class="col-12">
                <table class="table table-bordered table-sm align-middle mb-0">
                    <thead class="table-light text-center">
                        <tr>
                            <th width="10%">CANTIDAD</th>
                            <th width="15%">CLAVE</th>
                            <th width="45%">DESCRIPCIÓN</th>
                            <th width="15%">P/U</th>
                            <th width="15%">IMPORTE</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($detalles as $d): ?>
                            <tr>
                                <td class="text-center"><?php echo $d['cantidad']; ?></td>
                                <td class="text-center"><?php echo htmlspecialchars($d['clave_product']); ?></td>
                                <!-- <td class="text-start px-2">?php echo htmlspecialchars($d['descripcion_product']); ?></td> -->
                                <td class="text-start px-2 py-2">
                                    <?php echo nl2br(htmlspecialchars($d['descripcion_product'])); ?>
                                </td>
                                <td class="text-end px-2"><?php echo number_format($d['precio_unitario'], 2); ?></td>
                                <td class="text-end px-2"><?php echo number_format($d['precio_extendido'], 2); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
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

            <div class="col-7">
                <?php if ($cot['division'] == 'LA NETWORKS & TECHNOLOGIES'): ?>
                    <div class="notes-box text-center small rounded">
                        CON EL FIN DE BRINDARLE ATENCION OPORTUNA<br>
                        FAVOR DE ENVIAR LOS DOMICILIOS, PARA ELABORACION<br>
                        DE CERTIFICADOS Y DE ENVIO DE EQUIPOS
                    </div>
                <?php endif; ?>
            </div>

            <div class="col-5">
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
                        <tr class="table-dark">
                            <td class="text-start fw-bold px-2 border-0">Total</td>
                            <td class="text-end fw-bold px-2 border-0">$ <?php echo number_format(($cot['precio_iva']), 2); ?></td>
                        </tr>
                    </tbody>
                </table>
                <div class="fw-bold small text-uppercase mt-1 text-start" style="font-size: 10px;">
                    <?php
                    // Sumamos subtotal + IVA para obtener el Total real
                    $total_cotizacion = $cot['precio_iva'];
                    echo NumeroALetras::convertir($total_cotizacion) . " M.N.";
                    ?>
                </div>
            </div>

        </div>

        <!-- <div class="row mt-4 align-items-center">
            <div class="col-6 mt-2">
                ?php if ($cot['division'] == 'LA NETWORKS & TECHNOLOGIES'): ?>
                    <div class="notes-box text-center small rounded">
                        CON EL FIN DE BRINDARLE ATENCION OPORTUNA<br>
                        FAVOR DE ENVIAR LOS DOMICILIOS, PARA ELABORACION<br>
                        DE CERTIFICADOS Y DE ENVIO DE EQUIPOS
                    </div>
                ?php endif; ?>

                ?php if (!empty($cot['comentarios'])): ?>
                    <div class="small mb-4 text-uppercase" style="font-size: 11px; line-height: 1.4;">
                        ?php echo nl2br(htmlspecialchars($cot['comentarios'])); ?>
                    </div>
                ?php endif; ?>
            </div>
            <div class="col-6">
                <table class="table table-bordered table-striped float-end table-sm mb-0" style="width: 70%">
                    <tbody>
                        <tr>
                            <td class="text-start fw-bold px-2">Subtotal</td>
                            <td class="text-end px-2"><?php echo number_format($cot['importe_total'], 2); ?></td>
                        </tr>
                        <tr>
                            <td class="text-start fw-bold px-2">IVA</td>
                            <td class="text-end px-2"><?php echo number_format($cot['precio_iva'] - $cot['importe_total'], 2); ?></td>
                        </tr>
                        <tr class="table-dark">
                            <td class="text-start fw-bold px-2 border-0">Total</td>
                            <td class="text-end fw-bold px-2 border-0"><?php echo number_format(($cot['precio_iva']), 2); ?></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div> -->

        <!-- <div class="row mt-1 mb-4">
            <div class="col-12 fw-bold small text-uppercase text-end">
                ?php
                // Sumamos subtotal + IVA para obtener el Total real (caso normal) Para este caso, la base de datos guarda el total con iva en el campo precio_iva
                $total_cotizacion = $cot['precio_iva'];
                echo NumeroALetras::convertir($total_cotizacion);
                ?>
            </div>
        </div> -->

        <div class="row">
            <div class="col-12">
                <div class="mt-2">
                    <?php if ($cot['division'] == 'LA NETWORKS & TECHNOLOGIES'): ?>
                        <img src="assets/images/pdf/LAN-TECHNOLOGIES.jpeg" alt="SAC TECNOLOGIES" class="img-fluid" style="max-width: 320px;">
                    <?php else: ?>
                        <img src="assets/images/pdf/LAN-ANALITICAL.jpeg" alt="SAC ANALITICAL" class="img-fluid" style="max-width: 320px;">
                    <?php endif; ?>
                </div>
            </div><!--  -->
        </div>

        <?php if ($cot['division'] == 'LA NETWORKS ANALITICAL'): ?>
            <div class="row mt-5 mb-4">
                <div class="col-12 text-center" style="font-size: 12px; font-weight: bold;">
                    Atentamente
                </div>
                <div class="col-12 text-center mt-5" style="font-size: 12px;">
                    <strong>Ejecutivo de ventas: </strong><br>
                    <!-- ?php echo $cot['vendedor']; ? -->
                    <?php echo $nombre_vendedor; ?>
                </div>
            </div>
        <?php endif; ?>

        <footer class="row mt-5 pt-3 border-top border-secondary footer-system text-center small">
            <div class="col-12" style="font-size: 9px; font-weight: bold;">
                <?php if ($cot['division'] == 'LA NETWORKS & TECHNOLOGIES'): ?>
                    Sistema Automatizado de Cotizaciones (SAC)<br>
                    LA Networks & Smart Technologies S.A. de C.V.
                <?php else: ?>
                    Sistema Automatizado de Cotizaciones (SAC)<br>
                    LA Networks Analitical S.A. de C.V.
                <?php endif; ?>
            </div>
        </footer>

    </div>

    <script>
        window.onload = function() {
            window.print();
        }
    </script>

</body>

</html>