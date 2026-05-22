function createModule(opts) {
  var wasmBase64 = "@@WASM_BASE64@@";
  var wasmBytes = Uint8Array.from(atob(wasmBase64), function(c) { return c.charCodeAt(0); });

  var memory = new WebAssembly.Memory({ initial: 32 });

  var imports = {
    env: {
      memory: memory,
      cryptoGetRandomValues: function(ptr, size) {
        var buf = new Uint8Array(memory.buffer);
        var a = new Uint8Array(size);
        opts.cryptoGetRandomValues(a);
        buf.set(a, ptr);
      }
    }
  };

  return WebAssembly.instantiate(wasmBytes, imports).then(function(result) {
    var instance = result.instance;
    var mod = {};

    mod.wasmMemory = memory;
    mod.HEAP8 = new Int8Array(memory.buffer);
    mod.HEAP32 = new Int32Array(memory.buffer);

    // Export mclBn* wasm functions with _ prefix
    var exports = instance.exports
    for (var name in exports) {
      if (name.startsWith('mclBn') && typeof exports[name] === 'function') {
        mod['_' + name] = exports[name]
      }
    }
    mod['_malloc'] = exports.malloc
    mod['_free'] = exports.free

    // Stack pointer operations (direct wasm exports)
    mod.stackSave = exports.stackSave;
    mod.stackAlloc = exports.stackAlloc;
    mod.stackRestore = exports.stackRestore;

    // Call global constructors if present
    if (exports.__wasm_call_ctors) exports.__wasm_call_ctors();

    return mod;
  });
}

if (typeof module !== 'undefined') module.exports = createModule;
