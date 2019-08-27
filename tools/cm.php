<?php

	if ($argc != 2)
		exit("cm.php takes 1 argument\n");

	if (($snip = file_get_contents($argv[1])) === false)
		exit("could not open $argv[1]\n");

	define('TEMPLATE', 'templates/cm.html');

	if (($html = file_get_contents(TEMPLATE)) === false)
		exit("could not open " . TEMPLATE . "\n");

	exit(str_replace('THE-SNIP', $snip, $html));

?>
