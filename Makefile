MCL_DIR?=./src/mcl
MCL_JS=./src/mcl_c.js
WASM=./src/mcl.wasm

CC=clang-18
CXX=clang++-18
LD=wasm-ld-18

TARGET=--target=wasm32-unknown-unknown

CFLAGS=$(TARGET) -O3 -DNDEBUG -flto -fvisibility=hidden
CFLAGS+=-fno-threadsafe-statics -fno-rtti -fno-stack-protector -fno-exceptions
CFLAGS+=-DMCL_SIZEOF_UNIT=4
CFLAGS+=-DMCL_USE_WEB_CRYPTO_API -DCYBOZU_MINIMUM_EXCEPTION
CFLAGS+=-DCYBOZU_DONT_USE_EXCEPTION -DCYBOZU_DONT_USE_STRING
CFLAGS+=-I src/wasm-stubs -I $(MCL_DIR)/include -I $(MCL_DIR)/src
CFLAGS+=-Wall -Wextra

CXXFLAGS=$(CFLAGS) -std=c++03

LDFLAGS=--no-entry --export-dynamic -z stack-size=1048576
LDFLAGS+=--export=__stack_pointer
LDFLAGS+=--export=__wasm_call_ctors
LDFLAGS+=--export=malloc --export=free
LDFLAGS+=--import-memory
LDFLAGS+=--allow-undefined
LDFLAGS+=--undefined=cryptoGetRandomValues
LDFLAGS+=--lto-O3

OBJS=src/fp.o src/dlmalloc.o src/wasm-stubs/libc.o

all: $(MCL_JS)

$(MCL_JS): $(WASM) src/glue.js
	perl -pe 'BEGIN{open F,"-|","base64 -w0 $(WASM)";$$b=<F>;chomp $$b}s/\@\@WASM_BASE64\@\@/$$b/' src/glue.js > $@

$(WASM): $(OBJS)
	$(LD) -o $@ $(OBJS) $(LDFLAGS)

src/fp.o: $(MCL_DIR)/src/fp.cpp
	$(CXX) $(CXXFLAGS) -c -o $@ $<

DLMALLOC_FLAGS=-DLACKS_SYS_TYPES_H -DLACKS_FCNTL_H -DLACKS_UNISTD_H
DLMALLOC_FLAGS+=-DLACKS_SYS_MMAN_H -DLACKS_STRINGS_H -DLACKS_SYS_PARAM_H
DLMALLOC_FLAGS+=-DLACKS_SCHED_H -DLACKS_TIME_H
DLMALLOC_FLAGS+=-DHAVE_MORECORE=1 -DHAVE_MMAP=0 -DNO_MALLOC_STATS=1
DLMALLOC_FLAGS+=-DMORECORE_CONTIGUOUS=0
DLMALLOC_FLAGS+=-Dsize_t=unsigned\ long -Dptrdiff_t=long
DLMALLOC_FLAGS+=-DMALLOC_ALIGNMENT=16

src/dlmalloc.o: src/dlmalloc.c
	$(CC) $(TARGET) -O3 -DNDEBUG -flto -I src/wasm-stubs $(DLMALLOC_FLAGS) -c -o $@ $<

src/wasm-stubs/libc.o: src/wasm-stubs/libc.c
	$(CC) $(TARGET) -O3 -DNDEBUG -flto -I src/wasm-stubs -c -o $@ $<

clean:
	rm -f $(OBJS) $(WASM) $(MCL_JS)

.PHONY: clean all
