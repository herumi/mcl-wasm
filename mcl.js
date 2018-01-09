'use strict';
(generator => {
  if (typeof exports === 'object') {
    const crypto = require('crypto')
    crypto.getRandomValues = crypto.randomFillSync
    generator(exports, crypto, true)
  } else {
    const crypto = window.crypto || window.msCrypto
    const exports = {}
    window.mcl = generator(exports, crypto, false)
  }
})((exports, crypto, isNodeJs) => {
  const MCLBN_FP_UNIT_SIZE = 4 // set 6 if you want to use MCLBN_CURVE_FP382_1

  /* eslint-disable */
  const MCLBN_CURVE_FP254BNB = 0
  const MCLBN_CURVE_FP382_1 = 1
  const MCLBN_CURVE_FP382_2 = 2
  /* eslint-disable */

  const MCLBN_FP_SIZE = MCLBN_FP_UNIT_SIZE * 8
  const MCLBN_G1_SIZE = MCLBN_FP_SIZE * 3
  const MCLBN_G2_SIZE = MCLBN_FP_SIZE * 6
  const MCLBN_GT_SIZE = MCLBN_FP_SIZE * 12

  const setup = (exports, curveType) => {
    const mod = exports.mod

    const ptrToStr = (pos, n) => {
      let s = ''
      for (let i = 0; i < n; i++) {
        s += String.fromCharCode(mod.HEAP8[pos + i])
      }
      return s
    }
    const Uint8ArrayToMem = (pos, buf) => {
      for (let i = 0; i < buf.length; i++) {
        mod.HEAP8[pos + i] = buf[i]
      }
    }
    const AsciiStrToMem = (pos, s) => {
      for (let i = 0; i < s.length; i++) {
        mod.HEAP8[pos + i] = s.charCodeAt(i)
      }
    }
    const copyToUint32Array = (a, pos) => {
      a.set(mod.HEAP32.subarray(pos / 4, pos / 4 + a.length))
//    for (let i = 0; i < a.length; i++) {
//      a[i] = mod.HEAP32[pos / 4 + i]
//    }
    }
    const copyFromUint32Array = (pos, a) => {
      for (let i = 0; i < a.length; i++) {
        mod.HEAP32[pos / 4 + i] = a[i]
      }
    }
    exports.toHex = (a, start, n) => {
      let s = ''
      for (let i = 0; i < n; i++) {
        s += ('0' + a[start + i].toString(16)).slice(-2)
      }
      return s
    }
    // Uint8Array to hex string
    exports.toHexStr = a => {
      return exports.toHex(a, 0, a.length)
    }
    // hex string to Uint8Array
    exports.fromHexStr = s => {
      if (s.length & 1) throw new Error('fromHexStr:length must be even ' + s.length)
      const n = s.length / 2
      const a = new Uint8Array(n)
      for (let i = 0; i < n; i++) {
        a[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16)
      }
      return a
    }

    const wrapOutputString = (func, doesReturnString = true) => {
      return (x, ioMode = 0) => {
        const maxBufSize = 2048
        const stack = mod.Runtime.stackSave()
        const pos = mod.Runtime.stackAlloc(maxBufSize)
        const n = func(pos, maxBufSize, x, ioMode)
        if (n < 0) {
          throw new Error('err gen_str:' + x)
        }
        if (doesReturnString) {
          const s = ptrToStr(pos, n)
          mod.Runtime.stackRestore(stack)
          return s
        } else {
          const a = new Uint8Array(n)
          for (let i = 0; i < n; i++) {
            a[i] = mod.HEAP8[pos + i]
          }
          mod.Runtime.stackRestore(stack)
          return a
        }
      }
    }
    const wrapOutputArray = func => {
      return wrapOutputString(func, false)
    }
    const wrapDeserialize = func => {
      return (x, buf) => {
        const stack = mod.Runtime.stackSave()
        const pos = mod.Runtime.stackAlloc(buf.length)
        Uint8ArrayToMem(pos, buf)
        const r = func(x, pos, buf.length)
        mod.Runtime.stackRestore(stack)
        if (r === 0) throw new Error('err wrapDeserialize', buf)
      }
    }
    /*
      argNum : n
      func(x0, ..., x_(n-1), buf, ioMode)
      => func(x0, ..., x_(n-1), pos, buf.length, ioMode)
    */
    const wrapIntput = (func, argNum, returnValue = false) => {
      return function () {
        const args = [...arguments]
        const buf = args[argNum]
        const ioMode = args[argNum + 1] // may undefined
        const stack = mod.Runtime.stackSave()
        const pos = mod.Runtime.stackAlloc(buf.length)
        if (typeof (buf) === 'string') {
          AsciiStrToMem(pos, buf)
        } else {
          Uint8ArrayToMem(pos, buf)
        }
        const r = func(...args.slice(0, argNum), pos, buf.length, ioMode)
        mod.Runtime.stackRestore(stack)
        if (returnValue) return r
        if (r) throw new Error('err wrapIntput ' + buf)
      }
    }
    const callSetter = (func, a, p1, p2) => {
      const xPos = mod._malloc(a.length * 4)
      const r = func(xPos, p1, p2) // p1, p2 may be undefined
      copyToUint32Array(a, xPos)
      mod._free(xPos)
      if (r) throw new Error('callSetter err')
    }
    const callState = (func, x) => {
      const xPos = x._getPtr()
      const r = func(xPos)
      mod._free(xPos)
      return r
    }
    const callIsEqual = (func, x, y) => {
      const xPos = x._getPtr()
      const yPos = y._getPtr()
      const r = func(xPos, yPos)
      mod._free(yPos)
      mod._free(xPos)
      return r === 1
    }
    const callGetter = (func, a, p1, p2) => {
      const pos = mod._malloc(a.length * 4)
      mod.HEAP32.set(a, pos / 4)
      const s = func(pos, p1, p2)
      mod._free(pos)
      return s
    }
    // y = func(x)
    const callOp1 = (func, Cstr, x) => {
      const y = new Cstr()
      const stack = mod.Runtime.stackSave()
      const xPos = mod.Runtime.stackAlloc(x.length * 4)
      const yPos = mod.Runtime.stackAlloc(y.a_.length * 4)
      copyFromUint32Array(xPos, x)
      func(yPos, xPos)
      copyToUint32Array(y.a_, yPos)
      mod.Runtime.stackRestore(stack)
      return y
    }
    // z = func(x, y)
    const callOp2 = (func, Cstr, x, y) => {
      const z = new Cstr()
      const stack = mod.Runtime.stackSave()
      const xPos = mod.Runtime.stackAlloc(x.length * 4)
      const yPos = mod.Runtime.stackAlloc(y.length * 4)
      const zPos = mod.Runtime.stackAlloc(z.a_.length * 4)
      copyFromUint32Array(xPos, x)
      copyFromUint32Array(yPos, y)
      func(zPos, xPos, yPos)
      copyToUint32Array(z.a_, zPos)
      mod.Runtime.stackRestore(stack)
      return z
    }
    const callSetHashOf = (func, x, s) => {
      const pos = x._getFreshPtr()
      const r = func(pos, s)
      x._save(pos)
      mod._free(pos)
      if (r) throw new Error('callSetHashOf')
    }

    mod.mclBnFr_malloc = () => {
      return mod._malloc(MCLBN_FP_SIZE)
    }
    exports.free = x => {
      mod._free(x)
    }
    mod.mclBnFr_setLittleEndian = wrapIntput(mod._mclBnFr_setLittleEndian, 1)
    mod.mclBnFr_setStr = wrapIntput(mod._mclBnFr_setStr, 1)
    mod.mclBnFr_getStr = wrapOutputString(mod._mclBnFr_getStr)
    mod.mclBnFr_deserialize = wrapDeserialize(mod._mclBnFr_deserialize)
    mod.mclBnFr_serialize = wrapOutputArray(mod._mclBnFr_serialize)
    mod.mclBnFr_setHashOf = wrapIntput(mod._mclBnFr_setHashOf, 1)

    /// ////////////////////////////////////////////////////////////
    mod.mclBnG1_malloc = () => {
      return mod._malloc(MCLBN_G1_SIZE)
    }
    mod.mclBnG1_setStr = wrapIntput(mod._mclBnG1_setStr, 1)
    mod.mclBnG1_getStr = wrapOutputString(mod._mclBnG1_getStr)
    mod.mclBnG1_deserialize = wrapDeserialize(mod._mclBnG1_deserialize)
    mod.mclBnG1_serialize = wrapOutputArray(mod._mclBnG1_serialize)
    mod.mclBnG1_hashAndMapTo = wrapIntput(mod._mclBnG1_hashAndMapTo, 1)

    /// ////////////////////////////////////////////////////////////
    mod.mclBnG2_malloc = () => {
      return mod._malloc(MCLBN_G2_SIZE)
    }
    mod.mclBnG2_setStr = wrapIntput(mod._mclBnG2_setStr, 1)
    mod.mclBnG2_getStr = wrapOutputString(mod._mclBnG2_getStr)
    mod.mclBnG2_deserialize = wrapDeserialize(mod._mclBnG2_deserialize)
    mod.mclBnG2_serialize = wrapOutputArray(mod._mclBnG2_serialize)
    mod.mclBnG2_hashAndMapTo = wrapIntput(mod._mclBnG2_hashAndMapTo, 1)

    /// ////////////////////////////////////////////////////////////
    mod.mclBnGT_malloc = () => {
      return mod._malloc(MCLBN_GT_SIZE)
    }
    mod.mclBnGT_deserialize = wrapDeserialize(mod._mclBnGT_deserialize)
    mod.mclBnGT_serialize = wrapOutputArray(mod._mclBnGT_serialize)
    mod.mclBnGT_setStr = wrapIntput(mod._mclBnGT_setStr, 1)
    mod.mclBnGT_getStr = wrapOutputString(mod._mclBnGT_getStr)
    /// ////////////////////////////////////////////////////////////

    class Common {
      constructor (size) {
        this.a_ = new Uint32Array(size / 4)
      }
      deserializeHexStr (s) {
        this.deserialize(exports.fromHexStr(s))
      }
      serializeToHexStr () {
        return exports.toHexStr(this.serialize())
      }
      dump (msg = '') {
        console.log(msg + this.serializeToHexStr())
      }
      clear () {
        this.a_.fill(0)
      }
      // get fresh ptr
      _getFreshPtr () {
        return mod._malloc(this.a_.length * 4)
      }
      // get copied ptr
      _getPtr () {
        const pos = mod._malloc(this.a_.length * 4)
        mod.HEAP32.set(this.a_, pos / 4)
        return pos
      }
      // copy to this
      _save (pos) {
        copyToUint32Array(this.a_, pos)
      }
    }
    exports.Fr = class extends Common {
      constructor () {
        super(MCLBN_FP_SIZE)
      }
      setInt (x) {
        callSetter(mod._mclBnFr_setInt32, this.a_, x)
      }
      deserialize (s) {
        callSetter(mod.mclBnFr_deserialize, this.a_, s)
      }
      serialize () {
        return callGetter(mod.mclBnFr_serialize, this.a_)
      }
      setStr (s, base = 10) {
        callSetter(mod.mclBnFr_setStr, this.a_, s, base)
      }
      getStr (base = 10) {
        return callGetter(mod.mclBnFr_getStr, this.a_, base)
      }
      isZero () {
        return callState(mod._mclBnFr_isZero, this) === 1
      }
      isOne () {
        return callState(mod._mclBnFr_isOne, this) === 1
      }
      isEqual (rhs) {
        return callIsEqual(mod._mclBnFr_isEqual, this, rhs)
      }
      setLittleEndian (s) {
        callSetter(mod.mclBnFr_setLittleEndian, this.a_, s)
      }
      setByCSPRNG () {
        let a = new Uint8Array(MCLBN_FP_SIZE)
        crypto.getRandomValues(a)
        this.setLittleEndian(a)
      }
      setHashOf (s) {
        callSetHashOf(mod.mclBnFr_setHashOf, this, s)
      }
    }
    exports.deserializeHexStrToFr = s => {
      const r = new exports.Fr()
      r.deserializeHexStr(s)
      return r
    }
    exports.G1 = class extends Common {
      constructor () {
        super(MCLBN_G1_SIZE)
      }
      deserialize (s) {
        callSetter(mod.mclBnG1_deserialize, this.a_, s)
      }
      serialize () {
        return callGetter(mod.mclBnG1_serialize, this.a_)
      }
      setStr (s, base = 10) {
        callSetter(mod.mclBnG1_setStr, this.a_, s, base)
      }
      getStr (base = 10) {
        return callGetter(mod.mclBnG1_getStr, this.a_, base)
      }
      isZero () {
        return callState(mod._mclBnG1_isZero, this) === 1
      }
      isEqual (rhs) {
        return callIsEqual(mod._mclBnG1_isEqual, this, rhs)
      }
      setHashOf (s) {
        callSetHashOf(mod.mclBnG1_hashAndMapTo, this, s)
      }
    }
    exports.deserializeHexStrToG1 = s => {
      const r = new exports.G1()
      r.deserializeHexStr(s)
      return r
    }
    exports.G2 = class extends Common {
      constructor () {
        super(MCLBN_G2_SIZE)
      }
      deserialize (s) {
        callSetter(mod.mclBnG2_deserialize, this.a_, s)
      }
      serialize () {
        return callGetter(mod.mclBnG2_serialize, this.a_)
      }
      setStr (s, base = 10) {
        callSetter(mod.mclBnG2_setStr, this.a_, s, base)
      }
      getStr (base = 10) {
        return callGetter(mod.mclBnG2_getStr, this.a_, base)
      }
      isZero () {
        return callState(mod._mclBnG2_isZero, this) === 1
      }
      isEqual (rhs) {
        return callIsEqual(mod._mclBnG2_isEqual, this, rhs)
      }
      setHashOf (s) {
        callSetHashOf(mod.mclBnG2_hashAndMapTo, this, s)
      }
    }
    exports.deserializeHexStrToG2 = s => {
      const r = new exports.G2()
      r.deserializeHexStr(s)
      return r
    }
    exports.GT = class extends Common {
      constructor () {
        super(MCLBN_GT_SIZE)
      }
      setInt (x) {
        callSetter(mod._mclBnGT_setInt32, this.a_, x)
      }
      deserialize (s) {
        callSetter(mod.mclBnGT_deserialize, this.a_, s)
      }
      serialize () {
        return callGetter(mod.mclBnGT_serialize, this.a_)
      }
      setStr (s, base = 10) {
        callSetter(mod.mclBnGT_setStr, this.a_, s, base)
      }
      getStr (base = 10) {
        return callGetter(mod.mclBnGT_getStr, this.a_, base)
      }
      isZero () {
        return callState(mod._mclBnGT_isZero, this) === 1
      }
      isOne () {
        return callState(mod._mclBnGT_isOne, this) === 1
      }
      isEqual (rhs) {
        return callIsEqual(mod._mclBnGT_isEqual, this, rhs)
      }
    }
    exports.deserializeHexStrToGT = s => {
      const r = new exports.GT()
      r.deserializeHexStr(s)
      return r
    }
    exports.neg = x => {
      let f = null
      let cstr = null
      if (x instanceof exports.Fr) {
        f = mod._mclBnFr_neg
        cstr = exports.Fr
      } else
      if (x instanceof exports.G1) {
        f = mod._mclBnG1_neg
        cstr = exports.G1
      } else
      if (x instanceof exports.G2) {
        f = mod._mclBnG2_neg
        cstr = exports.G2
      } else
      if (x instanceof exports.GT) {
        f = mod._mclBnGT_neg
        cstr = exports.GT
      }
      return callOp1(f, cstr, x.a_)
    }
    exports.inv = x => {
      let f = null
      let cstr = null
      if (x instanceof exports.Fr) {
        f = mod._mclBnFr_inv
        cstr = exports.Fr
      } else
      if (x instanceof exports.GT) {
        f = mod._mclBnGT_inv
        cstr = exports.GT
      }
      return callOp1(f, cstr, x.a_)
    }
    exports.add = (x, y) => {
      if (x.constructor !== y.constructor) throw new Error('add:bad type')
      let f = null
      let cstr = null
      if (x instanceof exports.Fr) {
        f = mod._mclBnFr_add
        cstr = exports.Fr
      } else
      if (x instanceof exports.G1) {
        f = mod._mclBnG1_add
        cstr = exports.G1
      } else
      if (x instanceof exports.G2) {
        f = mod._mclBnG2_add
        cstr = exports.G2
      } else
      if (x instanceof exports.GT) {
        f = mod._mclBnGT_add
        cstr = exports.GT
      }
      return callOp2(f, cstr, x.a_, y.a_)
    }
    exports.sub = (x, y) => {
      if (x.constructor !== y.constructor) throw new Error('sub:bad type')
      let f = null
      let cstr = null
      if (x instanceof exports.Fr) {
        f = mod._mclBnFr_sub
        cstr = exports.Fr
      } else
      if (x instanceof exports.G1) {
        f = mod._mclBnG1_sub
        cstr = exports.G1
      } else
      if (x instanceof exports.G2) {
        f = mod._mclBnG2_sub
        cstr = exports.G2
      } else
      if (x instanceof exports.GT) {
        f = mod._mclBnGT_sub
        cstr = exports.GT
      }
      return callOp2(f, cstr, x.a_, y.a_)
    }
    /*
      Fr * Fr
      G1 * Fr ; scalar mul
      G2 * Fr ; scalar mul
      GT * GT
    */
    exports.mul = (x, y) => {
      let f = null
      let cstr = null
      if (x instanceof exports.Fr && y instanceof exports.Fr) {
        f = mod._mclBnFr_mul
        cstr = exports.Fr
      } else
      if (x instanceof exports.G1 && y instanceof exports.Fr) {
        f = mod._mclBnG1_mul
        cstr = exports.G1
      } else
      if (x instanceof exports.G2 && y instanceof exports.Fr) {
        f = mod._mclBnG2_mul
        cstr = exports.G2
      } else
      if (x instanceof exports.GT && y instanceof exports.GT) {
        f = mod._mclBnGT_mul
        cstr = exports.GT
      } else {
        throw new Error('mul:bad type')
      }
      return callOp2(f, cstr, x.a_, y.a_)
    }
    exports.div = (x, y) => {
      if (x.constructor !== y.constructor) throw new Error('div:bad type')
      let f = null
      let cstr = null
      if (x instanceof exports.Fr) {
        f = mod._mclBnFr_div
        cstr = exports.Fr
      } else
      if (x instanceof exports.GT) {
        f = mod._mclBnGT_div
        cstr = exports.GT
      }
      return callOp2(f, cstr, x.a_, y.a_)
    }
    exports.dbl = x => {
      let f = null
      let cstr = null
      if (x instanceof exports.G1) {
        f = mod._mclBnG1_dbl
        cstr = exports.G1
      } else
      if (x instanceof exports.G2) {
        f = mod._mclBnG2_dbl
        cstr = exports.G2
      } else {
        throw new Error('dbl:bad type')
      }
      return callOp1(f, cstr, x.a_)
    }
    exports.hashToFr = s => {
      const x = new exports.Fr()
      x.setHashOf(s)
      return x
    }
    exports.hashAndMapToG1 = s => {
      const x = new exports.G1()
      x.setHashOf(s)
      return x
    }
    exports.hashAndMapToG2 = s => {
      const x = new exports.G2()
      x.setHashOf(s)
      return x
    }
    // pow(GT x, Fr y)
    exports.pow = (x, y) => {
      if (x instanceof exports.GT && y instanceof exports.Fr) {
        return callOp2(mod._mclBnGT_pow, exports.GT, x.a_, y.a_)
      }
      throw new Error('exports.pow:bad type')
    }
    // pairing(G1 x, G2 y)
    exports.pairing = (x, y) => {
      if (x instanceof exports.G1 && y instanceof exports.G2) {
        return callOp2(mod._mclBn_pairing, exports.GT, x.a_, y.a_)
      }
      throw new Error('exports.pairing:bad type')
    }
    const r = mod._mclBn_init(curveType, MCLBN_FP_UNIT_SIZE)
    if (r) throw new Error('_mclBn_init err ' + r)
  } // setup()
  exports.init = (curveType = MCLBN_CURVE_FP254BNB) => {
    console.log('init')
    const name = 'mcl_c'
    return new Promise((resolve) => {
      if (isNodeJs) {
        const path = require('path')
        const js = require(`./${name}.js`)
        const Module = {
          wasmBinaryFile: path.join(__dirname, `/${name}.wasm`)
        }
        js(Module)
          .then(_mod => {
            exports.mod = _mod
            setup(exports, curveType)
            resolve()
          })
      } else {
        fetch(`./${name}.wasm`) // eslint-disable-line
          .then(response => response.arrayBuffer())
          .then(buffer => new Uint8Array(buffer))
          .then(() => {
            exports.mod = Module() // eslint-disable-line
            exports.mod.onRuntimeInitialized = () => {
              setup(exports, curveType)
              resolve()
            }
          })
      }
    })
  }
  return exports
})
