$(document).ready(function() {
    let id_cot = $('#id_cotizacion').val();

    // 1. Cargar Domicilio Fiscal Original
    $.ajax({
        url: 'api/api_finalizar_venta.php?id_cotizacion=' + id_cot,
        method: 'GET', dataType: 'json',
        success: function(res) {
            if(res.status === 'success' && res.data) {
                let d = res.data;
                $('input[name="f_calle"]').val(d.calle_numero);
                $('input[name="f_colonia"]').val(d.colonia);
                $('input[name="f_localidad"]').val(d.localidad);
                $('input[name="f_municipio"]').val(d.municipio);
                $('input[name="f_estado"]').val(d.estado);
                $('input[name="f_cp"]').val(d.codigo_postal);
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

    // 5. Enviar Datos
    $('#formFormalizar').on('submit', function(e) {
        e.preventDefault();
        $.ajax({
            url: 'api/api_finalizar_venta.php',
            type: 'POST', data: $(this).serialize(),
            success: function(res) {
                if(res.status === 'success') {
                    alert(res.message);
                    window.location.href = 'ver_cotizaciones.php';
                } else alert("Error: " + res.message);
            }
        });
    });
});