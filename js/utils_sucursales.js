/**
 * utils_sucursales.js
 * Función centralizada para consumir y renderizar las sucursales del backend.
*/
function cargarSelectSucursales(usuarioId, idSelectPrincipal, claseSelectFila, preseleccionPrincipal = null) {
    let $selectSuc = $(idSelectPrincipal);
    
    // Blindaje anti-crasheos para Select2
    if ($selectSuc.length && $selectSuc.hasClass('select2-hidden-accessible')) {
        $selectSuc.select2('destroy');
    }

    $selectSuc.html('<option value="">Cargando...</option>');
    
    if (!usuarioId) {
        $selectSuc.html('<option value="">Selecciona un solicitante...</option>');
        return;
    }

    $.ajax({
        url: 'api/api_cotizador.php?action=get_sucursales_usuario&usuario_id=' + usuarioId,
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            $selectSuc.empty();
            let opcionesFila = '<option value="">Selecciona destino...</option>';

            if (data.length === 0) {
                $selectSuc.append('<option value="" disabled>Sin sucursales asignadas</option>');
                opcionesFila = '<option value="" disabled>Sin sucursales</option>';
            } else {
                $selectSuc.append('<option value="">Selecciona la sucursal...</option>');
                
                data.forEach(suc => {
                    // let textEstado = suc.estado ? ` (${suc.estado})` : '';
                    
                    let nombreVisual = suc.nombre_listo_para_mostrar || suc.nombre_sucursal || '';
                    if (nombreVisual.trim() === '' && suc.id_sae == 1) {
                        nombreVisual = 'SUCURSAL MATRIZ (Sin Sucursal)';
                    } else if (nombreVisual.trim() === '') {
                        nombreVisual = `SUCURSAL SAE: ${suc.id_sae}`;
                    }
                    
                    let nombreFinal = `${nombreVisual}`;

                    $selectSuc.append(`<option value="${suc.id_sucursal}">${nombreFinal}</option>`);
                    opcionesFila += `<option value="${suc.id_sucursal}">${nombreFinal}</option>`;
                });

                if (preseleccionPrincipal) {
                    $selectSuc.val(preseleccionPrincipal);
                } else if (data.length === 1) {
                    $selectSuc.val(data[0].id_sucursal);
                }
            }

            // 1. SINCRONIZAMOS VARIABLES GLOBALES (Para las filas nuevas que se agreguen)
            window.windowSucursalesOpciones = opcionesFila;
            window.windowSucursalesOpcionesEdit = opcionesFila; 

            // Reactivar Select2 respetando modales
            let $modal = $selectSuc.closest('.modal');
            if ($modal.length) {
                $selectSuc.select2({ dropdownParent: $modal });
            } else if ($.fn.select2) {
                $selectSuc.select2({ width: '100%' });
            }
            
            $selectSuc.trigger('change.select2');

            // 2. ACTUALIZAR DOM DE FORMA FORZADA (Para las filas que ya se pintaron)
            if (claseSelectFila) {
                $(claseSelectFila).each(function() {
                    let $filaSelect = $(this);
                    let valToSelect = $filaSelect.attr('data-selected-suc') || $filaSelect.val();
                    
                    // Destruimos la instancia previa de Select2 si existe para evitar duplicados en memoria
                    if ($filaSelect.hasClass('select2-hidden-accessible')) {
                        $filaSelect.select2('destroy');
                    }

                    $filaSelect.html(opcionesFila); // Inyectamos las opciones
                    
                    if (valToSelect && valToSelect !== 'null' && valToSelect !== '0') {
                        $filaSelect.val(valToSelect); // Seleccionamos la que le toca
                    }

                    // ✨ LA MAGIA: Inicializamos Select2 para incrustar el buscador en la fila
                    if ($.fn.select2) {
                        let configSelect2 = {
                            theme: 'bootstrap-5', // ✨ ESTO LE DARÁ EL DISEÑO AMPLIO Y ELEGANTE
                            width: '100%',
                            placeholder: "Selecciona destino..."
                        };
                        
                        // Si la fila está dentro de un modal (Edición), anclamos el dropdown al modal
                        let $modal = $filaSelect.closest('.modal');
                        if ($modal.length) {
                            configSelect2.dropdownParent = $modal;
                        }
                        
                        $filaSelect.select2(configSelect2);
                    }
                });
            }
        },
        error: function() {
            $selectSuc.html('<option value="" disabled>Error al cargar sucursales</option>');
        }
    });
}