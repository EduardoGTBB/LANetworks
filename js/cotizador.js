$(document).ready(function () {
    const formatoMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    // ✨ NUEVO: Formateador estricto (fuerza punto decimal y coma de miles sin el signo de pesos)
    const formatoInput = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    var uniqueIdCounter = 1;
    var preciosProductos = {};
    var windowProductos = [];
    var sucursalesCache = []; 

    $(document).on('blur', '.precio-mask', function() {
        let valor = String($(this).val()).replace(/,/g, '');
        if(valor !== '' && !isNaN(valor)) {
            $(this).val(formatoInput.format(valor));
        } else {
            $(this).val('');
        }
    });

    $(document).on('focus', '.precio-mask', function() {
        let valor = String($(this).val()).replace(/,/g, '');
        $(this).val(valor); // Quita comas para editar facil
    });
    
    $(document).on('input', '.precio-mask', function() {
        this.value = this.value.replace(/[^0-9.,]/g, ''); // Bloquea letras
    });

    window.windowSucursalesOpciones = '<option value="">Selecciona destino...</option>';
    if ($.fn.select2) {
        $('#filtro_estado_producto').select2({
            theme: 'bootstrap-5',
            minimumResultsForSearch: Infinity 
        });
    }

    $(document).on('change', '.chk-desglosar', function () {
        $(this).siblings('.hidden-desglose').val($(this).is(':checked') ? 'Y' : 'N');
    });

    if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
        let $tipoPrecio = $('#tipo_precio');
        $tipoPrecio.val('Público').prop('disabled', true).trigger('change.select2').trigger('change');

        $tipoPrecio.next('.select2-container').css({
            'pointer-events': 'none',
            'opacity': '0.7'
        });

        if ($('#hidden_tipo_precio').length === 0) {
            $('#nueva_cotizacion').append('<input type="hidden" id="hidden_tipo_precio" name="tipo_precio" value="Público">');
        }
    }

    // >>> 1. CARGAR DATOS INICIALES (EMPRESAS Y PRODUCTOS)
    $.ajax({
        url: 'api/api_cotizador.php?action=get_empresas',
        method: 'GET', dataType: 'json',
        success: function (data) {
            let $select = $('#select_empresa');
            if ($select.length) {
                $select.empty().append('<option value="">Selecciona un cliente...</option>');
                data.forEach(emp => $select.append(`<option value="${emp.id_empresa}">${emp.razon_social}</option>`));

                if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
                    $select.val(PORTAL_EMPRESA_ID).trigger('change.select2').trigger('change');
                    $select.prop('disabled', true);
                    if ($('#hidden_empresa').length === 0) {
                        $('#nueva_cotizacion').append(`<input type="hidden" id="hidden_empresa" name="Empresa_id" value="${PORTAL_EMPRESA_ID}">`);
                    }
                }
            } else {
                cargarSolicitantes(1);
            }
        }
    });

    $.ajax({
        url: 'api/api_cotizador.php?action=get_productos',
        method: 'GET', dataType: 'json',
        success: function (data) {
            windowProductos = data; 
            data.forEach(prod => {
                preciosProductos[prod.id_product] = prod;
            });
            $('#filtro_estado_producto').trigger('change');
        }
    });

    $(document).on('change', '#filtro_estado_producto', function () {
        let filtro = $(this).val();
        if (!windowProductos || windowProductos.length === 0) return;

        let $selects = $('.product-select');

        $selects.each(function () {
            let $select = $(this);
            let valorActual = $select.val();

            if ($select.hasClass('select2-hidden-accessible')) {
                $select.select2('destroy');
            }

            $select.html('<option value="">Selecciona un producto...</option>');

            windowProductos.forEach(function (prod) {
                let estadoBD = prod.estado_product ? prod.estado_product.toUpperCase().trim() : 'N/A';

                if (filtro === 'TODOS' || estadoBD === filtro) {
                    let idProd = prod.id_product;
                    let clave = prod.clave_product || '';
                    let desc = prod.descripcion_product || '';

                    let marca = (prod.marca_product && prod.marca_product !== 'N/A') ? prod.marca_product.toUpperCase() : '';
                    let textoMarca = marca ? ` | Marca: ${marca}` : '';

                    let nombreAMostrar = clave ? `[${clave}] ${desc}${textoMarca}` : `${desc}${textoMarca}`;
                    let esServicio = (estadoBD === 'CALIBRACION');

                    $select.append(`<option value="${idProd}" data-servicio="${esServicio}">${nombreAMostrar}</option>`);
                }
            });

            if (valorActual) {
                $select.val(valorActual);
            }

            $select.select2({
                theme: 'bootstrap-5',
                width: '100%'
            });
        });
    });

    $(document).on('change', 'input[name="tipo_sucursal_flujo"]', function () {
        let tipo = $(this).val();
        let $selectSuc = $('#select_sucursal');

        if (tipo === 'multisucursal') {
            $('#wrapper_selector_sucursal').fadeOut('fast');
            $selectSuc.val('').trigger('change.select2').prop('required', false);
            $('.col-multisucursal').fadeIn('fast');
        } else {
            $('#wrapper_selector_sucursal').fadeIn('fast');
            $selectSuc.prop('required', true);
            $('.col-multisucursal').fadeOut('fast');
            $('.select-sucursal-fila').val('').trigger('change.select2');
        }
    });

    // >>> 2. EVENTOS DE DROPDOWNS (SOLICITANTE Y SUCURSALES)
    function cargarSolicitantes(empresaId) {
        var $selectSol = $('#select_solicitante');
        $selectSol.empty().append('<option value="">Cargando solicitantes...</option>');
        $.ajax({
            url: 'api/api_cotizador.php?action=get_usuarios&empresa_id=' + empresaId,
            method: 'GET', dataType: 'json',
            success: function (data) {
                $selectSol.empty();
                if (data.length === 0) {
                    $selectSol.append('<option value="" disabled>No hay solicitantes en esta empresa</option>');
                } else {
                    $selectSol.append('<option value="">Selecciona un solicitante...</option>');
                    data.forEach(usr => {
                        $selectSol.append(`<option value="${usr.id_usuario}">${usr.nombre} ${usr.apellido_pat} ${usr.apellido_mat}</option>`);
                    });

                    if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
                        $selectSol.val(PORTAL_USUARIO_ID).trigger('change.select2').trigger('change');
                        $selectSol.prop('disabled', true);

                        if ($('#hidden_usuario').length === 0) {
                            $('#nueva_cotizacion').append(`<input type="hidden" id="hidden_usuario" name="Usuario_id" value="${PORTAL_USUARIO_ID}">`);
                        }
                    }
                }
            }
        });
    }

    // ✨ EVENTO SOLICITANTE: CARGA PLAZAS Y SUCURSALES (CON ESCUDOS DE SEGURIDAD)
    $('#select_solicitante').on('change', function () {
        let usuarioId = $(this).val();
        let $selectSuc = $('#select_sucursal');

        let $infoPlaza = $('#info_plaza');
        let $wrapperPlaza = $('#wrapper_info_plaza');

        if (usuarioId) {
            $selectSuc.empty().append('<option value="">Cargando...</option>');
            $infoPlaza.empty().append('<option value="">Cargando plazas...</option>');
            $wrapperPlaza.slideDown('fast');

            $.ajax({
                url: 'api/api_cotizador.php?action=get_sucursales_usuario&usuario_id=' + usuarioId,
                method: 'GET',
                dataType: 'json',
                success: function (data) {
                    sucursalesCache = data;

                    // --- 1. LLENAR SUCURSALES ---
                    if ($selectSuc.hasClass('select2-hidden-accessible')) {
                        $selectSuc.select2('destroy'); // 🧹 Limpiamos el plugin atorado
                    }
                    $selectSuc.empty();
                    window.windowSucursalesOpciones = '<option value="">Selecciona destino...</option>';

                    if (data.length === 0) {
                        $selectSuc.append('<option value="" disabled>Sin sucursales asignadas</option>');
                    } else {
                        $selectSuc.append('<option value="">Selecciona la sucursal...</option>');
                        
                        let sucursalesAgregadas = new Set(); 
                        
                        data.forEach(suc => {
                            if (!sucursalesAgregadas.has(suc.id_sucursal)) {
                                sucursalesAgregadas.add(suc.id_sucursal);
                                let nombreVisual = suc.nombre_listo_para_mostrar;
                                $selectSuc.append(`<option value="${suc.id_sucursal}">${nombreVisual}</option>`);
                                window.windowSucursalesOpciones += `<option value="${suc.id_sucursal}">${nombreVisual}</option>`;
                            }
                        });
                    }

                    $selectSuc.select2({
                        theme: 'bootstrap-5',
                        width: '100%'
                    });

                    $('.select-sucursal-fila').html(window.windowSucursalesOpciones);
                    if ($.fn.select2) {
                        $('.select-sucursal-fila').each(function() {
                            if ($(this).hasClass('select2-hidden-accessible')) {
                                $(this).select2('destroy');
                            }
                            $(this).select2({
                                theme: 'bootstrap-5',
                                width: '100%',
                                placeholder: "Selecciona destino..."
                            });
                        });
                    }
                    
                    // --- 2. LLENAR PLAZAS (Basado SOLAMENTE en el solicitante) ---
                    /* let plazasUnicas = new Map();

                    data.forEach(suc => {
                        if (suc.id_sae == 1) return;

                        if (suc.ids_plazas && suc.nombres_plazas) {
                            let ids = suc.ids_plazas.toString().split('||'); // ✨ SEPARADOR CORRECTO
                            let nombres = suc.nombres_plazas.split('||');

                            for (let i = 0; i < ids.length; i++) {
                                let idPlaza = ids[i].trim();
                                let nomPlaza = nombres[i].trim();
                                if (idPlaza && nomPlaza) {
                                    plazasUnicas.set(idPlaza, nomPlaza);
                                }
                            }
                        }
                    }); */
                    let plazasUnicas = new Map();
                    data.forEach(suc => {
                        if (suc.ids_plazas && suc.nombres_plazas) {
                            let ids = suc.ids_plazas.toString().split('||'); 
                            let nombres = suc.nombres_plazas.split('||');
                            for (let i = 0; i < ids.length; i++) {
                                let idPlaza = ids[i].trim();
                                let nomPlaza = nombres[i].trim();
                                if (idPlaza && nomPlaza) plazasUnicas.set(idPlaza, nomPlaza);
                            }
                        }
                    });

                    // 🧹 Limpiamos Select2 previo y quitamos la clase form-select problemática
                    if ($infoPlaza.hasClass('select2-hidden-accessible')) {
                        $infoPlaza.select2('destroy');
                    }
                    $infoPlaza.empty().removeClass('form-select').addClass('form-control').css({'pointer-events': '', 'background-image': '', 'appearance': ''});

                    if (plazasUnicas.size === 0) {
                        $infoPlaza.append('<option value="">El usuario no tiene plazas ligadas</option>');
                        $infoPlaza.prop('disabled', true).removeClass('bg-white').addClass('bg-light').css('pointer-events', 'none');
                    } else if (plazasUnicas.size === 1) {
                        // ✨ 1 Sola Plaza: Bloqueo visual, sin plugin
                        let plazaActiva = Array.from(plazasUnicas.entries())[0];
                        $infoPlaza.append(`<option value="${plazaActiva[0]}" selected>${plazaActiva[1]}</option>`);
                        $infoPlaza.prop('disabled', false).removeClass('bg-white').addClass('bg-light').css('pointer-events', 'none');
                    } else {
                        // ✨ 2+ Plazas: Inicializamos Select2 sobre form-control para que se vea idéntico
                        $infoPlaza.append('<option value="">Selecciona la plaza...</option>');
                        plazasUnicas.forEach((nombre, id) => {
                            $infoPlaza.append(`<option value="${id}">${nombre}</option>`);
                        });
                        $infoPlaza.prop('disabled', false).removeClass('bg-light').addClass('bg-white').css('pointer-events', 'auto');
                        
                        // Solo aplica para las vistas de edición (no rompe el cotizador nuevo)
                        if (typeof preseleccion_plaza !== 'undefined' && preseleccion_plaza) {
                            $infoPlaza.val(preseleccion_plaza.toString());
                        }

                        if ($.fn.select2) {
                            $infoPlaza.select2({
                                theme: 'bootstrap-5',
                                width: '100%',
                                minimumResultsForSearch: Infinity // Evita que salga la caja de búsqueda interna
                            });
                        }
                    }
                },
                error: function () {
                    $selectSuc.empty().append('<option value="">Error al cargar</option>');
                    $infoPlaza.empty().append('<option value="">Error al cargar</option>');
                }
            });
        } else {
            sucursalesCache = [];
            $selectSuc.empty().append('<option value="">Esperando al solicitante...</option>');
            $('.select-sucursal-fila').html('<option value="">Selecciona destino...</option>');
            $wrapperPlaza.slideUp('fast');
        }
    });

    $('#tipo_precio').on('change', function () {
        $('#tab_logic tbody tr').each(function () { calculateTotal($(this)); });
    });

    // >>> 4. EVENTOS DE LAS FILAS
    $(document).on('change', '.product-select, .chk-config', function () {
        let row = $(this).closest('tr');
        calculateTotal(row);
    });

    $(document).on('keyup change', '.qty', function () {
        let row = $(this).closest('tr');
        calculateTotal(row);
    });

    function verificarBotonFondo() {
        let cantidadFilas = $('#tab_logic tbody tr').length;
        if (cantidadFilas >= 4) {
            $('#btn_add_row_bottom').removeClass('d-none');
        } else {
            $('#btn_add_row_bottom').addClass('d-none');
        }
    }

    // >>> 5. AGREGAR/ELIMINAR FILAS
    $("#add_row, #btn_add_row_bottom").click(function (e) {
        e.preventDefault();
        var nuevaFila = $("#addr0").clone();

        nuevaFila.find('.select-sucursal-fila').html(window.windowSucursalesOpciones).val('');
        nuevaFila.attr('id', 'addr' + uniqueIdCounter);
        nuevaFila.find("input[type='text'], input[type='number']").val('');
        nuevaFila.find("input[type='hidden']").not('.hidden-desglose').val('');
        nuevaFila.find('.qty').val(1);

        nuevaFila.find('.chk-desglosar').attr('id', 'chk_desglosar_' + uniqueIdCounter).prop('checked', false).prop('disabled', false);
        nuevaFila.find('label[for^="chk_desglosar"]').attr('for', 'chk_desglosar_' + uniqueIdCounter);
        nuevaFila.find('.hidden-desglose').val('N');
        nuevaFila.find('.info-desglose').html('');

        nuevaFila.find('.puntos-calibracion-wrapper').hide().empty();
        nuevaFila.find('.equipo-id-input').hide().val('').prop('required', false);

        nuevaFila.find('.select2-container').remove();
        nuevaFila.find('select').removeClass('select2-hidden-accessible').removeAttr('data-select2-id aria-hidden tabindex');
        nuevaFila.find('select option, select optgroup').removeAttr('data-select2-id');

        let $nuevoSelect = nuevaFila.find('.product-select');
        $nuevoSelect.val('');

        $("#tab_logic tbody").append(nuevaFila);

        $('#filtro_estado_producto').trigger('change');

        if ($.fn.select2) {
            nuevaFila.find('.select-sucursal-fila').select2({
                theme: 'bootstrap-5',
                width: '100%',
                placeholder: "Selecciona destino..."
            });
        }

        uniqueIdCounter++;
        recalcularNumeros();
        verificarBotonFondo(); 
    });

    $(document).on('click', '.btn-eliminar-fila', function (e) {
        e.preventDefault();
        if ($('#tab_logic tbody tr').length > 1) {
            $(this).closest('tr').remove();
            recalcularNumeros();
            calc_total();
            verificarBotonFondo(); 
        } else {
            alert("La cotización debe tener al menos un producto.");
        }
    });

    // ✨ CORRECCIÓN CLONACIÓN (1111)
    function recalcularNumeros() {
        $('#tab_logic tbody tr').each(function (index) {
            $(this).find('.num-fila-txt').text(index + 1);
        });
    }

    $("#tax").on("keyup change", function () { calc_total(); });

    // >>> 6. FUNCIONES MATEMÁTICAS PRINCIPALES
    function calculateTotal(row) {
        let productSelect = row.find('.product-select');
        let prodId = productSelect.val();
        let pData = preciosProductos[prodId];

        let $puntosWrapper = row.find('.puntos-calibracion-wrapper');
        let $inputID = row.find('.equipo-id-input');

        if (!pData) {
            row.find('.price').val('');
            row.find('.total-hidden').val('');
            row.find('.total-visual').val('');
            row.find('.info-desglose').html('');
            $puntosWrapper.slideUp('fast').empty();
            $inputID.hide().prop('required', false).val('');
            row.find('.chk-desglosar').prop('disabled', false);
            calc_total();
            return;
        }

        let ptos = pData.puntos_calibracion;

        if (ptos !== null && ptos !== undefined && String(ptos).trim() !== '' && String(ptos).trim() !== 'null') {
            let puntosFormateados = String(ptos).trim().replace(/\n/g, '<br>');
            $puntosWrapper.html(`
                <span class="badge bg-soft-success text-success px-2 py-1 fs-11 w-100 shadow-sm mt-1" style="white-space: normal; text-align: left; line-height: 1.4; border-left: 3px solid #28a745;">
                    <i class="feather-target me-1 fw-bold"></i> Ptos de calibración: ${puntosFormateados}
                </span>
            `).slideDown('fast');
        } else {
            $puntosWrapper.hide().empty();
        }

        let qty = parseFloat(row.find('.qty').val()) || 0;
        let tipoPrecio = $('#tipo_precio').val();

        let estadoBD = pData.estado_product ? pData.estado_product.toUpperCase().trim() : '';
        let esServicio = (estadoBD === 'CALIBRACION');

        if (esServicio) {
            $inputID.hide().prop('required', false).val('');
            row.find('.chk-desglosar').prop('checked', false).prop('disabled', true);
        } else {
            row.find('.chk-desglosar').prop('disabled', false);

            if (estadoBD === 'USADO') {
                // Equipos USADOS: Siempre visible y obligatorio
                $inputID.show().prop('readonly', false).removeClass('bg-light').prop('required', true).attr('placeholder', 'ID del equipo (Obligatorio)');
            } else {
                // Equipos NUEVOS: Opcional por defecto
                $inputID.prop('required', false).attr('placeholder', 'ID del equipo (Opcional)');
                
                // ✨ LÓGICA DE VISIBILIDAD PARA EL CLIENTE (PORTAL B2B)
                if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
                    if ($inputID.val() && $inputID.val().trim() !== '') {
                        // El empleado ya le asignó un ID, se muestra pero bloqueado (Solo lectura)
                        $inputID.show().prop('readonly', true).addClass('bg-light');
                    } else {
                        // Está vacío (Nueva cotización o edición sin captura), se oculta al cliente
                        $inputID.hide();
                    }
                } else {
                    // Es un empleado LAN, siempre puede ver y editar
                    $inputID.show().prop('readonly', false).removeClass('bg-light');
                }
            }
        }

        let desglosar = row.find('.chk-desglosar').is(':checked');

        if (!tipoPrecio) {
            row.find('.price').val('');
            row.find('.info-desglose').html('<small class="text-danger fw-bold">Selecciona el tipo de precio arriba</small>');
            return;
        }

        let pEquipo = (tipoPrecio === 'Farmacia') ? parseFloat(pData.pf_equipo) : parseFloat(pData.pp_equipo);
        let pCalib = (tipoPrecio === 'Farmacia') ? parseFloat(pData.pf_calib) : parseFloat(pData.pp_calib);
        let pAntesIva = (tipoPrecio === 'Farmacia') ? parseFloat(pData.pf_antes_iva) : parseFloat(pData.pp_antes_iva);

        let textoInformativo = "";

        if (esServicio) {
            row.find('.price').val(pEquipo.toFixed(2));
            textoInformativo = `<small class="text-info d-block fw-bold mt-1">Servicio (${formatoMXN.format(pEquipo)})</small>`;
        } else {
            row.find('.price').val(pAntesIva.toFixed(2));
            if (desglosar) {
                // ✨ FORMATO MEXICANO FORZADO
                textoInformativo = `<small class="text-primary d-block fw-bold mt-1">Equipo (${formatoMXN.format(pEquipo)}) + Calibración (${formatoMXN.format(pCalib)})</small>`;
            } else {
                textoInformativo = `<small class="text-muted d-block mt-1">Incluye equipo y calibración</small>`;
            }
        }

        row.find('.info-desglose').html(textoInformativo);

        let unitarioRaw = String(row.find('.price').val()).replace(/,/g, '');
        let unitario = parseFloat(unitarioRaw) || 0;
        let totalFila = unitario * qty;

        row.find('.total-hidden').val(totalFila > 0 ? totalFila.toFixed(2) : '');
        row.find('.total-visual').val(totalFila > 0 ? formatoMXN.format(totalFila) : '');

        calc_total();
    }

    function calc_total() {
        var sub_total = 0;
        $(".total-hidden").each(function () { 
            sub_total += parseFloat($(this).val()) || 0; 
        });
        
        $("#sub_total_hidden").val(sub_total.toFixed(2));
        $("#sub_total_visual").val(formatoMXN.format(sub_total));

        var tax_percent = parseFloat($("#tax").val()) || 0;
        var tax_sum = (sub_total / 100) * tax_percent;
        
        $("#total_amount_hidden").val((sub_total + tax_sum).toFixed(2));
        $("#total_amount_visual").val(formatoMXN.format(sub_total + tax_sum));
    }

    // >>> 7. ENVIAR EL FORMULARIO
    $('#nueva_cotizacion').on('submit', function (e) {
        e.preventDefault();
        $('#tab_logic tbody tr').each(function () { calculateTotal($(this)); });

        let btnSubmit = $(this).find('button[type="submit"]');
        let textoOriginal = btnSubmit.text();
        btnSubmit.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...');

        let formData = $(this).serialize();
        if (formData.indexOf('Empresa_id=') === -1) {
            formData += '&Empresa_id=1';
        }

        $.ajax({
            url: 'api/api_cotizador.php',
            type: 'POST',
            data: formData + '&action=crear',
            dataType: 'json',
            success: function (response) {
                if (response.status === 'success') {
                    alert(response.message);
                    window.location.href = 'finalizar_venta.php?id=' + response.id_cotizacion;
                } else {
                    alert("Error: " + response.message);
                    btnSubmit.prop('disabled', false).text(textoOriginal);
                }
            },
            error: function (xhr) {
                alert("Ocurrió un error al guardar. Intenta nuevamente.");
                btnSubmit.prop('disabled', false).text(textoOriginal);
            }
        });
    });

    // >>> 8. BOTÓN VOLVER ARRIBA (SCROLL TO TOP) <<<
    let $btnTop = $('#btnBackToTop');

    if ($btnTop.length) {
        $(window).on('scroll', function () {
            if ($(this).scrollTop() > 200) {
                $btnTop.css('display', 'flex');
            } else {
                $btnTop.css('display', 'none');
            }
        });

        $btnTop.on('click', function () {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});
/* $(document).ready(function () {
    var uniqueIdCounter = 1;
    var preciosProductos = {};
    var windowProductos = [];
    var sucursalesCache = []; // ✨ CACHÉ DE SUCURSALES

    window.windowSucursalesOpciones = '<option value="">Selecciona destino...</option>';
    if ($.fn.select2) {
        $('#filtro_estado_producto').select2({
            theme: 'bootstrap-5', // Ajusta el diseño a tu plantilla
            minimumResultsForSearch: Infinity // Oculta la lupa de búsqueda para que se vea más limpio
        });
    }

    $(document).on('change', '.chk-desglosar', function () {
        $(this).siblings('.hidden-desglose').val($(this).is(':checked') ? 'Y' : 'N');
    });

    if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
        let $tipoPrecio = $('#tipo_precio');
        // 1. Asignar 'Público', bloquear el select y notificar a Select2
        $tipoPrecio.val('Público')
            .prop('disabled', true)
            .trigger('change.select2')
            .trigger('change');

        // 2. Bloquear interacciones del ratón por CSS (Refuerzo UX)
        $tipoPrecio.next('.select2-container').css({
            'pointer-events': 'none',
            'opacity': '0.7'
        });

        // 3. Crear input hidden de respaldo para enviar 'tipo_precio' en el POST de AJAX
        if ($('#hidden_tipo_precio').length === 0) {
            $('#nueva_cotizacion').append('<input type="hidden" id="hidden_tipo_precio" name="tipo_precio" value="Público">');
        }
    }

    // >>> 1. CARGAR DATOS INICIALES (EMPRESAS Y PRODUCTOS)
    $.ajax({
        url: 'api/api_cotizador.php?action=get_empresas',
        method: 'GET', dataType: 'json',
        success: function (data) {
            let $select = $('#select_empresa');
            if ($select.length) {
                $select.empty().append('<option value="">Selecciona un cliente...</option>');
                data.forEach(emp => $select.append(`<option value="${emp.id_empresa}">${emp.razon_social}</option>`));

                if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
                    $select.val(PORTAL_EMPRESA_ID).trigger('change.select2').trigger('change');
                    $select.prop('disabled', true);
                    if ($('#hidden_empresa').length === 0) {
                        $('#nueva_cotizacion').append(`<input type="hidden" id="hidden_empresa" name="Empresa_id" value="${PORTAL_EMPRESA_ID}">`);
                    }
                }
            } else {
                cargarSolicitantes(1);
            }
        }
    });

    $.ajax({
        url: 'api/api_cotizador.php?action=get_productos',
        method: 'GET', dataType: 'json',
        success: function (data) {
            windowProductos = data; // Almacenamos todo el catálogo
            data.forEach(prod => {
                preciosProductos[prod.id_product] = prod;
            });

            // Obligamos al filtro a pintar la lista inicial
            $('#filtro_estado_producto').trigger('change');
        }
    });

    $(document).on('change', '#filtro_estado_producto', function () {
        let filtro = $(this).val();

        if (!windowProductos || windowProductos.length === 0) return;

        // Buscamos específicamente los dropdowns de la tabla
        let $selects = $('.product-select');

        $selects.each(function () {
            let $select = $(this);
            let valorActual = $select.val();

            // Destruir plugin visual temporalmente para limpiar
            if ($select.hasClass('select2-hidden-accessible')) {
                $select.select2('destroy');
            }

            $select.html('<option value="">Selecciona un producto...</option>');

            // Recorremos y pintamos según la base de datos
            windowProductos.forEach(function (prod) {
                // Leemos directamente de la columna real (estado_product)
                let estadoBD = prod.estado_product ? prod.estado_product.toUpperCase().trim() : 'N/A';

                // Si el filtro es TODOS, o si el estado de la BD coincide con el filtro:
                if (filtro === 'TODOS' || estadoBD === filtro) {

                    let idProd = prod.id_product;
                    let clave = prod.clave_product || '';
                    let desc = prod.descripcion_product || '';

                    let marca = (prod.marca_product && prod.marca_product !== 'N/A') ? prod.marca_product.toUpperCase() : '';
                    let textoMarca = marca ? ` | Marca: ${marca}` : '';

                    *  let nombreAMostrar = clave ? `[${clave}] ${desc}` : desc; *
                    let nombreAMostrar = clave ? `[${clave}] ${desc}${textoMarca}` : `${desc}${textoMarca}`;

                    let esServicio = (estadoBD === 'CALIBRACION');

                    $select.append(`<option value="${idProd}" data-servicio="${esServicio}">${nombreAMostrar}</option>`);
                }
            });

            // Restaurar selección previa si aplica
            if (valorActual) {
                $select.val(valorActual);
            }

            // Reactivar Select2
            $select.select2({
                theme: 'bootstrap-5',
                width: '100%'
            });
        });
    });

    $(document).on('change', 'input[name="tipo_sucursal_flujo"]', function () {
        let tipo = $(this).val();
        if (tipo === 'multisucursal') {
            $('#wrapper_selector_sucursal').fadeOut('fast');
            $('#select_sucursal').val('').trigger('change.select2').prop('required', false);
            $('.col-multisucursal').fadeIn('fast');
        } else {
            $('#wrapper_selector_sucursal').fadeIn('fast');
            $('#select_sucursal').prop('required', true);
            $('.col-multisucursal').fadeOut('fast');
            $('.select-sucursal-fila').val('');
        }
        actualizarPlazaInformativa();
    });

    // >>> 2. EVENTOS DE DROPDOWNS (SOLICITANTE Y SUCURSALES)
    function cargarSolicitantes(empresaId) {
        var $selectSol = $('#select_solicitante');
        $selectSol.empty().append('<option value="">Cargando solicitantes...</option>');
        $.ajax({
            url: 'api/api_cotizador.php?action=get_usuarios&empresa_id=' + empresaId,
            method: 'GET', dataType: 'json',
            success: function (data) {
                $selectSol.empty();
                if (data.length === 0) {
                    $selectSol.append('<option value="" disabled>No hay solicitantes en esta empresa</option>');
                } else {
                    $selectSol.append('<option value="">Selecciona un solicitante...</option>');
                    data.forEach(usr => {
                        $selectSol.append(`<option value="${usr.id_usuario}">${usr.nombre} ${usr.apellido_pat} ${usr.apellido_mat}</option>`);
                    });

                    if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
                        $selectSol.val(PORTAL_USUARIO_ID).trigger('change.select2').trigger('change');
                        $selectSol.prop('disabled', true);

                        if ($('#hidden_usuario').length === 0) {
                            $('#nueva_cotizacion').append(`<input type="hidden" id="hidden_usuario" name="Usuario_id" value="${PORTAL_USUARIO_ID}">`);
                        }
                    }
                }
            }
        });
    }

    // ✨ INTERCEPTOR UNIFICADO: CARGA CACHÉ Y PLAZAS DINÁMICAS (CORREGIDO PARA SUCURSAL ÚNICA)
    $('#select_solicitante').on('change', function () {
        let usuarioId = $(this).val();
        let $selectSuc = $('#select_sucursal');
        
        let $infoPlaza = $('#info_plaza'); 
        let $wrapperPlaza = $('#wrapper_info_plaza');

        // Reset visual al cambiar entre 'multisucursal' y 'unica'
        $(document).off('change', 'input[name="tipo_sucursal_flujo"]').on('change', 'input[name="tipo_sucursal_flujo"]', function () {
            let tipo = $(this).val();
            if (tipo === 'multisucursal') {
                $('#wrapper_selector_sucursal').fadeOut('fast');
                $selectSuc.val('').trigger('change.select2').prop('required', false);
                $('.col-multisucursal').fadeIn('fast');
            } else {
                $('#wrapper_selector_sucursal').fadeIn('fast');
                $selectSuc.prop('required', true);
                $('.col-multisucursal').fadeOut('fast');
                $('.select-sucursal-fila').val('');
            }
        });

        if (usuarioId) {
            $selectSuc.empty().append('<option value="">Cargando...</option>');
            $infoPlaza.empty().append('<option value="">Cargando plazas...</option>');
            $wrapperPlaza.slideDown('fast'); // Mostrar siempre que hay solicitante

            $.ajax({
                url: 'api/api_cotizador.php?action=get_sucursales_usuario&usuario_id=' + usuarioId,
                method: 'GET',
                dataType: 'json',
                success: function (data) {
                    sucursalesCache = data;

                    // --- 1. LLENAR SUCURSALES (Incluyendo la Matriz) ---
                    $selectSuc.empty();
                    if (data.length === 0) {
                        $selectSuc.append('<option value="" disabled>Sin sucursales asignadas</option>');
                        window.windowSucursalesOpciones = '<option value="">Sin sucursales</option>';
                    } else {
                        $selectSuc.append('<option value="">Selecciona la sucursal...</option>');
                        window.windowSucursalesOpciones = '<option value="">Selecciona destino...</option>';

                        data.forEach(suc => {
                            let nombreVisual = suc.nombre_listo_para_mostrar || suc.nombre_sucursal;
                            $selectSuc.append(`<option value="${suc.id_sucursal}">${nombreVisual}</option>`);
                            window.windowSucursalesOpciones += `<option value="${suc.id_sucursal}">${nombreVisual}</option>`;
                        });

                        // 🔴 CAMBIO CLAVE: Usamos trigger('change') normal sin '.select2' 
                        // para no disparar eventos en cadena innecesarios.
                        if (data.length === 1) {
                            $selectSuc.val(data[0].id_sucursal).trigger('change');
                        }
                    }
                    $('.select-sucursal-fila').html(window.windowSucursalesOpciones);
                    
                    // Si usas Select2 en la sucursal, lo actualizamos silenciosamente
                    if ($selectSuc.hasClass('select2-hidden-accessible')) {
                        $selectSuc.trigger('change.select2');
                    }

                    // --- 2. LLENAR PLAZAS (Basado SOLAMENTE en el solicitante) ---
                    let plazasUnicas = new Map();

                    data.forEach(suc => {
                        // 🔒 REQUERIMIENTO: La Matriz (id_sae = 1) no interfiere en la carga de plazas
                        if (suc.id_sae == 1) return;

                        if (suc.ids_plazas && suc.nombres_plazas) {
                            let ids = suc.ids_plazas.toString().split(',');
                            let nombres = suc.nombres_plazas.split(',');
                            
                            for(let i = 0; i < ids.length; i++) {
                                let idPlaza = ids[i].trim();
                                let nomPlaza = nombres[i].trim();
                                if(idPlaza && nomPlaza) {
                                    plazasUnicas.set(idPlaza, nomPlaza);
                                }
                            }
                        }
                    });

                    $infoPlaza.empty();
                    if (plazasUnicas.size === 0) {
                        $infoPlaza.append('<option value="">El usuario no tiene plazas ligadas</option>').prop('disabled', true);
                    } else if (plazasUnicas.size === 1) {
                        // REQUERIMIENTO: Si tiene 1, autoseleccionar y bloquear
                        let plazaActiva = Array.from(plazasUnicas.entries())[0];
                        $infoPlaza.append(`<option value="${plazaActiva[0]}" selected>${plazaActiva[1]}</option>`);
                        
                        // Bloquear visualmente pero permitir que el valor viaje en el POST
                        $infoPlaza.css('pointer-events', 'none').css('background-color', '#e9ecef');
                        
                    } else {
                        // REQUERIMIENTO: Si tiene más de 1, dejar seleccionar
                        $infoPlaza.append('<option value="">Selecciona la plaza...</option>');
                        plazasUnicas.forEach((nombre, id) => {
                            $infoPlaza.append(`<option value="${id}">${nombre}</option>`);
                        });
                        $infoPlaza.prop('disabled', false).css('pointer-events', 'auto').css('background-color', '');
                    }
                },
                error: function () {
                    $selectSuc.empty().append('<option value="">Error al cargar</option>');
                    $infoPlaza.empty().append('<option value="">Error al cargar</option>');
                }
            });
        } else {
            sucursalesCache = [];
            $selectSuc.empty().append('<option value="">Esperando al solicitante...</option>');
            $('.select-sucursal-fila').html('<option value="">Selecciona destino...</option>');
            $wrapperPlaza.slideUp('fast');
        }
    });

    // 🔴 ASEGURARNOS DE QUE NO HAY EVENTOS RESIDUALES
    $('#select_sucursal').off('change'); 
    $('#select_sucursal').on('select2:select', function (e) {
        // Bloqueamos explícitamente cualquier acción al seleccionar en Select2
        // para que no modifique #info_plaza
        e.stopPropagation();
    });
    
    // Eliminamos por completo la función actualizarPlazaInformativa()
    * function cargarSolicitantes(empresaId) {
        var $selectSol = $('#select_solicitante');
        $selectSol.empty().append('<option value="">Cargando solicitantes...</option>');
        $.ajax({
            url: 'api/api_cotizador.php?action=get_usuarios&empresa_id=' + empresaId,
            method: 'GET', dataType: 'json',
            success: function (data) {
                $selectSol.empty();
                if (data.length === 0) {
                    $selectSol.append('<option value="" disabled>No hay solicitantes en esta empresa</option>');
                } else {
                    $selectSol.append('<option value="">Selecciona un solicitante...</option>');
                    data.forEach(usr => {
                        $selectSol.append(`<option value="${usr.id_usuario}">${usr.nombre} ${usr.apellido_pat} ${usr.apellido_mat}</option>`);
                    });

                    if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
                        $selectSol.val(PORTAL_USUARIO_ID).trigger('change.select2').trigger('change');
                        $selectSol.prop('disabled', true);

                        if ($('#hidden_usuario').length === 0) {
                            $('#nueva_cotizacion').append(`<input type="hidden" id="hidden_usuario" name="Usuario_id" value="${PORTAL_USUARIO_ID}">`);
                        }
                    }
                }
            }
        });
    } *

    * $('#select_solicitante').on('change', function() {
        let usuarioId = $(this).val();
        // Llamada a la utilidad centralizada (MVC Limpio)
        cargarSelectSucursales(usuarioId, '#select_sucursal', '.select-sucursal-fila', null);
    }); *
    // ✨ INTERCEPTOR UNIFICADO: CARGA CACHÉ Y PLAZA A PRUEBA DE FALLOS
    $('#select_solicitante').on('change', function () {
        let usuarioId = $(this).val();
        let $selectSuc = $('#select_sucursal');
        
        // Asume que tu HTML tiene un <select id="info_plaza" name="Plaza_id">
        let $infoPlaza = $('#info_plaza'); 
        let $wrapperPlaza = $('#wrapper_info_plaza');

        // Reset visual al cambiar entre 'multisucursal' y 'unica'
        $(document).on('change', 'input[name="tipo_sucursal_flujo"]', function () {
            let tipo = $(this).val();
            if (tipo === 'multisucursal') {
                $('#wrapper_selector_sucursal').fadeOut('fast');
                $selectSuc.val('').trigger('change.select2').prop('required', false);
                $('.col-multisucursal').fadeIn('fast');
            } else {
                $('#wrapper_selector_sucursal').fadeIn('fast');
                $selectSuc.prop('required', true);
                $('.col-multisucursal').fadeOut('fast');
                $('.select-sucursal-fila').val('');
            }
        });

        if (usuarioId) {
            $selectSuc.empty().append('<option value="">Cargando...</option>');
            $infoPlaza.empty().append('<option value="">Cargando plazas...</option>');
            $wrapperPlaza.slideDown('fast');

            $.ajax({
                url: 'api/api_cotizador.php?action=get_sucursales_usuario&usuario_id=' + usuarioId,
                method: 'GET',
                dataType: 'json',
                success: function (data) {
                    sucursalesCache = data;

                    // --- 1. LLENAR SUCURSALES (Incluyendo la Matriz) ---
                    $selectSuc.empty();
                    if (data.length === 0) {
                        $selectSuc.append('<option value="" disabled>Sin sucursales asignadas</option>');
                        window.windowSucursalesOpciones = '<option value="">Sin sucursales</option>';
                    } else {
                        $selectSuc.append('<option value="">Selecciona la sucursal...</option>');
                        window.windowSucursalesOpciones = '<option value="">Selecciona destino...</option>';

                        data.forEach(suc => {
                            let nombreVisual = suc.nombre_listo_para_mostrar || suc.nombre_sucursal;
                            $selectSuc.append(`<option value="${suc.id_sucursal}">${nombreVisual}</option>`);
                            window.windowSucursalesOpciones += `<option value="${suc.id_sucursal}">${nombreVisual}</option>`;
                        });

                        if (data.length === 1) {
                            $selectSuc.val(data[0].id_sucursal).trigger('change');
                        }
                    }
                    $('.select-sucursal-fila').html(window.windowSucursalesOpciones);

                    // --- 2. LLENAR PLAZAS (Dependen directamente del solicitante) ---
                    let plazasUnicas = new Map();

                    data.forEach(suc => {
                        // 🔒 REQUERIMIENTO: La Matriz (id_sae = 1) no interfiere en la carga de plazas
                        if (suc.id_sae == 1) return;

                        if (suc.ids_plazas && suc.nombres_plazas) {
                            let ids = suc.ids_plazas.toString().split(',');
                            let nombres = suc.nombres_plazas.split(',');
                            
                            for(let i = 0; i < ids.length; i++) {
                                let idPlaza = ids[i].trim();
                                let nomPlaza = nombres[i].trim();
                                if(idPlaza && nomPlaza) {
                                    plazasUnicas.set(idPlaza, nomPlaza);
                                }
                            }
                        }
                    });

                    $infoPlaza.empty();
                    if (plazasUnicas.size === 0) {
                        $infoPlaza.append('<option value="">El usuario no tiene plazas ligadas</option>').prop('disabled', true);
                    } else if (plazasUnicas.size === 1) {
                        // REQUERIMIENTO: Si tiene 1, autoseleccionar y bloquear
                        let plazaActiva = Array.from(plazasUnicas.entries())[0];
                        $infoPlaza.append(`<option value="${plazaActiva[0]}" selected>${plazaActiva[1]}</option>`);
                        
                        // Opcional: Deshabilitarlo o ponerle readonly
                        // $infoPlaza.prop('disabled', true); 
                    } else {
                        // REQUERIMIENTO: Si tiene más de 1, dejar seleccionar
                        $infoPlaza.append('<option value="">Selecciona la plaza...</option>');
                        plazasUnicas.forEach((nombre, id) => {
                            $infoPlaza.append(`<option value="${id}">${nombre}</option>`);
                        });
                        $infoPlaza.prop('disabled', false);
                    }
                },
                error: function () {
                    $selectSuc.empty().append('<option value="">Error al cargar</option>');
                    $infoPlaza.empty().append('<option value="">Error al cargar</option>');
                }
            });
        } else {
            sucursalesCache = [];
            $selectSuc.empty().append('<option value="">Esperando al solicitante...</option>');
            $('.select-sucursal-fila').html('<option value="">Selecciona destino...</option>');
            $wrapperPlaza.slideUp('fast');
        }
    });

    $('#select_sucursal').on('change', function () {
        actualizarPlazaInformativa();
    });

    // ✨ LÓGICA DE PLAZAS: EXACTAMENTE COMO LA SOLICITASTE
    function actualizarPlazaInformativa() {
        let tipoFlujo = $('input[name="tipo_sucursal_flujo"]:checked').val();
        let $infoPlaza = $('#info_plaza');
        let $wrapperPlaza = $('#wrapper_info_plaza');
        let usuarioId = $('#select_solicitante').val();

        if (!usuarioId) {
            $wrapperPlaza.slideUp('fast');
            return;
        }

        if (tipoFlujo === 'multisucursal') {
            // ✨ MODO MULTISUCURSAL: Recolectamos todas las plazas asociadas
            let todasLasPlazas = new Set();

            // Verificamos si el usuario tiene sucursales propias (que no sean la matriz global)
            let tieneSucursalesPropias = sucursalesCache.some(suc => suc.id_sae != 1);

            // Recorremos la caché y extraemos las plazas sin repetir
            sucursalesCache.forEach(suc => {
                // Filtro Anti-Contaminación: Ignoramos la matriz para el resumen visual, a menos que sea su única sucursal
                if (tieneSucursalesPropias && suc.id_sae == 1) return;

                if (suc.nombres_plazas) {
                    suc.nombres_plazas.split(',').forEach(p => todasLasPlazas.add(p.trim()));
                }
            });

            let plazasArray = Array.from(todasLasPlazas);
            $infoPlaza.empty();

            if (plazasArray.length > 0) {
                // Si tiene 1 o varias plazas, las unimos y las mostramos
                let textoPlazas = plazasArray.join(', ');
                $infoPlaza.append(`<option value="">${textoPlazas}</option>`);
            } else {
                // Respaldo si sus sucursales no tienen plaza asignada
                $infoPlaza.append('<option value="">Sin plaza registrada</option>');
            }

            $infoPlaza.prop('disabled', true);
            $wrapperPlaza.slideDown('fast'); // Se muestra de inmediato
        } else {
            // MODO SUCURSAL ÚNICA: Solo aparece HASTA que elijan la sucursal
            let suc_id = $('#select_sucursal').val();

            if (suc_id && sucursalesCache.length > 0) {
                let sucursal = sucursalesCache.find(s => s.id_sucursal == suc_id);
                $infoPlaza.empty();

                if (sucursal && sucursal.nombres_plazas) {
                    let plazas = sucursal.nombres_plazas.split(',');
                    if (plazas.length === 1) {
                        $infoPlaza.append(`<option value="${plazas[0]}">${plazas[0]}</option>`);
                        $infoPlaza.prop('disabled', true);
                    } else {
                        plazas.forEach(p => {
                            $infoPlaza.append(`<option value="${p.trim()}">${p.trim()}</option>`);
                        });
                        $infoPlaza.prop('disabled', false);
                    }
                } else {
                    let nombreRespaldo = (sucursal && sucursal.id_sae == 1) ? 'MATRIZ (Sin Plaza Asignada)' : 'Sin plaza registrada';
                    $infoPlaza.append(`<option value="">${nombreRespaldo}</option>`);
                    $infoPlaza.prop('disabled', true);
                }
                $wrapperPlaza.slideDown('fast'); // ¡Aparece al seleccionar destino!
            } else {
                // Si aún no eligen la Sucursal Destino, permanece oculta
                $wrapperPlaza.slideUp('fast');
            }
        }
    }

    $('#tipo_precio').on('change', function () {
        $('#tab_logic tbody tr').each(function () { calculateTotal($(this)); });
    });

    // >>> 4. EVENTOS DE LAS FILAS
    $(document).on('change', '.product-select, .chk-config', function () {
        let row = $(this).closest('tr');
        calculateTotal(row);
    });

    $(document).on('keyup change', '.qty', function () {
        let row = $(this).closest('tr');
        calculateTotal(row);
    });

    // ✨ FUNCIÓN MOSTRAR BOTÓN FONDO
    function verificarBotonFondo() {
        let cantidadFilas = $('#tab_logic tbody tr').length;
        if (cantidadFilas >= 4) {
            $('#btn_add_row_bottom').removeClass('d-none');
        } else {
            $('#btn_add_row_bottom').addClass('d-none');
        }
    }

    // >>> 5. AGREGAR/ELIMINAR FILAS
    $("#add_row, #btn_add_row_bottom").click(function (e) {
        e.preventDefault();
        var nuevaFila = $("#addr0").clone();

        nuevaFila.find('.select-sucursal-fila').html(window.windowSucursalesOpciones).val('');
        nuevaFila.attr('id', 'addr' + uniqueIdCounter);
        nuevaFila.find("input[type='text'], input[type='number']").val('');
        nuevaFila.find('.qty').val(1);

        // &AJUSTE: Siempre clona las filas con el checkbox APAGADO pero ACTIVO
        nuevaFila.find('.chk-incluir').attr('id', 'chk_incluir_' + uniqueIdCounter).prop('checked', true).prop('disabled', true);
        nuevaFila.find('label[for^="chk_incluir"]').attr('for', 'chk_incluir_' + uniqueIdCounter);

        nuevaFila.find('.chk-desglosar').attr('id', 'chk_desglosar_' + uniqueIdCounter).prop('checked', false).prop('disabled', false);
        nuevaFila.find('label[for^="chk_desglosar"]').attr('for', 'chk_desglosar_' + uniqueIdCounter);

        nuevaFila.find('.hidden-desglose').val('N');
        nuevaFila.find('.info-desglose').html('');

        nuevaFila.find('.puntos-calibracion-wrapper').hide().empty();

        nuevaFila.find('.select2-container').remove();
        nuevaFila.find('select').removeClass('select2-hidden-accessible').removeAttr('data-select2-id aria-hidden tabindex');
        nuevaFila.find('select option, select optgroup').removeAttr('data-select2-id');

        let $nuevoSelect = nuevaFila.find('.product-select');
        $nuevoSelect.val('');

        $("#tab_logic tbody").append(nuevaFila);

        $('#filtro_estado_producto').trigger('change');

        * if ($.fn.select2) { $nuevoSelect.select2({ width: '100%' }); }*
        if ($.fn.select2) {
            nuevaFila.find('.select-sucursal-fila').select2({
                theme: 'bootstrap-5',
                width: '100%',
                placeholder: "Selecciona destino..."
            });
        }

        uniqueIdCounter++;
        recalcularNumeros();
        verificarBotonFondo(); // Verifica las 7 filas
    });

    $(document).on('click', '.btn-eliminar-fila', function (e) {
        e.preventDefault();
        if ($('#tab_logic tbody tr').length > 1) {
            $(this).closest('tr').remove();
            recalcularNumeros();
            calc_total();
            verificarBotonFondo(); // Verifica las 7 filas
        } else {
            alert("La cotización debe tener al menos un producto.");
        }
    });

    function recalcularNumeros() {
        $('#tab_logic tbody tr').each(function (index) {
            $(this).find('td:first-child').text(index + 1);
        });
    }

    $("#tax").on("keyup change", function () { calc_total(); });

    // >>> 6. FUNCIONES MATEMÁTICAS PRINCIPALES
    function calculateTotal(row) {
        let productSelect = row.find('.product-select');
        let prodId = productSelect.val();

        let pData = preciosProductos[prodId];
        let $puntosWrapper = row.find('.puntos-calibracion-wrapper');

        if (!pData) {
            row.find('.price').val('');
            row.find('.total').val('');
            row.find('.info-desglose').html('');
            $puntosWrapper.slideUp('fast').empty();
            row.find('.chk-incluir').prop('disabled', false);
            row.find('.chk-desglosar').prop('disabled', false);
            calc_total();
            return;
        }

        let ptos = pData.puntos_calibracion;

        // Verificamos que no sea null, ni undefined, ni la palabra "null", ni un campo vacío
        if (ptos !== null && ptos !== undefined && String(ptos).trim() !== '' && String(ptos).trim() !== 'null') {
            let puntosFormateados = String(ptos).trim().replace(/\n/g, '<br>');
            $puntosWrapper.html(`
                <span class="badge bg-soft-success text-success px-2 py-1 fs-11 w-100 shadow-sm mt-1" style="white-space: normal; text-align: left; line-height: 1.4; border-left: 3px solid #28a745;">
                    <i class="feather-target me-1 fw-bold"></i> Ptos de calibración: ${puntosFormateados}
                </span>
            `).slideDown('fast');
        } else {
            $puntosWrapper.hide().empty();
        }

        let qty = parseFloat(row.find('.qty').val()) || 0;
        let tipoPrecio = $('#tipo_precio').val();

        // >>> LÓGICA DE SERVICIOS: Checar si el producto seleccionado es un servicio
        let optionSelected = productSelect.find('option:selected');
        let esServicio = optionSelected.data('servicio') === true || optionSelected.data('servicio') === 'true';

        // Si es servicio, apagamos y bloqueamos los check de calibración. Si no, los habilitamos.
        if (esServicio) {
            row.find('.chk-incluir').prop('checked', false).prop('disabled', true);
            row.find('.chk-desglosar').prop('checked', false).prop('disabled', true);
        } else {
            row.find('.chk-incluir').prop('disabled', false);
            row.find('.chk-desglosar').prop('disabled', false);
        }

        let incluirCalib = row.find('.chk-incluir').is(':checked');
        let desglosar = row.find('.chk-desglosar').is(':checked');

        if (!tipoPrecio) {
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

        // Formato condicional de la Etiqueta (Servicio o Equipo)
        if (esServicio) {
            row.find('.price').val(pEquipo.toFixed(2));
            textoInformativo = `<small class="text-info d-block fw-bold mt-1">Servicio ($${pEquipo.toFixed(2)})</small>`;
        } else {
            if (incluirCalib) {
                row.find('.price').val(pAntesIva.toFixed(2));
                if (desglosar) {
                    textoInformativo = `<small class="text-primary d-block fw-bold mt-1">Equipo ($${pEquipo.toFixed(2)}) + Calibración ($${pCalib.toFixed(2)})</small>`;
                } else {
                    textoInformativo = `<small class="text-muted d-block mt-1">Incluye equipo y calibración</small>`;
                }
            } else {
                row.find('.price').val(pEquipo.toFixed(2));
                if (desglosar) {
                    textoInformativo = `<small class="text-info d-block fw-bold mt-1">Solo Equipo ($${pEquipo.toFixed(2)})</small>`;
                } else {
                    textoInformativo = `<small class="text-muted d-block mt-1">Solo Equipo</small>`;
                }
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
        $(".total").each(function () { sub_total += parseFloat($(this).val()) || 0; });
        $("#sub_total").val(sub_total.toFixed(2));

        var tax_percent = parseFloat($("#tax").val()) || 0;
        var tax_sum = (sub_total / 100) * tax_percent;
        $("#total_amount").val((sub_total + tax_sum).toFixed(2));
    }

    // >>> 7. ENVIAR EL FORMULARIO
    $('#nueva_cotizacion').on('submit', function (e) {
        e.preventDefault();
        $('#tab_logic tbody tr').each(function () { calculateTotal($(this)); });

        let btnSubmit = $(this).find('button[type="submit"]');
        let textoOriginal = btnSubmit.text();
        btnSubmit.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...');

        let formData = $(this).serialize();
        if (formData.indexOf('Empresa_id=') === -1) {
            formData += '&Empresa_id=1';
        }

        $.ajax({
            url: 'api/api_cotizador.php',
            type: 'POST',
            data: formData + '&action=crear',
            dataType: 'json',
            success: function (response) {
                if (response.status === 'success') {
                    alert(response.message);
                    window.location.href = 'finalizar_venta.php?id=' + response.id_cotizacion;
                } else {
                    alert("Error: " + response.message);
                    btnSubmit.prop('disabled', false).text(textoOriginal);
                }
            },
            error: function (xhr) {
                alert("Ocurrió un error al guardar. Intenta nuevamente.");
                btnSubmit.prop('disabled', false).text(textoOriginal);
            }
        });
    });

    // >>> 8. BOTÓN VOLVER ARRIBA (SCROLL TO TOP) <<<
    let $btnTop = $('#btnBackToTop');

    if ($btnTop.length) {
        // Detectar el scroll de la ventana
        $(window).on('scroll', function () {
            if ($(this).scrollTop() > 200) {
                $btnTop.css('display', 'flex');
            } else {
                $btnTop.css('display', 'none');
            }
        });

        // Acción al hacer clic
        $btnTop.on('click', function () {
            // Usamos Vanilla JS dentro del evento de jQuery para un rendimiento más fluido
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ==============================================================================
    // 🛡️ ESCUDO DE SEGURIDAD: PREVENIR EVENTOS FANTASMAS EN LA SUCURSAL DESTINO
    // ==============================================================================
    
    // 1. Destruimos cualquier evento 'change' que haya sido inyectado por utils_sucursales.js o caché
    $(document).off('change', '#select_sucursal');
    $('#select_sucursal').off('change select2:select');

    // 2. Interceptamos el cambio de la sucursal y detenemos su propagación en seco.
    // Esto permite que el usuario elija la Sucursal Matriz, pero le dice al navegador: 
    // "No dejes que ningún otro script ejecute lógica al hacer este cambio".
    $('#select_sucursal').on('change select2:select', function(e) {
        e.stopImmediatePropagation();
    });
}); */