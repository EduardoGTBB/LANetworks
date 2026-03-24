$(document).ready(function () {

    // 0. Leemos las constantes que inyectamos desde PHP
    let clienteGuardado = typeof ID_CLIENTE_GUARDADO !== 'undefined' ? ID_CLIENTE_GUARDADO : null;
    let solicitanteGuardado = typeof ID_SOLICITANTE_GUARDADO !== 'undefined' ? ID_SOLICITANTE_GUARDADO : null;

    // 1. CARGAR CLIENTES (Y AUTO-SELECCIONAR EL GUARDADO)
    function cargarClientes() {
        $.ajax({
            url: 'api/api_ver_clientes.php',
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                let $select = $('#select_empresa');
                $select.empty().append('<option value="">Selecciona un cliente...</option>');
                
                data.forEach(function (empresa) {
                    $select.append(`<option value="${empresa.id_empresa}">${empresa.razon_social}</option>`);
                });

                // Si hay cliente guardado, lo seleccionamos e iniciamos la carga de SUS solicitantes
                if (clienteGuardado) {
                    $select.val(clienteGuardado);
                    cargarSolicitantes(clienteGuardado, true); // true = Es la carga inicial
                }
                
                $select.select2({ width: '100%' });
            }
        });
    }

    // 2. CARGAR SOLICITANTES DEPENDIENDO DE LA EMPRESA
    function cargarSolicitantes(empresa_id, esCargaInicial = false) {
        $.ajax({
            url: 'api/api_obtener_usuarios_por_empresa.php',
            type: 'GET',
            data: { empresa_id: empresa_id },
            dataType: 'json',
            success: function(data) {
                let $selectSol = $('#select_solicitante');
                $selectSol.empty().append('<option value="">Selecciona un solicitante...</option>');

                data.forEach(function(user) {
                    $selectSol.append(`<option value="${user.id_usuario}">${user.nombre} ${user.apellido_pat}</option>`);
                });

                // Si es la carga inicial de la página, seleccionamos al solicitante guardado
                if (esCargaInicial && solicitanteGuardado) {
                    $selectSol.val(solicitanteGuardado);
                    solicitanteGuardado = null; // Lo vaciamos para que no se atore si el usuario cambia de empresa después
                }

                $selectSol.select2({ width: '100%' });
            }
        });
    }

    // EVENTO: CUANDO UN HUMANO CAMBIA DE EMPRESA MANUALMENTE
    $('#select_empresa').on('change', function(e) {
        // e.originalEvent verifica que fue un clic real y no una carga automática
        if (e.originalEvent) {
            let empresa_id = $(this).val();
            if (empresa_id) {
                 cargarSolicitantes(empresa_id, false); // false = No es carga inicial, es manual
            } else {
                $('#select_solicitante').empty().append('<option value="">Selecciona un cliente primero...</option>').select2({ width: '100%' });
            }
        }
    });

    // 3. CARGAR PRODUCTOS EN LA TABLA
    function cargarProductos() {
        $.ajax({
            url: 'api/api_ver_productos.php',
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                window.productosData = data;

                $('.product-select').each(function () {
                    let $select = $(this);
                    let preseleccionado = $select.attr('data-selected');

                    $select.empty().append('<option value="">Selecciona un producto...</option>');
                    data.forEach(function (prod) {
                        $select.append(`<option value="${prod.id_product}" data-precio="${prod.precio_farmacia}">[${prod.clave_product}] ${prod.descripcion_product}</option>`);
                    });

                    if (preseleccionado) {
                        $select.val(preseleccionado);
                    }
                    $select.select2({ width: '100%' });
                });
            }
        });
    }

    // Iniciamos la maquinaria
    cargarClientes();
    cargarProductos();

    // 4. LÓGICA DE AGREGAR/ELIMINAR FILAS
    var rowCount = $("#tab_logic tbody tr").length;

    $("#add_row").click(function (e) {
        e.preventDefault();
        var nuevaFila = $("#addr0").clone();

        nuevaFila.attr('id', 'addr' + rowCount);
        nuevaFila.find("td:first-child").html(rowCount + 1);
        nuevaFila.find("input").val('');

        nuevaFila.find('.select2-container').remove();
        let $nuevoSelect = nuevaFila.find('select');
        $nuevoSelect.removeClass('select2-hidden-accessible').removeAttr('data-select2-id aria-hidden tabindex data-selected').val('');
        $nuevoSelect.find('option').removeAttr('data-select2-id');

        $("#tab_logic tbody").append(nuevaFila);
        $nuevoSelect.select2({ width: '100%' });

        rowCount++;
    });

    $("#delete_row").click(function (e) {
        e.preventDefault();
        if (rowCount > 1) {
            $("#addr" + (rowCount - 1)).remove();
            rowCount--;
            calc();
        }
    });

    // EVENTO: AL SELECCIONAR UN PRODUCTO NUEVO, ACTUALIZAR PRECIO
    $(document).on('select2:select', '.product-select', function (e) {
        let precio = $(this).find('option:selected').data('precio') || 0;
        let fila = $(this).closest('tr');
        fila.find('.price').val(precio);
        calc();
    });

    $(document).on("keyup change", ".qty, .price, #tax", function () {
        calc();
    });

    function calc() {
        var sub_total = 0;
        $("#tab_logic tbody tr").each(function () {
            var qty = parseFloat($(this).find(".qty").val()) || 0;
            var price = parseFloat($(this).find(".price").val()) || 0;
            var totalRow = qty * price;
            $(this).find(".total").val(totalRow > 0 ? totalRow.toFixed(2) : '');
            sub_total += totalRow;
        });

        $("#sub_total").val(sub_total.toFixed(2));
        var tax_percent = parseFloat($("#tax").val()) || 0;
        var tax_sum = (sub_total / 100) * tax_percent;
        $("#total_amount").val((sub_total + tax_sum).toFixed(2));
    }

    // 5. ENVÍO DEL FORMULARIO
    $('#editar_cotizacion').on('submit', function (e) {
        e.preventDefault();
        let formData = $(this).serialize();

        $.ajax({
            url: 'api/api_update_cotizacion.php',
            type: 'POST',
            data: formData,
            dataType: 'json',
            success: function (response) {
                if (response.status === 'success') {
                    alert("¡Cotización editada con éxito!");
                    window.location.href = 'ver_cotizaciones.php';
                } else {
                    alert("Error: " + response.message);
                }
            },
            error: function (xhr) {
                alert("Error al comunicarse con el servidor. Revisa la consola.");
                console.error(xhr.responseText);
            }
        });
    });
});