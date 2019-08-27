<?php

	if ($argc != 2)
		exit("iframe.php takes 1 argument\n");

	define('TEMPLATE', 'templates/iframe.html');

	if (($html = file_get_contents(TEMPLATE)) === false)
		exit("could not open " . TEMPLATE . "\n");

	exit(str_replace('THE-SNIP', $argv[1], $html));

?>
