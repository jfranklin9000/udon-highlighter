<?php

	if ($argc != 2)
		exit("snip.php takes 1 argument\n");

	if (($file = file_get_contents($argv[1])) === false)
		exit("could not open $argv[1]\n");

	define('SNIP', '-- -- -- --');

	echo ";>\n\n";

	$snips = explode(SNIP, $file);

	foreach ($snips as $snip)
		echo "\n```$snip```$snip---\n";

?>
