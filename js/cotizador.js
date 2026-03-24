$(document).ready(function() {
    var uniqueIdCounter = 1; 
    var preciosProductos = {}; 

    // ==========================================
    // 0. CONFIGURACIÓN INICIAL DE INTERFAZ (PORTAL)
    // ==========================================
    if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
        let $tipoPrecio = $('#tipo_precio');
        
        // Forzamos el valor a "Público" y actualizamos el diseño visual
        $tipoPrecio.val('Público').trigger('change.select2');
        
        // Ocultamos la columna completa donde vive el tipo de precio
        $tipoPrecio.closest('.col-md-6').hide();
        
        // Expandimos la columna del Solicitante (de 6 a 12 espacios) para que no quede un hueco feo a la derecha
        $('#select_solicitante').closest('.col-md-6').removeClass('col-md-6').addClass('col-md-12');
    }

    // ==========================================
    // 1. CARGAR DATOS INICIALES
    // ==========================================
    $.ajax({
        url: 'api/api_cotizador.php?action=get_empresas',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            let $select = $('#select_empresa');
            $select.empty().append('<option value="">Selecciona un cliente...</option>');
            data.forEach(emp => $select.append(`<option value="${emp.id_empresa}">${emp.razon_social}</option>`));
            
            // ¡LÓGICA PARA EL CLIENTE (PORTAL)!
            if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
                // Actualizamos valor y forzamos renderizado visual de select2 y el evento change
                $select.val(PORTAL_EMPRESA_ID).trigger('change.select2').trigger('change'); 
                $select.prop('disabled', true); 
                
                if($('#hidden_empresa').length === 0){
                    $('#nueva_cotizacion').append(`<input type="hidden" id="hidden_empresa" name="Empresa_id" value="${PORTAL_EMPRESA_ID}">`);
                }
            }
        }
    });

    $.ajax({
        url: 'api/api_cotizador.php?action=get_productos',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            let $selectProd = $('.product-select'); 
            $selectProd.empty().append('<option value="">Selecciona un producto...</option>');
            
            data.forEach(prod => {
                preciosProductos[prod.id_product] = {
                    'Farmacia': parseFloat(prod.precio_farmacia),
                    'Público': parseFloat(prod.precio_publico)
                };
                
                let claveMayus = prod.clave_product.toUpperCase();
                let descMayus = prod.descripcion_product.toUpperCase();
                
                $selectProd.append(`<option value="${prod.id_product}">[${claveMayus}] ${descMayus}</option>`);
            });
        }
    });

    // ==========================================
    // 2. EVENTOS DE DROPDOWNS
    // ==========================================
    $('#select_empresa').on('change', function() {
        var empresaId = $(this).val();
        var $selectSol = $('#select_solicitante');
        $selectSol.empty().append('<option value="">Cargando solicitantes...</option>');

        if (empresaId) {
            $.ajax({
                url: 'api/api_cotizador.php?action=get_usuarios&empresa_id=' + empresaId,
                method: 'GET',
                dataType: 'json',
                success: function(data) {
                    $selectSol.empty();
                    if(data.length === 0) {
                        $selectSol.append('<option value="" disabled>No hay solicitantes en esta empresa</option>');
                    } else {
                        $selectSol.append('<option value="">Selecciona un solicitante...</option>');
                        data.forEach(usr => {
                            $selectSol.append(`<option value="${usr.id_usuario}">${usr.nombre} ${usr.apellido_pat}</option>`);
                        });
                        
                        // ¡LÓGICA PARA EL CLIENTE (PORTAL)!
                        if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
                            $selectSol.val(PORTAL_USUARIO_ID).trigger('change.select2'); 
                            $selectSol.prop('disabled', true); 
                            if($('#hidden_usuario').length === 0){
                                $('#nueva_cotizacion').append(`<input type="hidden" id="hidden_usuario" name="Usuario_id" value="${PORTAL_USUARIO_ID}">`);
                            }
                        }
                    }
                }
            });
        } else {
            $selectSol.empty().append('<option value="">Selecciona primero un cliente...</option>');
        }
    });

    $('#tipo_precio').on('change', function() {
        $('.product-select').each(function() {
            if ($(this).val()) {
                $(this).trigger('change'); 
            }
        });
    });

    // ==========================================
    // 3. LÓGICA DE FILAS (Agregar y Eliminar)
    // ==========================================
    function bindRowEvents(row) {
        row.find(".product-select").on("change", function() {
            var productoId = $(this).val();
            var inputPrecio = $(this).closest('tr').find('.price');
            var tipoPrecioActivo = $('#tipo_precio').val(); 
            
            if (productoId && tipoPrecioActivo) {
                inputPrecio.val(preciosProductos[productoId][tipoPrecioActivo]);
            } else {
                inputPrecio.val('');
                if(productoId && !tipoPrecioActivo) {
                    alert("¡Atención! Selecciona primero la 'Lista de Precios' en la parte superior.");
                    $(this).val('').trigger('change.select2');
                }
            }
            calc();
        });

        row.find(".qty, .price").on("keyup change", function() { calc(); });
    }

    bindRowEvents($("#addr0"));

    $("#add_row").click(function(e) {
        e.preventDefault();
        var nuevaFila = $("#addr0").clone();
        
        nuevaFila.attr('id', 'addr' + uniqueIdCounter);
        nuevaFila.find("input").val('');
        
        nuevaFila.find('.select2-container').remove();
        let $nuevoSelect = nuevaFila.find('select');
        $nuevoSelect.removeClass('select2-hidden-accessible').removeAttr('data-select2-id aria-hidden tabindex').val('');
        $nuevoSelect.find('option').removeAttr('data-select2-id');

        $("#tab_logic tbody").append(nuevaFila);
        if ($.fn.select2) { $nuevoSelect.select2({ width: '100%' }); }
        
        bindRowEvents(nuevaFila);
        uniqueIdCounter++;
        recalcularNumeros(); 
    });

    $(document).on('click', '.btn-eliminar-fila', function(e) {
        e.preventDefault();
        if ($('#tab_logic tbody tr').length > 1) {
            $(this).closest('tr').remove();
            recalcularNumeros();
            calc();
        } else {
            alert("La cotización debe tener al menos un producto.");
        }
    });

    function recalcularNumeros() {
        $('#tab_logic tbody tr').each(function(index) {
            $(this).find('td:first-child').text(index + 1);
        });
    }

    $("#tax").on("keyup change", function() { calc_total(); });

    // ==========================================
    // 4. FUNCIONES MATEMÁTICAS Y GUARDADO
    // ==========================================
    function calc() {
        $("#tab_logic tbody tr").each(function() {
            var qty = parseFloat($(this).find(".qty").val()) || 0;
            var price = parseFloat($(this).find(".price").val()) || 0;
            var totalRow = qty * price;
            $(this).find(".total").val(totalRow > 0 ? totalRow.toFixed(2) : '');
        });
        calc_total();
    }

    function calc_total() {
        var sub_total = 0;
        $(".total").each(function() { sub_total += parseFloat($(this).val()) || 0; });
        $("#sub_total").val(sub_total.toFixed(2));
        
        var tax_percent = parseFloat($("#tax").val()) || 0;
        var tax_sum = (sub_total / 100) * tax_percent;
        $("#total_amount").val((sub_total + tax_sum).toFixed(2));
    }

    // ENVIAR EL FORMULARIO A LA API
    $('#nueva_cotizacion').on('submit', function(e) {
        e.preventDefault(); 
        calc(); 
        let formData = $(this).serialize();

        $.ajax({
            url: 'api/api_cotizador.php',
            type: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    alert(response.message);
                    window.location.href = "ver_cotizaciones.php";
                } else {
                    alert("Error: " + response.message);
                }
            },
            error: function(xhr) {
                alert("Hubo un error de conexión al guardar. Revisa la consola.");
            }
        });
    });
});