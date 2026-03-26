$(document).ready(function () {
    const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    let windowEmpresas = [];
    let windowProductos = [];
    let preciosProductos = {};
    let rowCount = 0;

    // ==========================================
    // 1. CARGA INICIAL DE DATOS MAESTROS
    // ==========================================
    $.ajax({ url: 'api/api_cotizador.php?action=get_empresas', type: 'GET', success: function (data) { windowEmpresas = data; } });

    $.ajax({
        url: 'api/api_cotizador.php?action=get_productos',
        type: 'GET',
        success: function (data) {
            windowProductos = data;
            data.forEach(prod => {
                preciosProductos[prod.id_product] = {
                    'Farmacia': parseFloat(prod.precio_farmacia),
                    'Público': parseFloat(prod.precio_publico)
                };
            });
        }
    });

    // ==========================================
    // 2. CARGAR TABLA PRINCIPAL CON DATATABLES
    // ==========================================
    function cargarTablaPrincipal() {
        $.ajax({
            url: 'api/api_ver_cotizaciones.php?action=leer',
            method: 'GET',
            cache: false,
            dataType: 'json',
            success: function (data) {
                let tbody = $('#tabla-cotizaciones');
                let $tabla = $('#tableMisCotizaciones');

                if ($.fn.DataTable && $.fn.DataTable.isDataTable($tabla)) {
                    $tabla.DataTable().destroy();
                }

                tbody.empty();

                if (data.length === 0) {
                    tbody.append('<tr><td colspan="6" class="text-center text-muted py-4">No hay cotizaciones registradas.</td></tr>');
                    return;
                }

                data.forEach(function (cot) {
                    let folio = cot.id_cotizacion.toString().padStart(4, '0');

                    let nombreSol = cot.nombre ? cot.nombre : 'Admin';
                    let apellidoSol = cot.apellido_pat ? cot.apellido_pat : '';
                    let solicitante = `${nombreSol} ${apellidoSol}`.trim();
                    let razonSoc = cot.razon_social ? cot.razon_social : 'Sin Empresa';
                    let badgeColor = 'bg-soft-primary text-primary'; // Por defecto Guardada
                    let estatusTexto = cot.estatus ? cot.estatus : 'Guardada';
                    if (estatusTexto === 'Ganada (sin dirección registrada)') badgeColor = 'bg-soft-warning text-warning';
                    if (estatusTexto === 'Ganada') badgeColor = 'bg-soft-success text-success';
                    if (estatusTexto === 'Perdida') badgeColor = 'bg-soft-danger text-danger';


                    let btnCompletarVenta = '';
                    if (estatusTexto === 'Ganada (sin dirección registrada)') {
                        btnCompletarVenta = `<a href="finalizar_venta.php?id=${cot.id_cotizacion}" class="avatar-text avatar-md bg-soft-warning border border-warning" style="animation: pulse 2s infinite;">
                                                <abbr title="¡Faltan Direcciones! Haz clic para completar la venta" style="text-decoration:none;">
                                                    <i class="feather-map-pin text-warning"></i>
                                                </abbr>
                                             </a>`;
                    }

                    let btnEliminar = '';
                    let cotizacionCerrada = (estatusTexto === 'Ganada' || estatusTexto === 'Perdida');

                    // Si no está cerrada, O si el usuario es Admin, mostramos el botón de basura
                    if (!cotizacionCerrada || USER_PERFIL === 'admin') {
                        btnEliminar = `<a href="#" class="avatar-text avatar-md btn-borrar-cot" data-id="${cot.id_cotizacion}"><abbr title="Eliminar" style="text-decoration:none;"><i class="feather-trash-2 text-danger"></i></abbr></a>`;
                    } else {
                        // Si está cerrada y NO es admin, mostramos un candado inactivo
                        btnEliminar = `<a href="javascript:void(0);" class="avatar-text avatar-md" style="opacity: 0.4; cursor: not-allowed;"><abbr title="Bloqueado: Solo administradores pueden eliminarla" style="text-decoration:none;"><i class="feather-lock text-muted"></i></abbr></a>`;
                    }

                    let tr = `
                        <tr>
                            <td>
                                <div class="hstack gap-3">
                                    <div><a class="d-block fw-bold">#${folio}</a></div>
                                    <div class="avatar-image avatar-md rounded"><img class="img-fluid" src="assets/images/gallery/icono_cot.jpg"></div>
                                </div>
                            </td>
                            <td><span class="d-block fw-bold">${cot.fecha_cot}</span></td>
                            <td>
                                <span class="d-block fw-bold text-uppercase">${razonSoc}</span>
                                <small class="text-muted fs-11">Solicitante: ${solicitante}</small>
                            </td>
                            <td><span class="text-dark fw-bold">${formatoMoneda.format(cot.gran_total)}</span></td>
                            <td><span class="badge ${badgeColor}">${estatusTexto}</span></td>
                            <td class="text-center">
                                <div class="hstack gap-2 justify-content-center">
                                    ${btnCompletarVenta}
                                    <a href="imprimir_cotizacion.php?id=${cot.id_cotizacion}" target="_blank" class="avatar-text avatar-md"><abbr title="Imprimir" style="text-decoration:none;"><i class="feather-printer"></i></abbr></a>
                                    <a href="#" class="avatar-text avatar-md btn-editar-modal" data-id="${cot.id_cotizacion}" data-folio="${folio}"><abbr title="Editar" style="text-decoration:none;"><i class="feather-edit"></i></abbr></a>
                                    ${btnEliminar}
                                </div>
                            </td>
                        </tr>
                    `;
                    tbody.append(tr);
                });

                if ($.fn.DataTable) {
                    $tabla.DataTable({
                        language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' },
                        destroy: true,
                        pageLength: 8,
                        lengthChange: false,
                        ordering: false,
                        searching: false,
                        info: true, 
                        dom: "<'table-responsive'tr>" +
                             "<'row align-items-center p-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-end'p>>",

                        drawCallback: function () {
                            // Le agregamos 'pagination-sm' para hacer los botones más pequeños
                            // y 'mb-0' para quitar cualquier margen inferior sobrante
                            $('.dataTables_paginate > .pagination').addClass('pagination-sm mb-0');
                            
                        }
                    });
                }
            },
            error: function () {
                $('#tabla-cotizaciones').html('<tr><td colspan="6" class="text-center text-danger py-4">Error al cargar las cotizaciones.</td></tr>');
            }
        });
    }

    cargarTablaPrincipal();

    // ==========================================
    // 3. LÓGICA DEL MODAL DE EDICIÓN
    // ==========================================
    function construirFila(index, prod_id = '', precio = '', qty = 1, total = '') {
        let opciones = '<option value="">Selecciona...</option>';
        windowProductos.forEach(p => {
            let selected = (p.id_product == prod_id) ? 'selected' : '';
            // Forzamos mayúsculas
            let claveM = p.clave_product.toUpperCase();
            let descM = p.descripcion_product.toUpperCase();
            opciones += `<option value="${p.id_product}" ${selected}>[${claveM}] ${descM}</option>`;
        });

        return `
            <tr id="edit_addr${index}" class="fila-producto">
                <td class="text-center align-middle fila-numero">${index + 1}</td>
                <td class="align-middle"><select class="form-control select-prod-modal" name="productos[]" required>${opciones}</select></td>
                <td class="align-middle"><input type="number" name="unitario[]" class="form-control edit-price" step="any" value="${precio}" required></td>
                <td class="align-middle"><input type="number" name="cantidad_cot[]" class="form-control edit-qty" step="1" min="1" value="${qty}" required></td>
                <td class="align-middle">
                    <div class="d-flex align-items-center gap-2">
                        <input type="number" name="total[]" class="form-control edit-total" readonly value="${total}">
                        <a href="#" class="text-danger btn-eliminar-fila-unica" title="Eliminar fila" style="font-size: 1.2rem;"><i class="feather-trash-2"></i></a>
                    </div>
                </td>
            </tr>
        `;
    }

    // ABRIR EL MODAL Y LLENAR DATOS
    $(document).on('click', '.btn-editar-modal', function (e) {
        e.preventDefault();
        let id_cot = $(this).data('id');
        $('#modal_folio_badge').text('#' + $(this).data('folio'));

        $.ajax({
            url: 'api/api_ver_cotizaciones.php?action=get_cotizacion&id=' + id_cot,
            method: 'GET',
            success: function (res) {
                let cot = res.cotizacion;
                let dets = res.detalles;

                let isReadOnly = (cot.estatus === 'Ganada' || cot.estatus === 'Perdida');
                $('#formEditarCotizacion input, #formEditarCotizacion select').prop('disabled', false);
                $('#edit_add_row').show();
                $('#formEditarCotizacion button[type="submit"]').show();

                $('#edit_id_cotizacion').val(cot.id_cotizacion);
                $('#division').val(cot.division).trigger('change');
                $('#tipo_precio').val(cot.tipo_precio).trigger('change');
                $('#edit_tax').val(cot.porcentaje_iva);
                $('#edit_sub_total').val(cot.importe_total);
                $('#edit_total_amount').val(cot.precio_iva);

                let $selEmp = $('#edit_select_empresa');
                $selEmp.empty().append('<option value="">Selecciona un cliente...</option>');
                windowEmpresas.forEach(emp => { $selEmp.append(`<option value="${emp.id_empresa}">${emp.razon_social}</option>`); });
                $selEmp.val(cot.Empresa_id).select2({ dropdownParent: $('#modalEditarCotizacion') });
                $('#edit_estatus').val(cot.estatus ? cot.estatus : 'Guardada').trigger('change');


                let $colSolicitante = $('#edit_select_solicitante').closest('div[class^="col-"]');
                let $colPrecio = $('#tipo_precio').closest('div[class^="col-"]');
                let $colEstatus = $('#fila_estatus_lan'); // ID de la columna estatus

                $colSolicitante.removeClass('col-md-12').addClass('col-md-4');
                $colPrecio.show();
                $colEstatus.show();
                $selEmp.prop('disabled', false); // Habilitar select de Empresa por defecto

                // ¡LÓGICA DEL CLIENTE - Ocultamos y bloqueamos campos para proteger la cotización
                if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {

                    // A. Ocultar Status y Tipo de Precio
                    $colPrecio.hide();
                    $colEstatus.hide();

                    // B. Solicitante abarca 12 columnas (fila completa)
                    $colSolicitante.removeClass('col-md-4').addClass('col-md-12');

                    // REQUERIMIENTOS SEGURIDAD B2B: Bloqueamos alterar la Empresa
                    $selEmp.prop('disabled', true);

                    // Aseguramos que los inputs ocultos (trampas) existan para enviar los datos obligatorios que bloqueamos
                    if ($('#hidden_edit_empresa').length === 0) {
                        $('#formEditarCotizacion').append(`<input type="hidden" id="hidden_edit_empresa" name="Empresa_id" value="${cot.Empresa_id}">`);
                        $('#formEditarCotizacion').append(`<input type="hidden" id="hidden_edit_precio" name="tipo_precio" value="${cot.tipo_precio}">`);
                        $('#formEditarCotizacion').append(`<input type="hidden" id="hidden_edit_estatus" name="estatus" value="${cot.estatus ? cot.estatus : 'Guardada'}">`);
                    } else {
                        $('#hidden_edit_empresa').val(cot.Empresa_id);
                        $('#hidden_edit_precio').val(cot.tipo_precio);
                        $('#hidden_edit_estatus').val(cot.estatus ? cot.estatus : 'Guardada');
                    }
                } /* else {
                    $('#fila_estatus_lan').show();
                } */

                cargarSolicitantes(cot.Empresa_id, cot.Usuario_empresa_id, isReadOnly);

                let $tbody = $('#edit_tbody_productos');
                $tbody.empty();
                rowCount = 0;

                dets.forEach((item, index) => {
                    $tbody.append(construirFila(index, item.Product_id, item.precio_unitario, item.cantidad, item.precio_extendido));
                    rowCount++;
                });

                $('.select-prod-modal').select2({ dropdownParent: $('#modalEditarCotizacion') });

                if (isReadOnly) {
                    $('#formEditarCotizacion input, #formEditarCotizacion select').prop('disabled', true);
                    $('#edit_add_row').hide();
                    $('.btn-eliminar-fila-unica').hide(); // Ocultamos los íconos de basura
                    $('#formEditarCotizacion button[type="submit"]').hide(); // Ocultar botón guardar
                }

                $('#modalEditarCotizacion').modal('show');
            }
        });
    });

    function cargarSolicitantes(id_empresa, preseleccion = null, isReadOnly = false) {
        $.ajax({
            url: 'api/api_cotizador.php?action=get_usuarios&empresa_id=' + id_empresa,
            method: 'GET',
            success: function (users) {
                let $selSol = $('#edit_select_solicitante');
                $selSol.empty().append('<option value="">Selecciona...</option>');
                users.forEach(u => { $selSol.append(`<option value="${u.id_usuario}">${u.nombre} ${u.apellido_pat}</option>`); });
                if (preseleccion) $selSol.val(preseleccion);
                $selSol.select2({ dropdownParent: $('#modalEditarCotizacion') });

                // Bloqueamos también al solicitante si es un cliente B2B
                if (typeof ES_CLIENTE_PORTAL !== 'undefined' && ES_CLIENTE_PORTAL) {
                    $selSol.prop('disabled', true);
                    if ($('#hidden_edit_usuario').length === 0) {
                        $('#formEditarCotizacion').append(`<input type="hidden" id="hidden_edit_usuario" name="Usuario_id" value="${preseleccion}">`);
                    } else {
                        $('#hidden_edit_usuario').val(preseleccion);
                    }
                }
            }
        });
    }

    $('#edit_select_empresa').on('change', function () { cargarSolicitantes($(this).val()); });

    $('#tipo_precio').on('change', function () {
        $('.select-prod-modal').each(function () {
            if ($(this).val()) $(this).trigger('change');
        });
    });

    // ==========================================
    // 4. MATEMÁTICAS Y FILAS DINÁMICAS EN MODAL
    // ==========================================
    $("#edit_add_row").click(function () {
        $("#edit_tbody_productos").append(construirFila(rowCount));
        $(`#edit_addr${rowCount} .select-prod-modal`).select2({ dropdownParent: $('#modalEditarCotizacion') });
        rowCount++;
        recalcularNumerosFila();
    });

    $(document).on('click', '.btn-eliminar-fila-unica', function (e) {
        e.preventDefault();
        if ($('#edit_tbody_productos tr.fila-producto').length > 1) {
            $(this).closest('tr').remove();
            recalcularNumerosFila();
            calcEdit();
        } else {
            alert("La cotización debe tener al menos un producto.");
        }
    });

    function recalcularNumerosFila() {
        $('#edit_tbody_productos tr.fila-producto').each(function (index) {
            $(this).find('.fila-numero').text(index + 1);
        });
    }

    $(document).on('change', '.select-prod-modal', function () {
        let prodId = $(this).val();
        let tipoPrecioActivo = $('#tipo_precio').val();
        let inputPrecio = $(this).closest('tr').find('.edit-price');

        if (prodId && tipoPrecioActivo && preciosProductos[prodId]) {
            inputPrecio.val(preciosProductos[prodId][tipoPrecioActivo]);
        } else if (prodId && !tipoPrecioActivo) {
            alert("¡Atención! Selecciona primero la 'Lista de Precios' en la parte superior.");
            $(this).val('').trigger('change.select2');
        }
        calcEdit();
    });

    $(document).on("keyup change", ".edit-qty, .edit-price, #edit_tax", function () { calcEdit(); });

    function calcEdit() {
        let sub = 0;
        $("#tab_logic_edit tbody tr.fila-producto").each(function () {
            let q = parseFloat($(this).find(".edit-qty").val()) || 0;
            let p = parseFloat($(this).find(".edit-price").val()) || 0;
            let t = q * p;
            $(this).find(".edit-total").val(t > 0 ? t.toFixed(2) : '');
            sub += t;
        });
        $("#edit_sub_total").val(sub.toFixed(2));
        let tax = parseFloat($("#edit_tax").val()) || 0;
        $("#edit_total_amount").val((sub + (sub * tax / 100)).toFixed(2));
    }

    // ==========================================
    // 5. GUARDAR CAMBIOS Y ELIMINAR
    // ==========================================
    $('#formEditarCotizacion').on('submit', function (e) {
        e.preventDefault();
        calcEdit();
        $.ajax({
            url: 'api/api_ver_cotizaciones.php',
            type: 'POST',
            data: $(this).serialize(),
            success: function (res) {
                if (res.status === 'success') {
                    $('#modalEditarCotizacion').modal('hide');
                    $('.modal-backdrop').remove();

                    let newestatus = $('#edit_estatus').val();
                    if (newestatus === 'Ganada (sin dirección registrada)') {
                        window.location.href = 'finalizar_venta.php?id=' + $('#edit_id_cotizacion').val();
                    } else {
                        cargarTablaPrincipal();
                        alert(res.message);
                    }
                } else alert("Error: " + res.message);
            }
        });
    });

    $(document).on('click', '.btn-borrar-cot', function (e) {
        e.preventDefault();
        if (confirm("¿Eliminar permanentemente esta cotización?")) {
            $.ajax({
                url: 'api/api_ver_cotizaciones.php',
                type: 'POST',
                data: { action: 'eliminar', id_cotizacion: $(this).data('id') },
                success: function (res) {
                    if (res.status === 'success') {
                        cargarTablaPrincipal();
                    } else {
                        alert("Error al eliminar: " + res.message);
                    }
                }
            });
        }
    });
});