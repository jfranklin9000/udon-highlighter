<?php

	if (($files = scandir('rendered')) === false)
		exit("scandir() returned FALSE\n");

	$head =
"<head>
	<title>Udon Syntax Highlighter</title>
	<meta charset=\"utf-8\"/>
	<script src=\"../CodeMirror/lib/codemirror.js\"></script>
	<link rel=\"stylesheet\" href=\"../CodeMirror/lib/codemirror.css\">
	<script src=\"../CodeMirror/mode/udon/udon.js\"></script>
	<style>
	body {
		background: #fff;
	}
	pre {
		background: #eee;
		padding: 6px;
	}
	code {
		background: #eee;
		padding: 6px;
		white-space: pre-wrap;
	}
	blockquote {
		background: antiquewhite;
		padding: 6px;
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
		file_put_contents($name, "<!doctype html>\n" . $html);
	}

?>
