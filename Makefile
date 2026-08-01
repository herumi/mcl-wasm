MCL_DIR?=./src/mcl
LLVM_VER?=-18
STACK_MODE?=0

LIB_DIR=./src

all:
	$(MAKE) -f Makefile.wasm -C $(MCL_DIR) LLVM_VER=$(LLVM_VER) LIB_DIR=$(abspath $(LIB_DIR)) STACK_MODE=$(STACK_MODE)
	mkdir -p dist && cp $(LIB_DIR)/mcl_c.js dist/mcl_c.js

clean:
	$(MAKE) -f Makefile.wasm -C $(MCL_DIR) clean LIB_DIR=$(abspath $(LIB_DIR))
	rm -f dist/mcl_c.js

.PHONY: clean all
