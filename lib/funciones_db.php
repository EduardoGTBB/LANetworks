<?php

declare(strict_types=1);

// >>> ==================================
// >>>       INICIO: LOGIN
// >>> ================================== 
// | Usuarios LAN
// [fn] Obtener usuario para el Login (Validación)
function obtenerUsuarioPorLan(PDO $pdo, string $usuario_lan)
{
    // Aquí agregamos foto_perfil a la consulta
    $sql = "SELECT id_user_admin, admin_nombre, admin_apell_pat, perfil, usuario_lan, password, foto_perfil 
            FROM usuarios_admin 
            WHERE usuario_lan = :usuario AND estatus = 'Y'";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':usuario' => $usuario_lan]);

    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// | Usuarios Cliente
// [fn] Obtener los clientes(Empresa) para login
function obtenerUsuarioEmpresaporCorreo(PDO $pdo, string $correo)
{
    $sql = "SELECT id_usuario, nombre, apellido_pat, Empresa_id, correo, usuario_password, foto_perfil
            FROM usuarios
            WHERE correo = :correo AND activo = 'true'";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':correo' => $correo]);

    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// >>> ==================================
// >>>       FIN: LOGIN
// >>> ================================== 

// -----------------------------------------------------

// >>> ==============================================
// >>>       INICIO: FUNCIONES NUEVA COTIZACION
// >>> ============================================== 
// [fn] Obtener clientes por empresa
function obtenerUsuariosporEmpresa(PDO $pdo, int $empresa_id): array
{
    $sql = "SELECT id_usuario, nombre, apellido_pat, apellido_mat 
            FROM usuarios 
            WHERE Empresa_id = :empresa_id AND activo='true'";


    $stmt = $pdo->prepare($sql);
    $stmt->execute([':empresa_id' => $empresa_id]);
    return $stmt->fetchAll();
}

// [fn] Obtener los clientes
function obtenerClientes(PDO $pdo): array
{
    $sql = "SELECT id_empresa, razon_social 
            FROM empresa 
            WHERE estatus= 'Y' ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    return $stmt->fetchAll();
}

// [fn] Obtener los productos
function obtenerProduct(PDO $pdo): array
{
    $sql = "SELECT p.*, 
            pf.pf_equipo, pf.pf_calibracion as pf_calib, pf.pf_precio_antes_iva as pf_antes_iva,
            pp.pp_equipo, pp.pp_calibracion as pp_calib, pp.pp_precio_antes_iva as pp_antes_iva
            FROM productos p
            LEFT JOIN precios_farmacia pf ON p.id_product = pf.Producto_id
            LEFT JOIN precios_publico pp ON p.id_product = pp.Producto_id";
            // ORDER BY p.id_product DESC
            
    return $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
}

function obtenerProductPorId(PDO $pdo, int $id_product)
{
    // Usamos los nombres reales de las columnas en la BD: precio_equipo y precio_calibracion
    $sql = "SELECT p.*, 
            pf.pf_equipo, pf.pf_calibracion as pf_calib, pf.pf_precio_antes_iva as pf_antes_iva,
            pp.pp_equipo, pp.pp_calibracion as pp_calib, pp.pp_precio_antes_iva as pp_antes_iva
            FROM productos p
            LEFT JOIN precios_farmacia pf ON p.id_product = pf.Producto_id
            LEFT JOIN precios_publico pp ON p.id_product = pp.Producto_id
            WHERE p.id_product = :id";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id_product]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// [fn] Guardar la nueva cotización
function saveCotizacion(PDO $pdo, array $datosCotizacion, array $detalles): string|false
{
    try {
        $pdo->beginTransaction();

        $sqlCotizacion = "INSERT INTO cotizacion (Empresa_id,Sucursal_id, Usuario_admin_id, Usuario_empresa_id , fecha_cot, importe_total, comentarios, precio_iva, porcentaje_iva, tipo_precio, division)
                        VALUES (:empresa_id, :sucursal_id, :id_user_admin,:usuario_id, :fecha_cot, :importe_total, :comentarios, :precio_iva,:pcte_iva , :tprecio, :division)";

        $stmtCot = $pdo->prepare($sqlCotizacion);

        $stmtCot->execute([
            ':empresa_id'    => $datosCotizacion['empresa_id'],
            ':sucursal_id'   => $datosCotizacion['sucursal_id'],
            ':id_user_admin' => $datosCotizacion['id_user_admin'],
            ':usuario_id'    => $datosCotizacion['usuario_id'],
            ':fecha_cot'     => $datosCotizacion['fecha_cot'],
            ':importe_total' => $datosCotizacion['importe_total'],
            ':comentarios'   => $datosCotizacion['comentarios'],
            ':precio_iva'    => $datosCotizacion['precio_iva'],
            ':pcte_iva'       => $datosCotizacion['porcentaje_iva'],
            ':tprecio'       => $datosCotizacion['tipo_precio'],
            ':division'      => $datosCotizacion['division']
        ]);

        // Obtenemos el ID recién generado
        $id_cotizacion = $pdo->lastInsertId();

        $sqlDetalle = "INSERT INTO `detalle_cotizacion` (`Cotizacion_id`, `Product_id`, `cantidad`, `precio_unitario`, `precio_extendido`, `desglosar`, `sucursal_destino_id`)VALUES (:cot_id, :prod_id, :cantidad, :precio_u, :precio_ext, :desglosar, :suc_dest)";

        $stmtDet = $pdo->prepare($sqlDetalle);

        foreach ($detalles as $item) {

            $stmtDet->execute([
                ':cot_id'     => $id_cotizacion,
                ':prod_id'    => $item['producto_id'],
                ':cantidad'   => $item['cantidad'],
                ':precio_u'   => $item['precio_unitario'],
                ':precio_ext' => $item['precio_extendido'],
                ':desglosar'  => $item['desglosar'] ?? 'N', 
                ':suc_dest'   => $item['sucursal_destino_id']
            ]);
        }

        $pdo->commit();
        return $id_cotizacion;
    } catch (Exception $e) {
        $pdo->rollBack();
        // Guardamos el error real en los logs del servidor por seguridad
        error_log("Error al guardar cotización: " . $e->getMessage());
        throw new Exception($e->getMessage());
    }
}
// >>> ==============================================
// >>>       FIN: FUNCIONES NUEVA COTIZACION
// >>> ============================================== 

// -----------------------------------------------------

// >>> ==============================================
// >>>        INICIO: FUNCION COTIZACIONES
// >>> ============================================== 
// |------Ver_cotizaciones_por_Usuario/Cliente------
// [fn] Obtener las cotizaciones por Usuario Logeado
function obtenerCotizaciones(PDO $pdo, int $id_user_admin): array
{
    /* $sql = "SELECT c.id_cotizacion, c.fecha_cot, c.precio_iva 
            AS gran_total, e.razon_social, u.nombre, u.apellido_pat, c.estatus
            FROM cotizacion c
            LEFT JOIN empresa e ON c.Empresa_id = e.id_empresa
            LEFT JOIN usuarios u ON c.Usuario_empresa_id = u.id_usuario
            WHERE c.Usuario_admin_id = :admin_id
            ORDER BY c.id_cotizacion DESC";*/
    $sql = "SELECT c.id_cotizacion, c.fecha_cot, c.precio_iva AS gran_total, 
                   e.razon_social, u.nombre, u.apellido_pat, c.estatus,
                   (SELECT COUNT(*) FROM domicilio_fiscal df WHERE df.Cotizacion_id = c.id_cotizacion) as tiene_dir
            FROM cotizacion c
            LEFT JOIN empresa e ON c.Empresa_id = e.id_empresa
            LEFT JOIN usuarios u ON c.Usuario_empresa_id = u.id_usuario
            WHERE c.Usuario_admin_id = :admin_id
            ORDER BY c.id_cotizacion DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':admin_id' => $id_user_admin]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// [fn] Obtener las cotizaciones por cliente
function obtenerCotizacionesCliente(PDO $pdo, int $id_usuario_cliente): array
{
    /* $sql = "SELECT c.id_cotizacion, c.fecha_cot, c.precio_iva 
            AS gran_total,  e.razon_social, u.nombre, u.apellido_pat, c.estatus
            FROM cotizacion c
            LEFT JOIN empresa e ON c.Empresa_id = e.id_empresa
            LEFT JOIN usuarios u ON c.Usuario_empresa_id = u.id_usuario
            WHERE c.Usuario_empresa_id = :cliente_id
            ORDER BY c.id_cotizacion DESC"; */
    $sql = "SELECT c.id_cotizacion, c.fecha_cot, c.precio_iva AS gran_total, 
                   e.razon_social, u.nombre, u.apellido_pat, c.estatus,
                   (SELECT COUNT(*) FROM domicilio_fiscal df WHERE df.Cotizacion_id = c.id_cotizacion) as tiene_dir
            FROM cotizacion c
            LEFT JOIN empresa e ON c.Empresa_id = e.id_empresa
            LEFT JOIN usuarios u ON c.Usuario_empresa_id = u.id_usuario
            WHERE c.Usuario_empresa_id = :cliente_id
            ORDER BY c.id_cotizacion DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':cliente_id' => $id_usuario_cliente]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// [fn] Borrar cotizacion
function borrarCotizacion(PDO $pdo, int $id_cotizacion): bool
{
    try {
        //$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $pdo->beginTransaction();

        // %Primero borramos la tabla hijo 
        $sqldetalle = "DELETE FROM detalle_cotizacion WHERE Cotizacion_id = :id";
        $stmtDet = $pdo->prepare($sqldetalle);
        $stmtDet->execute([':id' => $id_cotizacion]);

        // %Borramos la tabla padre
        $sqlCotizacion = "DELETE FROM cotizacion WHERE id_cotizacion = :id";
        $stmtCot = $pdo->prepare($sqlCotizacion);
        $stmtCot->execute([':id' => $id_cotizacion]);

        // %Confirmacion cambios
        $pdo->commit();
        return true;
    } catch (Exception $e) {

        $pdo->rollBack();
        throw new Exception("Error al borrar la base de datos: " . $e->getMessage());
    }
}

// [fn] Editar cotizacion
// &Obtenemos la cotizacion especifica ID (Padre)
function editarCotizacionporID(PDO $pdo, int $id_cotizacion)
{
    $sql = "SELECT id_cotizacion, Empresa_id, Sucursal_id, Usuario_admin_id, Usuario_empresa_id, fecha_cot, importe_total, comentarios, precio_iva, porcentaje_iva, tipo_precio, division, estatus,
            (SELECT COUNT(*) FROM domicilio_fiscal df WHERE df.Cotizacion_id = cotizacion.id_cotizacion) as tiene_dir
            FROM cotizacion
            WHERE id_cotizacion = :id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id_cotizacion]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// [fn] Obtener los productos de la cotizacion
// &Obtenemos los detalles de la cotizzacion(hijos)
function obtenerdetallesCotizacionID(PDO $pdo, int $id_cotizacion)
{
    $sql = "SELECT id_detalle_cot, Cotizacion_id, Product_id, cantidad, precio_unitario, precio_extendido, desglosar, sucursal_destino_id
            FROM detalle_cotizacion
            WHERE Cotizacion_id = :id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id_cotizacion]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// [fn] Actualizar la Cotizacion
function updateCotizacion(PDO $pdo, int $id_cotizacion, array $datosCotizacion, array $detalles): bool
{
    try {
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->beginTransaction();

        // 1. Actualizamos el padre (La cotización)
        $sqlCot = "UPDATE cotizacion 
                   SET Empresa_id = :empresa_id, 
                       Sucursal_id = :sucursal_id,
                       Usuario_empresa_id = :usuario_id, 
                       importe_total = :importe_total, 
                       precio_iva = :precio_iva, 
                       division = :division,
                       tipo_precio = :tipo_precio,
                       porcentaje_iva = :porcentaje_iva,
                       estatus = :estatus,
                       comentarios = :comentarios
                   WHERE id_cotizacion = :id_cot";

        $stmtCot = $pdo->prepare($sqlCot);
        $stmtCot->execute([
            ':empresa_id'     => $datosCotizacion['empresa_id'],
            ':sucursal_id'    => $datosCotizacion['sucursal_id'],
            ':usuario_id'     => $datosCotizacion['usuario_id'],
            ':importe_total'  => $datosCotizacion['importe_total'],
            ':precio_iva'     => $datosCotizacion['precio_iva'],
            ':porcentaje_iva' => $datosCotizacion['porcentaje_iva'],
            ':tipo_precio'    => $datosCotizacion['tipo_precio'],
            ':division'       => $datosCotizacion['division'],
            ':estatus'        => $datosCotizacion['estatus'],
            ':comentarios'    => $datosCotizacion['comentarios'],
            ':id_cot'         => $id_cotizacion
        ]);

        // 2. Extraer los IDs actuales de la tabla detalle_cotizacion para NO borrarlos
        $stmtIds = $pdo->prepare("SELECT id_detalle_cot FROM detalle_cotizacion WHERE Cotizacion_id = ? ORDER BY id_detalle_cot ASC");
        $stmtIds->execute([$id_cotizacion]);
        $idsExistentes = $stmtIds->fetchAll(PDO::FETCH_COLUMN);

        // Preparamos las consultas de Actualizar e Insertar
        $stmtUpdateDetalle = $pdo->prepare("UPDATE detalle_cotizacion SET Product_id = :prod_id, cantidad = :cantidad, precio_unitario = :precio_u, precio_extendido = :precio_ext, desglosar = :desglosar, Sucursal_destino_id = :suc_dest WHERE id_detalle_cot = :id_detalle");
        
        $stmtInsertDetalle = $pdo->prepare("INSERT INTO detalle_cotizacion (Cotizacion_id, Product_id, cantidad, precio_unitario, precio_extendido, desglosar, Sucursal_destino_id) VALUES (:cot_id, :prod_id, :cantidad, :precio_u, :precio_ext, :desglosar, :suc_dest)");

        $indice = 0;
        foreach ($detalles as $item) {
            $id_detalle_actual = $idsExistentes[$indice] ?? null;

            if ($id_detalle_actual) {
                // Si existe la fila, ACTUALIZAMOS (Esto conserva los id_dom_cert y el orden original)
                $stmtUpdateDetalle->execute([
                    ':prod_id'    => $item['producto_id'],
                    ':cantidad'   => $item['cantidad'],
                    ':precio_u'   => $item['precio_unitario'],
                    ':precio_ext' => $item['precio_extendido'],
                    ':desglosar'  => $item['desglosar'] ?? 'N', 
                    ':suc_dest'   => $item['sucursal_destino_id'],
                    ':id_detalle' => $id_detalle_actual
                ]);
            } else {
                // Si es un producto que agregaron como "nuevo" en esta edición, lo insertamos
                $stmtInsertDetalle->execute([
                    ':cot_id'     => $id_cotizacion,
                    ':prod_id'    => $item['producto_id'],
                    ':cantidad'   => $item['cantidad'],
                    ':precio_u'   => $item['precio_unitario'],
                    ':precio_ext' => $item['precio_extendido'],
                    ':desglosar'  => $item['desglosar'] ?? 'N', 
                    ':suc_dest'   => $item['sucursal_destino_id']
                ]);
            }
            $indice++;
        }

        // 3. Limpiar los excedentes (Si el usuario eliminó un producto de la lista, lo borramos de la BD)
        while ($indice < count($idsExistentes)) {
            $id_sobrante = $idsExistentes[$indice];
            $pdo->prepare("DELETE FROM detalle_cotizacion WHERE id_detalle_cot = ?")->execute([$id_sobrante]);
            $indice++;
        }

        $pdo->commit();
        return true;
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw new Exception("Error al actualizar: " . $e->getMessage());
    }
}
// |------Fin_Ver_cotizaciones_por_Usuario/Cliente------


// |------Inicio_Ver_todas_las_Cotizaciones_Users_Admin------
// [fn] Obtener All cotizaciones Admin
function obtenerTodasLasCotizaciones(PDO $pdo): array
{
    /* $sql = "SELECT c.id_cotizacion, c.fecha_cot, c.precio_iva AS gran_total, 
                   e.razon_social, 
                   u.nombre, u.apellido_pat, u.apellido_mat,
                   ua.admin_nombre, ua.admin_apell_pat, 
                   c.estatus
            FROM cotizacion c
            LEFT JOIN empresa e ON c.Empresa_id = e.id_empresa
            LEFT JOIN usuarios u ON c.Usuario_empresa_id = u.id_usuario
            LEFT JOIN usuarios_admin ua ON c.Usuario_admin_id = ua.id_user_admin
            ORDER BY c.id_cotizacion DESC"; */
    $sql = "SELECT c.id_cotizacion, c.fecha_cot, c.precio_iva AS gran_total, 
                   e.razon_social, u.nombre, u.apellido_pat, u.apellido_mat,
                   ua.admin_nombre, ua.admin_apell_pat, c.estatus,
                   (SELECT COUNT(*) FROM domicilio_fiscal df WHERE df.Cotizacion_id = c.id_cotizacion) as tiene_dir
            FROM cotizacion c
            LEFT JOIN empresa e ON c.Empresa_id = e.id_empresa
            LEFT JOIN usuarios u ON c.Usuario_empresa_id = u.id_usuario
            LEFT JOIN usuarios_admin ua ON c.Usuario_admin_id = ua.id_user_admin
            ORDER BY c.id_cotizacion DESC";


    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
// |------Fin_Ver_todas_las_Cotizaciones_Users_Admin------

// >>> ==============================================
// >>>       FIN: FUNCIONES COTIZACIONES
// >>> ============================================== 

// -----------------------------------------------------

// >>> ==============================================
// >>>       INICIO: FUNCIONES CLIENTES|EMPRESAS
// >>> ============================================== 

// [fn] Obtener todas las empresas
function obtenerAllempresas(PDO $pdo): array
{
    $sql = "SELECT e.id_empresa, e.nombre_empresa, e.razon_social, e.rfc, e.telefono, e.correo, e.estatus, d.calle_numero ,d.colonia, d.localidad, d.codigo_postal, d.municipio, d.estado, d.pais  
            FROM empresa e
            LEFT JOIN domicilio_empresa d ON e.id_empresa = d.Empresa_id
            ORDER BY e.nombre_empresa ASC";
    $stmt = $pdo->prepare($sql);

    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function insertarEmpresa(PDO $pdo, array $datos): bool
{
    try {
        //° $pdo->beginTransaction();
        $sqlEMP = "INSERT INTO empresa (nombre_empresa, razon_social, rfc, dias_credito, estatus) 
            VALUES (:nombre, :razon, :rfc, :dias, 'Y')";

        $stmtEMP = $pdo->prepare($sqlEMP);
        return $stmtEMP->execute([
            ':nombre'   => $datos['nombre_empresa'],
            ':razon'    => $datos['razon_social'],
            ':rfc'      => $datos['rfc'],
            ':dias' => $datos['dias_credito']
        ]);
        /* $id_empresa = $pdo->lastInsertId(); // Obtenemos el ID generado

        $sqlDOM = "INSERT INTO domicilio_empresa(Empresa_id, calle_numero, colonia, localidad, codigo_postal, municipio, estado, pais)
            VALUES (:emp_id, :calle, :colonia, :localidad, :cp, :municipio, :estado, :pais)";

        $stmtDOM = $pdo->prepare($sqlDOM);
        $stmtDOM->execute([
            ':emp_id'   => $id_empresa,
            ':calle'    => $datos['calle_numero'],
            ':colonia'      => $datos['colonia'],
            ':localidad' => $datos['localidad'],
            ':cp' => $datos['codigo_postal'],
            ':municipio' => $datos['municipio'],
            ':estado' => $datos['estado'],
            ':pais'   => $datos['pais']
        ]);
 */
        /* $pdo->commit();
        return true; */
    } catch (Exception $e) {
        $pdo->rollBack(); // Revertimos si hay error
        throw $e;
    }
}

function actualizarEmpresa(PDO $pdo, array $datos): bool
{
    try {
        //° $pdo->beginTransaction();

        // 1. Actualizar empresa
        $sqlEmp = "UPDATE empresa SET nombre_empresa = :nombre, razon_social = :razon, rfc = :rfc, dias_credito = :dias WHERE id_empresa = :id";
        $stmtEmp = $pdo->prepare($sqlEmp);
        return $stmtEmp->execute([
            ':nombre'   => $datos['nombre_empresa'],
            ':razon'    => $datos['razon_social'],
            ':rfc'      => $datos['rfc'],
            ':dias'     => $datos['dias_credito'],
            ':id'       => $datos['id_empresa']
        ]);

        /* //° 2. Verificar si ya tenía domicilio registrado para actualizarlo o insertarlo
        $stmtCheck = $pdo->prepare("SELECT id_domicilio_empresa FROM domicilio_empresa WHERE Empresa_id = :id");
        $stmtCheck->execute([':id' => $datos['id_empresa']]);

        if ($stmtCheck->rowCount() > 0) {
            $sqlDom = "UPDATE domicilio_empresa SET calle_numero = :calle, colonia = :colonia, localidad = :localidad, codigo_postal = :cp, municipio = :municipio, estado = :estado, pais = :pais WHERE Empresa_id = :id";
        } else {
            $sqlDom = "INSERT INTO domicilio_empresa (calle_numero, colonia, localidad, codigo_postal, municipio, estado, pais, Empresa_id) VALUES (:calle, :colonia, :localidad, :cp, :municipio, :estado, :pais, :id)";
        }

        $stmtDom = $pdo->prepare($sqlDom);
        $stmtDom->execute([
            ':calle'     => $datos['calle_numero'],
            ':colonia'   => $datos['colonia'],
            ':localidad' => $datos['localidad'],
            ':cp'        => $datos['codigo_postal'],
            ':municipio' => $datos['municipio'],
            ':estado'    => $datos['estado'],
            ':pais'      => $datos['pais'],
            ':id'        => $datos['id_empresa']
        ]);

        $pdo->commit();
        return true; */
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function eliminarEmpresa(PDO $pdo, int $id_empresa): string
{
    /* $sql = "DELETE FROM empresa WHERE id_empresa = :id";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([':id' => $id_empresa]); */

    // *Cambios de estatus y mantener oculto
    /*  try {
        $sql = "UPDATE empresa SET estatus = 'N' WHERE id_empresa = :id";
        $stmt = $pdo->prepare($sql);
        
        return $stmt->execute([':id' => $id_empresa]);
        
    } catch (Exception $e) {
        throw new Exception("Error al eliminar cliente: " . $e->getMessage());
    } */

    // 1. Verificamos si la empresa tiene usuarios enlazados
    $sql_check = "SELECT COUNT(id_usuario) FROM usuarios WHERE Empresa_id = :id";
    $stmt_check = $pdo->prepare($sql_check);
    $stmt_check->execute([':id' => $id_empresa]);
    $existe_usuario = $stmt_check->fetchColumn();

    if ($existe_usuario > 0) {
        // 2. Si tiene usuarios, hacemos borrado lógico (estatus 'N')
        $sql = "UPDATE empresa SET estatus = 'N' WHERE id_empresa = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id_empresa]);
        return 'inactivada';
    } else {
        // 3. Si NO tiene usuarios, la borramos permanentemente. 
        $sql = "DELETE FROM empresa WHERE id_empresa = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id_empresa]);
        return 'eliminada';
    }
}

// [fn] Candado evitar empresas suplicadas
function verificarEmpresaExistente(PDO $pdo, string $nombre_empresa, string $razon_social, string $rfc, int $id_empresa = 0): string|false
{
    // Limpiamos y convertimos a mayúsculas para una comparación exacta y sin importar si escribieron en minúsculas
    $nombre_empresa = mb_strtoupper(trim($nombre_empresa), 'UTF-8');
    $razon_social = mb_strtoupper(trim($razon_social), 'UTF-8');
    $rfc = mb_strtoupper(trim($rfc), 'UTF-8');

    // Buscamos coincidencias de Nombre Comercial, Razón Social o RFC
    $sql = "SELECT id_empresa, nombre_empresa, razon_social, rfc 
            FROM empresa 
            WHERE (UPPER(nombre_empresa) = :nombre OR razon_social = :razon OR rfc = :rfc)";

    // Si estamos editando ($id_empresa > 0), excluimos a la propia empresa de la búsqueda
    if ($id_empresa > 0) {
        $sql .= " AND id_empresa != :id";
    }

    $stmt = $pdo->prepare($sql);

    $params = [
        ':nombre' => $nombre_empresa,
        ':razon' => $razon_social,
        ':rfc' => $rfc
    ];

    if ($id_empresa > 0) {
        $params[':id'] = $id_empresa;
    }

    $stmt->execute($params);
    $existe = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existe) {
        // Identificamos exactamente qué campo causó el conflicto
        if (mb_strtoupper($existe['nombre_empresa'], 'UTF-8') === $nombre_empresa) {
            return 'El NOMBRE COMERCIAL ingresado ya se encuentra registrado en otra empresa.';
        }
        if (mb_strtoupper($existe['razon_social'], 'UTF-8') === $razon_social) {
            return 'La RAZÓN SOCIAL ingresada ya se encuentra registrada en otra empresa.';
        }
        if (mb_strtoupper($existe['rfc'], 'UTF-8') === $rfc) {
            return 'El RFC ingresado ya se encuentra registrado en otra empresa.';
        }
    }

    return false; // No hay duplicados
}

// >>> ==============================================
// >>>        FIN: FUNCIONES CLIENTES|EMPRESAS
// >>> ============================================== 

// -----------------------------------------------------

// >>> ==============================================
// >>>        INICIO: FUNCIONES CLIENTES|USUARIOS
// >>> ============================================== 
// [fn] Obtenemos todos los usuarios 
function obtenerAllusers(PDO $pdo): array
{
    $sql = "SELECT u.id_usuario, u.foto_perfil, u.correo, u.nombre, u.apellido_pat, u.apellido_mat, u.Empresa_id, u.activo, e.razon_social
            FROM usuarios u 
            INNER JOIN empresa e ON u.Empresa_id = e.id_empresa
            ORDER BY u.nombre ASC";

    $stmt = $pdo->prepare($sql);

    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function insertarUsuario(PDO $pdo, array $datos): bool
{
    $foto = !empty($datos['foto_perfil']) ? $datos['foto_perfil'] : 'user.png';
    $sql = "INSERT INTO usuarios (foto_perfil, usuario_password, correo, nombre, apellido_pat, apellido_mat, Empresa_id, activo) 
            VALUES (:foto, :u_password, :correo, :u_name, :ape_pat, :ape_mat, :Empresa_id, :activo)";

    $stmt = $pdo->prepare($sql);
    return $stmt->execute([
        ':foto'       => $foto,
        ':u_password' => $datos['usuario_password'],
        ':correo'     => $datos['correo'],
        ':u_name'     => $datos['nombre'],
        ':ape_pat'    => $datos['apellido_pat'],
        ':ape_mat'    => $datos['apellido_mat'],
        ':Empresa_id' => $datos['Empresa_id'],
        ':activo'     => $datos['activo']
    ]);
}

function actualizarUsuario(PDO $pdo, array $datos): bool
{

    $fotoSql = !empty($datos['foto_perfil']) ? ", foto_perfil = :foto" : "";

    if (!empty($datos['usuario_password'])) {
        $sql = "UPDATE usuarios 
                SET usuario_password = :password, correo = :correo, nombre = :nombre, 
                    apellido_pat = :apellido_pat, apellido_mat = :apellido_mat, Empresa_id = :empresa_id, activo = :activo {$fotoSql}
                WHERE id_usuario = :id";
        $stmt = $pdo->prepare($sql);
        $params = [':password' => $datos['usuario_password']];
    } else {
        $sql = "UPDATE usuarios 
                SET correo = :correo, nombre = :nombre, 
                    apellido_pat = :apellido_pat, apellido_mat = :apellido_mat, Empresa_id = :empresa_id, activo = :activo {$fotoSql}
                WHERE id_usuario = :id";
        $stmt = $pdo->prepare($sql);
        $params = [];
    }

    $params = array_merge($params, [
        ':correo'       => $datos['correo'],
        ':nombre'       => $datos['nombre'],
        ':apellido_pat' => $datos['apellido_pat'],
        ':apellido_mat' => $datos['apellido_mat'],
        ':empresa_id'   => $datos['Empresa_id'],
        ':activo'       => $datos['activo'],
        ':id'           => $datos['id_usuario']
    ]);

    if (!empty($datos['foto_perfil'])) {
        $params[':foto'] = $datos['foto_perfil'];
    }

    return $stmt->execute($params);
}

// [fn] Eliminar usuario con candado
function eliminarUsuario(PDO $pdo, int $id_usuario): string
{

    /* $sql = "UPDATE usuarios SET activo = 'false' WHERE id_usuario = :id";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([':id' => $id_usuario]); */
    // Cambiamos el UPDATE por un DELETE FROM definitivo
    /* $sql = "DELETE FROM usuarios WHERE id_usuario = :id";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([':id' => $id_usuario]); */

    // 1. Verificamos si el usuario fue quien solicitó alguna cotización
    $sql_check = "SELECT COUNT(id_cotizacion) FROM cotizacion WHERE Usuario_empresa_id = :id";
    $stmt_check = $pdo->prepare($sql_check);
    $stmt_check->execute([':id' => $id_usuario]);
    $existe = $stmt_check->fetchColumn();

    if ($existe > 0) {
        // 2. Si existe, hacemos borrado lógico (estatus 'false')
        $sql = "UPDATE usuarios SET activo = 'false' WHERE id_usuario = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id_usuario]);
        return 'inactivado';
    } else {
        // 3. Si NO existe, lo borramos permanentemente
        $sql = "DELETE FROM usuarios WHERE id_usuario = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id_usuario]);
        return 'eliminado';
    }
}

// [fn] Candado evitar usuarios clientes/usuarios repetidos
function verificarUsuarioClienteExistente(PDO $pdo, string $correo, int $id_usuario = 0): string|false
{
    $correo = trim($correo);

    // Buscamos si ese correo ya existe en la tabla de clientes
    $sql = "SELECT id_usuario, correo 
            FROM usuarios 
            WHERE correo = :correo";

    // Si estamos editando ($id_usuario > 0), excluimos al propio usuario de la búsqueda
    if ($id_usuario > 0) {
        $sql .= " AND id_usuario != :id";
    }

    $stmt = $pdo->prepare($sql);

    $params = [':correo' => $correo];
    if ($id_usuario > 0) {
        $params[':id'] = $id_usuario;
    }

    $stmt->execute($params);
    $existe = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existe) {
        return 'El Correo Electrónico ingresado ya se encuentra registrado para otro cliente en el sistema. Intenta con otro.';
    }

    return false; // No hay duplicados
}

// <<< ==============================================
// <<<         FIN: FUNCIONES CLIENTES|USUARIOS
// <<< ============================================== 

// -----------------------------------------------------

// >>> ==============================================
// >>>        INICIO: FUNCIONES | SUCURSALES
// >>> ============================================== 
function obtenerAllSucursales(PDO $pdo): array
{
    $sql = "SELECT s.*, e.razon_social FROM sucursales s INNER JOIN empresa e ON s.Empresa_id = e.id_empresa ORDER BY e.razon_social ASC, s.nombre_sucursal ASC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function insertarSucursal(PDO $pdo, array $post, array $usuarios_ids): void
{
    try {
        $pdo->beginTransaction();

        $sql = "INSERT INTO sucursales (Empresa_id, id_sae, nombre_sucursal, calle, num_ext, num_int, entre_calle, y_calle, colonia, cp, poblacion, municipio, estado, estatus) 
                VALUES (:emp_id, :sae, :nom, :calle, :ext, :int, :e_calle, :y_calle, :col, :cp, :pob, :mun, :est, 'Y')";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':emp_id' => $post['Empresa_id'],
            ':sae'    => !empty($post['id_sae']) ? $post['id_sae'] : null,
            ':nom'    => $post['nombre_sucursal'],
            ':calle'  => $post['calle'] ?? null,
            ':ext'    => $post['num_ext'] ?? null,
            ':int'    => $post['num_int'] ?? null,
            ':e_calle' => $post['entre_calle'] ?? null,
            ':y_calle' => $post['y_calle'] ?? null,
            ':col'    => $post['colonia'] ?? null,
            ':cp'     => $post['cp'] ?? null,
            ':pob'    => $post['poblacion'] ?? null,
            ':mun'    => $post['municipio'] ?? null,
            ':est'    => $post['estado'] ?? null,
        ]);

        // Obtenemos el ID de la sucursal recién creada
        $id_sucursal = (int)$pdo->lastInsertId();

        // Guardamos los usuarios relacionados
        actualizarRelacionUsuariosSucursal($pdo, $id_sucursal, $usuarios_ids);

        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function actualizarSucursal(PDO $pdo, array $post, array $usuarios_ids): void
{
    try {
        $pdo->beginTransaction();

        $sql = "UPDATE sucursales SET 
                    Empresa_id = :emp_id, id_sae = :sae, nombre_sucursal = :nom, 
                    calle = :calle, num_ext = :ext, num_int = :int, 
                    entre_calle = :e_calle, y_calle = :y_calle, colonia = :col, 
                    cp = :cp, poblacion = :pob, municipio = :mun, 
                    estado = :est, estatus = :status
                WHERE id_sucursal = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':emp_id' => $post['Empresa_id'],
            ':sae'    => !empty($post['id_sae']) ? $post['id_sae'] : null,
            ':nom'    => $post['nombre_sucursal'],
            ':calle'  => $post['calle'] ?? null,
            ':ext'    => $post['num_ext'] ?? null,
            ':int'    => $post['num_int'] ?? null,
            ':e_calle' => $post['entre_calle'] ?? null,
            ':y_calle' => $post['y_calle'] ?? null,
            ':col'    => $post['colonia'] ?? null,
            ':cp'     => $post['cp'] ?? null,
            ':pob'    => $post['poblacion'] ?? null,
            ':mun'    => $post['municipio'] ?? null,
            ':est'    => $post['estado'] ?? null,
            ':status' => $post['estatus'],
            ':id'     => $post['id_sucursal']
        ]);

        // Sincronizamos los usuarios (Elimina anteriores e inserta nuevos)
        actualizarRelacionUsuariosSucursal($pdo, (int)$post['id_sucursal'], $usuarios_ids);

        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function actualizarRelacionUsuariosSucursal(PDO $pdo, int $id_sucursal, array $usuarios_ids): void
{
    // 1. Borramos todas las relaciones actuales de esta sucursal
    $stmtDel = $pdo->prepare("DELETE FROM usuario_sucursal WHERE Sucursal_id = ?");
    $stmtDel->execute([$id_sucursal]);

    // 2. Si vienen usuarios seleccionados, los insertamos
    if (!empty($usuarios_ids)) {
        $sqlIns = "INSERT INTO usuario_sucursal (Usuario_id, Sucursal_id) VALUES (?, ?)";
        $stmtIns = $pdo->prepare($sqlIns);
        foreach ($usuarios_ids as $id_usuario) {
            if (!empty($id_usuario)) {
                $stmtIns->execute([(int)$id_usuario, $id_sucursal]);
            }
        }
    }
}

function eliminarSucursal(PDO $pdo, int $id_sucursal)
{
    // Borrado físico si no tiene cotizaciones ligadas, sino borrado lógico
    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM cotizacion WHERE Sucursal_id = ?");
    $stmtCheck->execute([$id_sucursal]);
    if ($stmtCheck->fetchColumn() > 0) {
        $pdo->prepare("UPDATE sucursales SET estatus = 'N' WHERE id_sucursal = ?")->execute([$id_sucursal]);
        return 'inactivada';
    } else {
        $pdo->prepare("DELETE FROM sucursales WHERE id_sucursal = ?")->execute([$id_sucursal]);
        return 'eliminada';
    }
}
// <<< ==============================================
// <<<         FIN: FUNCIONES | SUCURSALES
// <<< ============================================== 


// -----------------------------------------------------

// >>> ==============================================
// >>>          INICIO: FUNCIONES ALMACEN|PRODUCTOS
// >>> ============================================== 

function insertarProduct(PDO $pdo, array $datos): void
{
    try {
        $pdo->beginTransaction();

        // 1. Insertar Producto (Removido nombre_product)
        $sql = "INSERT INTO productos (clave_product, descripcion_product, marca_product, tipo_product, estado_product, foto_product, estatus) 
                VALUES (:clave, :desc, :marca, :tipo, :estado, :foto, :estatus)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':clave'   => $datos['clave_product'],
            ':desc'    => $datos['descripcion_product'],
            ':marca'   => $datos['marca_product'],
            ':tipo'    => $datos['tipo_product'],
            ':estado'  => $datos['estado_product'],
            ':foto'    => $datos['foto_product'],
            ':estatus' => $datos['estatus']
        ]);

        $id_product = $pdo->lastInsertId();

        // 2. Insertar Precios Farmacia
        /* $pf_total = $datos['pf_equipo'] + $datos['pf_calib']; */
        $sqlF = "INSERT INTO precios_farmacia (Producto_id, pf_equipo, pf_calibracion) VALUES (?, ?, ?)";
        $pdo->prepare($sqlF)->execute([$id_product, $datos['pf_equipo'], $datos['pf_calib']]);

        // 3. Insertar Precios Público
        /* $pp_total = $datos['pp_equipo'] + $datos['pp_calib']; */
        $sqlP = "INSERT INTO precios_publico (Producto_id, pp_equipo, pp_calibracion) VALUES (?, ?, ?)";
        $pdo->prepare($sqlP)->execute([$id_product, $datos['pp_equipo'], $datos['pp_calib']]);

        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function actualizarProduct(PDO $pdo, array $datos): void
{
    try {
        $pdo->beginTransaction();

        // 1. Actualizar Producto (Removido nombre_product)
        $sql = "UPDATE productos SET 
                clave_product = :clave, 
                descripcion_product = :desc, 
                marca_product = :marca,
                tipo_product = :tipo,
                estado_product = :estado, foto_product = :foto, estatus = :estatus
                WHERE id_product = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':clave'   => $datos['clave_product'],
            ':desc'    => $datos['descripcion_product'],
            ':marca'   => $datos['marca_product'],
            ':tipo'    => $datos['tipo_product'],
            ':estado'  => $datos['estado_product'],
            ':foto'    => $datos['foto_product'],
            ':estatus' => $datos['estatus'],
            ':id'      => $datos['id_product']
        ]);

        // 2. Sincronizar Precios Farmacia
        $pdo->prepare("DELETE FROM precios_farmacia WHERE Producto_id = ?")->execute([$datos['id_product']]);
        $pf_total = $datos['pf_equipo'] + $datos['pf_calib'];
        $sqlF = "INSERT INTO precios_farmacia (Producto_id, pf_equipo, pf_calibracion) VALUES (?, ?, ?)";
        $pdo->prepare($sqlF)->execute([$datos['id_product'], $datos['pf_equipo'], $datos['pf_calib']]);

        // 3. Sincronizar Precios Público
        $pdo->prepare("DELETE FROM precios_publico WHERE Producto_id = ?")->execute([$datos['id_product']]);
        $pp_total = $datos['pp_equipo'] + $datos['pp_calib'];
        $sqlP = "INSERT INTO precios_publico (Producto_id, pp_equipo, pp_calibracion) VALUES (?, ?, ?)";
        $pdo->prepare($sqlP)->execute([$datos['id_product'], $datos['pp_equipo'], $datos['pp_calib']]);

        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function eliminarProduct(PDO $pdo, int $id_product): string
{

    /* $sql = "UPDATE usuarios SET activo = 'false' WHERE id_usuario = :id";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([':id' => $id_usuario]); */
    // Cambiamos el UPDATE por un DELETE FROM definitivo
    /*  $sql = "DELETE FROM productos WHERE id_product = :id";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([':id' => $id_product]); */

    // 1. Verificamos si el producto existe en alguna cotización
    $sql_check = "SELECT COUNT(Product_id) FROM detalle_cotizacion WHERE Product_id = :id";
    $stmt_check = $pdo->prepare($sql_check);
    $stmt_check->execute([':id' => $id_product]);
    $existe = $stmt_check->fetchColumn();

    if ($existe > 0) {
        // 2. Si existe, hacemos borrado lógico (estatus 'N')
        $sql = "UPDATE productos SET estatus = 'N' WHERE id_product = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id_product]);
        return 'inactivado';
    } else {
        // 3. Si NO existe, lo borramos permanentemente
        $sql = "DELETE FROM productos WHERE id_product = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id_product]);
        return 'eliminado';
    }
}

// [fn] Candado productos duplicados
function verificarProductoExistente(PDO $pdo, string $descripcion, string $clave, int $id_product = 0)
{
    $sql = "SELECT clave_product FROM productos WHERE clave_product = :clave AND id_product != :id LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':clave' => $clave,
        ':id'    => $id_product
    ]);
    $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($resultado) {
        return "La CLAVE comercial [" . $clave . "] ya se encuentra registrada en el sistema. Por favor, verifica los datos.";
    }

    return false;
}
// >>> ==============================================
// >>>          FIN: FUNCIONES ALMACEN|PRODUCTOS
// >>> ============================================== 

// -----------------------------------------------------

// >>> ==============================================
// >>>          INICIO: FUNCIONES EMPLEADOS_LAN
// >>> ============================================== 

// [fn] Obtener los usuarios Admin
function obtenerusuarios(PDO $pdo, int $id_user_admin): array
{
    // Traemos el ID, el nombre, correo(Usuario) y su estatus
    $sql = "SELECT id_user_admin, usuario_lan, admin_nombre, admin_apell_pat, perfil, foto_perfil, mp_cotizador, mp_ver_cotiz, mp_ver_clientes, mp_ver_productos, mp_ver_usuarios, estatus
            FROM usuarios_admin
            ORDER BY admin_nombre ASC";

    $stmt = $pdo->prepare($sql);

    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
// [fn] Insertar nuevo usuario Admin
function insertarUsuarioAdmin(PDO $pdo, array $datos): bool
{
    $foto = !empty($datos['foto_perfil']) ? $datos['foto_perfil'] : 'user.png';
    $sql = "INSERT INTO usuarios_admin (usuario_lan, password, admin_nombre, admin_apell_pat, perfil, estatus, foto_perfil, mp_cotizador, mp_ver_cotiz, mp_ver_clientes, mp_ver_productos, mp_ver_usuarios) 
            VALUES (:usr, :pass, :nom, :ape, :perfil, :est , :foto, :p1, :p2, :p3, :p4, :p5)";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([
        ':usr'    => $datos['usuario_lan'],
        ':pass'   => $datos['password'],
        ':nom'    => $datos['admin_nombre'],
        ':ape'    => $datos['admin_apell_pat'],
        ':perfil' => $datos['perfil'],
        ':est'    => $datos['estatus'],
        ':foto'   => $foto,
        ':p1'     => $datos['mp_cotizador'],
        ':p2'     => $datos['mp_ver_cotiz'],
        ':p3'     => $datos['mp_ver_clientes'],
        ':p4'     => $datos['mp_ver_productos'],
        ':p5'     => $datos['mp_ver_usuarios']

    ]);
}

// [fn] Actualizar usuario Admin
function actualizarUsuarioAdmin(PDO $pdo, array $datos): bool
{
    if (!empty($datos['foto_perfil'])) {
        $stmtFoto = $pdo->prepare("SELECT foto_perfil FROM usuarios_admin WHERE id_user_admin = :id");
        $stmtFoto->execute([':id' => $datos['id_user_admin']]);
        $oldUser = $stmtFoto->fetch(PDO::FETCH_ASSOC);

        // Verificamos que tenga foto y que no sea la imagen por defecto ('user.png')
        if ($oldUser && !empty($oldUser['foto_perfil']) && $oldUser['foto_perfil'] !== 'user.png') {
            $ruta_vieja = '../assets/images/avatar/' . $oldUser['foto_perfil'];
            // Si el archivo existe físicamente en el servidor, lo destruimos
            if (file_exists($ruta_vieja)) {
                unlink($ruta_vieja);
            }
        }
    }

    $permisosSql = "mp_cotizador = :p1, mp_ver_cotiz = :p2, mp_ver_clientes = :p3, mp_ver_productos = :p4, mp_ver_usuarios = :p5";
    $fotoSql = !empty($datos['foto_perfil']) ? ", foto_perfil = :foto" : ""; // Solo actualiza si subió foto

    // 3. Armamos la consulta base
    $sql = "UPDATE usuarios_admin 
            SET usuario_lan = :usr, admin_nombre = :nom, admin_apell_pat = :ape, perfil = :perfil, estatus = :est " . $fotoSql . ", " . $permisosSql . " 
            WHERE id_user_admin = :id";

    // Si mandó contraseña, ajustamos el SQL para incluirla
    if (!empty($datos['password'])) {
        $sql = "UPDATE usuarios_admin 
                SET usuario_lan = :usr, password = :pass, admin_nombre = :nom, admin_apell_pat = :ape, perfil = :perfil, estatus = :est " . $fotoSql . ", " . $permisosSql . " 
                WHERE id_user_admin = :id";
    }

    $stmt = $pdo->prepare($sql);

    // 4. Asignamos los parámetros obligatorios
    $params = [
        ':usr'    => $datos['usuario_lan'],
        ':nom'    => $datos['admin_nombre'],
        ':ape'    => $datos['admin_apell_pat'],
        ':perfil' => $datos['perfil'],
        ':est'    => $datos['estatus'],
        ':p1'     => $datos['mp_cotizador'],
        ':p2'     => $datos['mp_ver_cotiz'],
        ':p3'     => $datos['mp_ver_clientes'],
        ':p4'     => $datos['mp_ver_productos'],
        ':p5'     => $datos['mp_ver_usuarios'],
        ':id'     => $datos['id_user_admin']
    ];

    // 5. Asignamos los parámetros opcionales
    if (!empty($datos['password'])) {
        $params[':pass'] = $datos['password'];
    }
    if (!empty($datos['foto_perfil'])) {
        $params[':foto'] = $datos['foto_perfil'];
    }

    return $stmt->execute($params);

    /* $permisosSql = "mp_cotizador = :p1, mp_ver_cotiz = :p2, mp_ver_clientes = :p3, mp_ver_productos = :p4, mp_ver_usuarios = :p5";
    
    if (!empty($datos['password'])) {
        $sql = "UPDATE usuarios_admin 
                SET usuario_lan = :usr, password = :pass, admin_nombre = :nom, admin_apell_pat = :ape, perfil = :perfil, estatus = :est, " . $permisosSql . " 
                WHERE id_user_admin = :id";
        $stmt = $pdo->prepare($sql);
        $params = [':pass' => $datos['password']];
    } else {
        $sql = "UPDATE usuarios_admin 
                SET usuario_lan = :usr, admin_nombre = :nom, admin_apell_pat = :ape, perfil = :perfil, estatus = :est, " . $permisosSql . " 
                WHERE id_user_admin = :id";
        $stmt = $pdo->prepare($sql);
        $params = [];
    }

    $params = array_merge($params, [
        ':usr'    => $datos['usuario_lan'],
        ':nom'    => $datos['admin_nombre'],
        ':ape'    => $datos['admin_apell_pat'],
        ':perfil' => $datos['perfil'],
        ':est'    => $datos['estatus'],
        ':p1'     => $datos['mp_cotizador'],
        ':p2'     => $datos['mp_ver_cotiz'],
        ':p3'     => $datos['mp_ver_clientes'],
        ':p4'     => $datos['mp_ver_productos'],
        ':p5'     => $datos['mp_ver_usuarios'],
        ':id'     => $datos['id_user_admin']
    ]);

    $stmt->execute($params); 
    !return true;*/
}

// [fn] Candado para evitar registros duplicados
function CUsuarioAdminExistente(PDO $pdo, string $usuario_lan, int $id_user_admin = 0): string|false
{
    $usuario_lan = trim($usuario_lan);

    // Buscamos si ese correo/usuario ya existe en la tabla
    $sql = "SELECT id_user_admin, usuario_lan 
            FROM usuarios_admin 
            WHERE usuario_lan = :usr";

    // Si estamos editando ($id_user_admin > 0), excluimos al propio usuario de la búsqueda
    if ($id_user_admin > 0) {
        $sql .= " AND id_user_admin != :id";
    }

    $stmt = $pdo->prepare($sql);

    $params = [':usr' => $usuario_lan];
    if ($id_user_admin > 0) {
        $params[':id'] = $id_user_admin;
    }

    $stmt->execute($params);
    $existe = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existe) {
        return 'El Usuario (email) ingresado ya se encuentra registrado en el sistema. Intenta con otro.';
    }

    return false; // No hay duplicados
}

// >>> ==============================================
// >>>          FIN: FUNCIONES EMPLEADOS_LAN
// >>> ============================================== 

// -----------------------------------------------------

// >>> ==============================================
// >>>           INICIO: FUNCIONES DOMICILIOS
// >>> ============================================== 

// [fn] Domicilio de empresa ligada
function obtenerDomicilioPorCotizacion(PDO $pdo, int $id_cotizacion)
{
    $sql = "SELECT d.* FROM domicilio_empresa d 
            JOIN cotizacion c ON d.Empresa_id = c.Empresa_id 
            WHERE c.id_cotizacion = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id_cotizacion]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// [fn] Sucursales por Usuario
function obtenerSucursalesPorUsuario(PDO $pdo, int $id_usuario): array
{
    $sql = "SELECT s.* FROM sucursales s
            INNER JOIN usuario_sucursal us ON s.id_sucursal = us.Sucursal_id
            WHERE us.Usuario_id = :usuario_id AND s.estatus = 'Y'";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':usuario_id' => $id_usuario]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}


// [fn] Obtener detalles y la dirección de la sucursal asignada
/* function obtenerDetallesParaFinalizarVenta(PDO $pdo, int $id_cot) {
    $sql = "SELECT dc.id_detalle_cot, dc.cantidad, p.clave_product, p.descripcion_product,
                   c.calle_numero_cert as c_calle, c.colonia_cert as c_colonia, c.localidad_cert as c_localidad, c.municipio_cert as c_municipio, c.estado as c_estado, c.cp_cert as c_cp,
                   e.calle_numero_envio as e_calle, e.colonia_envio as e_colonia, e.localidad_envio as e_localidad, e.municipio_envio as e_municipio, e.estado_envio as e_estado, e.cp_envio as e_cp,
                   s.calle as suc_calle_sola, s.num_ext as suc_num_ext, s.colonia as suc_colonia, s.poblacion as suc_localidad, s.municipio as suc_municipio, s.estado as suc_estado, s.cp as suc_cp
            FROM detalle_cotizacion dc
            JOIN productos p ON dc.Product_id = p.id_product
            LEFT JOIN domicilio_cert_calib c ON dc.id_dom_cert = c.id_domicilio_cert
            LEFT JOIN domicilio_envio e ON dc.id_dom_envio = e.id_domicilio_envio
            LEFT JOIN sucursales s ON dc.sucursal_destino_id = s.id_sucursal
            WHERE dc.Cotizacion_id = ?
            ORDER BY dc.id_detalle_cot ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id_cot]);
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($resultados as &$row) {
        $row['suc_calle'] = trim(($row['suc_calle_sola'] ?? '') . ' ' . ($row['suc_num_ext'] ?? ''));
    }
    return $resultados;
} */

function obtenerDetallesParaFinalizarVenta(PDO $pdo, int $id_cotizacion) {
    // ✨ FIX: Agregamos el JOIN con sucursales para traer la dirección destino 
    // y corregimos los nombres reales de las columnas en los JOIN (id_dom_cert)
    $sql = "SELECT dc.id_detalle_cot, dc.cantidad, p.clave_product, p.descripcion_product, dc.sucursal_destino_id,
                   c.calle_numero_cert as c_calle, c.colonia_cert as c_colonia, c.localidad_cert as c_localidad, c.municipio_cert as c_municipio, c.estado as c_estado, c.cp_cert as c_cp,
                   e.calle_numero_envio as e_calle, e.colonia_envio as e_colonia, e.localidad_envio as e_localidad, e.municipio_envio as e_municipio, e.estado_envio as e_estado, e.cp_envio as e_cp,
                   s.nombre_sucursal as suc_nombre, s.calle as suc_calle_sola, s.num_ext as suc_num_ext, s.colonia as suc_colonia, s.poblacion as suc_localidad, s.municipio as suc_municipio, s.estado as suc_estado, s.cp as suc_cp
            FROM detalle_cotizacion dc
            JOIN productos p ON dc.Product_id = p.id_product
            LEFT JOIN domicilio_cert_calib c ON dc.id_dom_cert = c.id_domicilio_cert
            LEFT JOIN domicilio_envio e ON dc.id_dom_envio = e.id_domicilio_envio
            LEFT JOIN sucursales s ON dc.sucursal_destino_id = s.id_sucursal
            WHERE dc.Cotizacion_id = ?
            ORDER BY dc.id_detalle_cot ASC";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id_cotizacion]);
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Concatenamos calle y numero exterior limpiamente
    foreach ($resultados as &$row) {
        $row['suc_calle'] = trim(($row['suc_calle_sola'] ?? '') . ' ' . ($row['suc_num_ext'] ?? ''));
    }
    
    return $resultados;
}

// [fn] Guardar las direccioens ligadas
function formalizarVenta(PDO $pdo, int $id_cot, array $fiscal, array $equipos): bool {
    try {
        $pdo->beginTransaction();

        $pdo->prepare("UPDATE detalle_cotizacion SET id_domicilio_cert = NULL, id_domicilio_envio = NULL WHERE Cotizacion_id = ?")->execute([$id_cot]);
        $pdo->prepare("DELETE FROM domicilio_fiscal WHERE Cotizacion_id = ?")->execute([$id_cot]);
        $pdo->prepare("DELETE FROM domicilio_cert_calib WHERE Cotizacion_id = ?")->execute([$id_cot]);
        $pdo->prepare("DELETE FROM domicilio_envio WHERE Cotizacion_id = ?")->execute([$id_cot]);

        if (!empty($fiscal['calle'])) {
            $pdo->prepare("INSERT INTO domicilio_fiscal (Cotizacion_id, calle_numero_fiscal, colonia_fiscal, localidad_fiscal, cp_fiscal, municipio_fiscal, estado_fiscal) VALUES (?, ?, ?, ?, ?, ?, ?)")
                ->execute([$id_cot, $fiscal['calle'], $fiscal['colonia'], $fiscal['localidad'], $fiscal['cp'], $fiscal['municipio'], $fiscal['estado']]);
        }

        $stmtCert = $pdo->prepare("INSERT INTO domicilio_cert_calib (Cotizacion_id, calle_numero_cert, colonia_cert, localidad_cert, cp_cert, municipio_cert, estado) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmtEnvio = $pdo->prepare("INSERT INTO domicilio_envio (Cotizacion_id, calle_numero_envio, colonia_envio, localidad_envio, cp_envio, municipio_envio, estado_envio) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmtUpdateDetalle = $pdo->prepare("UPDATE detalle_cotizacion SET id_domicilio_cert = ?, id_domicilio_envio = ? WHERE id_detalle_cot = ?");

        // Obtenemos los IDs exactos directo de la base de datos
        $stmtIds = $pdo->prepare("SELECT id_detalle_cot FROM detalle_cotizacion WHERE Cotizacion_id = ? ORDER BY id_detalle_cot ASC");
        $stmtIds->execute([$id_cot]);
        $idsRealesDB = $stmtIds->fetchAll(PDO::FETCH_COLUMN);

        $indice = 0;
        foreach ($equipos as $dirs) {
            $id_real = $idsRealesDB[$indice] ?? null;
            if (!$id_real) break;

            $stmtCert->execute([$id_cot, $dirs['cert']['calle'] ?? '', $dirs['cert']['colonia'] ?? '', $dirs['cert']['localidad'] ?? '', $dirs['cert']['cp'] ?? '', $dirs['cert']['municipio'] ?? '', $dirs['cert']['estado'] ?? '']);
            $id_cert = (int)$pdo->lastInsertId();

            $stmtEnvio->execute([$id_cot, $dirs['envio']['calle'] ?? '', $dirs['envio']['colonia'] ?? '', $dirs['envio']['localidad'] ?? '', $dirs['envio']['cp'] ?? '', $dirs['envio']['municipio'] ?? '', $dirs['envio']['estado'] ?? '']);
            $id_envio = (int)$pdo->lastInsertId();

            $stmtUpdateDetalle->execute([$id_cert, $id_envio, (int)$id_real]);
            $indice++;
        }

        $pdo->commit();
        return true;
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

// [fn] Guardar Fiscal y Array de Equipos estructurado desde JSON
function formalizarVentaEquipos(PDO $pdo, int $id_cot, array $fiscal, array $equipos): bool {
    try {
        $pdo->beginTransaction();

        // 1. Limpieza usando los nombres correctos
        $pdo->prepare("UPDATE detalle_cotizacion SET id_dom_cert = NULL, id_dom_envio = NULL WHERE Cotizacion_id = ?")->execute([$id_cot]);
        $pdo->prepare("DELETE FROM domicilio_fiscal WHERE Cotizacion_id = ?")->execute([$id_cot]);
        $pdo->prepare("DELETE FROM domicilio_cert_calib WHERE Cotizacion_id = ?")->execute([$id_cot]);
        $pdo->prepare("DELETE FROM domicilio_envio WHERE Cotizacion_id = ?")->execute([$id_cot]);

        // 2. Guardar Fiscal
        if (!empty($fiscal['calle'])) {
            $pdo->prepare("INSERT INTO domicilio_fiscal (Cotizacion_id, calle_numero_fiscal, colonia_fiscal, localidad_fiscal, cp_fiscal, municipio_fiscal, estado_fiscal) VALUES (?, ?, ?, ?, ?, ?, ?)")
                ->execute([$id_cot, $fiscal['calle'], $fiscal['colonia']??'', $fiscal['localidad']??'', $fiscal['cp']??'', $fiscal['municipio']??'', $fiscal['estado']??'']);
        }

        $stmtCert = $pdo->prepare("INSERT INTO domicilio_cert_calib (Cotizacion_id, calle_numero_cert, colonia_cert, localidad_cert, cp_cert, municipio_cert, estado) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmtEnvio = $pdo->prepare("INSERT INTO domicilio_envio (Cotizacion_id, calle_numero_envio, colonia_envio, localidad_envio, cp_envio, municipio_envio, estado_envio) VALUES (?, ?, ?, ?, ?, ?, ?)");
        
        // ✨ AQUÍ ESTABA EL ERROR: Los nombres correctos son id_dom_cert e id_dom_envio
        $stmtUpdateDetalle = $pdo->prepare("UPDATE detalle_cotizacion SET id_dom_cert = ?, id_dom_envio = ? WHERE id_detalle_cot = ?");

        foreach ($equipos as $eq) {
            $id_detalle = (int)$eq['id_detalle'];
            if ($id_detalle === 0) continue;

            $cert = $eq['cert'] ?? [];
            $stmtCert->execute([$id_cot, $cert['calle']??'', $cert['colonia']??'', $cert['localidad']??'', $cert['cp']??'', $cert['municipio']??'', $cert['estado']??'']);
            $id_cert = (int)$pdo->lastInsertId();

            $envio = $eq['envio'] ?? [];
            $stmtEnvio->execute([$id_cot, $envio['calle']??'', $envio['colonia']??'', $envio['localidad']??'', $envio['cp']??'', $envio['municipio']??'', $envio['estado']??'']);
            $id_envio = (int)$pdo->lastInsertId();

            $stmtUpdateDetalle->execute([$id_cert, $id_envio, $id_detalle]);
        }

        $pdo->commit();
        return true;
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

// [fn] Obtener la dirección fiscal de la cotización
function obtenerDireccionesCotizacion(PDO $pdo, int $id_cot) {
    $stmt = $pdo->prepare("SELECT * FROM domicilio_fiscal WHERE Cotizacion_id = ?");
    $stmt->execute([$id_cot]);
    return ['fiscal' => $stmt->fetch(PDO::FETCH_ASSOC)];
}

// [fn] Obtener la dirección de la sucursal global (Para Sucursal Única)
function obtenerSucursalGlobalPorCotizacion(PDO $pdo, int $id_cotizacion) {
    $sql = "SELECT s.nombre_sucursal as suc_nombre, s.calle as suc_calle_sola, s.num_ext as suc_num_ext, s.colonia as suc_colonia, s.poblacion as suc_localidad, s.municipio as suc_municipio, s.estado as suc_estado, s.cp as suc_cp
            FROM cotizacion c
            JOIN sucursales s ON c.Sucursal_id = s.id_sucursal
            WHERE c.id_cotizacion = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id_cotizacion]);
    $res = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($res) {
        // Concatenamos limpiamente la calle y el número
        $res['suc_calle'] = trim(($res['suc_calle_sola'] ?? '') . ' ' . ($res['suc_num_ext'] ?? ''));
    }
    return $res ?: null;
}

// >>> ==============================================
// >>>           FIN: FUNCIONES DOMICILIOS
// >>> ============================================== 


// >>> ==============================================
// >>>           INICIO: FUNCIONES INICIO
// >>> ============================================== 

// [fn] Estadisticas de inicio
function obtenerEstadisticasDashboard(PDO $pdo, int $id_cliente, int $id_admin, string $perfil)
{
    $where = "1=1";
    $params = [];

    // Filtro por roles
    if ($id_cliente > 0) {
        // Es un cliente del portal
        $where = "Usuario_empresa_id = :id_cliente";
        $params[':id_cliente'] = $id_cliente;
    } elseif ($perfil !== 'admin' && $id_admin > 0) {
        // Es un operativo (LAN)
        $where = "Usuario_admin_id = :id_admin";
        $params[':id_admin'] = $id_admin;
    }
    // Si es admin, $where se queda como "1=1" y trae todo

    $sql = "SELECT 
                COUNT(id_cotizacion) as total_cotizaciones,
                COALESCE(SUM(CASE WHEN estatus IN ('Guardado', 'Por aprobar') THEN 1 ELSE 0 END), 0) as pendientes,
                COALESCE(SUM(CASE WHEN estatus LIKE 'Autorizada%' THEN 1 ELSE 0 END), 0) as ganadas,
                COALESCE(SUM(CASE WHEN estatus = 'No autorizada' THEN 1 ELSE 0 END), 0) as perdidas,
                
                COALESCE(SUM(CASE WHEN estatus LIKE 'Autorizada%' THEN precio_iva ELSE 0 END), 0) as monto_total,
                COALESCE(SUM(CASE WHEN estatus IN ('Guardado', 'Por aprobar') THEN precio_iva ELSE 0 END), 0) as monto_pendientes,
                COALESCE(SUM(CASE WHEN estatus = 'No autorizada' THEN precio_iva ELSE 0 END), 0) as monto_perdidas,
                COALESCE(SUM(precio_iva), 0) as monto_total_general,
                
                /* Estadísticas del mes */
                COALESCE(SUM(CASE WHEN MONTH(fecha_cot) = MONTH(CURRENT_DATE()) AND YEAR(fecha_cot) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END), 0) as cots_mes_actual,
                COALESCE(SUM(CASE WHEN MONTH(fecha_cot) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(fecha_cot) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH) THEN 1 ELSE 0 END), 0) as cots_mes_pasado,
                COALESCE(SUM(CASE WHEN estatus LIKE 'Autorizada%' AND MONTH(fecha_cot) = MONTH(CURRENT_DATE()) AND YEAR(fecha_cot) = YEAR(CURRENT_DATE()) THEN precio_iva ELSE 0 END), 0) as monto_mes_actual
            FROM cotizacion 
            WHERE $where";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function obtenerGraficaCotizaciones(PDO $pdo, int $id_cliente, int $id_admin, string $perfil)
{
    $where = "1=1";
    $params = [];

    if ($id_cliente > 0) {
        $where = "Usuario_empresa_id = :id_cliente";
        $params[':id_cliente'] = $id_cliente;
    } elseif ($perfil !== 'admin' && $id_admin > 0) {
        $where = "Usuario_admin_id = :id_admin";
        $params[':id_admin'] = $id_admin;
    }

    // Agrupamos el importe (precio_iva) por mes usando MySQL
    /* $sql = "SELECT DATE_FORMAT(fecha_cot, '%b %Y') as mes_texto, 
                   DATE_FORMAT(fecha_cot, '%Y-%m') as mes, 
                   SUM(precio_iva) as total
            FROM cotizacion
            WHERE $where AND fecha_cot >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
            GROUP BY mes, mes_texto
            ORDER BY mes ASC"; */


    /* $sql = "SELECT CONCAT('Semana ', WEEK(fecha_cot, 1)) as mes_texto, 
                   YEARWEEK(fecha_cot, 1) as semana, 
                   SUM(precio_iva) as total
            FROM cotizacion
            WHERE $where AND fecha_cot >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 WEEK)
            GROUP BY semana, mes_texto
            ORDER BY semana ASC"; */

    $sql = "SELECT CONCAT(
                    CASE MONTH(fecha_cot)
                        WHEN 1 THEN 'Ene' WHEN 2 THEN 'Feb' WHEN 3 THEN 'Mar'
                        WHEN 4 THEN 'Abr' WHEN 5 THEN 'May' WHEN 6 THEN 'Jun'
                        WHEN 7 THEN 'Jul' WHEN 8 THEN 'Ago' WHEN 9 THEN 'Sep'
                        WHEN 10 THEN 'Oct' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dic'
                    END, ' ', YEAR(fecha_cot)
                   ) as mes_texto, 
                   DATE_FORMAT(fecha_cot, '%Y-%m') as mes, 
                   SUM(precio_iva) as total
            FROM cotizacion
            WHERE $where AND fecha_cot >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
            GROUP BY mes, mes_texto
            ORDER BY mes ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function obtenerCotizacionesRecientes(PDO $pdo, int $id_cliente, int $id_admin, string $perfil)
{
    $where = "1=1";
    $params = [];

    if ($id_cliente > 0) {
        $where = "c.Usuario_empresa_id = :id_cliente";
        $params[':id_cliente'] = $id_cliente;
    } elseif ($perfil !== 'admin' && $id_admin > 0) {
        $where = "c.Usuario_admin_id = :id_admin";
        $params[':id_admin'] = $id_admin;
    }

    $sql = "SELECT c.id_cotizacion, c.fecha_cot, c.precio_iva, c.estatus, e.razon_social 
            FROM cotizacion c
            LEFT JOIN empresa e ON c.Empresa_id = e.id_empresa
            WHERE $where
            ORDER BY c.id_cotizacion DESC 
            LIMIT 3";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// >>> ==============================================
// >>>           FIN: FUNCIONES INICIO
// >>> ============================================== 
