<?php
/**
 * lib/utilidades.php
 *
 * Librería de funciones de ayuda y utilidades generales.
 * (Sintaxis compatible con PHP 7)
 */

/**
 * Obtiene de forma segura un ID numérico de una variable $_GET.
 *
 * @param string $nombre_param El nombre del parámetro en la URL (ej. 'id')
 * @return int|false El ID numérico limpio, o 'false' si no es válido
 */
function obtener_id_get(string $nombre_param) 
{
    // 1. Verificar si el parámetro existe y no está vacío
    if (!isset($_GET[$nombre_param]) || empty($_GET[$nombre_param])) {
        return false;
    }

    // 2. "Sanitizar" el valor
    $id = filter_var($_GET[$nombre_param], FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1]
    ]);

    // 3. filter_var devuelve 'false' si la validación falla
    return $id;
}

class NumeroALetras {
    private static $UNIDADES = [
        '', 'UN ', 'DOS ', 'TRES ', 'CUATRO ', 'CINCO ', 'SEIS ', 'SIETE ', 'OCHO ', 'NUEVE ', 'DIEZ ',
        'ONCE ', 'DOCE ', 'TRECE ', 'CATORCE ', 'QUINCE ', 'DIECISEIS ', 'DIECISIETE ', 'DIECIOCHO ', 'DIECINUEVE ', 'VEINTE '
    ];

    private static $DECENAS = [
        'VENTI', 'TREINTA ', 'CUARENTA ', 'CINCUENTA ', 'SESENTA ', 'SETENTA ', 'OCHENTA ', 'NOVENTA ', 'CIEN '
    ];

    private static $CENTENAS = [
        'CIENTO ', 'DOSCIENTOS ', 'TRESCIENTOS ', 'CUATROCIENTOS ', 'QUINIENTOS ', 'SEISCIENTOS ', 'SETECIENTOS ', 'OCHOCIENTOS ', 'NOVECIENTOS '
    ];

    public static function convertir($numero, $moneda = 'PESOS', $sufijo = 'M.N.') {
        $numero = str_replace(',', '', $numero);
        $numero = number_format($numero, 2, '.', '');
        $partes = explode('.', $numero);
        $entero = (int)$partes[0];
        $centavos = $partes[1];

        if ($entero == 0) {
            $letras = 'CERO ';
        } else {
            $letras = self::procesarMillones($entero);
        }

        return trim($letras) . " $moneda $centavos/100 $sufijo";
    }

    private static function procesarMillones($numero) {
        $letras = '';
        if ($numero >= 1000000) {
            $millones = intdiv($numero, 1000000);
            $numero = $numero % 1000000;
            if ($millones == 1) {
                $letras .= 'UN MILLON ';
            } else {
                $letras .= self::procesarMiles($millones) . 'MILLONES ';
            }
        }
        $letras .= self::procesarMiles($numero);
        return $letras;
    }

    private static function procesarMiles($numero) {
        $letras = '';
        if ($numero >= 1000) {
            $miles = intdiv($numero, 1000);
            $numero = $numero % 1000;
            if ($miles == 1) {
                $letras .= 'MIL ';
            } else {
                $letras .= self::procesarCentenas($miles) . 'MIL ';
            }
        }
        $letras .= self::procesarCentenas($numero);
        return $letras;
    }

    private static function procesarCentenas($numero) {
        $letras = '';
        if ($numero >= 100) {
            if ($numero == 100) {
                return 'CIEN ';
            }
            $centenas = intdiv($numero, 100);
            $numero = $numero % 100;
            $letras .= self::$CENTENAS[$centenas - 1];
        }
        
        if ($numero >= 21 && $numero <= 29) {
            $letras .= 'VEINTI' . trim(self::$UNIDADES[$numero % 10]) . ' ';
        } elseif ($numero >= 30) {
            $decenas = intdiv($numero, 10);
            $unidades = $numero % 10;
            $letras .= self::$DECENAS[$decenas - 2];
            if ($unidades > 0) {
                $letras .= 'Y ' . self::$UNIDADES[$unidades];
            }
        } else {
            $letras .= self::$UNIDADES[$numero];
        }
        
        return $letras;
    }
}

?>