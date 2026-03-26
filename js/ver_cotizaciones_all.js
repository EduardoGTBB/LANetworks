$(document).ready(function() {
    const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    
    let windowEmpresas = [];
    let windowProductos = [];
    let preciosProductos = {}; 
    let rowCount = 0;

    // 1. CARGA INICIAL
    $.ajax({ url: 'api/api_cotizador.php?action=get_empresas', type: 'GET', success: function(data) { windowEmpresas = data; }});
    $.ajax({ 
        url: 'api/api_cotizador.php?action=get_productos', type: 'GET', 
        success: function(data) { 
            windowProductos = data; 
            data.forEach(p => { preciosProductos[p.id_product] = { 'Farmacia': parseFloat(p.precio_farmacia), 'Público': parseFloat(p.precio_publico) }; });
        }
    });

    // 2. CARGAR TABLA 
    function cargarTablaPrincipal() {
        $.ajax({
            url: 'api/api_ver_cotizaciones.php?action=leer_todas',
            method: 'GET', cache: false, dataType: 'json',
            success: function(data) {
                let tbody = $('#tabla-cotizaciones');
                let $tabla = $('#tableAllCotizaciones'); 
                
                if ($.fn.DataTable && $.fn.DataTable.isDataTable($tabla)) { $tabla.DataTable().destroy(); }
                tbody.empty(); 

                if(data.length === 0) {
                    tbody.append('<tr><td colspan="6" class="text-center text-muted py-4">No hay cotizaciones registradas en la empresa.</td></tr>');
                    return;
                }

                data.forEach(function(cot) {
                    let folio = cot.id_cotizacion.toString().padStart(4, '0');
                    let razonSoc = cot.razon_social ? cot.razon_social : 'Sin Empresa';
                    
                    let nombreSol = cot.nombre ? cot.nombre : 'Sin registro';
                    let apellidoSol = cot.apellido_pat ? cot.apellido_pat : '';
                    let solicitante = `${nombreSol} ${apellidoSol}`.trim();
                    
                    // Identificamos quién hizo la cotización
                    let creador = cot.admin_nombre ? `${cot.admin_nombre} ${cot.admin_apell_pat}` : 'Portal B2B (Cliente)';
                    let colorCreador = cot.admin_nombre ? 'text-primary' : 'text-danger';

                    // Lógica dinámica del estatus en la tabla
                    let badgeColor = 'bg-soft-primary text-primary';
                    let estatusTexto = cot.estatus ? cot.estatus : 'Guardada';
                    if (estatusTexto === 'Ganada') badgeColor = 'bg-soft-success text-success';
                    if (estatusTexto === 'Perdida') badgeColor = 'bg-soft-danger text-danger';

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
                                <small class="text-muted fs-11">Solicitante: ${solicitante}</small><br>
                                <small class="fs-11 fw-bold ${colorCreador}">Creado por: ${creador}</small>
                            </td>
                            <td><span class="text-dark fw-bold">${formatoMoneda.format(cot.gran_total)}</span></td>
                            <td><span class="badge ${badgeColor}">${estatusTexto}</span></td>
                            <td class="text-center">
                                <div class="hstack gap-2 justify-content-center">
                                    <a href="imprimir_cotizacion.php?id=${cot.id_cotizacion}" target="_blank" class="avatar-text avatar-md"><abbr title="Imprimir" style="text-decoration:none;"><i class="feather-printer"></i></abbr></a>
                                    <a href="#" class="avatar-text avatar-md btn-editar-modal" data-id="${cot.id_cotizacion}" data-folio="${folio}"><abbr title="Editar" style="text-decoration:none;"><i class="feather-edit"></i></abbr></a>
                                    <a href="#" class="avatar-text avatar-md btn-borrar-cot" data-id="${cot.id_cotizacion}"><abbr title="Eliminar" style="text-decoration:none;"><i class="feather-trash-2 text-danger"></i></abbr></a>
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
                        info: true 
                    }); 
                }
            },
            error: function() { $('#tabla-cotizaciones').html('<tr><td colspan="6" class="text-center text-danger py-4">Error al cargar.</td></tr>'); }
        });
    }

    cargarTablaPrincipal();

    // 3. LÓGICA DEL MODAL DE EDICIÓN
    function construirFila(index, prod_id = '', precio = '', qty = 1, total = '') {
        let opciones = '<option value="">Selecciona...</option>';
        windowProductos.forEach(p => {
            let selected = (p.id_product == prod_id) ? 'selected' : '';
            opciones += `<option value="${p.id_product}" ${selected}>[${p.clave_product.toUpperCase()}] ${p.descripcion_product.toUpperCase()}</option>`;
        });
        return `<tr id="edit_addr${index}" class="fila-producto">
            <td class="text-center align-middle fila-numero">${index + 1}</td>
            <td class="align-middle"><select class="form-control select-prod-modal" name="productos[]" required>${opciones}</select></td>
            <td class="align-middle"><input type="number" name="unitario[]" class="form-control edit-price" step="any" value="${precio}" required></td>
            <td class="align-middle"><input type="number" name="cantidad_cot[]" class="form-control edit-qty" step="1" min="1" value="${qty}" required></td>
            <td class="align-middle"><div class="d-flex align-items-center gap-2"><input type="number" name="total[]" class="form-control edit-total" readonly value="${total}"><a href="#" class="text-danger btn-eliminar-fila-unica" style="font-size: 1.2rem;"><i class="feather-trash-2"></i></a></div></td></tr>`;
    }

    $(document).on('click', '.btn-editar-modal', function(e) {
        e.preventDefault();
        let id_cot = $(this).data('id');
        $('#modal_folio_badge').text('#' + $(this).data('folio'));

        $.ajax({
            url: 'api/api_ver_cotizaciones.php?action=get_cotizacion&id=' + id_cot,
            method: 'GET',
            success: function(res) {
                let cot = res.cotizacion; let dets = res.detalles;
                
                // 1. DETERMINAR SI ESTÁ CERRADA (Ganada o Perdida)
                let isReadOnly = (cot.estatus === 'Ganada' || cot.estatus === 'Perdida');

                // 2. RESET GLOBAL DEL MODAL (Desbloquear todo antes de rellenar)
                $('#formEditarCotizacion input, #formEditarCotizacion select').prop('disabled', false);
                $('#edit_add_row').show();
                $('#formEditarCotizacion button[type="submit"]').show();

                $('#edit_id_cotizacion').val(cot.id_cotizacion);
                $('#division').val(cot.division).trigger('change');
                $('#tipo_precio').val(cot.tipo_precio).trigger('change');
                $('#edit_estatus').val(cot.estatus ? cot.estatus : 'Guardada').trigger('change');
                $('#edit_tax').val(cot.porcentaje_iva); 
                $('#edit_sub_total').val(cot.importe_total);
                $('#edit_total_amount').val(cot.precio_iva);

                let $selEmp = $('#edit_select_empresa');
                $selEmp.empty().append('<option value="">Selecciona un cliente...</option>');
                windowEmpresas.forEach(emp => { $selEmp.append(`<option value="${emp.id_empresa}">${emp.razon_social}</option>`); });
                $selEmp.val(cot.Empresa_id).select2({ dropdownParent: $('#modalEditarCotizacion') });

                // Mandamos isReadOnly para bloquear el select de solicitante si es necesario
                cargarSolicitantes(cot.Empresa_id, cot.Usuario_empresa_id, isReadOnly);

                let $tbody = $('#edit_tbody_productos');
                $tbody.empty(); rowCount = 0;
                dets.forEach((item, index) => {
                    $tbody.append(construirFila(index, item.Product_id, item.precio_unitario, item.cantidad, item.precio_extendido));
                    rowCount++;
                });

                $('.select-prod-modal').select2({ dropdownParent: $('#modalEditarCotizacion') });
                
                // 3. APLICAR BLOQUEO TOTAL SI ES SOLO LECTURA
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

    // Se agrega parámetro isReadOnly
    function cargarSolicitantes(id_empresa, preseleccion = null, isReadOnly = false) {
        $.ajax({
            url: 'api/api_cotizador.php?action=get_usuarios&empresa_id=' + id_empresa,
            method: 'GET',
            success: function(users) {
                let $selSol = $('#edit_select_solicitante');
                $selSol.empty().append('<option value="">Selecciona...</option>');
                users.forEach(u => { $selSol.append(`<option value="${u.id_usuario}">${u.nombre} ${u.apellido_pat}</option>`); });
                if(preseleccion) $selSol.val(preseleccion);
                $selSol.select2({ dropdownParent: $('#modalEditarCotizacion') });
                
                // Si la cotización está bloqueada (Ganada/Perdida), bloqueamos el select
                if (isReadOnly) {
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

    $('#edit_select_empresa').on('change', function() { cargarSolicitantes($(this).val()); });
    $('#tipo_precio').on('change', function() { $('.select-prod-modal').each(function() { if ($(this).val()) $(this).trigger('change'); }); });

    $("#edit_add_row").click(function () {
        $("#edit_tbody_productos").append(construirFila(rowCount));
        $(`#edit_addr${rowCount} .select-prod-modal`).select2({ dropdownParent: $('#modalEditarCotizacion') });
        rowCount++; recalcularNumerosFila();
    });

    $(document).on('click', '.btn-eliminar-fila-unica', function(e) {
        e.preventDefault();
        if ($('#edit_tbody_productos tr.fila-producto').length > 1) {
            $(this).closest('tr').remove(); recalcularNumerosFila(); calcEdit();
        } else { alert("La cotización debe tener al menos un producto."); }
    });

    function recalcularNumerosFila() { $('#edit_tbody_productos tr.fila-producto').each(function(index) { $(this).find('.fila-numero').text(index + 1); }); }

    $(document).on('change', '.select-prod-modal', function() {
        let prodId = $(this).val(); let tipoPrecioActivo = $('#tipo_precio').val(); let inputPrecio = $(this).closest('tr').find('.edit-price');
        if (prodId && tipoPrecioActivo && preciosProductos[prodId]) { inputPrecio.val(preciosProductos[prodId][tipoPrecioActivo]);
        } else if (prodId && !tipoPrecioActivo) { alert("Selecciona la Lista de Precios."); $(this).val('').trigger('change.select2'); }
        calcEdit();
    });

    $(document).on("keyup change", ".edit-qty, .edit-price, #edit_tax", function () { calcEdit(); });

    function calcEdit() {
        let sub = 0;
        $("#tab_logic_edit tbody tr.fila-producto").each(function () {
            let q = parseFloat($(this).find(".edit-qty").val()) || 0; let p = parseFloat($(this).find(".edit-price").val()) || 0; let t = q * p;
            $(this).find(".edit-total").val(t > 0 ? t.toFixed(2) : ''); sub += t;
        });
        $("#edit_sub_total").val(sub.toFixed(2));
        let tax = parseFloat($("#edit_tax").val()) || 0;
        $("#edit_total_amount").val((sub + (sub * tax / 100)).toFixed(2));
    }

    $('#formEditarCotizacion').on('submit', function(e) {
        e.preventDefault(); calcEdit();
        $.ajax({
            url: 'api/api_ver_cotizaciones.php', type: 'POST', data: $(this).serialize(),
            success: function(res) {
                if(res.status === 'success') {
                    $('#modalEditarCotizacion').modal('hide'); $('.modal-backdrop').remove();
                    cargarTablaPrincipal(); alert(res.message);
                } else alert("Error: " + res.message);
            }
        });
    });

    $(document).on('click', '.btn-borrar-cot', function(e) {
        e.preventDefault();
        if (confirm("¿Eliminar permanentemente esta cotización?")) {
            $.ajax({
                url: 'api/api_ver_cotizaciones.php', type: 'POST', data: { action: 'eliminar', id_cotizacion: $(this).data('id') },
                success: function(res) {
                    if(res.status === 'success') { cargarTablaPrincipal(); } else { alert("Error al eliminar: " + res.message); }
                }
            });
        }
    });
});