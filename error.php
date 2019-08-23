<?php

	// source
	$udon =
";>

Above the line
---
Below the line
-----
And below this	line, too";

	// error position (1-based)
	$lin = 6;
	$col = 4;

	// 1-based to 0-based
	$lin--;
	$col--;

	$lines = explode("\n", $udon);
	$count = count($lines);

	// XX error check $lin/$count?

	// add spans to $udon based on lin,col:
	// $udon = SOME-UDON + MORE-UDON
	// after adding spans:
	// $udon = <span class="ok">SOME-UDON</span><span class="err">MORE-UDON</span>

	// handle error line first
	$line = str_split($lines[$lin]);
	$ok = array_slice($line, 0, $col);
	$er = array_slice($line, $col);
	$sp = array("</span><span class=\"err\">");
	$line = implode('', array_merge($ok, $sp, $er));
	$lines[$lin] = $line;

	// handle first line
	$lines[0] = "<span class=\"ok\">" . $lines[0];

	// handle last line
	$lines[$count - 1] = $lines[$count - 1] . "</span>";

	// package it up
	$udon = implode("\n", $lines);

	// highlight tabs (XX add to highlighter too)
	$udon = str_replace("\t", "<span class=\"tab\">\t</span>", $udon);

?>
<!doctype html>
<html>
  <head>
    <style>
      body { font-size: 20px; }
      .ok { color: black; }
   /* .err { color: red; background: lightgray; } */
      .err { color: black; background: salmon; }
      .tab { background: red; }
    </style>
  </head>
  <body>
    <pre><?php echo $udon ?></pre>
  </body>
</html>
