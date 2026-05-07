$(document).ready(function () {
    let id_cot = $('#id_cotizacion').val();
    let dirFiscal = {};
    let dirSucursal = {};

    // Función auxiliar para comparar si dos direcciones son exactamente iguales
    function esMismaDireccion(dir1, dir2) {
        if (!dir1 || !dir2) return false;
        return (dir1.calle || '').trim() === (dir2.calle || '').trim() &&
               (dir1.colonia || '').trim() === (dir2.colonia || '').trim() &&
               (dir1.cp || '').trim() === (dir2.cp || '').trim();
    }

    // ========================================================
    // 0. ASEGURAR QUE EL CHECKBOX DE ENVÍO INICIE DESMARCADO
    // ========================================================
    $('#check_envio_igual').prop('checked', false);

    // ========================================================
    // 1. CARGA INICIAL (Jalamos datos de BD)
    // ========================================================
    $.ajax({
        url: 'api/api_finalizar_venta.php?id_cotizacion=' + id_cot,
        method: 'GET', dataType: 'json',
        success: function (res) {
            if (res.status === 'success' && res.data) {
                let d = res.data;

                // A) Guardar y Llenar Dirección Fiscal
                if (d.fiscal && d.fiscal.calle_numero_fiscal) {
                    dirFiscal = {
                        calle: d.fiscal.calle_numero_fiscal, colonia: d.fiscal.colonia_fiscal,
                        localidad: d.fiscal.localidad_fiscal, municipio: d.fiscal.municipio_fiscal,
                        estado: d.fiscal.estado_fiscal, cp: d.fiscal.cp_fiscal
                    };
                } else if (d.empresa_default) {
                    dirFiscal = {
                        calle: d.empresa_default.calle_numero, colonia: d.empresa_default.colonia,
                        localidad: d.empresa_default.localidad, municipio: d.empresa_default.municipio,
                        estado: d.empresa_default.estado, cp: d.empresa_default.codigo_postal
                    };
                }

                $('input[name="f_calle"]').val(dirFiscal.calle);
                $('input[name="f_colonia"]').val(dirFiscal.colonia);
                $('input[name="f_localidad"]').val(dirFiscal.localidad);
                $('input[name="f_municipio"]').val(dirFiscal.municipio);
                $('input[name="f_estado"]').val(dirFiscal.estado);
                $('input[name="f_cp"]').val(dirFiscal.cp);

                // B) Buscar la sucursal elegida para tener su dirección lista
                $.ajax({
                    url: 'api/api_finalizar_venta.php?action=get_sucursales&usuario_id=' + d.Usuario_empresa_id,
                    method: 'GET', dataType: 'json',
                    success: function(sucursales) {
                        let sucElegida = sucursales.find(s => s.id_sucursal == d.Sucursal_id);
                        if(sucElegida) {
                            
                            // CONCATENACIÓN LIMPIA (Solo Calle y Números)
                            let calleArmada = sucElegida.calle ? sucElegida.calle.trim() : '';

                            if (sucElegida.num_ext && sucElegida.num_ext.trim() !== '') {
                                calleArmada += ' No. ' + sucElegida.num_ext.trim();
                            }
                            if (sucElegida.num_int && sucElegida.num_int.trim() !== '') {
                                calleArmada += ' Int. ' + sucElegida.num_int.trim();
                            }

                            dirSucursal = {
                                calle: calleArmada.trim(), 
                                colonia: sucElegida.colonia || '',
                                localidad: sucElegida.poblacion || '', 
                                municipio: sucElegida.municipio || '',
                                estado: sucElegida.estado || '', 
                                cp: sucElegida.cp || ''
                            };

                            $('#nombre_sucursal_label').text(sucElegida.nombre_sucursal);
                        } else {
                            $('#nombre_sucursal_label').text('Sucursal no encontrada');
                        }

                        // >>> INICIO: MEMORIA DE DIRECCIONES GUARDADAS <<<
                        
                        // Extraemos lo que ya estaba en la BD de la cotización
                        let savedCert = null;
                        if (d.cert && d.cert.calle_numero_cert) {
                            savedCert = {
                                calle: d.cert.calle_numero_cert, colonia: d.cert.colonia_cert,
                                localidad: d.cert.localidad_cert, municipio: d.cert.municipio_cert,
                                estado: d.cert.estado, cp: d.cert.cp_cert
                            };
                        }

                        let savedEnvio = null;
                        if (d.envio && d.envio.calle_numero_envio) {
                            savedEnvio = {
                                calle: d.envio.calle_numero_envio, colonia: d.envio.colonia_envio,
                                localidad: d.envio.localidad_envio, municipio: d.envio.municipio_envio,
                                estado: d.envio.estado_envio, cp: d.envio.cp_envio
                            };
                        }

                        // 1. Decidir qué Radio Button de Certificado presionar
                        if (savedCert) {
                            if (esMismaDireccion(savedCert, dirSucursal)) {
                                $('#cert_sucursal').prop('checked', true);
                            } else if (esMismaDireccion(savedCert, dirFiscal)) {
                                $('#cert_fiscal').prop('checked', true);
                            } else {
                                $('#cert_manual').prop('checked', true);
                            }
                        } else {
                            $('#cert_sucursal').prop('checked', true); // Default si es nueva
                        }

                        // 2. Decidir si palomear el Checkbox de Envío
                        if (savedEnvio && savedCert) {
                            if (esMismaDireccion(savedEnvio, savedCert)) {
                                $('#check_envio_igual').prop('checked', true);
                            } else {
                                $('#check_envio_igual').prop('checked', false);
                            }
                        } else if (savedEnvio) {
                            $('#check_envio_igual').prop('checked', false);
                        }

                        // 3. Disparar los eventos visuales para que se bloqueen/desbloqueen las cajas
                        $('input[name="tipo_dir_cert"]:checked, input[name="tipo_dir_certificado"]:checked').trigger('change');
                        $('#check_envio_igual').trigger('change');

                        // 4. Si habían elegido "Manual", restaurar los datos exactos que escribieron
                        if (savedCert && $('#cert_manual').is(':checked')) {
                            llenarInputs('.c-input', savedCert);
                        }
                        if (savedEnvio && !$('#check_envio_igual').is(':checked')) {
                            llenarInputs('.e-input', savedEnvio);
                        }

                        // MAGIA NUEVA: Si la cotización ya tiene certificado o envío en BD, cambiamos el botón
                        if (savedCert || savedEnvio) {
                            $('#btn_regresar').text('Regresar');
                        }

                        // >>> FIN: MEMORIA DE DIRECCIONES GUARDADAS <<<
                    }
                });
            }
        }
    });

    // ========================================================
    // 2. LÓGICA DE RADIOS (DIRECCIÓN CERTIFICADO)
    // ========================================================
    $('input[name="tipo_dir_cert"], input[name="tipo_dir_certificado"]').on('change', function() {
        let tipo = $(this).val();

        if (tipo === 'sucursal') {
            llenarInputs('.c-input', dirSucursal);
            $('.c-input').prop('readonly', true);       
            $('#bloque_cert_manual').slideDown();
        } else if (tipo === 'fiscal') {
            llenarInputs('.c-input', dirFiscal);
            $('.c-input').prop('readonly', true);       
            $('#bloque_cert_manual').slideDown();
        } else if (tipo === 'manual') {
            limpiarInputs('.c-input');
            $('.c-input').prop('readonly', false);      
            $('#bloque_cert_manual').slideDown();
        }

        if($('#check_envio_igual').is(':checked')) {
            $('#check_envio_igual').trigger('change');
        }
    });

    // ========================================================
    // 3. LÓGICA DE CHECKBOX (DIRECCIÓN ENVÍO)
    // ========================================================
    $('#check_envio_igual').on('change', function() {
        if($(this).is(':checked')) {
            let certData = {
                calle: $('input[name="c_calle"]').val(), colonia: $('input[name="c_colonia"]').val(),
                localidad: $('input[name="c_localidad"]').val(), municipio: $('input[name="c_municipio"]').val(),
                estado: $('input[name="c_estado"]').val(), cp: $('input[name="c_cp"]').val()
            };
            llenarInputs('.e-input', certData);
            $('.e-input').prop('readonly', true);        
            $('#bloque_envio_manual').slideDown();
        } else {
            limpiarInputs('.e-input');
            $('.e-input').prop('readonly', false);       
            $('#bloque_envio_manual').slideDown();
        }
    });

    // Sincronizar en tiempo real
    $('.c-input').on('keyup', function () { 
        if ($('#check_envio_igual').is(':checked')) {
            let name = $(this).attr('name').replace('c_', 'e_');
            $('input[name="'+name+'"]').val($(this).val());
        }
    });

    // ========================================================
    // 4. FUNCIONES AUXILIARES
    // ========================================================
    function llenarInputs(clase, data) {
        let prefix = (clase === '.c-input') ? 'c_' : 'e_';
        $('input[name="'+prefix+'calle"]').val(data.calle || '');
        $('input[name="'+prefix+'colonia"]').val(data.colonia || '');
        $('input[name="'+prefix+'localidad"]').val(data.localidad || '');
        $('input[name="'+prefix+'municipio"]').val(data.municipio || '');
        $('input[name="'+prefix+'estado"]').val(data.estado || '');
        $('input[name="'+prefix+'cp"]').val(data.cp || '');
    }

    function limpiarInputs(clase) { $(clase).val(''); }

    // ========================================================
    // 5. GUARDAR DATOS
    // ========================================================
    $('#formFormalizar').on('submit', function (e) {
        e.preventDefault();
        let btnSubmit = $(this).find('button[type="submit"]');
        let textoOriginal = btnSubmit.text();
        btnSubmit.prop('disabled', true).html('Guardando...');
        let urlOrigen = $('#url_origen').val();

        $.ajax({
            url: 'api/api_finalizar_venta.php',
            type: 'POST', data: $(this).serialize(),
            success: function (res) {
                if (res.status === 'success') {
                    alert(res.message);
                    window.location.href = urlOrigen; 
                } else {
                    alert("Error: " + res.message);
                    btnSubmit.prop('disabled', false).text(textoOriginal);
                }
            },
            error: function () {
                alert("Ocurrió un error al guardar.");
                btnSubmit.prop('disabled', false).text(textoOriginal);
            }
        });
    });
});