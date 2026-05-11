<?php
session_start();
if (!isset($_SESSION['id_user_admin'])) {
    exit("Acceso denegado. Solo administradores.");
}

require 'api/config.php';

$mensaje = "";

// 1. Obtener la lista de Clientes (Empresas) para relacionar las sucursales
$empresas = [];
try {
    $stmtEmp = $pdo->query("SELECT id_empresa, razon_social FROM empresa ORDER BY razon_social ASC");
    $empresas = $stmtEmp->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['archivo_csv'])) {
    $archivo = $_FILES['archivo_csv']['tmp_name'];
    $empresa_id = (int)$_POST['empresa_id'];
    
    if (is_uploaded_file($archivo) && $empresa_id > 0) {
        $handle = fopen($archivo, "r");
        
        try {
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->beginTransaction();
            
            $sucursales_nuevas = 0;
            $sucursales_existentes = 0;
            $vinculos_creados = 0;
            $usuarios_no_encontrados = [];

            // Saltamos la primera línea si es el encabezado (Opcional, pero recomendado)
            // fgetcsv($handle, 10000, ","); 

            while (($data = fgetcsv($handle, 10000, ",")) !== FALSE) {
                
                // Parche por si Excel lo guardó con punto y coma (;)
                if (count($data) == 1 && strpos($data[0], ';') !== false) {
                    $data = explode(';', $data[0]);
                }

                // ==========================================
                // 📍 MAPEO DE COLUMNAS (Ajusta los números)
                // Columna A = 0, B = 1, C = 2, D = 3, E = 4...
                // ==========================================
                $id_sae          = isset($data[0]) ? trim((string)$data[0]) : '';
                $nombre_sucursal = isset($data[1]) ? trim((string)$data[1]) : '';
                $calle           = isset($data[2]) ? trim((string)$data[2]) : '';
                $colonia         = isset($data[3]) ? trim((string)$data[3]) : '';
                $cp              = isset($data[4]) ? trim((string)$data[4]) : '';
                $municipio       = isset($data[5]) ? trim((string)$data[5]) : '';
                $estado          = isset($data[6]) ? trim((string)$data[6]) : '';
                
                // ¡AQUÍ PON EL NÚMERO DE LA COLUMNA DONDE DEJASTE EL CORREO!
                $correos_raw     = isset($data[7]) ? trim((string)$data[7]) : ''; 

                // Si no hay ID SAE o nombre, nos saltamos la fila
                if (empty($id_sae) || empty($nombre_sucursal)) {
                    continue;
                }

                // ==========================================
                // 1. CREAR O IGNORAR SUCURSAL
                // ==========================================
                $stmtCheckSuc = $pdo->prepare("SELECT id_sucursal FROM sucursales WHERE id_sae = ? AND Empresa_id = ?");
                $stmtCheckSuc->execute([$id_sae, $empresa_id]);
                $sucursal = $stmtCheckSuc->fetch(PDO::FETCH_ASSOC);

                if ($sucursal) {
                    $id_sucursal_actual = $sucursal['id_sucursal'];
                    $sucursales_existentes++;
                } else {
                    $stmtInsSuc = $pdo->prepare("INSERT INTO sucursales (Empresa_id, id_sae, nombre_sucursal, calle, colonia, cp, municipio, estado, estatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Y')");
                    $stmtInsSuc->execute([$empresa_id, $id_sae, $nombre_sucursal, $calle, $colonia, $cp, $municipio, $estado]);
                    $id_sucursal_actual = $pdo->lastInsertId();
                    $sucursales_nuevas++;
                }

                // ==========================================
                // 2. VINCULAR CON EL USUARIO (CORREO)
                // ==========================================
                if (!empty($correos_raw)) {
                    // Separamos por si pusiste varios correos con "|"
                    $correos_array = explode('|', $correos_raw); 

                    foreach ($correos_array as $email) {
                        $email_limpio = strtolower(trim($email));
                        if(empty($email_limpio)) continue;
                        
                        $stmtUser = $pdo->prepare("SELECT id_usuario FROM usuarios WHERE correo = ? AND Empresa_id = ?");
                        $stmtUser->execute([$email_limpio, $empresa_id]);
                        $user = $stmtUser->fetch(PDO::FETCH_ASSOC);

                        if ($user) {
                            $id_usuario = $user['id_usuario'];

                            // Verificar si ya están vinculados
                            $stmtCheckLink = $pdo->prepare("SELECT id_usu_suc FROM usuario_sucursal WHERE Usuario_id = ? AND Sucursal_id = ?");
                            $stmtCheckLink->execute([$id_usuario, $id_sucursal_actual]);

                            if (!$stmtCheckLink->fetch()) {
                                $stmtInsLink = $pdo->prepare("INSERT INTO usuario_sucursal (Usuario_id, Sucursal_id) VALUES (?, ?)");
                                $stmtInsLink->execute([$id_usuario, $id_sucursal_actual]);
                                $vinculos_creados++;
                            }
                        } else {
                            // Guardamos registro si no encontró el correo en BD
                            if (!in_array($email_limpio, $usuarios_no_encontrados)) {
                                $usuarios_no_encontrados[] = $email_limpio;
                            }
                        }
                    }
                }
            }
            
            $pdo->commit();

            // Mensaje de usuarios no encontrados
            $html_errores = "";
            if (count($usuarios_no_encontrados) > 0) {
                $html_errores = "<div class='mt-3 alert alert-warning small mb-0'>
                                    <b>¡Ojo!</b> Los siguientes correos venían en el archivo pero no existen en la base de datos (o pertenecen a otro Cliente), por lo que no se les vinculó sucursal:<br>
                                    " . implode(", ", $usuarios_no_encontrados) . "
                                 </div>";
            }

            $mensaje = "<div class='alert alert-success'>
                            <h5 class='alert-heading'>¡Importación de Sucursales Finalizada!</h5>
                            <hr>
                            <p class='mb-0'>
                                🏪 <b>$sucursales_nuevas</b> Sucursales nuevas creadas.<br>
                                ♻️ <b>$sucursales_existentes</b> Sucursales ya existían (No se duplicaron).<br>
                                🔗 <b>$vinculos_creados</b> Asignaciones Usuario-Sucursal creadas con éxito.
                            </p>
                            $html_errores
                        </div>";
            
        } catch (Exception $e) {
            $pdo->rollBack();
            $mensaje = "<div class='alert alert-danger'>Error al importar: " . $e->getMessage() . "</div>";
        }
        fclose($handle);
    } else {
        $mensaje = "<div class='alert alert-danger'>Debes seleccionar un archivo CSV y a qué Cliente pertenecen.</div>";
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Importador de Sucursales</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-7">
                <div class="card shadow-sm border-0">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">Carga Masiva de Sucursales y Asignación (CSV)</h5>
                    </div>
                    <div class="card-body">
                        <?php echo $mensaje; ?>
                        
                        <div class="alert alert-info small">
                            <strong>Instrucciones:</strong>
                            <ul class="mb-0 mt-1">
                                <li>El ID SAE (Ej: 828) se usa para no duplicar. Si el SAE ya existe, solo se conectará con el usuario.</li>
                                <li>La columna de Correos es la encargada de enlazar la sucursal con los usuarios que subimos antes.</li>
                                <li>Si una sucursal la manejan 2 personas, separa los correos con una línea vertical ( <b>|</b> ).</li>
                            </ul>
                        </div>

                        <form action="importar_sucursales.php" method="POST" enctype="multipart/form-data" class="mt-4">
                            
                            <div class="mb-3">
                                <label for="empresa_id" class="form-label fw-bold">¿A qué Cliente pertenecen estas sucursales?</label>
                                <select class="form-select form-select-lg" name="empresa_id" id="empresa_id" required>
                                    <option value="">Selecciona la empresa...</option>
                                    <?php foreach ($empresas as $emp): ?>
                                        <option value="<?php echo $emp['id_empresa']; ?>">
                                            <?php echo htmlspecialchars($emp['razon_social']); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <div class="mb-4">
                                <label for="archivo_csv" class="form-label fw-bold">Selecciona tu archivo .CSV (UTF-8)</label>
                                <input class="form-control form-control-lg" type="file" name="archivo_csv" id="archivo_csv" accept=".csv" required>
                            </div>
                            
                            <button type="submit" class="btn btn-primary btn-lg w-100 fw-bold">Importar Sucursales</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>