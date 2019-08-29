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
		line-height: 2.0em;
		font-family: \"Trebuchet MS\", Arial, Helvetica, sans-serif;
	}
	pre {
		background: #eee;
		padding: 10px;
		line-height: 1.5em;
		font-size: larger;
		overflow-x: scroll;
	}
	code {
		background: #eee;		/* #a50 in highlighter */
		padding: 5px;
		white-space: pre-wrap;
		font-size: larger;
	}
	blockquote {
		background: #aca;		/* #090 in highlighter */
		padding: 0 20px;
	}
	div div {					/* poem */
		background: #bbf;		/* #00f in highlighter */
		padding: 0 20px;
	}
	a {
		color: inherit;
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
		$doctype = (stripos($html, "<!doctype html>\n") === false) ? "<!doctype html>\n" : "";
		$html = str_replace('<head></head>', $head, $html);
		file_put_contents($name, $doctype . $html);
	}

?>
