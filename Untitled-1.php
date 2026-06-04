<body>
    <div class="container-fluid py-3">
        <div class="row mb-3 border-bottom pb-3">
            <div class="col-4 text-start">
                <img src="assets/images/logo-la-networks.png" alt="LA Networks" style="max-height: 80px;">
            </div>
            <div class="col-4 text-center">
                <h6 class="fw-bold mb-0" style="font-size: 14px;">LA NETWORKS & SMART TECHNOLOGIES S.A. DE C.V.</h6>
                <div style="font-size: 10px;">
                    RFC: LNS191024L59<br>
                    Av. Vía Láctea #407, Colonia Jardines de Satélite<br>
                    Naucalpan de Juárez, Estado de México, C.P. 53129
                </div>
            </div>
            <div class="col-4 text-end">
                <h5 class="fw-bold mb-1 text-danger" style="font-size: 16px;">COTIZACIÓN</h5>
                <h5 class="mb-1 text-danger" style="font-size: 16px;"><?php echo $serie . " - " . $folio; ?></h5>
                <div style="font-size: 11px;">
                    <strong>Fecha:</strong> <?php echo date('d/m/Y', strtotime($cot['fecha_cot'])); ?><br>
                    <strong>Vigencia:</strong> 15 Días
                </div>
            </div>
        </div>

        <div class="row mb-3">
            <div class="col-7">
                <div class="p-2 border" style="height: 100%;">
                    <strong style="font-size: 12px; border-bottom: 1px solid #ccc; display: block; margin-bottom: 5px;">DATOS DEL CLIENTE:</strong>
                    <table class="table table-sm table-borderless mb-0 p-0" style="font-size: 10px;">
                        <tr><td width="25%" class="p-0 fw-bold">Razón Social:</td><td class="p-0 text-uppercase"><?php echo htmlspecialchars($cot['razon_social']); ?></td></tr>
                        <tr><td class="p-0 fw-bold">Atención a:</td><td class="p-0"><?php echo htmlspecialchars($cot['cliente']); ?></td></tr>
                        <tr>
                            <td class="p-0 fw-bold">Dir. Fiscal:</td>
                            <td class="p-0 text-uppercase">
                                <?php
                                $dirFiscal = $cot['calle_numero'] . ", " . $cot['colonia'] . ", " . $cot['municipio'] . ", " . $cot['estado'] . " C.P. " . $cot['codigo_postal'];
                                echo htmlspecialchars($dirFiscal);
                                ?>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <div class="col-5">
                <div class="p-2 border" style="height: 100%;">
                    <strong style="font-size: 12px; border-bottom: 1px solid #ccc; display: block; margin-bottom: 5px;">DETALLES COMERCIALES:</strong>
                    <table class="table table-sm table-borderless mb-0 p-0" style="font-size: 10px;">
                        <tr><td width="35%" class="p-0 fw-bold">Cond. Pago:</td><td class="p-0 text-uppercase">Contado</td></tr>
                        <tr><td class="p-0 fw-bold">Vendedor:</td><td class="p-0 text-uppercase"><?php echo htmlspecialchars($cot['vendedor']); ?></td></tr>
                        <tr><td class="p-0 fw-bold">División:</td><td class="p-0 text-uppercase"><?php echo htmlspecialchars($cot['division']); ?></td></tr>
                        
                        <?php if (!$es_multisucursal && $dir_envio): ?>
                            <tr>
                                <td class="p-0 fw-bold">Dir. Envío:</td>
                                <td class="p-0 text-uppercase" style="font-size: 9px; line-height: 1.1;">
                                    <?php echo htmlspecialchars($dir_envio['calle_numero_envio'] . ', C.P. ' . $dir_envio['cp_envio']); ?>
                                </td>
                            </tr>
                        <?php endif; ?>
                    </table>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-12">
                <table class="table table-bordered table-sm mb-0">
                    <thead class="table-light text-center">
                        <tr>
                            <th width="8%">CANTIDAD</th>
                            <th width="12%">CLAVE</th>
                            <th width="50%">DESCRIPCIÓN</th>
                            <th width="15%">P. UNITARIO</th>
                            <th width="15%">IMPORTE</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($detalles as $d): ?>
                            <tr>
                                <td class="text-center align-middle"><?php echo $d['cantidad']; ?></td>
                                <td class="text-center align-middle"><?php echo htmlspecialchars($d['clave_product']); ?></td>
                                <td class="text-start px-2 py-2">
                                    <span style="font-size: 11px; font-weight: bold;">
                                        <?php echo nl2br(htmlspecialchars($d['descripcion_product'])); ?>
                                    </span>

                                    <?php 
                                    // ✨ AQUÍ ESTÁ LA MAGIA: Si es multisucursal, inyectamos las direcciones debajo de la descripción
                                    if ($es_multisucursal && (!empty($d['calle_numero_cert']) || !empty($d['calle_numero_envio']))): 
                                    ?>
                                        <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #ccc;">
                                            <span style="font-size: 9px; color: #444; display: block; line-height: 1.2;">
                                                <strong style="color: #000;">📍 Certificado (<?php echo htmlspecialchars($d['nombre_sucursal_destino']); ?>):</strong> 
                                                <?php echo htmlspecialchars($d['calle_numero_cert'] . ', ' . $d['colonia_cert'] . ', ' . $d['municipio_cert'] . ', ' . $d['estado_cert'] . ' C.P. ' . $d['cp_cert']); ?>
                                            </span>
                                            <span style="font-size: 9px; color: #444; display: block; line-height: 1.2; margin-top: 2px;">
                                                <strong style="color: #000;">🚚 Envío:</strong> 
                                                <?php echo htmlspecialchars($d['calle_numero_envio'] . ', ' . $d['colonia_envio'] . ', ' . $d['municipio_envio'] . ', ' . $d['estado_envio'] . ' C.P. ' . $d['cp_envio']); ?>
                                            </span>
                                        </div>
                                    <?php endif; ?>

                                    <?php
                                    // Si el desglose está activo, mostramos los precios del Equipo/Calibración
                                    if (isset($d['desglosar']) && $d['desglosar'] === 'Y'):
                                        $pEquipo = ($cot['tipo_precio'] === 'Farmacia') ? $d['pf_equipo'] : $d['pp_equipo'];
                                        $pCalib = ($cot['tipo_precio'] === 'Farmacia') ? $d['pf_calibracion'] : $d['pp_calibracion'];

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
                                </td>

                                <td class="text-end px-2 align-middle">$<?php echo number_format($d['precio_unitario'], 2); ?></td>
                                <td class="text-end px-2 align-middle">$<?php echo number_format($d['precio_extendido'], 2); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="row mt-2">
            <div class="col-8">
                <div class="notes-box">
                    <strong>OBSERVACIONES:</strong><br>
                    <?php echo nl2br(htmlspecialchars($cot['comentarios'])); ?><br><br>
                    <i>* Precios sujetos a cambio sin previo aviso.</i><br>
                    <i>* La calibración se realiza bajo los estándares normativos vigentes.</i>
                </div>
            </div>
            
            <?php
            $subtotal = $cot['importe_total'];
            $iva = $cot['precio_iva'] - $subtotal;
            $total = $cot['precio_iva'];
            ?>
            <div class="col-4">
                <table class="table table-sm table-borderless">
                    <tr><td class="text-end fw-bold">SUBTOTAL:</td><td class="text-end" width="40%">$<?php echo number_format($subtotal, 2); ?></td></tr>
                    <tr><td class="text-end fw-bold">I.V.A. (<?php echo $cot['porcentaje_iva']; ?>%):</td><td class="text-end">$<?php echo number_format($iva, 2); ?></td></tr>
                    <tr class="border-top"><td class="text-end fw-bold" style="font-size: 13px;">TOTAL MXN:</td><td class="text-end fw-bold" style="font-size: 13px;">$<?php echo number_format($total, 2); ?></td></tr>
                </table>
            </div>
        </div>

        <div class="row mt-4 pt-2">
            <div class="col-12 text-center">
                <p style="font-size: 10px; margin-bottom: 50px;">Para aceptar esta cotización, favor de firmar de conformidad y enviar copia a su ejecutivo de ventas.</p>
                <div class="signature-line"></div>
                <p style="font-size: 10px; font-weight: bold; margin-top: 5px;">NOMBRE Y FIRMA DE ACEPTACIÓN</p>
            </div>
        </div>
    </div>

    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>