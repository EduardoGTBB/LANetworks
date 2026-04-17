$(document).ready(function () {
    let id_cot = $('#id_cotizacion').val();

    // 1. CARGA INICIAL: Datos de la Cotización y Direcciones
    $.ajax({
        url: 'api/api_finalizar_venta.php?id_cotizacion=' + id_cot,
        method: 'GET', dataType: 'json',
        success: function (res) {
            if (res.status === 'success' && res.data) {
                let d = res.data;
                let estatus = d.estatus_cotizacion;

                // Cargar sucursales del solicitante
                cargarSucursalesDestino(d.Usuario_empresa_id, d.Sucursal_id);

                // Llenar Dirección Fiscal (Siempre de lectura)
                if (d.fiscal && d.fiscal.calle_numero_fiscal) {
                    $('input[name="f_calle"]').val(d.fiscal.calle_numero_fiscal);
                    $('input[name="f_colonia"]').val(d.fiscal.colonia_fiscal);
                    $('input[name="f_localidad"]').val(d.fiscal.localidad_fiscal);
                    $('input[name="f_municipio"]').val(d.fiscal.municipio_fiscal);
                    $('input[name="f_estado"]').val(d.fiscal.estado_fiscal);
                    $('input[name="f_cp"]').val(d.fiscal.cp_fiscal);
                }
                else if (d.empresa_default) {
                    $('input[name="f_calle"]').val(d.empresa_default.calle_numero);
                    $('input[name="f_colonia"]').val(d.empresa_default.colonia);
                    $('input[name="f_localidad"]').val(d.empresa_default.localidad);
                    $('input[name="f_municipio"]').val(d.empresa_default.municipio);
                    $('input[name="f_estado"]').val(d.empresa_default.estado);
                    $('input[name="f_cp"]').val(d.empresa_default.codigo_postal);
                }

                // Llenar Certificado si existe
                if (d.cert && d.cert.calle_numero_cert) {
                    $('input[name="c_calle"]').val(d.cert.calle_numero_cert);
                    $('input[name="c_colonia"]').val(d.cert.colonia_cert);
                    $('input[name="c_localidad"]').val(d.cert.localidad_cert);
                    $('input[name="c_municipio"]').val(d.cert.municipio_cert);
                    $('input[name="c_estado"]').val(d.cert.estado);
                    $('input[name="c_cp"]').val(d.cert.cp_cert);
                }

                // Llenar Envío si existe
                if (d.envio && d.envio.calle_numero_envio) {
                    $('input[name="e_calle"]').val(d.envio.calle_numero_envio);
                    $('input[name="e_colonia"]').val(d.envio.colonia_envio);
                    $('input[name="e_localidad"]').val(d.envio.localidad_envio);
                    $('input[name="e_municipio"]').val(d.envio.municipio_envio);
                    $('input[name="e_estado"]').val(d.envio.estado_envio);
                    $('input[name="e_cp"]').val(d.envio.cp_envio);
                }

                // ========================================================
                // 2. LÓGICA DE BLOQUEO DINÁMICO (POR APROBAR)
                // ========================================================
                if (estatus === 'Por aprobar') {
                    let faltaInfo = false;

                    // Revisar Dirección Certificado
                    if ($('input[name="c_calle"]').val() !== '') {
                        $('.c-input').prop('readonly', true);
                        $('#check_cert_igual').prop('disabled', true).closest('.form-check').hide();
                    } else {
                        $('.c-input').prop('readonly', false);
                        $('#check_cert_igual').prop('disabled', false).closest('.form-check').show();
                        faltaInfo = true;
                    }

                    // Revisar Dirección Envío
                    if ($('input[name="e_calle"]').val() !== '') {
                        $('.e-input').prop('readonly', true);
                        $('#check_envio_igual').prop('disabled', true).closest('.form-check').hide();
                        $('#select_sucursal_final').prop('disabled', true); // Bloqueamos el select de sucursal
                    } else {
                        $('.e-input').prop('readonly', false);
                        $('#check_envio_igual').prop('disabled', false).closest('.form-check').show();
                        $('#select_sucursal_final').prop('disabled', false);
                        faltaInfo = true;
                    }

                    // Ocultar botón si ya no hay nada que llenar
                    if (!faltaInfo) {
                        $('#formFormalizar button[type="submit"]').hide();
                    } else {
                        $('#formFormalizar button[type="submit"]').show();
                    }
                    
                    $('#btn_regresar').text('Regresar al listado');
                }
            }
        }
    });

    // 3. FUNCIONES DE SUCURSAL
    function cargarSucursalesDestino(usuarioId, seleccionado = null) {
        $.ajax({
            // ---> CAMBIAMOS LA URL AQUÍ PARA APUNTAR A LA API CORRECTA <---
            url: 'api/api_finalizar_venta.php?action=get_sucursales&usuario_id=' + usuarioId,
            method: 'GET', dataType: 'json',
            success: function(data) {
                let $select = $('#select_sucursal_final');
                $select.empty().append('<option value="">-- Seleccionar Sucursal --</option>');
                
                // Si el arreglo está vacío, avisamos
                if(data.length === 0) {
                    $select.empty().append('<option value="">Sin sucursales asignadas</option>');
                    return;
                }

                data.forEach(suc => {
                    let sel = (suc.id_sucursal == seleccionado) ? 'selected' : '';
                    // Guardamos todo el objeto de la sucursal en un atributo HTML para leerlo rápido
                    $select.append(`<option value="${suc.id_sucursal}" ${sel} data-dir='${JSON.stringify(suc)}'>${suc.nombre_sucursal} (${suc.plaza})</option>`);
                });
            },
            error: function(xhr, status, error) {
                console.error("Error al cargar las sucursales:", error);
            }
        });
    }

    // EVENTO: Al elegir una sucursal
    $(document).on('change', '#select_sucursal_final', function() {
        let option = $(this).find(':selected');
        let suc = option.data('dir'); // Leemos el objeto guardado
        
        if(suc) {
            // Desmarcamos el checkbox del certificado para evitar conflictos lógicos
            $('#check_envio_igual').prop('checked', false); 
            
            $('input[name="e_calle"]').val(suc.calle_numero);
            $('input[name="e_colonia"]').val(suc.colonia);
            $('input[name="e_localidad"]').val(suc.localidad);
            $('input[name="e_municipio"]').val(suc.municipio);
            $('input[name="e_estado"]').val(suc.estado);
            $('input[name="e_cp"]').val(suc.cp);
            
            // Bloqueamos los inputs porque los trajo de la BD
            $('.e-input').prop('readonly', true);
        } else {
            // Si eligen "-- Seleccionar --", vaciamos y desbloqueamos
            if (!$('#check_envio_igual').is(':checked')) {
                $('.e-input').val('').prop('readonly', false);
            }
        }
    });


    // 4. CHECKBOXES ORIGINALES
    // Copiar Fiscal a Certificado
    $('#check_cert_igual').on('change', function () {
        if ($(this).is(':checked')) {
            $('input[name="c_calle"]').val($('input[name="f_calle"]').val());
            $('input[name="c_colonia"]').val($('input[name="f_colonia"]').val());
            $('input[name="c_localidad"]').val($('input[name="f_localidad"]').val());
            $('input[name="c_municipio"]').val($('input[name="f_municipio"]').val());
            $('input[name="c_estado"]').val($('input[name="f_estado"]').val());
            $('input[name="c_cp"]').val($('input[name="f_cp"]').val());
            $('.c-input').prop('readonly', true);
            $('#check_envio_igual').trigger('change'); 
        } else {
            $('.c-input').val('').prop('readonly', false);
        }
    });

    // Copiar Certificado a Envío
    $('#check_envio_igual').on('change', function () {
        if ($(this).is(':checked')) {
            $('#select_sucursal_final').val(''); // Limpiamos el select de sucursal
            $('input[name="e_calle"]').val($('input[name="c_calle"]').val());
            $('input[name="e_colonia"]').val($('input[name="c_colonia"]').val());
            $('input[name="e_localidad"]').val($('input[name="c_localidad"]').val());
            $('input[name="e_municipio"]').val($('input[name="c_municipio"]').val());
            $('input[name="e_estado"]').val($('input[name="c_estado"]').val());
            $('input[name="e_cp"]').val($('input[name="c_cp"]').val());
            $('.e-input').prop('readonly', true);
        } else {
            $('.e-input').val('').prop('readonly', false);
        }
    });

    $('.f-input').on('keyup', function () { if ($('#check_cert_igual').is(':checked')) $('#check_cert_igual').trigger('change'); });
    $('.c-input').on('keyup', function () { if ($('#check_envio_igual').is(':checked')) $('#check_envio_igual').trigger('change'); });

    // 5. ENVIAR DATOS
    $('#formFormalizar').on('submit', function (e) {
        e.preventDefault();

        let btnSubmit = $(this).find('button[type="submit"]');
        let textoOriginal = btnSubmit.text();
        btnSubmit.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...');
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
            error: function (xhr) {
                alert("Ocurrió un error al guardar. Intenta nuevamente.");
                btnSubmit.prop('disabled', false).text(textoOriginal);
            }
        });
    });
});

/* $(document).ready(function () {
    let id_cot = $('#id_cotizacion').val();

    // 1. Cargar Direcciones Previas o Domicilio Fiscal Original
    $.ajax({
        url: 'api/api_finalizar_venta.php?id_cotizacion=' + id_cot,
        method: 'GET', dataType: 'json',
        success: function (res) {
            if (res.status === 'success' && res.data) {
                let d = res.data;
                let estatus = d.estatus_cotizacion;

                // Si la cotización YA TENÍA dirección fiscal (el cliente la llenó)
                if (d.fiscal && d.fiscal.calle_numero_fiscal) {
                    $('input[name="f_calle"]').val(d.fiscal.calle_numero_fiscal);
                    $('input[name="f_colonia"]').val(d.fiscal.colonia_fiscal);
                    $('input[name="f_localidad"]').val(d.fiscal.localidad_fiscal);
                    $('input[name="f_municipio"]').val(d.fiscal.municipio_fiscal);
                    $('input[name="f_estado"]').val(d.fiscal.estado_fiscal);
                    $('input[name="f_cp"]').val(d.fiscal.cp_fiscal);
                }
                // Si NO tenía, le ponemos la de la empresa por defecto
                else if (d.empresa_default) {
                    $('input[name="f_calle"]').val(d.empresa_default.calle_numero);
                    $('input[name="f_colonia"]').val(d.empresa_default.colonia);
                    $('input[name="f_localidad"]').val(d.empresa_default.localidad);
                    $('input[name="f_municipio"]').val(d.empresa_default.municipio);
                    $('input[name="f_estado"]').val(d.empresa_default.estado);
                    $('input[name="f_cp"]').val(d.empresa_default.codigo_postal);
                }

                // Llenar Certificado si existe
                if (d.cert && d.cert.calle_numero_cert) {
                    $('input[name="c_calle"]').val(d.cert.calle_numero_cert);
                    $('input[name="c_colonia"]').val(d.cert.colonia_cert);
                    $('input[name="c_localidad"]').val(d.cert.localidad_cert);
                    $('input[name="c_municipio"]').val(d.cert.municipio_cert);
                    $('input[name="c_estado"]').val(d.cert.estado);
                    $('input[name="c_cp"]').val(d.cert.cp_cert);
                }

                // Llenar Envío si existe
                if (d.envio && d.envio.calle_numero_envio) {
                    $('input[name="e_calle"]').val(d.envio.calle_numero_envio);
                    $('input[name="e_colonia"]').val(d.envio.colonia_envio);
                    $('input[name="e_localidad"]').val(d.envio.localidad_envio);
                    $('input[name="e_municipio"]').val(d.envio.municipio_envio);
                    $('input[name="e_estado"]').val(d.envio.estado_envio);
                    $('input[name="e_cp"]').val(d.envio.cp_envio);
                }


                if (estatus === 'Por aprobar') {
                    let faltaInfo = false;

                    // Revisar Dirección Certificado
                    if ($('input[name="c_calle"]').val() !== '') {
                        // Si tiene datos: Bloquear
                        $('.c-input').prop('readonly', true);
                        $('#check_cert_igual').prop('disabled', true).closest('.form-check').hide();
                    } else {
                        // Si no tiene datos: Asegurar que esté abierto
                        $('.c-input').prop('readonly', false);
                        $('#check_cert_igual').prop('disabled', false).closest('.form-check').show();
                        faltaInfo = true;
                    }

                    // Revisar Dirección Envío
                    if ($('input[name="e_calle"]').val() !== '') {
                        // Si tiene datos: Bloquear
                        $('.e-input').prop('readonly', true);
                        $('#check_envio_igual').prop('disabled', true).closest('.form-check').hide();
                    } else {
                        // Si no tiene datos: Asegurar que esté abierto
                        $('.e-input').prop('readonly', false);
                        $('#check_envio_igual').prop('disabled', false).closest('.form-check').show();
                        faltaInfo = true;
                    }

                    // Botón de guardar
                    if (!faltaInfo) {
                        $('#formFormalizar button[type="submit"]').hide();
                    } else {
                        $('#formFormalizar button[type="submit"]').show();
                    }
                    
                    $('#btn_regresar').text('Regresar al listado');
                }
            }
        }
    });

    // 2. Checkbox: Copiar Fiscal a Certificado
    $('#check_cert_igual').on('change', function () {
        if ($(this).is(':checked')) {
            $('input[name="c_calle"]').val($('input[name="f_calle"]').val());
            $('input[name="c_colonia"]').val($('input[name="f_colonia"]').val());
            $('input[name="c_localidad"]').val($('input[name="f_localidad"]').val());
            $('input[name="c_municipio"]').val($('input[name="f_municipio"]').val());
            $('input[name="c_estado"]').val($('input[name="f_estado"]').val());
            $('input[name="c_cp"]').val($('input[name="f_cp"]').val());
            $('.c-input').prop('readonly', true);
            $('#check_envio_igual').trigger('change'); // Refrescar envío si está marcado
        } else {
            $('.c-input').val('').prop('readonly', false);
        }
    });

    // 3. Checkbox: Copiar Certificado a Envío
    $('#check_envio_igual').on('change', function () {
        if ($(this).is(':checked')) {
            $('input[name="e_calle"]').val($('input[name="c_calle"]').val());
            $('input[name="e_colonia"]').val($('input[name="c_colonia"]').val());
            $('input[name="e_localidad"]').val($('input[name="c_localidad"]').val());
            $('input[name="e_municipio"]').val($('input[name="c_municipio"]').val());
            $('input[name="e_estado"]').val($('input[name="c_estado"]').val());
            $('input[name="e_cp"]').val($('input[name="c_cp"]').val());
            $('.e-input').prop('readonly', true);
        } else {
            $('.e-input').val('').prop('readonly', false);
        }
    });

    // 4. Refrescar copias si editan la fiscal
    $('.f-input').on('keyup', function () { if ($('#check_cert_igual').is(':checked')) $('#check_cert_igual').trigger('change'); });
    $('.c-input').on('keyup', function () { if ($('#check_envio_igual').is(':checked')) $('#check_envio_igual').trigger('change'); });

    // 5. Enviar Datos (DOBLE CLIC BLOQUEADO)
    $('#formFormalizar').on('submit', function (e) {
        e.preventDefault();

        let btnSubmit = $(this).find('button[type="submit"]');
        let textoOriginal = btnSubmit.text();
        btnSubmit.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...');
        let urlOrigen = $('#url_origen').val();

        $.ajax({
            url: 'api/api_finalizar_venta.php',
            type: 'POST', data: $(this).serialize(),
            success: function (res) {
                if (res.status === 'success') {
                    alert(res.message);
                    window.location.href = urlOrigen; // Usamos la URL dinámica aquí
                } else {
                    alert("Error: " + res.message);
                    btnSubmit.prop('disabled', false).text(textoOriginal);
                }
            },
            error: function (xhr) {
                alert("Ocurrió un error al guardar. Intenta nuevamente.");
                btnSubmit.prop('disabled', false).text(textoOriginal);
            }
        });
    });
}); */


