# ~dirwex-dosrev
# August 7, 2019

UDONS = \
  static-site/headers.udon \
  static-site/italics-bold.udon \
  static-site/README.udon

all: $(UDONS)

static-site/%.udon: snips/%.snip
	cp snips/micgar.txt $@ ; cat $< >> $@

# what the heck, send markdown through the udon parser
static-site/README.udon: README.md
	cp snips/micgar.txt $@ ; cat $< >> $@
