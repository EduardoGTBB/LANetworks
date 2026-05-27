$(document).ready(function() {
    
    // Función para cargar la tabla de empresas
    function cargarTabla() {
        $.ajax({
            url: 'api/api_ver_clientes.php?action=leer',
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                let tbody = $('#table_clientes');
                
                // Destruir DataTable si ya existe para redibujarlo
                if ($.fn.DataTable.isDataTable('#proposalList')) {
                    $('#proposalList').DataTable().destroy();
                }
                
                tbody.empty();

                if (data.length === 0) {
                    tbody.append('<tr><td colspan="7" class="text-center text-muted py-4">No hay empresas registradas.</td></tr>');
                } else {
                    data.forEach(function(emp) {
                        let badge = emp.estatus === 'Y' 
                            ? '<span class="badge bg-soft-success text-success">Activa</span>' 
                            : '<span class="badge bg-soft-danger text-danger">Inactiva</span>';
                        
                        tbody.append(`
                            <tr>
                                <td><span class="fw-bold text-dark">${emp.nombre_empresa}</span></td>
                                <td>${emp.razon_social}</td>
                                <td>${emp.rfc}</td>
                                <td><span class="badge bg-soft-info text-info">${emp.dias_credito} días</span></td>
                                <td>${badge}</td>
                                <td class="text-center">
                                    <div class="hstack gap-2 justify-content-center">
                                        <a href="#" class="avatar-text avatar-md btn-editar" data-id="${emp.id_empresa}"><i class="feather-edit"></i></a>
                                        <a href="#" class="avatar-text avatar-md btn-eliminar" data-id="${emp.id_empresa}"><i class="feather-trash-2 text-danger"></i></a>
                                    </div>
                                </td>
                            </tr>
                        `);
                    });
                }

                // Inicializar DataTables con diseño limpio
                $('#proposalList').DataTable({
                    language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' },
                    lengthChange: false,
                    searching: false,
                    dom: "<'table-responsive'tr><'row align-items-center p-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-end'p>>",
                    drawCallback: function () {
                        $('.dataTables_paginate > .pagination').addClass('pagination-sm mb-0');
                    }
                });
            },
            error: function() {
                console.error("Error al cargar los datos de las empresas.");
            }
        });
    }

    // Cargar la tabla al iniciar
    cargarTabla();

    // ==========================================
    // EVENTOS DE BOTONES
    // ==========================================

    // Botón "Nueva Empresa"
    $('#btnNuevoCliente').click(function(e) {
        e.preventDefault();
        $('#formEmpresa')[0].reset();
        $('#empresa_action').val('crear');
        $('#id_empresa').val('');
        $('#bloque_estatus').hide(); 
        $('#modalEmpresaLabel').text('Nueva Empresa');
        $('#modalEmpresa').modal('show');
    });

    // Botón "Editar" (Delegado)
    $(document).on('click', '.btn-editar', function(e) {
        e.preventDefault();
        let id = $(this).data('id');
        
        $.ajax({
            url: 'api/api_ver_clientes.php?action=leer_uno&id=' + id,
            method: 'GET',
            dataType: 'json',
            success: function(res) {
                if (res.status === 'success') {
                    let emp = res.data;
                    $('#empresa_action').val('editar');
                    $('#id_empresa').val(emp.id_empresa);
                    $('#modalEmpresaLabel').text('Editar Empresa');
                    
                    // Llenar datos simplificados
                    $('#nombre_empresa').val(emp.nombre_empresa);
                    $('#razon_social').val(emp.razon_social);
                    $('#rfc').val(emp.rfc);
                    $('#dias_credito').val(emp.dias_credito);
                    
                    // Mostrar control de estatus
                    $('#bloque_estatus').show();
                    $('#estatus').prop('checked', emp.estatus === 'Y');

                    $('#modalEmpresa').modal('show');
                } else {
                    alert(res.message);
                }
            }
        });
    });

    // ==========================================
    // ENVIAR FORMULARIO (CREAR/EDITAR)
    // ==========================================
    $('#formEmpresa').on('submit', function(e) {
        e.preventDefault();
        
        let btn = $(this).find('button[type="submit"]');
        let originalText = btn.text();
        btn.prop('disabled', true).text('Guardando...');

        $.ajax({
            url: 'api/api_ver_clientes.php',
            type: 'POST',
            data: $(this).serialize(),
            dataType: 'json',
            success: function(res) {
                if (res.status === 'success') {
                    $('#modalEmpresa').modal('hide');
                    alert(res.message);
                    cargarTabla(); 
                } else {
                    alert("Error: " + res.message);
                }
                btn.prop('disabled', false).text(originalText);
            },
            error: function() {
                alert("Ocurrió un error en la conexión.");
                btn.prop('disabled', false).text(originalText);
            }
        });
    });

    // ==========================================
    // ELIMINAR EMPRESA
    // ==========================================
    $(document).on('click', '.btn-eliminar', function(e) {
        e.preventDefault();
        let id = $(this).data('id');
        
        if (confirm('¿Estás seguro de que deseas eliminar o inactivar esta empresa?')) {
            $.ajax({
                url: 'api/api_ver_clientes.php',
                type: 'POST',
                data: { action: 'eliminar', id_empresa: id },
                dataType: 'json',
                success: function(res) {
                    if (res.status === 'success') {
                        alert(res.message);
                        cargarTabla();
                    } else {
                        alert("Error: " + res.message);
                    }
                }
            });
        }
    });
});

