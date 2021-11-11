const { _free, _malloc, mod, toHexStr, fromHexStr } = require('./mcl')
const { MCLBN_FP_SIZE, MCLBN_FR_SIZE, MCLBN_G1_SIZE, MCLBN_G2_SIZE, MCLBN_GT_SIZE } = require('./constants')
const getRandomValues = require('./getRandomValues')

class Common {
  constructor (size) {
    this.a_ = new Uint32Array(size / 4)
  }

  deserializeHexStr (s) {
    this.deserialize(fromHexStr(s))
  }

  serializeToHexStr () {
    return toHexStr(this.serialize())
  }

  dump (msg = '') {
    console.log(msg + this.serializeToHexStr())
  }

  clear () {
    this.a_.fill(0)
  }

  // copy to allocated memory
  copyToMem (pos) {
    mod.HEAP32.set(this.a_, pos / 4)
  }

  // copy from allocated memory
  copyFromMem (pos) {
    this.a_.set(mod.HEAP32.subarray(pos / 4, pos / 4 + this.a_.length))
  }

  // alloc new array
  _alloc () {
    return _malloc(this.a_.length * 4)
  }

  // alloc and copy a_ to mod.HEAP32[pos / 4]
  _allocAndCopy () {
    const pos = this._alloc()
    mod.HEAP32.set(this.a_, pos / 4)
    return pos
  }

  // save pos to a_
  _save (pos) {
    this.a_.set(mod.HEAP32.subarray(pos / 4, pos / 4 + this.a_.length))
  }

  // save and free
  _saveAndFree (pos) {
    this._save(pos)
    _free(pos)
  }

  // set parameter (p1, p2 may be undefined)
  _setter (func, p1, p2) {
    const pos = this._alloc()
    const r = func(pos, p1, p2)
    this._saveAndFree(pos)
    if (r) throw new Error('_setter err')
  }

  // getter (p1, p2 may be undefined)
  _getter (func, p1, p2) {
    const pos = this._allocAndCopy()
    const s = func(pos, p1, p2)
    _free(pos)
    return s
  }

  _isEqual (func, rhs) {
    const xPos = this._allocAndCopy()
    const yPos = rhs._allocAndCopy()
    const r = func(xPos, yPos)
    _free(yPos)
    _free(xPos)
    return r === 1
  }

  // func(y, this) and return y
  _op1 (func) {
    const y = new this.constructor()
    const xPos = this._allocAndCopy()
    const yPos = y._alloc()
    func(yPos, xPos)
    y._saveAndFree(yPos)
    _free(xPos)
    return y
  }

  // func(z, this, y) and return z
  _op2 (func, y, Cstr = null) {
    const z = Cstr ? new Cstr() : new this.constructor()
    const xPos = this._allocAndCopy()
    const yPos = y._allocAndCopy()
    const zPos = z._alloc()
    func(zPos, xPos, yPos)
    z._saveAndFree(zPos)
    _free(yPos)
    _free(xPos)
    return z
  }

  // devide Uint32Array a into n and chose the idx-th
  _getSubArray (idx, n) {
    const d = this.a_.length / n
    return new Uint32Array(this.a_.buffer, d * idx * 4, d)
  }

  // set array lhs to idx
  _setSubArray (lhs, idx, n) {
    const d = this.a_.length / n
    this.a_.set(lhs.a_, d * idx)
  }
}
exports.Fr = class extends Common {
  constructor () {
    super(MCLBN_FR_SIZE)
  }

  setInt (x) {
    this._setter(mod._mclBnFr_setInt32, x)
  }

  deserialize (s) {
    this._setter(mod.mclBnFr_deserialize, s)
  }

  serialize () {
    return this._getter(mod.mclBnFr_serialize)
  }

  setStr (s, base = 0) {
    this._setter(mod.mclBnFr_setStr, s, base)
  }

  getStr (base = 0) {
    return this._getter(mod.mclBnFr_getStr, base)
  }

  isZero () {
    return this._getter(mod._mclBnFr_isZero) === 1
  }

  isOne () {
    return this._getter(mod._mclBnFr_isOne) === 1
  }

  isEqual (rhs) {
    return this._isEqual(mod._mclBnFr_isEqual, rhs)
  }

  setLittleEndian (s) {
    this._setter(mod.mclBnFr_setLittleEndian, s)
  }

  setLittleEndianMod (s) {
    this._setter(mod.mclBnFr_setLittleEndianMod, s)
  }

  setBigEndianMod (s) {
    this._setter(mod.mclBnFr_setBigEndianMod, s)
  }

  setByCSPRNG () {
    const a = new Uint8Array(MCLBN_FR_SIZE)
    getRandomValues(a)
    this.setLittleEndian(a)
  }

  setHashOf (s) {
    this._setter(mod.mclBnFr_setHashOf, s)
  }
}
exports.deserializeHexStrToFr = s => {
  const r = new exports.Fr()
  r.deserializeHexStr(s)
  return r
}
exports.Fp = class extends Common {
  constructor () {
    super(MCLBN_FP_SIZE)
  }

  setInt (x) {
    this._setter(mod._mclBnFp_setInt32, x)
  }

  deserialize (s) {
    this._setter(mod.mclBnFp_deserialize, s)
  }

  serialize () {
    return this._getter(mod.mclBnFp_serialize)
  }

  setStr (s, base = 0) {
    this._setter(mod.mclBnFp_setStr, s, base)
  }

  getStr (base = 0) {
    return this._getter(mod.mclBnFp_getStr, base)
  }

  isEqual (rhs) {
    return this._isEqual(mod._mclBnFp_isEqual, rhs)
  }

  setLittleEndian (s) {
    this._setter(mod.mclBnFp_setLittleEndian, s)
  }

  setLittleEndianMod (s) {
    this._setter(mod.mclBnFp_setLittleEndianMod, s)
  }

  setBigEndianMod (s) {
    this._setter(mod.mclBnFp_setBigEndianMod, s)
  }

  setByCSPRNG () {
    const a = new Uint8Array(MCLBN_FP_SIZE)
    getRandomValues(a)
    this.setLittleEndian(a)
  }

  setHashOf (s) {
    this._setter(mod.mclBnFp_setHashOf, s)
  }

  mapToG1 () {
    const y = new exports.G1()
    const xPos = this._allocAndCopy()
    const yPos = y._alloc()
    mod._mclBnFp_mapToG1(yPos, xPos)
    y._saveAndFree(yPos)
    _free(xPos)
    return y
  }
}
exports.deserializeHexStrToFp = s => {
  const r = new exports.Fp()
  r.deserializeHexStr(s)
  return r
}
exports.Fp2 = class extends Common {
  constructor () {
    super(MCLBN_FP_SIZE * 2)
  }

  setInt (x, y) {
    const v = new exports.Fp()
    v.setInt(x)
    this.set_a(v)
    v.setInt(y)
    this.set_b(v)
  }

  deserialize (s) {
    this._setter(mod.mclBnFp2_deserialize, s)
  }

  serialize () {
    return this._getter(mod.mclBnFp2_serialize)
  }

  isEqual (rhs) {
    return this._isEqual(mod._mclBnFp2_isEqual, rhs)
  }

  /*
    x = a + bi where a, b in Fp and i^2 = -1
  */
  get_a () {
    const r = new exports.Fp()
    r.a_ = this._getSubArray(0, 2)
    return r
  }

  get_b () {
    const r = new exports.Fp()
    r.a_ = this._getSubArray(1, 2)
    return r
  }

  set_a (v) {
    this._setSubArray(v, 0, 2)
  }

  set_b (v) {
    this._setSubArray(v, 1, 2)
  }

  mapToG2 () {
    const y = new exports.G2()
    const xPos = this._allocAndCopy()
    const yPos = y._alloc()
    mod._mclBnFp2_mapToG2(yPos, xPos)
    y._saveAndFree(yPos)
    _free(xPos)
    return y
  }
}
exports.deserializeHexStrToFp2 = s => {
  const r = new exports.Fp2()
  r.deserializeHexStr(s)
  return r
}
exports.G1 = class extends Common {
  constructor () {
    super(MCLBN_G1_SIZE)
  }

  deserialize (s) {
    this._setter(mod.mclBnG1_deserialize, s)
  }

  serialize () {
    return this._getter(mod.mclBnG1_serialize)
  }

  setStr (s, base = 0) {
    this._setter(mod.mclBnG1_setStr, s, base)
  }

  getStr (base = 0) {
    return this._getter(mod.mclBnG1_getStr, base)
  }

  normalize () {
    this.a_ = exports.normalize(this).a_
  }

  getX () {
    const r = new exports.Fp()
    r.a_ = this._getSubArray(0, 3)
    return r
  }

  getY () {
    const r = new exports.Fp()
    r.a_ = this._getSubArray(1, 3)
    return r
  }

  getZ () {
    const r = new exports.Fp()
    r.a_ = this._getSubArray(2, 3)
    return r
  }

  setX (v) {
    this._setSubArray(v, 0, 3)
  }

  setY (v) {
    this._setSubArray(v, 1, 3)
  }

  setZ (v) {
    this._setSubArray(v, 2, 3)
  }

  isZero () {
    return this._getter(mod._mclBnG1_isZero) === 1
  }

  isValid () {
    return this._getter(mod._mclBnG1_isValid) === 1
  }

  isValidOrder () {
    return this._getter(mod._mclBnG1_isValidOrder) === 1
  }

  isEqual (rhs) {
    return this._isEqual(mod._mclBnG1_isEqual, rhs)
  }

  setHashOf (s) {
    this._setter(mod.mclBnG1_hashAndMapTo, s)
  }
}
exports.deserializeHexStrToG1 = s => {
  const r = new exports.G1()
  r.deserializeHexStr(s)
  return r
}
exports.setETHserialization = (ETHserialization) => {
  mod._mclBn_setETHserialization(ETHserialization ? 1 : 0)
}
// mode = mcl.IRTF for Ethereum 2.0 spec
exports.setMapToMode = (mode) => {
  mod._mclBn_setMapToMode(mode)
}
exports.verifyOrderG1 = (doVerify) => {
  mod._mclBn_verifyOrderG1(doVerify ? 1 : 0)
}
exports.verifyOrderG2 = (doVerify) => {
  mod._mclBn_verifyOrderG2(doVerify ? 1 : 0)
}
exports.getBasePointG1 = () => {
  const x = new exports.G1()
  const xPos = x._alloc()
  mod._mclBnG1_getBasePoint(xPos)
  x._saveAndFree(xPos)
  if (x.isZero()) {
    throw new Error('not supported for pairing curves')
  }
  return x
}
exports.G2 = class extends Common {
  constructor () {
    super(MCLBN_G2_SIZE)
  }

  deserialize (s) {
    this._setter(mod.mclBnG2_deserialize, s)
  }

  serialize () {
    return this._getter(mod.mclBnG2_serialize)
  }

  setStr (s, base = 0) {
    this._setter(mod.mclBnG2_setStr, s, base)
  }

  getStr (base = 0) {
    return this._getter(mod.mclBnG2_getStr, base)
  }

  normalize () {
    this.a_ = exports.normalize(this).a_
  }

  getX () {
    const r = new exports.Fp2()
    r.a_ = this._getSubArray(0, 3)
    return r
  }

  getY () {
    const r = new exports.Fp2()
    r.a_ = this._getSubArray(1, 3)
    return r
  }

  getZ () {
    const r = new exports.Fp2()
    r.a_ = this._getSubArray(2, 3)
    return r
  }

  setX (v) {
    this._setSubArray(v, 0, 3)
  }

  setY (v) {
    this._setSubArray(v, 1, 3)
  }

  setZ (v) {
    this._setSubArray(v, 2, 3)
  }

  isZero () {
    return this._getter(mod._mclBnG2_isZero) === 1
  }

  isValid () {
    return this._getter(mod._mclBnG2_isValid) === 1
  }

  isValidOrder () {
    return this._getter(mod._mclBnG2_isValidOrder) === 1
  }

  isEqual (rhs) {
    return this._isEqual(mod._mclBnG2_isEqual, rhs)
  }

  setHashOf (s) {
    this._setter(mod.mclBnG2_hashAndMapTo, s)
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
    this._setter(mod._mclBnGT_setInt32, x)
  }

  deserialize (s) {
    this._setter(mod.mclBnGT_deserialize, s)
  }

  serialize () {
    return this._getter(mod.mclBnGT_serialize)
  }

  setStr (s, base = 0) {
    this._setter(mod.mclBnGT_setStr, s, base)
  }

  getStr (base = 0) {
    return this._getter(mod.mclBnGT_getStr, base)
  }

  isZero () {
    return this._getter(mod._mclBnGT_isZero) === 1
  }

  isOne () {
    return this._getter(mod._mclBnGT_isOne) === 1
  }

  isEqual (rhs) {
    return this._isEqual(mod._mclBnGT_isEqual, rhs)
  }
}
exports.deserializeHexStrToGT = s => {
  const r = new exports.GT()
  r.deserializeHexStr(s)
  return r
}
exports.PrecomputedG2 = class {
  constructor (Q) {
    if (!(Q instanceof exports.G2)) throw new Error('PrecomputedG2:bad type')
    const byteSize = mod._mclBn_getUint64NumToPrecompute() * 8
    this.p = _malloc(byteSize)
    const Qpos = Q._allocAndCopy()
    mod._mclBn_precomputeG2(this.p, Qpos)
    _free(Qpos)
  }

  /*
    call destroy if PrecomputedG2 is not necessary
    to avoid memory leak
  */
  destroy () {
    _free(this.p)
    this.p = null
  }
}
exports.neg = x => {
  if (x instanceof exports.Fr) {
    return x._op1(mod._mclBnFr_neg)
  }
  if (x instanceof exports.Fp) {
    return x._op1(mod._mclBnFp_neg)
  }
  if (x instanceof exports.G1) {
    return x._op1(mod._mclBnG1_neg)
  }
  if (x instanceof exports.G2) {
    return x._op1(mod._mclBnG2_neg)
  }
  if (x instanceof exports.GT) {
    return x._op1(mod._mclBnGT_neg)
  }
  if (x instanceof exports.Fp2) {
    return x._op1(mod._mclBnFp2_neg)
  }
  throw new Error('neg:bad type')
}
exports.sqr = x => {
  if (x instanceof exports.Fp) {
    return x._op1(mod._mclBnFp_sqr)
  }
  if (x instanceof exports.Fr) {
    return x._op1(mod._mclBnFr_sqr)
  }
  if (x instanceof exports.GT) {
    return x._op1(mod._mclBnGT_sqr)
  }
  if (x instanceof exports.Fp2) {
    return x._op1(mod._mclBnFp2_sqr)
  }
  throw new Error('sqr:bad type')
}
exports.inv = x => {
  if (x instanceof exports.Fp) {
    return x._op1(mod._mclBnFp_inv)
  }
  if (x instanceof exports.Fr) {
    return x._op1(mod._mclBnFr_inv)
  }
  if (x instanceof exports.GT) {
    return x._op1(mod._mclBnGT_inv)
  }
  if (x instanceof exports.Fp2) {
    return x._op1(mod._mclBnFp2_inv)
  }
  throw new Error('inv:bad type')
}
exports.normalize = x => {
  if (x instanceof exports.G1) {
    return x._op1(mod._mclBnG1_normalize)
  }
  if (x instanceof exports.G2) {
    return x._op1(mod._mclBnG2_normalize)
  }
  throw new Error('normalize:bad type')
}
exports.add = (x, y) => {
  if (x.constructor !== y.constructor) throw new Error('add:mismatch type')
  if (x instanceof exports.Fp) {
    return x._op2(mod._mclBnFp_add, y)
  }
  if (x instanceof exports.Fr) {
    return x._op2(mod._mclBnFr_add, y)
  }
  if (x instanceof exports.G1) {
    return x._op2(mod._mclBnG1_add, y)
  }
  if (x instanceof exports.G2) {
    return x._op2(mod._mclBnG2_add, y)
  }
  if (x instanceof exports.GT) {
    return x._op2(mod._mclBnGT_add, y)
  }
  if (x instanceof exports.Fp2) {
    return x._op2(mod._mclBnFp2_add, y)
  }
  throw new Error('add:bad type')
}
exports.sub = (x, y) => {
  if (x.constructor !== y.constructor) throw new Error('sub:mismatch type')
  if (x instanceof exports.Fp) {
    return x._op2(mod._mclBnFp_sub, y)
  }
  if (x instanceof exports.Fr) {
    return x._op2(mod._mclBnFr_sub, y)
  }
  if (x instanceof exports.G1) {
    return x._op2(mod._mclBnG1_sub, y)
  }
  if (x instanceof exports.G2) {
    return x._op2(mod._mclBnG2_sub, y)
  }
  if (x instanceof exports.GT) {
    return x._op2(mod._mclBnGT_sub, y)
  }
  if (x instanceof exports.Fp2) {
    return x._op2(mod._mclBnFp2_sub, y)
  }
  throw new Error('sub:bad type')
}
/*
  Fr * Fr
  G1 * Fr ; scalar mul
  G2 * Fr ; scalar mul
  GT * GT
*/
exports.mul = (x, y) => {
  if (x instanceof exports.Fp && y instanceof exports.Fp) {
    return x._op2(mod._mclBnFp_mul, y)
  }
  if (x instanceof exports.Fr && y instanceof exports.Fr) {
    return x._op2(mod._mclBnFr_mul, y)
  }
  if (x instanceof exports.G1 && y instanceof exports.Fr) {
    return x._op2(mod._mclBnG1_mul, y)
  }
  if (x instanceof exports.G2 && y instanceof exports.Fr) {
    return x._op2(mod._mclBnG2_mul, y)
  }
  if (x instanceof exports.GT && y instanceof exports.GT) {
    return x._op2(mod._mclBnGT_mul, y)
  }
  if (x instanceof exports.Fp2 && y instanceof exports.Fp2) {
    return x._op2(mod._mclBnFp2_mul, y)
  }
  throw new Error('mul:mismatch type')
}

const _mulVec = (func, xVec, yVec, Cstr) => {
  const n = xVec.length
  if (n != yVec.length) throw new Error(`err _mulVec bad length ${n}, ${yVec.length}`)
  const xSize = xVec[0].a_.length
  const ySize = yVec[0].a_.length
  const z = new Cstr()
  const zPos = z._alloc()
  const xPos = _malloc(xSize * n * 4)
  const yPos = _malloc(ySize * n * 4)
  let pos = xPos / 4
  for (let i = 0; i < n; i++) {
    mod.HEAP32.set(xVec[i].a_, pos)
    pos += xSize
  }
  pos = yPos / 4
  for (let i = 0; i < n; i++) {
    mod.HEAP32.set(yVec[i].a_, pos)
    pos += ySize
  }
  func(zPos, xPos, yPos, n)
  _free(yPos)
  _free(xPos)
  z._saveAndFree(zPos)
  return z
}

/*
  sum G1 * Fr ; scalar mul
  sum G2 * Fr ; scalar mul
*/
exports.mulVec = (xVec, yVec) => {
  if (xVec.length == 0) throw new Error('mulVec:zero array')
  if (xVec[0] instanceof exports.G1 && yVec[0] instanceof exports.Fr) {
    return _mulVec(mod._mclBnG1_mulVec, xVec, yVec, exports.G1)
  }
  if (xVec[0] instanceof exports.G2 && yVec[0] instanceof exports.Fr) {
    return _mulVec(mod._mclBnG2_mulVec, xVec, yVec, exports.G2)
  }
  throw new Error('mulVec:mismatch type')
}
exports.div = (x, y) => {
  if (x.constructor !== y.constructor) throw new Error('div:mismatch type')
  if (x instanceof exports.Fp) {
    return x._op2(mod._mclBnFp_div, y)
  }
  if (x instanceof exports.Fr) {
    return x._op2(mod._mclBnFr_div, y)
  }
  if (x instanceof exports.GT) {
    return x._op2(mod._mclBnGT_div, y)
  }
  if (x instanceof exports.Fp2) {
    return x._op2(mod._mclBnFp2_div, y)
  }
  throw new Error('div:bad type')
}
exports.dbl = x => {
  if (x instanceof exports.G1) {
    return x._op1(mod._mclBnG1_dbl)
  }
  if (x instanceof exports.G2) {
    return x._op1(mod._mclBnG2_dbl)
  }
  throw new Error('dbl:bad type')
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
    return x._op2(mod._mclBnGT_pow, y)
  }
  throw new Error('pow:bad type')
}
// pairing(G1 P, G2 Q)
exports.pairing = (P, Q) => {
  if (P instanceof exports.G1 && Q instanceof exports.G2) {
    return P._op2(mod._mclBn_pairing, Q, exports.GT)
  }
  throw new Error('exports.pairing:bad type')
}
// millerLoop(G1 P, G2 Q)
exports.millerLoop = (P, Q) => {
  if (P instanceof exports.G1 && Q instanceof exports.G2) {
    return P._op2(mod._mclBn_millerLoop, Q, exports.GT)
  }
  throw new Error('exports.millerLoop:bad type')
}
exports.precomputedMillerLoop = (P, Qcoeff) => {
  if (!(P instanceof exports.G1 && Qcoeff instanceof exports.PrecomputedG2)) throw new Error('exports.precomputedMillerLoop:bad type')
  const e = new exports.GT()
  const PPos = P._allocAndCopy()
  const ePos = e._alloc()
  mod._mclBn_precomputedMillerLoop(ePos, PPos, Qcoeff.p)
  e._saveAndFree(ePos)
  _free(PPos)
  return e
}
// millerLoop(P1, Q1coeff) * millerLoop(P2, Q2coeff)
exports.precomputedMillerLoop2 = (P1, Q1coeff, P2, Q2coeff) => {
  if (!(P1 instanceof exports.G1 && Q1coeff instanceof exports.PrecomputedG2 && P2 instanceof exports.G1 && Q2coeff instanceof exports.PrecomputedG2)) throw new Error('exports.precomputedMillerLoop2mixed:bad type')
  const e = new exports.GT()
  const P1Pos = P1._allocAndCopy()
  const P2Pos = P2._allocAndCopy()
  const ePos = e._alloc()
  mod._mclBn_precomputedMillerLoop2(ePos, P1Pos, Q1coeff.p, P2Pos, Q2coeff.p)
  e._saveAndFree(ePos)
  _free(P1Pos)
  _free(P2Pos)
  return e
}
// millerLoop(P1, Q1) * millerLoop(P2, Q2coeff)
exports.precomputedMillerLoop2mixed = (P1, Q1, P2, Q2coeff) => {
  if (!(P1 instanceof exports.G1 && Q1 instanceof exports.G2 && P2 instanceof exports.G1 && Q2coeff instanceof exports.PrecomputedG2)) throw new Error('exports.precomputedMillerLoop2mixed:bad type')
  const e = new exports.GT()
  const P1Pos = P1._allocAndCopy()
  const Q1Pos = Q1._allocAndCopy()
  const P2Pos = P2._allocAndCopy()
  const ePos = e._alloc()
  mod._mclBn_precomputedMillerLoop2mixed(ePos, P1Pos, Q1Pos, P2Pos, Q2coeff.p)
  e._saveAndFree(ePos)
  _free(P1Pos)
  _free(Q1Pos)
  _free(P2Pos)
  return e
}
exports.finalExp = x => {
  if (x instanceof exports.GT) {
    return x._op1(mod._mclBn_finalExp)
  }
  throw new Error('finalExp:bad type')
}
