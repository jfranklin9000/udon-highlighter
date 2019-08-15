# udon-highlighter

Udon Syntax Highlighter Bounty

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

### Populate `static-site/` from `snips/`

`snips/*.snip` are the udon sources.

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
The `iframes/` files combine the files
in `cms/` and `rendered/` in iframes.

### Iteration

Edit a `.snip` or create a new one in `snips/`.
If you create a new `.snip` add it to the `Makefile`.

```
make
|commit %home
|static
make css
```

### Reset

```
make clean
```

This deletes the files in `static-site/`, `rendered/`, `cms/` and `iframes/`.

## Questions

- Should we fail gracefully?

- The udon docs say a header are haxes followed
  by a single space followed by the actual text.
  Do we want to enforce a single space?
  The parser doesn't now; I guess the "actual text"
  can start with spaces.

- `lineIsEmpty(line)` => empty or _whitespace only_.
  What about udon parser?

### Miscellaneous

- requires command line `php`
