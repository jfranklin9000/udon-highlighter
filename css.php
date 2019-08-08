<?php

	if (($files = scandir('rendered')) === false)
		exit("scandir() returned FALSE\n");

	$head =
"<head>
	<style>
	pre {
		background: #eee;
		padding: 6px;
	}
	code {
		background: #eee;
		padding: 6px;
		white-space: pre-wrap;
	}
	</style>
</head>";

	foreach ($files as $file)
	{
		// report udon files here (which
		// signals a parser error)?

		if (strpos($file, '.html') === false)
			continue;

		$name = "rendered/$file";
		$html = file_get_contents($name);
		// idempotent..
		$html = str_replace('<head></head>', $head, $html);
		file_put_contents($name, $html);
	}

?>
