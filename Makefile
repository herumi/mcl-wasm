MCL_DIR?=./src/mcl
MCL_JS=./src/mcl_c.js

EMCC_OPT=-I $(MCL_DIR)/include -I $(MCL_DIR)/src -Wall -Wextra
EMCC_OPT+=-O3 -DNDEBUG -std=c++03
EMCC_OPT+=-fno-threadsafe-statics -fno-rtti -fno-stack-protector -fno-exceptions
EMCC_OPT+=-DMCL_SIZEOF_UNIT=4
EMCC_OPT+=-s WASM=1 -s NO_EXIT_RUNTIME=1 -s NODEJS_CATCH_EXIT=0 -s NODEJS_CATCH_REJECTION=0
EMCC_OPT+=-s MODULARIZE=1
#EMCC_OPT+=-s STRICT_JS=1
EMCC_OPT+=-s SINGLE_FILE=1
EMCC_OPT+=--minify 0
EMCC_OPT+=-DCYBOZU_MINIMUM_EXCEPTION
EMCC_OPT+=-s ABORTING_MALLOC=0
EMCC_OPT+=-s STACK_SIZE=1MB
EMCC_OPT+=-sEXPORTED_FUNCTIONS=stackAlloc,stackSave,stackRestore

all: $(MCL_JS)

$(MCL_JS):
	emcc -o $@ $(MCL_DIR)/src/fp.cpp $(MCL_DIR)/src/bn_c384_256.cpp $(EMCC_OPT) -DMCL_MAX_BIT_SIZE=384 -DMCL_USE_WEB_CRYPTO_API -s DISABLE_EXCEPTION_CATCHING=1 -DCYBOZU_DONT_USE_EXCEPTION -DCYBOZU_DONT_USE_STRING -fno-exceptions
	# disable require fs, path
	perl -i -pe 's@(.* = require\(.*)@//\1@' $@

clean:
	rm -rf $(MCL_JS)

.PHONY: clean
