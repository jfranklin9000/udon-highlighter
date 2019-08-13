# ~dirwex-dosrev
# August 7, 2019

UDONS = \
	static-site/headers.udon \
	static-site/italics-bold.udon \
	static-site/escape.udon \
	static-site/misc.udon \
	static-site/README.udon

all: $(UDONS)

css:
	php css.php

clean:
	rm -f static-site/* rendered/* cms/* iframes/*

static-site/%.udon: snips/%.snip
	php snip.php $< > $@
	php cm.php $< > cms/$*.html
	php iframe.php $* > iframes/$*.html

# what the heck, send markdown through the udon parser
static-site/README.udon: README.md
	echo ";>\n\n" > static-site/README.udon
	cat README.md >> static-site/README.udon
	php cm.php README.md > cms/README.html
	php iframe.php README > iframes/README.html
