# udon-highlighter

Udon Syntax Highlighter Bounty Test Environment

_*WORK IN PROGRESS - not ready for evaluation or bug reports*_

[https://github.com/jfranklin9000/udon-highlighter](https://github.com/jfranklin9000/udon-highlighter)

[http://jfranklin9000.com/udon-highlighter](http://jfranklin9000.com/udon-highlighter)

[https://jfranklin9000.com/udon-highlighter](https://jfranklin9000.com/udon-highlighter)
_(self-signed certificate)_

- The deliverable is `CodeMirror/mode/udon/udon.js`.

- Command line `php` is required to process new tests.

### Clone repository

```
git clone https://github.com/jfranklin9000/udon-highlighter.git
cd udon-highlighter
```

### Create a fake `zod` in `udon-highlighter/`

```
urbit -F zod
```

### Mount the `%home` desk

```
|mount /=home=
```

### Link `static-site/` into `%home` desk

```
mkdir -p zod/home/web
ln -s `pwd`/static-site zod/home/web/static-site
```

### Populate `static-site/` from `snips/` and `udons/`

`snips/*.snip` and `udons/*.udon` are the udon sources.

```
make
```

### Parse the udons

```
|commit %home
|static
```

### Post-process the udon parser output (idempotent)

```
make css
```

The final html files are in `iframes/`.
The `iframes/` files are the contents of
files in `cms/` and `rendered/` in html
iframes. These can be opened from your
hard drive, no web server required.

### Iteration

Edit a `.snip` or create a new one in `snips/`.
If you create a new `.snip` add it to the `Makefile`.
Do the same with a `.udon` in `udons/`.

```
make
|commit %home
|static
make css
```

A `.snip` (in `snips/`) should start and end with two
blank lines and not contain front matter, `;>` or block
code literals.

A `.udon` (in `udons/`) can have front matter and block
code literals, and _must_ have a `;>`.

#### `.snip` File Format

`snips/example.snip` with two snips:

_The udon parser eats a single blank line (if it exists)
at the start of a block code literal, so the udon parser
rendering of this doc only shows one blank line at the
start of `snips/example.snip`. There should be two!_

```


UDON-1

-- -- -- --

UDON-2


```

`make` will run `tools/snip.php` and produce `static-site/example.udon`:

_The escaped tics will actually be tics._

```
;>

\`\`\`

UDON-1

\`\`\`

UDON-1

---

\`\`\`

UDON-2

\`\`\`

UDON-2

---
```

### Reset

```
make clean
```

This deletes file in `static-site/`, `rendered/`, `cms/` and `iframes/`.
