$(document).ready(function () {
    $('#Plaza_id').select2({
        placeholder: "Selecciona plaza (Opcional)...",
        allowClear: true,
        width: '100%',
        dropdownParent: $('#modalSucursal .modal-content'),
        dropdownAutoWidth: true 
    });

    $('#nombre_sucursal, #calle, #num_ext, #num_int, #entre_calle, #y_calle, #colonia, #poblacion, #municipio, #estado').on('input', function() {
        $(this).val($(this).val().toUpperCase());
    });

    $.ajax({
        url: 'api/api_cotizador.php?action=get_empresas',
        method: 'GET', dataType: 'json',
        success: function (data) {
            data.forEach(emp => {
                $('#Empresa_id').append(`<option value="${emp.id_empresa}">${emp.razon_social}</option>`);
            });
        }
    });

    $.ajax({
        url: 'api/api_ver_plazas.php?action=leer',
        method: 'GET', dataType: 'json',
        success: function (data) {
            let $selectPlaza = $('#Plaza_id');
            $selectPlaza.empty().append('<option value="">Selecciona plaza (Opcional)...</option>');
            data.forEach(p => {
                $selectPlaza.append(`<option value="${p.id_plaza}">${p.nombre_plaza}</option>`);
            });
        }
    });

    function cargarTabla() {
        $.ajax({
            url: 'api/api_ver_sucursales.php?action=leer',
            method: 'GET', dataType: 'json',
            success: function (data) {
                let tbody = $('#all_surc');
                if ($.fn.DataTable.isDataTable('#proposalList')) {
                    $('#proposalList').DataTable().clear().destroy();
                }
                tbody.empty();

                data.forEach((suc, index) => {
                    let badgeClass = (suc.estatus === 'Y') ? 'bg-soft-success text-success' : 'bg-soft-danger text-danger';
                    let textoEstatus = (suc.estatus === 'Y') ? 'Activa' : 'Inactiva';
                    let id_sae_display = suc.id_sae ? suc.id_sae : '<span class="text-muted">-</span>';
                    let municipio_display = suc.municipio ? suc.municipio : 'Sin municipio';
                    let estado_display = suc.estado ? suc.estado : '';

                    let tr = `
                        <tr>
                            <td class="text-center align-middle"><span class="badge bg-primary fs-12">${id_sae_display}</span></td>
                            <td class="align-middle">
                                <span class="d-block fw-bold text-dark">${suc.nombre_sucursal}</span>
                                <small class="text-muted"><i class="feather-briefcase text-primary"></i> ${suc.razon_social || 'Sin empresa'}</small>
                            </td>
                            <td class="align-middle">
                                <span class="d-block text-dark">${municipio_display}, ${estado_display}</span>
                                <small class="text-muted fs-11">Ver dirección completa al editar</small>
                            </td>
                            <td class="text-center align-middle"><span class="badge ${badgeClass}">${textoEstatus}</span></td>
                            <td class="text-center align-middle">
                                <div class="hstack gap-2 justify-content-center">
                                    <a href="#" class="avatar-text avatar-md btn-editar" data-id="${suc.id_sucursal}">
                                        <abbr title="Editar Sucursal" style="text-decoration:none;"><i class="feather-edit"></i></abbr>
                                    </a>
                                    <a href="#" class="avatar-text avatar-md btn-eliminar" data-id="${suc.id_sucursal}">
                                        <abbr title="Eliminar" style="text-decoration:none;"><i class="feather-trash-2 text-danger"></i></abbr>
                                    </a>
                                </div>
                            </td>
                        </tr>
                    `;
                    tbody.append(tr);
                });

                if ($.fn.DataTable) {
                    $('#proposalList').DataTable({
                        language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' },
                        lengthChange: false,
                        searching: true,
                        dom: "<'row mb-3'<'col-sm-12 col-md-6 d-flex justify-content-start'f><'col-sm-12 col-md-6'>>" +
                            "<'table-responsive'tr>" +
                            "<'row align-items-center p-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-end'p>>",
                        drawCallback: function () {
                            $('.dataTables_paginate > .pagination').addClass('pagination-sm mb-0');
                        }
                    });
                }
            }
        });
    }

    cargarTabla();

    $('#btnNuevaSucursal').click(function (e) {
        e.preventDefault();
        $('#formSucursal')[0].reset();
        $('#Sucursal_action').val('crear');
        $('#sucursal_id').val('');
        $('#bloque_estatus_suc').hide();
        $('#Plaza_id').val([]).trigger('change.select2'); 
        $('#modalSucursalLabel').text('Nueva Sucursal');
        $('#modalSucursal').modal('show');
    });

    $(document).on('click', '.btn-editar', function (e) {
        e.preventDefault();
        let id = $(this).data('id');

        $.ajax({
            url: 'api/api_ver_sucursales.php?action=get_sucursal&id=' + id,
            method: 'GET', dataType: 'json',
            success: function (res) {
                if (res.status === 'success') {
                    let s = res.data;
                    $('#sucursal_id').val(s.id_sucursal);
                    $('#Sucursal_action').val('editar');
                    $('#id_sae').val(s.id_sae);
                    $('#nombre_sucursal').val(s.nombre_sucursal);
                    $('#modalSucursalLabel').text('Editar Sucursal');
                    $('#calle').val(s.calle);
                    $('#num_ext').val(s.num_ext);
                    $('#num_int').val(s.num_int);
                    $('#entre_calle').val(s.entre_calle);
                    $('#y_calle').val(s.y_calle);
                    $('#colonia').val(s.colonia);
                    $('#cp').val(s.cp);
                    $('#poblacion').val(s.poblacion);
                    $('#municipio').val(s.municipio);
                    $('#estado').val(s.estado);
                    $('#estatus_suc').prop('checked', s.estatus === 'Y');
                    $('#bloque_estatus_suc').show();
                    $('#Plaza_id').val(s.plazas_ids).trigger('change.select2');
                    $('#Empresa_id').val(s.Empresa_id).trigger('change');
                    $('#modalSucursal').modal('show');
                }
            }
        });
    });

    $('#formSucursal').on('submit', function (e) {
        e.preventDefault();
        let btn = $(this).find('button[type="submit"]');
        let txt = btn.text();
        btn.prop('disabled', true).text('Guardando...');

        $.ajax({
            url: 'api/api_ver_sucursales.php',
            type: 'POST',
            data: $(this).serialize(),
            success: function (res) {
                if (res.status === 'success') {
                    $('#modalSucursal').modal('hide');
                    alert(res.message);
                    cargarTabla();
                } else {
                    alert(res.message);
                }
                btn.prop('disabled', false).text(txt);
            },
            error: function () {
                alert('Error de conexión');
                btn.prop('disabled', false).text(txt);
            }
        });
    });

    $(document).on('click', '.btn-eliminar', function (e) {
        e.preventDefault();
        if (confirm('¿Eliminar esta sucursal?')) {
            $.post('api/api_ver_sucursales.php', { action: 'eliminar', id_sucursal: $(this).data('id') }, function (res) {
                alert(res.message);
                cargarTabla();
            }, 'json');
        }
    });
});