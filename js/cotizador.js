//* Nueva estructura 
//& Es de prueba
$(document).ready(function() {
    var uniqueIdCounter = 1; 
    var preciosProductos = {}; 

    if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
        let $tipoPrecio = $('#tipo_precio');
        $tipoPrecio.val('Público').trigger('change.select2');
        $tipoPrecio.closest('.col-md-6').hide();
        $('#select_sucursal').closest('.col-md-6').removeClass('col-md-6').addClass('col-md-12');
    }

    // 1. CARGAR DATOS INICIALES (EMPRESAS Y PRODUCTOS)
    $.ajax({
        url: 'api/api_cotizador.php?action=get_empresas',
        method: 'GET', dataType: 'json',
        success: function(data) {
            let $select = $('#select_empresa'); // Si existe en un form oculto
            if($select.length){
                $select.empty().append('<option value="">Selecciona un cliente...</option>');
                data.forEach(emp => $select.append(`<option value="${emp.id_empresa}">${emp.razon_social}</option>`));
                
                if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
                    $select.val(PORTAL_EMPRESA_ID).trigger('change.select2').trigger('change'); 
                    $select.prop('disabled', true); 
                    if($('#hidden_empresa').length === 0){
                        $('#nueva_cotizacion').append(`<input type="hidden" id="hidden_empresa" name="Empresa_id" value="${PORTAL_EMPRESA_ID}">`);
                    }
                }
            } else {
                // Si la empresa ya está definida o no hay select, cargamos los solicitantes directo (Empresa ID 1 por defecto por ahora)
                cargarSolicitantes(1);
            }
        }
    });

    $.ajax({
        url: 'api/api_cotizador.php?action=get_productos',
        method: 'GET', dataType: 'json',
        success: function(data) {
            let $selectProd = $('.product-select'); 
            $selectProd.empty().append('<option value="">Selecciona un producto...</option>');
            data.forEach(prod => {
                preciosProductos[prod.id_product] = prod;
                let claveMayus = prod.clave_product.toUpperCase();
                let descMayus = prod.descripcion_product.toUpperCase();
                $selectProd.append(`<option value="${prod.id_product}">[${claveMayus}] ${descMayus}</option>`);
            });
        }
    });

    // 2. EVENTOS DE DROPDOWNS (SOLICITANTE Y SUCURSALES)
    function cargarSolicitantes(empresaId) {
        var $selectSol = $('#select_solicitante');
        $selectSol.empty().append('<option value="">Cargando solicitantes...</option>');
        $.ajax({
            url: 'api/api_cotizador.php?action=get_usuarios&empresa_id=' + empresaId,
            method: 'GET', dataType: 'json',
            success: function(data) {
                $selectSol.empty();
                if(data.length === 0) {
                    $selectSol.append('<option value="" disabled>No hay solicitantes en esta empresa</option>');
                } else {
                    $selectSol.append('<option value="">Selecciona un solicitante...</option>');
                    data.forEach(usr => {
                        $selectSol.append(`<option value="${usr.id_usuario}">${usr.nombre} ${usr.apellido_pat}</option>`);
                    });
                    
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
    }

    // Cargar Sucursales al elegir Solicitante
    $('#select_solicitante').on('change', function() {
        let usuarioId = $(this).val();
        let $selectSuc = $('#select_sucursal');
        $selectSuc.empty().append('<option value="">Cargando...</option>');

        if (usuarioId) {
            $.ajax({
                url: 'api/api_cotizador.php?action=get_sucursales_usuario&usuario_id=' + usuarioId,
                method: 'GET', dataType: 'json',
                success: function(data) {
                    $selectSuc.empty();
                    if(data.length === 0) {
                        $selectSuc.append('<option value="" disabled>Sin sucursales asignadas</option>');
                    } else {
                        $selectSuc.append('<option value="">Selecciona la sucursal...</option>');
                        data.forEach(suc => {
                            $selectSuc.append(`<option value="${suc.id_sucursal}">${suc.nombre_sucursal} (${suc.estado})</option>`);
                        });
                        if(data.length === 1) $selectSuc.val(data[0].id_sucursal).trigger('change');
                    }
                }
            });
        } else {
            $selectSuc.empty().append('<option value="">Esperando al solicitante...</option>');
        }
    });

    $('#tipo_precio').on('change', function() {
        $('#tab_logic tbody tr').each(function() { calculateTotal($(this)); });
    });

    // 4. EVENTOS DE LAS FILAS
    $(document).on('change', '.product-select, .chk-config', function() {
        let row = $(this).closest('tr');
        calculateTotal(row);
    });

    $(document).on('keyup change', '.qty', function() {
        let row = $(this).closest('tr');
        calculateTotal(row);
    });

    // 5. AGREGAR/ELIMINAR FILAS
    $("#add_row").click(function(e) {
        e.preventDefault();
        var nuevaFila = $("#addr0").clone();
        
        nuevaFila.attr('id', 'addr' + uniqueIdCounter);
        nuevaFila.find("input[type='text'], input[type='number']").val('');
        
        // Asignar IDs únicos a los checkboxes de la nueva fila para que el label funcione
        nuevaFila.find('.chk-incluir').attr('id', 'chk_incluir_' + uniqueIdCounter).prop('checked', true);
        nuevaFila.find('label[for^="chk_incluir"]').attr('for', 'chk_incluir_' + uniqueIdCounter);
        
        nuevaFila.find('.chk-desglosar').attr('id', 'chk_desglosar_' + uniqueIdCounter).prop('checked', false);
        nuevaFila.find('label[for^="chk_desglosar"]').attr('for', 'chk_desglosar_' + uniqueIdCounter);

        nuevaFila.find('.info-desglose').html('');
        nuevaFila.find('.select2-container').remove();
        
        let $nuevoSelect = nuevaFila.find('select');
        $nuevoSelect.removeClass('select2-hidden-accessible').removeAttr('data-select2-id aria-hidden tabindex').val('');
        $nuevoSelect.find('option').removeAttr('data-select2-id');

        $("#tab_logic tbody").append(nuevaFila);
        if ($.fn.select2) { $nuevoSelect.select2({ width: '100%' }); }
        
        uniqueIdCounter++;
        recalcularNumeros(); 
    });

    $(document).on('click', '.btn-eliminar-fila', function(e) {
        e.preventDefault();
        if ($('#tab_logic tbody tr').length > 1) {
            $(this).closest('tr').remove();
            recalcularNumeros();
            calc_total();
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

    // 6. FUNCIONES MATEMÁTICAS PRINCIPALES
    function calculateTotal(row) {
        let productSelect = row.find('.product-select');
        let prodId = productSelect.val();
        
        let pData = preciosProductos[prodId]; 
        if (!pData) {
            row.find('.price').val('');
            row.find('.total').val('');
            row.find('.info-desglose').html('');
            calc_total();
            return;
        }

        let qty = parseFloat(row.find('.qty').val()) || 0;
        let tipoPrecio = $('#tipo_precio').val(); 
        
        let incluirCalib = row.find('.chk-incluir').is(':checked');
        let desglosar = row.find('.chk-desglosar').is(':checked');

        if(!tipoPrecio) {
            row.find('.price').val('');
            row.find('.total').val('');
            row.find('.info-desglose').html('<small class="text-danger fw-bold">Selecciona el tipo de precio arriba</small>');
            return;
        }

        // Extraer valores de la DB basados en el tipo de precio seleccionado
        let pEquipo = (tipoPrecio === 'Farmacia') ? parseFloat(pData.pf_equipo) : parseFloat(pData.pp_equipo);
        let pCalib = (tipoPrecio === 'Farmacia') ? parseFloat(pData.pf_calib) : parseFloat(pData.pp_calib);
        let pAntesIva = (tipoPrecio === 'Farmacia') ? parseFloat(pData.pf_antes_iva) : parseFloat(pData.pp_antes_iva);

        let textoInformativo = "";

        if (incluirCalib) {
            // Usa el precio completo (Equipo + Calibración generado en la BD)
            row.find('.price').val(pAntesIva.toFixed(2));
            
            if (desglosar) {
                textoInformativo = `<small class="text-primary d-block fw-bold mt-1">Equipo ($${pEquipo.toFixed(2)}) + Calibración ($${pCalib.toFixed(2)})</small>`;
            } else {
                textoInformativo = `<small class="text-muted d-block mt-1">Incluye equipo y calibración</small>`;
            }
        } else {
            // Usa solo el precio del equipo
            row.find('.price').val(pEquipo.toFixed(2));
            
            if (desglosar) {
                textoInformativo = `<small class="text-info d-block fw-bold mt-1">Solo Equipo ($${pEquipo.toFixed(2)})</small>`;
            } else {
                textoInformativo = `<small class="text-muted d-block mt-1">Solo Equipo</small>`;
            }
        }

        row.find('.info-desglose').html(textoInformativo);

        let unitario = parseFloat(row.find('.price').val()) || 0;
        let totalFila = unitario * qty;
        row.find('.total').val(totalFila > 0 ? totalFila.toFixed(2) : '');

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

    // 7. ENVIAR EL FORMULARIO
    $('#nueva_cotizacion').on('submit', function(e) {
        e.preventDefault(); 
        $('#tab_logic tbody tr').each(function() { calculateTotal($(this)); });

        let btnSubmit = $(this).find('button[type="submit"]');
        let textoOriginal = btnSubmit.text();
        btnSubmit.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...');

        // Aseguramos de tener una empresa por defecto si el administrador no tiene el select
        let formData = $(this).serialize();
        if (formData.indexOf('Empresa_id=') === -1) {
            formData += '&Empresa_id=1';
        }

        $.ajax({
            url: 'api/api_cotizador.php',
            type: 'POST',
            data: formData + '&action=crear',
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
                        window.location.href = 'finalizar_venta.php?id=' + response.id_cotizacion;
                    } else {
                        alert(response.message);
                        window.location.href = 'ver_cotizaciones.php';
                    }
                } else {
                    alert("Error: " + response.message);
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


/* //° CODIGO ORIGINAL $(document).ready(function() {
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

    // Cargar Sucursales al elegir Solicitante
    $('#select_solicitante').on('change', function() {
        let usuarioId = $(this).val();
        let $selectSuc = $('#select_sucursal');
        $selectSuc.empty().append('<option value="">Cargando...</option>');

        if (usuarioId) {
            $.ajax({
                url: 'api/api_cotizador.php?action=get_sucursales_usuario&usuario_id=' + usuarioId,
                method: 'GET', dataType: 'json',
                success: function(data) {
                    $selectSuc.empty();
                    if(data.length === 0) {
                        $selectSuc.append('<option value="" disabled>Sin sucursales asignadas</option>');
                    } else {
                        $selectSuc.append('<option value="">Selecciona la sucursal...</option>');
                        data.forEach(suc => {
                            // Mostramos el nombre y la plaza (ej. Narvarte - CDMX Centro)
                            $selectSuc.append(`<option value="${suc.id_sucursal}">${suc.nombre_sucursal} (${suc.plaza})</option>`);
                        });
                        
                        // Si solo tiene 1, seleccionarla en automático
                        if(data.length === 1) {
                            $selectSuc.val(data[0].id_sucursal).trigger('change');
                        }
                    }
                }
            });
        } else {
            $selectSuc.empty().append('<option value="">Esperando al solicitante...</option>');
        }
    });

    // ==========================================
    // LÓGICA VISUAL: CONDICIÓN DEL EQUIPO (NUEVO/USADO)
    // ==========================================
    $('#condicion_equipo').on('change', function() {
        let condicion = $(this).val();

        if (condicion === 'Nuevo') {
            $('.modulo-nuevo').show();
            $('.modulo-usado').hide();
            $('.modulo-vacio').hide();
            
        } else if (condicion === 'Usado') {
            $('.modulo-nuevo').hide();
            $('.modulo-usado').show();
            $('.modulo-vacio').hide();
            
        } else {
            // Si lo regresan a "Selecciona la condición..."
            $('.modulo-nuevo').hide();
            $('.modulo-usado').hide();
            $('.modulo-vacio').show();
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

        let btnSubmit = $(this).find('button[type="submit"]');
        let textoOriginal = btnSubmit.text();
        btnSubmit.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...');

        let formData = $(this).serialize();

        $.ajax({
            url: 'api/api_cotizador.php',
            type: 'POST',
            data: formData + '&action=crear',
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
                        window.location.href = 'finalizar_venta.php?id=' + response.id_cotizacion;
                    } else {
                        alert(response.message);
                        window.location.href = 'ver_cotizaciones.php';
                    }
                } else {
                    alert("Error: " + response.message);
                    btnSubmit.prop('disabled', false).text(textoOriginal);
                }
            },
            error: function(xhr) {
                alert("Ocurrió un error al guardar. Intenta nuevamente.");
                btnSubmit.prop('disabled', false).text(textoOriginal);
            }
        });
    });
}); */

/* //° FIN CODIGO ORIGINAL */