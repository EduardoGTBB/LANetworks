<?php 

include ('dumper.php');

try {

	$world_dumper = Shuttle_Dumper::create(array(
		'host' => 'localhost',
		'username' => '',//
		'password' => '',//
		'db_name' => 'lan_cotizador',//
	));

	//dump the database to gzipped file
	// $world_dumper->dump('domains/womi.lupware.com/public_html/respaldo-diario-bd/womi.sql.gz');
	$world_dumper->dump(__DIR__ . '/../respaldo-diario-bd/lan-sac.sql.gz');
	

} catch(Shuttle_Exception $e) {
	echo "Couldn't dump database: " . $e->getMessage();
}