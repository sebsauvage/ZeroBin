OPTIPNG ?= optipng

.PHONY: minify
minify: $(patsubst %.png,%.png.opt,$(wildcard *.png))

%.png.opt: %.png
	${OPTIPNG} $<
	@touch $@
