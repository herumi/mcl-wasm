(function(generator) {
  if (typeof exports === 'object') {
    const crypto = require('crypto')
    crypto.getRandomValues = crypto.randomFillSync
    exports.mod = require('./mcl_c.js')
    generator(exports, crypto, true)
  } else {
    const crypto = window.crypto || window.msCrypto
    let exports = {}
    exports.mod = {}
    window.mcl = generator(exports, crypto, false)
  }
})(function(exports, crypto, isNodeJs) {

  const MCLBN_CURVE_FP254BNB = 0
  const MCLBN_CURVE_FP382_1 = 1
  const MCLBN_CURVE_FP382_2 = 2

  const MCLBN_FP_UNIT_SIZE = 4

  const MCLBN_FP_SIZE = MCLBN_FP_UNIT_SIZE * 8
  const MCLBN_G1_SIZE = MCLBN_FP_SIZE * 3
  const MCLBN_G2_SIZE = MCLBN_FP_SIZE * 6
  const MCLBN_GT_SIZE = MCLBN_FP_SIZE * 12

  let capi = {}
  exports.capi = capi
  let mod = exports.mod

  exports.init = (curveType = MCLBN_CURVE_FP254BNB) => {
    console.log('init')
    if (!isNodeJs) {
      fetch('mcl_c.wasm')
        .then(response => response.arrayBuffer())
        .then(buffer => new Uint8Array(buffer))
        .then(binary => { Module(mod) })
    }
    return new Promise((resolve) => {
      mod.onRuntimeInitialized = () => {
        const f = (exportedFuncs) => {
          exportedFuncs.forEach(func => {
            capi[func.exportName] = mod.cwrap(func.name, func.returns, func.args)
          })
          define_extra_functions(mod)
          let r = capi._mclBn_init(MCLBN_CURVE_FP254BNB, MCLBN_FP_UNIT_SIZE)
          console.log('finished ' + r)
          resolve()
        }
        if (isNodeJs) {
          const fs = require('fs')
          const jsonStr = fs.readFileSync('./exported-mcl.json')
          f(JSON.parse(jsonStr))
        } else {
          fetch('exported-mcl.json')
            .then(response => response.json())
            .then(exportedFuncs => f(exportedFuncs))
        }
      }
    })
  }

  const ptrToStr = function(pos, n) {
    let s = ''
      for (let i = 0; i < n; i++) {
      s += String.fromCharCode(mod.HEAP8[pos + i])
    }
    return s
  }
  const Uint8ArrayToMem = function(pos, buf) {
    for (let i = 0; i < buf.length; i++) {
      mod.HEAP8[pos + i] = buf[i]
    }
  }
  const AsciiStrToMem = function(pos, s) {
    for (let i = 0; i < s.length; i++) {
      mod.HEAP8[pos + i] = s.charCodeAt(i)
    }
  }
  const copyToUint32Array = function(a, pos) {
    a.set(mod.HEAP32.subarray(pos / 4, pos / 4 + a.length))
//    for (let i = 0; i < a.length; i++) {
//      a[i] = mod.HEAP32[pos / 4 + i]
//    }
  }
  const copyFromUint32Array = function(pos, a) {
    for (let i = 0; i < a.length; i++) {
      mod.HEAP32[pos / 4 + i] = a[i]
    }
  }
  exports.toHex = function(a, start, n) {
    let s = ''
    for (let i = 0; i < n; i++) {
      s += ('0' + a[start + i].toString(16)).slice(-2)
    }
    return s
  }
  // Uint8Array to hex string
  exports.toHexStr = function(a) {
    return exports.toHex(a, 0, a.length)
  }
  // hex string to Uint8Array
  exports.fromHexStr = function(s) {
    if (s.length & 1) throw('fromHexStr:length must be even ' + s.length)
    let n = s.length / 2
    let a = new Uint8Array(n)
    for (let i = 0; i < n; i++) {
      a[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16)
    }
    return a
  }

  const wrap_outputString = function(func, doesReturnString = true) {
    return function(x, ioMode = 0) {
      let maxBufSize = 2048
      let stack = mod.Runtime.stackSave()
      let pos = mod.Runtime.stackAlloc(maxBufSize)
      let n = func(pos, maxBufSize, x, ioMode)
      if (n < 0) {
        throw('err gen_str:' + x)
      }
      if (doesReturnString) {
        let s = ptrToStr(pos, n)
        mod.Runtime.stackRestore(stack)
        return s
      } else {
        let a = new Uint8Array(n)
        for (let i = 0; i < n; i++) {
          a[i] = mod.HEAP8[pos + i]
        }
        mod.Runtime.stackRestore(stack)
        return a
      }
    }
  }
  const wrap_outputArray = function(func) {
    return wrap_outputString(func, false)
  }
  /*
    argNum : n
    func(x0, ..., x_(n-1), buf, ioMode)
    => func(x0, ..., x_(n-1), pos, buf.length, ioMode)
  */
  const wrap_input = function(func, argNum, returnValue = false) {
    return function() {
      const args = [...arguments]
      let buf = args[argNum]
      let ioMode = args[argNum + 1] // may undefined
      let stack = mod.Runtime.stackSave()
      let pos = mod.Runtime.stackAlloc(buf.length)
      if (typeof(buf) == "string") {
        AsciiStrToMem(pos, buf)
      } else {
        Uint8ArrayToMem(pos, buf)
      }
      let r = func(...args.slice(0, argNum), pos, buf.length, ioMode)
      mod.Runtime.stackRestore(stack)
      if (returnValue) return r
      if (r) throw('err wrap_input ' + buf)
    }
  }
  const callSetter = function(func, a, p1, p2) {
    let pos = mod._malloc(a.length * 4)
    func(pos, p1, p2) // p1, p2 may be undefined
    copyToUint32Array(a, pos)
    mod._free(pos)
  }
  const callGetter = function(func, a, p1, p2) {
    let pos = mod._malloc(a.length * 4)
    mod.HEAP32.set(a, pos / 4)
    let s = func(pos, p1, p2)
    mod._free(pos)
    return s
  }
  const define_extra_functions = function(mod) {
    capi.mclBnFr_malloc = function() {
      return mod._malloc(MCLBN_FP_SIZE)
    }
    capi.mcl_free = function(x) {
      mod._free(x)
    }
    capi.mclBnFr_deserialize = wrap_input(capi._mclBnFr_deserialize, 1)
    capi.mclBnFr_setLittleEndian = wrap_input(capi._mclBnFr_setLittleEndian, 1)
    capi.mclBnFr_setStr = wrap_input(capi._mclBnFr_setStr, 1)
    capi.mclBnFr_getStr = wrap_outputString(capi._mclBnFr_getStr)
    capi.mclBnFr_setHashOf = wrap_input(capi._mclBnFr_setHashOf, 1)

    ///////////////////////////////////////////////////////////////
    capi.mclBnG1_malloc = function() {
      return mod._malloc(MCLBN_G1_SIZE)
    }
    capi.mclBnG1_setStr = wrap_input(capi._mclBnG1_setStr, 1)
    capi.mclBnG1_getStr = wrap_outputString(capi._mclBnG1_getStr)
    capi.mclBnG1_deserialize = wrap_input(capi._mclBnG1_deserialize, 1)
    capi.mclBnG1_serialize = wrap_outputArray(capi._mclBnG1_serialize)
    capi.mclBnG1_hashAndMapTo = wrap_input(capi._mclBnG1_hashAndMapTo, 1)

    ///////////////////////////////////////////////////////////////
    capi.mclBnG2_malloc = function() {
      return mod._malloc(MCLBN_G2_SIZE)
    }
    capi.mclBnG2_setStr = wrap_input(capi._mclBnG2_setStr, 1)
    capi.mclBnG2_getStr = wrap_outputString(capi._mclBnG2_getStr)
    capi.mclBnG2_deserialize = wrap_input(capi._mclBnG2_deserialize, 1)
    capi.mclBnG2_serialize = wrap_outputArray(capi._mclBnG2_serialize)
    capi.mclBnG2_hashAndMapTo = wrap_input(capi._mclBnG2_hashAndMapTo, 1)

    ///////////////////////////////////////////////////////////////
    capi.mclBnGT_malloc = function() {
      return mod._malloc(MCLBN_GT_SIZE)
    }
    capi.mclBnGT_deserialize = wrap_input(capi._mclBnGT_deserialize, 1)
    capi.mclBnGT_serialize = wrap_outputArray(capi._mclBnGT_serialize)
    capi.mclBnGT_setStr = wrap_input(capi._mclBnGT_setStr, 1)
    capi.mclBnGT_getStr = wrap_outputString(capi._mclBnGT_getStr)
    ///////////////////////////////////////////////////////////////

    class Common {
      constructor(size) {
        this.a_ = new Uint32Array(size / 4)
      }
      fromHexStr(s) {
        this.deserialize(exports.fromHexStr(s))
      }
      toHexStr() {
        return exports.toHexStr(this.serialize())
      }
      dump(msg = '') {
        console.log(msg + this.toHexStr())
      }
    }
  }
  return exports
})
