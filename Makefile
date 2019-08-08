# ~dirwex-dosrev
# August 7, 2019

UDONS = \
  static-site/headers.udon \
  static-site/italics-bold.udon \
  static-site/misc.udon \
  static-site/README.udon

all: $(UDONS)

clean:
	rm static-site/*.udon

static-site/%.udon: snips/%.snip
	php snip.php $< > $@

# what the heck, send markdown through the udon parser
static-site/README.udon: README.md
	php snip.php $< > $@
