<?php

declare(strict_types=1);

/*   
& ======================================================
&        INICIO: DATOS LOGIN
& ======================================================- 
& */
// |Obtener usuario para el Login (Validación)
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
/*  
& ======================================================
&        FIN: DATOS LOGIN 
& ======================================================- 
& */

// -----------------------------------------------------

/*   
& ======================================================
&        INICIO: FUNCIONES NUEVA COTIZACION
& ====================================================== 
& */

// |Obtener clientes por empresa
function obtenerUsuariosporEmpresa(PDO $pdo, int $empresa_id): array
{
    $sql = "SELECT id_usuario, nombre, apellido_pat, apellido_mat 
            FROM usuarios 
            WHERE Empresa_id = :empresa_id AND activo='true'";


    $stmt = $pdo->prepare($sql);
    $stmt->execute([':empresa_id' => $empresa_id]);
    return $stmt->fetchAll();
}

// |Obtener los clientes
function obtenerClientes(PDO $pdo): array
{
    $sql = "SELECT id_empresa, razon_social 
            FROM empresa 
            WHERE estatus= 'Y' ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    return $stmt->fetchAll();
}

// |Obtener los productos
function obtenerProduct(PDO $pdo): array
{
    $sql = "SELECT id_product,descripcion_product, clave_product, precio_farmacia, precio_publico, foto_product, estatus 
            FROM productos
            ORDER BY descripcion_product ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    return $stmt->fetchAll();
}

// |Guardar la nueva cotización
function saveCotizacion(PDO $pdo, array $datosCotizacion, array $detalles): string|false
{
    try {
        $pdo->beginTransaction();

        $sqlCotizacion = "INSERT INTO cotizacion (Empresa_id, Usuario_admin_id, Usuario_empresa_id , fecha_cot, importe_total, comentarios, precio_iva, porcentaje_iva, tipo_precio, division)VALUES (:empresa_id,:id_user_admin,:usuario_id, :fecha_cot, :importe_total, :comentarios, :precio_iva,:pcte_iva , :tprecio, :division)";

        $stmtCot = $pdo->prepare($sqlCotizacion);

        $stmtCot->execute([
            ':empresa_id'    => $datosCotizacion['empresa_id'],
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

        $sqlDetalle = "INSERT INTO `detalle_cotizacion` (`Cotizacion_id`, `Product_id`, `cantidad`, `precio_unitario`, `precio_extendido`)VALUES (:cot_id, :prod_id, :cantidad, :precio_u, :precio_ext)";

        $stmtDet = $pdo->prepare($sqlDetalle);

        foreach ($detalles as $item) {

            $stmtDet->execute([
                ':cot_id'     => $id_cotizacion,
                ':prod_id'    => $item['producto_id'],
                ':cantidad'   => $item['cantidad'],
                ':precio_u'   => $item['precio_unitario'],
                ':precio_ext' => $item['precio_extendido']
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

/*  
& ======================================================
&        FIN: FUNCIONES NUEVA COTIZACION
& ======================================================
& */

// -----------------------------------------------------

/*   
& ======================================================
&        INICIO: FUNCION COTIZACIONES
& ====================================================== 
& */
// ------%Ver_cotizaciones_por_Usuario/Cliente------
// |Obtener las cotizaciones por Usuario Logeado
function obtenerCotizaciones(PDO $pdo, int $id_user_admin): array
{
    $sql = "SELECT c.id_cotizacion, c.fecha_cot, c.precio_iva 
            AS gran_total, e.razon_social, u.nombre, u.apellido_pat, c.estatus
            FROM cotizacion c
            LEFT JOIN empresa e ON c.Empresa_id = e.id_empresa
            LEFT JOIN usuarios u ON c.Usuario_empresa_id = u.id_usuario
            WHERE c.Usuario_admin_id = :admin_id
            ORDER BY c.id_cotizacion DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':admin_id' => $id_user_admin]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// |Obtener las cotizaciones por cliente
function obtenerCotizacionesCliente(PDO $pdo, int $id_usuario_cliente): array
{
    $sql = "SELECT c.id_cotizacion, c.fecha_cot, c.precio_iva 
            AS gran_total,  e.razon_social, u.nombre, u.apellido_pat, c.estatus
            FROM cotizacion c
            LEFT JOIN empresa e ON c.Empresa_id = e.id_empresa
            LEFT JOIN usuarios u ON c.Usuario_empresa_id = u.id_usuario
            WHERE c.Usuario_empresa_id = :cliente_id
            ORDER BY c.id_cotizacion DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':cliente_id' => $id_usuario_cliente]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// |Borrar cotizacion
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

// |Editar cotizacion
// &Obtenemos la cotizacion especifica ID (Padre)
function editarCotizacionporID(PDO $pdo, int $id_cotizacion)
{
    $sql = "SELECT id_cotizacion, Empresa_id, Usuario_admin_id, Usuario_empresa_id, fecha_cot, importe_total, comentarios, precio_iva, porcentaje_iva, tipo_precio, division, estatus 
            FROM cotizacion
            WHERE id_cotizacion = :id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id_cotizacion]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// |Obtener los productos de la cotizacion
// &Obtenemos los detalles de la cotizzacion(hijos)
function obtenerdetallesCotizacionID(PDO $pdo, int $id_cotizacion)
{
    $sql = "SELECT id_detalle_cot, Cotizacion_id, Product_id, cantidad, precio_unitario, precio_extendido 
            FROM detalle_cotizacion
            WHERE Cotizacion_id = :id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id_cotizacion]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// |Actualizar la Cotizacion
function updateCotizacion(PDO $pdo, int $id_cotizacion, array $datosCotizacion, array $detalles): bool
{
    try {
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->beginTransaction();

        // 1. Actualizamos el padre
        $sqlCot = "UPDATE cotizacion 
                   SET Empresa_id = :empresa_id, 
                       Usuario_empresa_id = :usuario_id, 
                       importe_total = :importe_total, 
                       precio_iva = :precio_iva, 
                       division = :division,
                       tipo_precio = :tipo_precio,
                       porcentaje_iva = :porcentaje_iva,
                       estatus = :estatus
                   WHERE id_cotizacion = :id_cot";

        $stmtCot = $pdo->prepare($sqlCot);
        $stmtCot->execute([
            ':empresa_id'     => $datosCotizacion['empresa_id'],
            ':usuario_id'     => $datosCotizacion['usuario_id'],
            ':importe_total'  => $datosCotizacion['importe_total'],
            ':precio_iva'     => $datosCotizacion['precio_iva'],
            ':porcentaje_iva' => $datosCotizacion['porcentaje_iva'],
            ':tipo_precio'    => $datosCotizacion['tipo_precio'],
            ':division'       => $datosCotizacion['division'],
            ':estatus'        => $datosCotizacion['estatus'],
            ':id_cot'         => $id_cotizacion
        ]);

        // 2. Borramos los hijos viejos (Limpieza)
        $sqlDel = "DELETE FROM detalle_cotizacion WHERE Cotizacion_id = :id_cot";
        $stmtDel = $pdo->prepare($sqlDel);
        $stmtDel->execute([':id_cot' => $id_cotizacion]);

        // 3. Insertamos los hijos nuevos o modificados
        $sqlDet = "INSERT INTO detalle_cotizacion (Cotizacion_id, Product_id, cantidad, precio_unitario, precio_extendido) 
                    VALUES (:cot_id, :prod_id, :cantidad, :precio_u, :precio_ext)";
        $stmtDet = $pdo->prepare($sqlDet);

        foreach ($detalles as $item) {
            $stmtDet->execute([
                ':cot_id'     => $id_cotizacion,
                ':prod_id'    => $item['producto_id'],
                ':cantidad'   => $item['cantidad'],
                ':precio_u'   => $item['precio_unitario'],
                ':precio_ext' => $item['precio_extendido']
            ]);
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
// ------%Fin_Ver_cotizaciones_por_Usuario/Cliente------


// ------%Inicio_Ver_todas_las_Cotizaciones_Users_Admin------
function obtenerTodasLasCotizaciones(PDO $pdo): array
{
    $sql = "SELECT c.id_cotizacion, c.fecha_cot, c.precio_iva AS gran_total, 
                   e.razon_social, 
                   u.nombre, u.apellido_pat, u.apellido_mat, /* <-- AGREGADO AQUI */
                   ua.admin_nombre, ua.admin_apell_pat, 
                   c.estatus
            FROM cotizacion c
            LEFT JOIN empresa e ON c.Empresa_id = e.id_empresa
            LEFT JOIN usuarios u ON c.Usuario_empresa_id = u.id_usuario
            LEFT JOIN usuarios_admin ua ON c.Usuario_admin_id = ua.id_user_admin
            ORDER BY c.id_cotizacion DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
// ------%Fin_Ver_todas_las_Cotizaciones_Users_Admin------
/*  
& ======================================================
&        FIN: FUNCIONES COTIZACIONES
& ====================================================== 
& */

// -----------------------------------------------------

/*   
& ======================================================
&        INICIO: FUNCIONES CLIENTES|EMPRESAS
& ======================================================
& */

// |Obtener todas las empresas
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
        $pdo->beginTransaction();
        $sqlEMP = "INSERT INTO empresa (nombre_empresa, razon_social, rfc, telefono, correo, estatus) 
            VALUES (:nombre, :razon, :rfc, :telefono, :correo, 'Y')";

        $stmtEMP = $pdo->prepare($sqlEMP);
        $stmtEMP->execute([
            ':nombre'   => $datos['nombre_empresa'],
            ':razon'    => $datos['razon_social'],
            ':rfc'      => $datos['rfc'],
            ':telefono' => $datos['telefono'],
            ':correo'   => $datos['correo']
        ]);
        $id_empresa = $pdo->lastInsertId(); // Obtenemos el ID generado

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

        $pdo->commit();
        return true;
    } catch (Exception $e) {
        $pdo->rollBack(); // Revertimos si hay error
        throw $e;
    }
}

function actualizarEmpresa(PDO $pdo, array $datos): bool
{
    try {
        $pdo->beginTransaction();

        // 1. Actualizar empresa
        $sqlEmp = "UPDATE empresa SET nombre_empresa = :nombre, razon_social = :razon, rfc = :rfc, telefono = :telefono, correo = :correo WHERE id_empresa = :id";
        $stmtEmp = $pdo->prepare($sqlEmp);
        $stmtEmp->execute([
            ':nombre'   => $datos['nombre_empresa'],
            ':razon'    => $datos['razon_social'],
            ':rfc'      => $datos['rfc'],
            ':telefono' => $datos['telefono'],
            ':correo'   => $datos['correo'],
            ':id'       => $datos['id_empresa']
        ]);

        // 2. Verificar si ya tenía domicilio registrado para actualizarlo o insertarlo
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
        return true;
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

// |Candado evitar empresas suplicadas
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

/*  
& ======================================================
&        FIN: FUNCIONES CLIENTES|EMPRESAS
& ====================================================== 
& */

// -----------------------------------------------------

/*   
& ======================================================
&        INICIO: FUNCIONES CLIENTES|USUARIOS  
& ======================================================
& */

// |Obtenemos todos los usuarios 
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

// |Eliminar usuario con candado
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

// |Candado evitar usuarios clientes/usuarios repetidos
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


/*  
& ======================================================
&        FIN: FUNCIONES CLIENTES|USUARIOS
& ======================================================
& */

// -----------------------------------------------------

/*   
& ======================================================
&        INICIO: FUNCIONES ALMACEN|PRODUCTOS
& ======================================================- 
& */

function insertarProduct(PDO $pdo, array $datos): bool
{

    $foto = !empty($datos['foto_product']) ? $datos['foto_product'] : 'producto.png';
    // Convertimos a mayúsculas
    $descripcion = mb_strtoupper($datos['descripcion_product'], 'UTF-8');

    $sql = "INSERT INTO productos (descripcion_product, clave_product, precio_farmacia, precio_publico, foto_product, estatus) 
            VALUES (:descripcion, :c_product, :f_product ,:p_product, :foto, :estatus)";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([
        ':descripcion' => $descripcion,
        ':c_product'   => $datos['clave_product'],
        ':f_product'   => $datos['precio_farmacia'],
        ':p_product'   => $datos['precio_publico'],
        ':foto'        => $foto,
        ':estatus'     => $datos['estatus']
    ]);
}

function actualizarProduct(PDO $pdo, array $datos): bool
{
    // Preparamos el fragmento de la foto
    $fotoSql = !empty($datos['foto_product']) ? ", foto_product = :foto" : "";
    $descripcion = mb_strtoupper($datos['descripcion_product'], 'UTF-8');

    $sql = "UPDATE productos
            SET descripcion_product = :descripcion, clave_product = :c_product, 
                precio_farmacia = :precio_farmacia, precio_publico = :precio_publico, estatus = :estatus {$fotoSql}
            WHERE id_product = :id_product";

    $stmt = $pdo->prepare($sql);
    $params = [
        ':descripcion'     => $descripcion,
        ':c_product'       => $datos['clave_product'],
        ':precio_farmacia' => $datos['precio_farmacia'],
        ':precio_publico'  => $datos['precio_publico'],
        ':estatus'         => $datos['estatus'],
        ':id_product'      => $datos['id_product']
    ];
    if (!empty($datos['foto_product'])) {
        $params[':foto'] = $datos['foto_product'];
    }

    $stmt->execute($params);
    return true;
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

// |Candado productos duplicados
function verificarProductoExistente(PDO $pdo, string $descripcion, string $clave, int $id_product = 0): string|false 
{
    // Limpiamos los datos y pasamos a mayúsculas para que la búsqueda sea exacta
    $descripcion = mb_strtoupper(trim($descripcion), 'UTF-8');
    $clave = trim($clave);

    // Buscamos coincidencias de nombre o clave
    $sql = "SELECT id_product, descripcion_product, clave_product 
            FROM productos 
            WHERE (descripcion_product = :desc OR clave_product = :clave)";
    
    // Si estamos editando ($id_product > 0), excluimos al propio producto de la búsqueda
    if ($id_product > 0) {
        $sql .= " AND id_product != :id";
    }

    $stmt = $pdo->prepare($sql);
    
    $params = [':desc' => $descripcion, ':clave' => $clave];
    if ($id_product > 0) {
        $params[':id'] = $id_product;
    }

    $stmt->execute($params);
    $existe = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existe) {
        if (mb_strtoupper($existe['descripcion_product'], 'UTF-8') === $descripcion) {
            return 'El NOMBRE del producto ya existe en la base de datos.';
        }
        if (mb_strtoupper($existe['clave_product'], 'UTF-8') === mb_strtoupper($clave, 'UTF-8')) {
            return 'La CLAVE del producto ya existe en la base de datos.';
        }
    }
    
    return false; // No hay duplicados
}

/*  
& ======================================================
&        FIN: FUNCIONES ALMACEN|PRODUCTOS
& ======================================================- 
& */

// -----------------------------------------------------

/*   
& ======================================================
&        INICIO: FUNCIONES EMPLEADOS_LAN
& ======================================================
& */

// |Obtener los usuarios Admin
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
// |Insertar nuevo usuario Admin
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

// |Actualizar usuario Admin
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

// |Candado para evitar registros duplicados
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


/*  
& ======================================================
&        FIN: FUNCIONES EMPLEADOS_LAN
& ======================================================
& */

// -----------------------------------------------------

/*   
& ======================================================
&        INICIO: FUNCIONES LOGIN CLIENTES
& ======================================================- 
& */

// |Obtener los clientes(Empresa) para login
function obtenerUsuarioEmpresaporCorreo(PDO $pdo, string $correo)
{
    $sql = "SELECT id_usuario, nombre, apellido_pat, Empresa_id, correo, usuario_password, foto_perfil
            FROM usuarios
            WHERE correo = :correo AND activo = 'true'";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':correo' => $correo]);

    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// |

/*  
& ======================================================
&        FIN: FUNCIONES LOGIN CLIENTES 
& ======================================================- 
& */

// -----------------------------------------------------

/*   
& ======================================================
&        INICIO: FUNCIONES DOMICILIOS
& ======================================================- 
& */

// |Domicilio de empresa ligada
function obtenerDomicilioPorCotizacion(PDO $pdo, int $id_cotizacion){
    $sql = "SELECT d.* FROM domicilio_empresa d 
            JOIN cotizacion c ON d.Empresa_id = c.Empresa_id 
            WHERE c.id_cotizacion = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id_cotizacion]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// |Guardar las direccioens ligadas
function formalizarVenta(PDO $pdo, int $id_cot, array $fiscal, array $cert, array $envio): bool {
    try {
        $pdo->beginTransaction();

        // 1. Insertar Fiscal
        $stmtF = $pdo->prepare("INSERT INTO domicilio_fiscal (Cotizacion_id, calle_numero_fiscal, colonia_fiscal, localidad_fiscal, cp_fiscal, municipio_fiscal, estado_fiscal) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmtF->execute([$id_cot, $fiscal['calle'], $fiscal['colonia'], $fiscal['localidad'], $fiscal['cp'], $fiscal['municipio'], $fiscal['estado']]);

        // 2. Insertar Certificado
        $stmtC = $pdo->prepare("INSERT INTO domicilio_cert_calib (Cotizacion_id, calle_numero_cert, colonia_cert, localidad_cert, cp_cert, municipio_cert, estado) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmtC->execute([$id_cot, $cert['calle'], $cert['colonia'], $cert['localidad'], $cert['cp'], $cert['municipio'], $cert['estado']]);

        // 3. Insertar Envío
        $stmtE = $pdo->prepare("INSERT INTO domicilio_envio (Cotizacion_id, calle_numero_envio, colonia_envio, localidad_envio, cp_envio, municipio_envio, estado_envio) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmtE->execute([$id_cot, $envio['calle'], $envio['colonia'], $envio['localidad'], $envio['cp'], $envio['municipio'], $envio['estado']]);

        // 4. Cambiar estatus definitivo a Ganada
        $stmtCot = $pdo->prepare("UPDATE cotizacion SET estatus = 'Ganada' WHERE id_cotizacion = ?");
        $stmtCot->execute([$id_cot]);

        $pdo->commit();
        return true;
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/*  
& ======================================================
&        FIN: FUNCIONES DOMICILIOS
& ======================================================- 
& */


