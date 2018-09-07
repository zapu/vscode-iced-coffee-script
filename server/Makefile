default: build
all: build

ICED=node_modules/.bin/iced
BUILD_STAMP=build-stamp

out/iced_walk.js : src/iced_walk.iced
	$(ICED) -I none -c -o `dirname $@` $<

out/server.js: src/server.ts
	tsc -p ./tsconfig.json

$(BUILD_STAMP): out/iced_walk.js out/server.js
	date > $@

clean:
	find out -type f -name *.js -exec rm {} \;
	find out -type f -name *.js.map -exec rm {} \;

build: $(BUILD_STAMP)

.PHONY : iced_files ts_files