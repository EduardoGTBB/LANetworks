$(document).ready(function () {
    const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    function cargarDashboard() {
        $.ajax({
            url: 'api/api_inicio.php',
            method: 'GET',
            dataType: 'json',
            success: function (res) {
                if (res.status === 'success') {
                    let stats = res.estadisticas;
                    let recientes = res.recientes;

                    // ¡AQUÍ ESTABA EL ERROR! Faltaban estas 4 líneas para convertir los datos a números
                    let totalCots = parseInt(stats.total_cotizaciones) || 0;
                    let pendientes = parseInt(stats.pendientes) || 0;
                    let ganadas = parseInt(stats.ganadas) || 0;
                    let montoTotal = parseFloat(stats.monto_total) || 0;

                    // 1. Llenar Tarjetas Superiores
                    $('#dash_total').text(totalCots);
                    $('#dash_pendientes').text(pendientes);
                    $('#dash_ganadas').text(ganadas);
                    $('#dash_monto').text(formatoMoneda.format(montoTotal));

                    // 2. Llenar Números Inferiores (Sub) y Barras
                    $('#dash_total_sub').text(totalCots);
                    $('#dash_monto_sub').text(formatoMoneda.format(montoTotal).replace('.00', ''));

                    if (totalCots > 0) {
                        let porcPendientes = Math.round((pendientes / totalCots) * 100);
                        let porcGanadas = Math.round((ganadas / totalCots) * 100);

                        // Agregamos los paréntesis al texto
                        $('#dash_pendientes_per').text('(' + porcPendientes + '%)');
                        $('#dash_ganadas_per').text('(' + porcGanadas + '%)');

                        $('#dash_pendientes_sub').text(pendientes);
                        $('#dash_ganadas_sub').text(ganadas);

                        // Actualizamos el ancho de las barras de progreso
                        $('#dash_pendientes_bar').css('width', porcPendientes + '%');
                        $('#dash_ganadas_bar').css('width', porcGanadas + '%');

                    } else {
                        $('#dash_pendientes_per, #dash_ganadas_per').text('(0%)');
                        $('#dash_pendientes_sub, #dash_ganadas_sub').text('0');
                        $('#dash_pendientes_bar, #dash_ganadas_bar').css('width', '0%');
                    }

                    // 3. Llenar Lista de Recientes
                    let containerLista = $('#dash_lista_recientes');
                    containerLista.empty();

                    if (recientes.length === 0) {
                        containerLista.append('<div class="text-center text-muted py-4">No hay cotizaciones recientes.</div>');
                    } else {
                        recientes.forEach(function (cot) {
                            let folio = cot.id_cotizacion.toString().padStart(4, '0');
                            let razonSocial = cot.razon_social ? cot.razon_social : 'Sin Cliente';
                            let fecha = cot.fecha_cot;
                            let total = formatoMoneda.format(cot.precio_iva);
                            let estatus = cot.estatus;

                            // Icono según estatus
                            let iconColor = 'text-primary';
                            let bgSoft = 'bg-soft-primary';
                            let iconName = 'feather-file-text';

                            if (estatus.includes('Ganada')) { iconColor = 'text-success'; bgSoft = 'bg-soft-success'; iconName = 'feather-check-circle'; }
                            if (estatus === 'Perdida') { iconColor = 'text-danger'; bgSoft = 'bg-soft-danger'; iconName = 'feather-x-circle'; }

                            let htmlRow = `
                                <div class="d-flex align-items-center justify-content-between mb-3">
                                    <div class="hstack gap-3">
                                        <div class="avatar-text avatar-lg p-2 rounded ${bgSoft}">
                                            <i class="${iconName} ${iconColor} fs-4"></i>
                                        </div>
                                        <div>
                                            <a href="ver_cotizaciones.php" class="d-block fw-bold text-truncate" style="max-width: 150px;">${razonSocial}</a>
                                            <span class="fs-12 text-muted">Folio #${folio}</span>
                                        </div>
                                    </div>
                                    <div class="text-end">
                                        <div class="fw-bold text-dark">${total}</div>
                                        <div class="fs-12 text-muted">${fecha}</div>
                                    </div>
                                </div>
                                <hr class="border-dashed my-3" />
                            `;
                            containerLista.append(htmlRow);
                        });
                    }

                    let mesActual = parseInt(stats.cots_mes_actual) || 0;
                    let mesPasado = parseInt(stats.cots_mes_pasado) || 0;

                    // 1.5 Llenar tarjeta azul de "Cotizaciones del Mes"
                    $('#dash_mes_actual').text(mesActual);

                    // Calcular porcentaje de crecimiento respecto al mes pasado
                    let porcentajeCrecimiento = 0;
                    if (mesPasado > 0) {
                        porcentajeCrecimiento = Math.round(((mesActual - mesPasado) / mesPasado) * 100);
                    } else if (mesActual > 0) {
                        porcentajeCrecimiento = 100; // Si el mes pasado hubo 0 y este mes hay, es un aumento del 100%
                    }

                    // Ponerle un signo de "+" si es positivo
                    let signo = porcentajeCrecimiento > 0 ? '+' : '';
                    $('#dash_mes_porcentaje').text(signo + porcentajeCrecimiento + '%');

                    // (Opcional) Cambiar el color si es negativo para dar mejor feedback visual
                    if (porcentajeCrecimiento < 0) {
                        $('#dash_mes_porcentaje').removeClass('text-primary').addClass('text-danger');
                    } else {
                        $('#dash_mes_porcentaje').removeClass('text-danger').addClass('text-primary');
                    }


                    let montoPendientes = parseFloat(stats.monto_pendientes) || 0;
                    let montoPerdidas = parseFloat(stats.monto_perdidas) || 0;
                    let montoTotalGen = parseFloat(stats.monto_total_general) || 0;

                    $('#dash_chart_pendientes').text(formatoMoneda.format(montoPendientes));
                    $('#dash_chart_ganadas').text(formatoMoneda.format(montoTotal)); // Ganadas
                    $('#dash_chart_perdidas').text(formatoMoneda.format(montoPerdidas));
                    $('#dash_chart_total').text(formatoMoneda.format(montoTotalGen));

                    // Porcentajes de las barras inferiores
                    if (montoTotalGen > 0) {
                        $('#dash_chart_pendientes_bar').css('width', (montoPendientes / montoTotalGen * 100) + '%');
                        $('#dash_chart_ganadas_bar').css('width', (montoTotal / montoTotalGen * 100) + '%');
                        $('#dash_chart_perdidas_bar').css('width', (montoPerdidas / montoTotalGen * 100) + '%');
                    } else {
                        $('#dash_chart_pendientes_bar, #dash_chart_ganadas_bar, #dash_chart_perdidas_bar').css('width', '0%');
                    }

                    // --------------------------------------------------
                    // 5. Dibujar Gráfica ApexChart (Cotizaciones vs Tiempo)
                    // --------------------------------------------------
                    let graficaDatos = res.grafica;
                    let labels = [];
                    let values = [];

                    graficaDatos.forEach(item => {
                        labels.push(item.mes_texto.toUpperCase()); // Ej: MAR 2026
                        values.push(parseFloat(item.total));
                    });

                    // Limpiamos la gráfica demo de la plantilla
                    $('#payment-records-chart').empty();

                    // Si no hay datos, mostramos un mensaje
                    if (values.length === 0) {
                        $('#payment-records-chart').html('<div class="text-center text-muted py-5 mt-5">No hay historial financiero reciente.</div>');
                    } else {
                        // Creamos nuestra propia gráfica conectada a la BD
                        var options = {
                            chart: { type: 'area', height: 300, toolbar: { show: false } },
                            series: [{ name: 'Ingresos', data: values }],
                            xaxis: { categories: labels },
                            colors: ['#3454d1'],
                            stroke: { curve: 'smooth', width: 2 },
                            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [50, 100] } },
                            dataLabels: { enabled: false },
                            yaxis: {
                                labels: {
                                    formatter: function (value) { return formatoMoneda.format(value); }
                                }
                            }
                        };
                        var chart = new ApexCharts(document.querySelector("#payment-records-chart"), options);
                        chart.render();
                    }
                }
            },
            error: function () {
                console.error("No se pudo cargar la información del Dashboard.");
            }
        });
    }

    cargarDashboard();
});