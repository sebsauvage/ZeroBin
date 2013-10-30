CLOSUREJAR ?= ../compiler.jar

.PHONY: minify
minify: $(patsubst %.js,%.js.old,$(wildcard *.js))

%.js.old: %.js
	@mv -f $< $@
	java -jar ${CLOSUREJAR} --compilation_level SIMPLE_OPTIMIZATIONS $@ > $<
	@touch $@
