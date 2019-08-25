# ~dirwex-dosrev
# August 7, 2019

UDONS = \
	static-site/index.udon \
	static-site/headers.udon \
	static-site/italics-bold.udon \
	static-site/line-break.udon \
	static-site/backslash-line-break.udon \
	static-site/escape.udon \
	static-site/list.udon \
	static-site/link.udon \
	static-site/anchor-link.udon \
	static-site/double-quote.udon \
	static-site/inline-code-literal.udon \
	static-site/block-code-literal.udon \
	static-site/hoon-constants.udon \
	static-site/horizontal-rule.udon \
	static-site/block-quote.udon \
	static-site/poem.udon \
	static-site/sail-expressions.udon \
	static-site/misc.udon \
	static-site/newline.udon \
	static-site/README.udon

all: $(UDONS)

css:
	php css.php

clean:
	rm -f static-site/*.udon cms/*.html iframes/*.html rendered/*.html rendered/*.udon

static-site/%.udon: snips/%.snip
	php snip.php $< > $@
	php cm.php $< > cms/$*.html
	php iframe.php $* > iframes/$*.html

# we don't want snip processing for this
static-site/index.udon: index.udon
	cp index.udon static-site/index.udon

# what the heck, send markdown through the udon parser
static-site/README.udon: README.md
	printf ";>\n\n" > static-site/README.udon
	cat README.md >> static-site/README.udon
	php cm.php README.md > cms/README.html
	php iframe.php README > iframes/README.html
