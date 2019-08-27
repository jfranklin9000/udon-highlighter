# ~dirwex-dosrev
# August 7, 2019

# you can't have `snips/foo.snip` and `udons/foo.udon`
# as they'd both be processed into `static-site/foo.udon`

STATIC = \
	static-site/README.udon \
	static-site/index.udon \
	static-site/front-matter.udon \
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
	static-site/empty.udon

all: $(STATIC)

css:
	php tools/css.php

clean:
	rm -f static-site/*.udon cms/*.html iframes/*.html rendered/*.html rendered/*.udon

static-site/%.udon: snips/%.snip
	@echo "---" $< "---"
	php tools/snip.php $< > $@
	php tools/cm.php $< > cms/$*.html
	php tools/iframe.php $* > iframes/$*.html

static-site/%.udon: udons/%.udon
	@echo "---" $< "---"
	cat $< > $@
	php tools/cm.php $< > cms/$*.html
	php tools/iframe.php $* > iframes/$*.html

# what the heck, send markdown through the udon parser
static-site/README.udon: README.md
	@echo "---" $< "---"
	printf ";>\n" > static-site/README.udon
	cat README.md >> static-site/README.udon
	php tools/cm.php README.md > cms/README.html
	php tools/iframe.php README > iframes/README.html
