$(document).ready(function() {
    let id_cot = $('#id_cotizacion').val();

    // 1. Cargar Direcciones Previas o Domicilio Fiscal Original
    $.ajax({
        url: 'api/api_finalizar_venta.php?id_cotizacion=' + id_cot,
        method: 'GET', dataType: 'json',
        success: function(res) {
            if(res.status === 'success' && res.data) {
                let d = res.data;
                
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
            }
        }
    });

    // 2. Checkbox: Copiar Fiscal a Certificado
    $('#check_cert_igual').on('change', function() {
        if($(this).is(':checked')) {
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
    $('#check_envio_igual').on('change', function() {
        if($(this).is(':checked')) {
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
    $('.f-input').on('keyup', function() { if($('#check_cert_igual').is(':checked')) $('#check_cert_igual').trigger('change'); });
    $('.c-input').on('keyup', function() { if($('#check_envio_igual').is(':checked')) $('#check_envio_igual').trigger('change'); });

    // 5. Enviar Datos (DOBLE CLIC BLOQUEADO)
    $('#formFormalizar').on('submit', function(e) {
        e.preventDefault();

        let btnSubmit = $(this).find('button[type="submit"]');
        let textoOriginal = btnSubmit.text();
        btnSubmit.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...');

        $.ajax({
            url: 'api/api_finalizar_venta.php',
            type: 'POST', data: $(this).serialize(),
            success: function(res) {
                if(res.status === 'success') {
                    alert(res.message);
                    window.location.href = 'ver_cotizaciones.php';
                } else {
                    alert("Error: " + res.message);
                    btnSubmit.prop('disabled', false).text(textoOriginal);
                }
            },
            error: function(xhr) {
                alert("Ocurrió un error al guardar. Intenta nuevamente.");
                btnSubmit.prop('disabled', false).text(textoOriginal);
            }
        });
    });
});