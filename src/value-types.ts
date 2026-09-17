import { mod, stackSave, stackRestore, copyToHeap32, copyFromHeap32, salloc, sallocCopy, sallocBytes, sallocArray, saveArray, callSetter, callGetter, callGetter2, callOp1, callOp2, callShare, callRecover, callSetInput, callGetStr, callDeserialize, callSerialize, toHexStr, fromHexStr } from './mcl'
import { MCLBN_FP_SIZE, MCLBN_FR_SIZE, MCLBN_G1_SIZE, MCLBN_G2_SIZE, MCLBN_GT_SIZE } from './constants'
import getRandomValues from './getRandomValues'

abstract class Common {
  /** @internal */
  public a_: Uint32Array

  constructor (size: number) {
    this.a_ = new Uint32Array(size / 4)
  }

  deserializeHexStr (s: string): void {
    this.deserialize(fromHexStr(s))
  }

  serializeToHexStr (): string {
    return toHexStr(this.serialize())
  }

  dump (msg = ''): void {
    console.log(msg + this.serializeToHexStr())
  }

  clear (): void {
    this.a_.fill(0)
  }

  // copy to allocated memory
  copyToMem (pos: number): void {
    copyToHeap32(this.a_, pos)
  }

  // copy from allocated memory
  copyFromMem (pos: number): void {
    copyFromHeap32(this.a_, pos)
  }

  abstract setStr (s: string, base?: number): void
  abstract getStr (base?: number): string
  abstract isEqual (rhs: this): boolean
  abstract isZero (): boolean
  abstract deserialize (v: Uint8Array): void
  abstract serialize (): Uint8Array
  abstract setHashOf (a: string | Uint8Array): void

  // internal methods

  /** @internal alloc new array */
  _alloc (): number {
    return mod._malloc(this.a_.length * 4)
  }

  /** @internal stack alloc new array */
  _salloc (): number {
    return salloc(this.a_)
  }

  /** @internal alloc and copy a_ to HEAP32[pos / 4] */
  _allocAndCopy (): number {
    const pos = this._alloc()
    copyToHeap32(this.a_, pos)
    return pos
  }

  /** @internal stack alloc and copy a_ to HEAP32[pos / 4] */
  _sallocAndCopy (): number {
    return sallocCopy(this.a_)
  }

  /** @internal save pos to a_ */
  _save (pos: number): void {
    copyFromHeap32(this.a_, pos)
  }

  /** @internal save and free */
  _saveAndFree (pos: number): void {
    this._save(pos)
    mod._free(pos)
  }

  /** @internal set parameter */
  _setter (func: Function, p1?: any, p2?: any): void {
    callSetter(func, this.a_, p1, p2)
  }

  /** @internal getter */
  _getter (func: Function, p1?: any, p2?: any): any {
    return callGetter(func, this.a_, p1, p2)
  }

  /** @internal this = func(buf) ; buf is a string or Uint8Array */
  _setInput (func: Function, buf: string | Uint8Array, ioMode?: number): void {
    callSetInput(func, this.a_, buf, ioMode)
  }

  /** @internal return string of this */
  _getStr (func: Function, ioMode?: number): string {
    return callGetStr(func, this.a_, ioMode)
  }

  /** @internal this = deserialize(buf) */
  _deserialize (func: Function, buf: Uint8Array): void {
    callDeserialize(func, this.a_, buf)
  }

  /** @internal return serialized this */
  _serialize (func: Function): Uint8Array {
    return callSerialize(func, this.a_)
  }

  /** @internal */
  _isEqual (func: (xPos: number, yPos: number) => number, rhs: Common): boolean {
    return callGetter2(func, this.a_, rhs.a_) === 1
  }

  /** @internal func(y, this) and return y */
  _op1 (func: (yPos: number, xPos: number) => void): any {
    const y = new (this.constructor as any)()
    callOp1(func, y.a_, this.a_)
    return y
  }

  /** @internal func(z, this, y) and return z */
  _op2 (func: (zPos: number, xPos: number, yPos: number) => void, y: Common, Cstr: (new () => Common) | null = null): any {
    const z = Cstr !== null ? new Cstr() : new (this.constructor as new () => Common)()
    callOp2(func, z.a_, this.a_, y.a_)
    return z
  }

  /** @internal r = func(y, this) and return (true, b) if r = true else (false, null) */
  _squareRoot (func: (yPos: number, xPos: number) => number): [boolean, any] {
    const y = new (this.constructor as any)()
    const r = callOp1(func, y.a_, this.a_)
    return r === 0 ? [true, y] : [false, null]
  }

  /** @internal devide Uint32Array a into n and chose the idx-th */
  _getSubArray (idx: number, n: number): Uint32Array {
    const d = this.a_.length / n
    // return new Uint32Array(this.a_.buffer, d * idx * 4, d) // err : return reference to the buffer
    // correct : make new buffer and copy it
    return new Uint32Array(new Uint32Array(this.a_.buffer, d * idx * 4, d))
  }

  /** @internal set array lhs to idx */
  _setSubArray (lhs: Common, idx: number, n: number): void {
    const d = this.a_.length / n
    this.a_.set(lhs.a_, d * idx)
  }
}

abstract class IntType extends Common {
  abstract setInt (x: number): void
  abstract isOne (): boolean
  abstract setLittleEndian (a: Uint8Array): void
  abstract setLittleEndianMod (a: Uint8Array): void
  abstract setBigEndianMod (a: Uint8Array): void
  abstract setByCSPRNG (): void
}

interface HasArray {
  a_: Uint32Array
}

const _cloneArray = <T extends HasArray> (x: T): T => {
  const Cstr = x.constructor as new () => T
  const r = new Cstr()
  r.a_.set(x.a_)
  return r
}

export class Fr extends IntType {
  constructor () {
    super(MCLBN_FR_SIZE)
  }

  clone (): Fr { return _cloneArray<Fr>(this) }

  setInt (x: number): void {
    this._setter(mod._mclBnFr_setInt32, x)
  }

  deserialize (s: Uint8Array): void {
    this._deserialize(mod._mclBnFr_deserialize, s)
  }

  serialize (): Uint8Array {
    return this._serialize(mod._mclBnFr_serialize)
  }

  setStr (s: string, base = 0): void {
    this._setInput(mod._mclBnFr_setStr, s, base)
  }

  getStr (base = 0): string {
    return this._getStr(mod._mclBnFr_getStr, base)
  }

  isZero (): boolean {
    return this._getter(mod._mclBnFr_isZero) === 1
  }

  isOne (): boolean {
    return this._getter(mod._mclBnFr_isOne) === 1
  }

  isEqual (rhs: this): boolean {
    return this._isEqual(mod._mclBnFr_isEqual, rhs)
  }

  setLittleEndian (a: Uint8Array): void {
    this._setInput(mod._mclBnFr_setLittleEndian, a)
  }

  setLittleEndianMod (a: Uint8Array): void {
    this._setInput(mod._mclBnFr_setLittleEndianMod, a)
  }

  setBigEndianMod (a: Uint8Array): void {
    this._setInput(mod._mclBnFr_setBigEndianMod, a)
  }

  setByCSPRNG (): void {
    const a = new Uint8Array(MCLBN_FR_SIZE)
    getRandomValues(a)
    this.setLittleEndian(a)
  }

  setHashOf (s: string | Uint8Array): void {
    this._setInput(mod._mclBnFr_setHashOf, s)
  }
}

export interface Fr {
  /** to distinct Fp and Fr for typescript */
  __Fr: never
}

export const deserializeHexStrToFr = (s: string): Fr => {
  const r = new Fr()
  r.deserializeHexStr(s)
  return r
}

export class Fp extends IntType {
  constructor () {
    super(MCLBN_FP_SIZE)
  }

  clone (): Fp { return _cloneArray<Fp>(this) }

  setInt (x: number): void {
    this._setter(mod._mclBnFp_setInt32, x)
  }

  deserialize (s: Uint8Array): void {
    this._deserialize(mod._mclBnFp_deserialize, s)
  }

  serialize (): Uint8Array {
    return this._serialize(mod._mclBnFp_serialize)
  }

  setStr (s: string, base = 0): void {
    this._setInput(mod._mclBnFp_setStr, s, base)
  }

  getStr (base = 0): string {
    return this._getStr(mod._mclBnFp_getStr, base)
  }

  isOne (): boolean {
    return this._getter(mod._mclBnFp_isOne) === 1
  }

  isZero (): boolean {
    return this._getter(mod._mclBnFp_isZero) === 1
  }

  isEqual (rhs: this): boolean {
    return this._isEqual(mod._mclBnFp_isEqual, rhs)
  }

  setLittleEndian (a: Uint8Array): void {
    this._setInput(mod._mclBnFp_setLittleEndian, a)
  }

  setLittleEndianMod (a: Uint8Array): void {
    this._setInput(mod._mclBnFp_setLittleEndianMod, a)
  }

  setBigEndianMod (a: Uint8Array): void {
    this._setInput(mod._mclBnFp_setBigEndianMod, a)
  }

  setByCSPRNG (): void {
    const a = new Uint8Array(MCLBN_FP_SIZE)
    getRandomValues(a)
    this.setLittleEndian(a)
  }

  setHashOf (s: string | Uint8Array): void {
    this._setInput(mod._mclBnFp_setHashOf, s)
  }

  mapToG1 (): G1 {
    const y = new G1()
    const stack = stackSave()
    const xPos = this._sallocAndCopy()
    const yPos = y._salloc()
    mod._mclBnFp_mapToG1(yPos, xPos)
    y._save(yPos)
    stackRestore(stack)
    return y
  }
}

export interface Fp {
  /** to distinct Fp and Fr for typescript */
  __Fp: never
}

export const deserializeHexStrToFp = (s: string): Fp => {
  const r = new Fp()
  r.deserializeHexStr(s)
  return r
}

export class Fp2 extends Common {
  constructor () {
    super(MCLBN_FP_SIZE * 2)
  }

  clone (): Fp2 { return _cloneArray<Fp2>(this) }

  setInt (x: number, y: number): void {
    const v = new Fp()
    v.setInt(x)
    this.set_a(v)
    v.setInt(y)
    this.set_b(v)
  }

  deserialize (s: Uint8Array): void {
    this._deserialize(mod._mclBnFp2_deserialize, s)
  }

  serialize (): Uint8Array {
    return this._serialize(mod._mclBnFp2_serialize)
  }

  getStr (base = 0): string {
    return this.get_a().getStr(base) + ' ' + this.get_b().getStr(base)
  }

  setStr (s: string, base = 0): void {
    const ss = s.split(' ')
    if (ss.length !== 2) throw new Error('bad str')
    const v = new Fp()
    v.setStr(ss[0], base)
    this.set_a(v)
    v.setStr(ss[1], base)
    this.set_b(v)
  }

  isEqual (rhs: this): boolean {
    return this._isEqual(mod._mclBnFp2_isEqual, rhs)
  }

  isZero (): boolean {
    return this._getter(mod._mclBnFp2_isZero) === 1
  }

  isOne (): boolean {
    return this._getter(mod._mclBnFp2_isOne) === 1
  }

  setHashOf (s: string | Uint8Array): void {
    throw new Error('Fp2.setHashOf is not supported')
  }

  /*
    x = a + bi where a, b in Fp and i^2 = -1
  */
  get_a (): Fp {
    const r = new Fp()
    r.a_ = this._getSubArray(0, 2)
    return r
  }

  get_b (): Fp {
    const r = new Fp()
    r.a_ = this._getSubArray(1, 2)
    return r
  }

  set_a (v: Fp): void {
    this._setSubArray(v, 0, 2)
  }

  set_b (v: Fp): void {
    this._setSubArray(v, 1, 2)
  }

  mapToG2 (): G2 {
    const y = new G2()
    const stack = stackSave()
    const xPos = this._sallocAndCopy()
    const yPos = y._salloc()
    mod._mclBnFp2_mapToG2(yPos, xPos)
    y._save(yPos)
    stackRestore(stack)
    return y
  }
}

export const deserializeHexStrToFp2 = (s: string): Fp2 => {
  const r = new Fp2()
  r.deserializeHexStr(s)
  return r
}

abstract class EllipticType extends Common {
  abstract normalize (): void
  abstract isValid (): boolean
  abstract isValidOrder (): boolean
}

export class G1 extends EllipticType {
  constructor () {
    super(MCLBN_G1_SIZE)
  }

  clone (): G1 { return _cloneArray<G1>(this) }

  deserialize (s: Uint8Array): void {
    this._deserialize(mod._mclBnG1_deserialize, s)
  }

  serialize (): Uint8Array {
    return this._serialize(mod._mclBnG1_serialize)
  }

  setStr (s: string, base = 0): void {
    this._setInput(mod._mclBnG1_setStr, s, base)
  }

  getStr (base = 0): string {
    return this._getStr(mod._mclBnG1_getStr, base)
  }

  normalize (): void {
    this.a_ = normalize(this).a_
  }

  getX (): Fp {
    const r = new Fp()
    r.a_ = this._getSubArray(0, 3)
    return r
  }

  getY (): Fp {
    const r = new Fp()
    r.a_ = this._getSubArray(1, 3)
    return r
  }

  getZ (): Fp {
    const r = new Fp()
    r.a_ = this._getSubArray(2, 3)
    return r
  }

  setX (v: Fp): void {
    this._setSubArray(v, 0, 3)
  }

  setY (v: Fp): void {
    this._setSubArray(v, 1, 3)
  }

  setZ (v: Fp): void {
    this._setSubArray(v, 2, 3)
  }

  isZero (): boolean {
    return this._getter(mod._mclBnG1_isZero) === 1
  }

  isValid (): boolean {
    return this._getter(mod._mclBnG1_isValid) === 1
  }

  isValidOrder (): boolean {
    return this._getter(mod._mclBnG1_isValidOrder) === 1
  }

  isEqual (rhs: this): boolean {
    return this._isEqual(mod._mclBnG1_isEqual, rhs)
  }

  setHashOf (s: string | Uint8Array): void {
    this._setInput(mod._mclBnG1_hashAndMapTo, s)
  }
}

export const deserializeHexStrToG1 = (s: string): G1 => {
  const r = new G1()
  r.deserializeHexStr(s)
  return r
}

export const setETHserialization = (ETHserialization: boolean): void => {
  mod._mclBn_setETHserialization(ETHserialization ? 1 : 0)
}

// mode = mcl.IRTF for Ethereum 2.0 spec
export const setMapToMode = (mode: number): void => {
  mod._mclBn_setMapToMode(mode)
}

export const verifyOrderG1 = (doVerify: boolean): void => {
  mod._mclBn_verifyOrderG1(doVerify ? 1 : 0)
}

export const verifyOrderG2 = (doVerify: boolean): void => {
  mod._mclBn_verifyOrderG2(doVerify ? 1 : 0)
}

export const getBasePointG1 = (): G1 => {
  const x = new G1()
  callSetter(mod._mclBnG1_getBasePoint, x.a_)
  if (x.isZero()) {
    throw new Error('not supported for pairing curves')
  }
  return x
}

export class G2 extends EllipticType {
  constructor () {
    super(MCLBN_G2_SIZE)
  }

  clone (): G2 { return _cloneArray<G2>(this) }

  deserialize (s: Uint8Array): void {
    this._deserialize(mod._mclBnG2_deserialize, s)
  }

  serialize (): Uint8Array {
    return this._serialize(mod._mclBnG2_serialize)
  }

  setStr (s: string, base = 0): void {
    this._setInput(mod._mclBnG2_setStr, s, base)
  }

  getStr (base = 0): string {
    return this._getStr(mod._mclBnG2_getStr, base)
  }

  normalize (): void {
    this.a_ = normalize(this).a_
  }

  getX (): Fp2 {
    const r = new Fp2()
    r.a_ = this._getSubArray(0, 3)
    return r
  }

  getY (): Fp2 {
    const r = new Fp2()
    r.a_ = this._getSubArray(1, 3)
    return r
  }

  getZ (): Fp2 {
    const r = new Fp2()
    r.a_ = this._getSubArray(2, 3)
    return r
  }

  setX (v: Fp2): void {
    this._setSubArray(v, 0, 3)
  }

  setY (v: Fp2): void {
    this._setSubArray(v, 1, 3)
  }

  setZ (v: Fp2): void {
    this._setSubArray(v, 2, 3)
  }

  isZero (): boolean {
    return this._getter(mod._mclBnG2_isZero) === 1
  }

  isValid (): boolean {
    return this._getter(mod._mclBnG2_isValid) === 1
  }

  isValidOrder (): boolean {
    return this._getter(mod._mclBnG2_isValidOrder) === 1
  }

  isEqual (rhs: this): boolean {
    return this._isEqual(mod._mclBnG2_isEqual, rhs)
  }

  setHashOf (s: string | Uint8Array): void {
    this._setInput(mod._mclBnG2_hashAndMapTo, s)
  }
}

export const deserializeHexStrToG2 = (s: string): G2 => {
  const r = new G2()
  r.deserializeHexStr(s)
  return r
}

export class GT extends Common {
  constructor () {
    super(MCLBN_GT_SIZE)
  }

  clone (): GT { return _cloneArray<GT>(this) }

  setInt (x: number): void {
    this._setter(mod._mclBnGT_setInt32, x)
  }

  deserialize (s: Uint8Array): void {
    this._deserialize(mod._mclBnGT_deserialize, s)
  }

  serialize (): Uint8Array {
    return this._serialize(mod._mclBnGT_serialize)
  }

  setStr (s: string, base = 0): void {
    this._setInput(mod._mclBnGT_setStr, s, base)
  }

  getStr (base = 0): string {
    return this._getStr(mod._mclBnGT_getStr, base)
  }

  isZero (): boolean {
    return this._getter(mod._mclBnGT_isZero) === 1
  }

  isOne (): boolean {
    return this._getter(mod._mclBnGT_isOne) === 1
  }

  isEqual (rhs: this): boolean {
    return this._isEqual(mod._mclBnGT_isEqual, rhs)
  }

  setHashOf (s: string | Uint8Array): void {
    throw new Error('GT.setHashOf is not supported')
  }
}

export const deserializeHexStrToGT = (s: string): GT => {
  const r = new GT()
  r.deserializeHexStr(s)
  return r
}

export class PrecomputedG2 {
  /** @internal */
  p: number | null

  constructor (Q: G2) {
    if (!(Q instanceof G2)) throw new Error('PrecomputedG2:bad type')
    const byteSize = mod._mclBn_getUint64NumToPrecompute() * 8
    this.p = mod._malloc(byteSize) // keep this address
    const stack = stackSave()
    try {
      const Qpos = sallocCopy(Q.a_)
      mod._mclBn_precomputeG2(this.p, Qpos)
    } finally {
      stackRestore(stack)
    }
  }

  /*
    call destroy if PrecomputedG2 is not necessary
    to avoid memory leak
  */
  destroy (): void {
    if (this.p != null) mod._free(this.p)
    this.p = null
  }
}

export const neg = <T extends Fr | Fp | G1 | G2 | GT | Fp2>(x: T): T => {
  if (x instanceof Fr) {
    return x._op1(mod._mclBnFr_neg)
  }
  if (x instanceof Fp) {
    return x._op1(mod._mclBnFp_neg)
  }
  if (x instanceof G1) {
    return x._op1(mod._mclBnG1_neg)
  }
  if (x instanceof G2) {
    return x._op1(mod._mclBnG2_neg)
  }
  if (x instanceof GT) {
    return x._op1(mod._mclBnGT_neg)
  }
  if (x instanceof Fp2) {
    return x._op1(mod._mclBnFp2_neg)
  }
  throw new Error('neg:bad type')
}

export const sqr = <T extends Fp | Fr | GT | Fp2>(x: T): T => {
  if (x instanceof Fp) {
    return x._op1(mod._mclBnFp_sqr)
  }
  if (x instanceof Fr) {
    return x._op1(mod._mclBnFr_sqr)
  }
  if (x instanceof GT) {
    return x._op1(mod._mclBnGT_sqr)
  }
  if (x instanceof Fp2) {
    return x._op1(mod._mclBnFp2_sqr)
  }
  throw new Error('sqr:bad type')
}

export const inv = <T extends Fp | Fr | GT | Fp2>(x: T): T => {
  if (x instanceof Fp) {
    return x._op1(mod._mclBnFp_inv)
  }
  if (x instanceof Fr) {
    return x._op1(mod._mclBnFr_inv)
  }
  if (x instanceof GT) {
    return x._op1(mod._mclBnGT_inv)
  }
  if (x instanceof Fp2) {
    return x._op1(mod._mclBnFp2_inv)
  }
  throw new Error('inv:bad type')
}

export const squareRoot = <T extends Fp | Fr | Fp2>(x: T): [boolean, T] => {
  if (x instanceof Fp) {
    return x._squareRoot(mod._mclBnFp_squareRoot)
  }
  if (x instanceof Fr) {
    return x._squareRoot(mod._mclBnFr_squareRoot)
  }
  if (x instanceof Fp2) {
    return x._squareRoot(mod._mclBnFp2_squareRoot)
  }
  throw new Error('squareRoot:bad type')
}

export const normalize = <T extends G1 | G2>(x: T): T => {
  if (x instanceof G1) {
    return x._op1(mod._mclBnG1_normalize)
  }
  if (x instanceof G2) {
    return x._op1(mod._mclBnG2_normalize)
  }
  throw new Error('normalize:bad type')
}

export const add = <T extends Fp | Fr | G1 | G2 | GT | Fp2>(x: T, y: T): T => {
  if (x.constructor !== y.constructor) throw new Error('add:mismatch type')
  if (x instanceof Fp) {
    return x._op2(mod._mclBnFp_add, y)
  }
  if (x instanceof Fr) {
    return x._op2(mod._mclBnFr_add, y)
  }
  if (x instanceof G1) {
    return x._op2(mod._mclBnG1_add, y)
  }
  if (x instanceof G2) {
    return x._op2(mod._mclBnG2_add, y)
  }
  if (x instanceof GT) {
    return x._op2(mod._mclBnGT_add, y)
  }
  if (x instanceof Fp2) {
    return x._op2(mod._mclBnFp2_add, y)
  }
  throw new Error('add:bad type')
}

export const sub = <T extends Fp | Fr | G1 | G2 | GT | Fp2>(x: T, y: T): T => {
  if (x.constructor !== y.constructor) throw new Error('sub:mismatch type')
  if (x instanceof Fp) {
    return x._op2(mod._mclBnFp_sub, y)
  }
  if (x instanceof Fr) {
    return x._op2(mod._mclBnFr_sub, y)
  }
  if (x instanceof G1) {
    return x._op2(mod._mclBnG1_sub, y)
  }
  if (x instanceof G2) {
    return x._op2(mod._mclBnG2_sub, y)
  }
  if (x instanceof GT) {
    return x._op2(mod._mclBnGT_sub, y)
  }
  if (x instanceof Fp2) {
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
export function mul (x: Fr, y: Fr): Fr
export function mul (x: Fp, y: Fp): Fp
export function mul (x: Fp2, y: Fp2): Fp2
export function mul (x: G1, y: Fr): G1
export function mul (x: G2, y: Fr): G2
export function mul (x: GT, y: GT): GT
export function mul (x: Common, y: Common): Common {
  if (x instanceof Fp && y instanceof Fp) {
    return x._op2(mod._mclBnFp_mul, y)
  }
  if (x instanceof Fr && y instanceof Fr) {
    return x._op2(mod._mclBnFr_mul, y)
  }
  if (x instanceof G1 && y instanceof Fr) {
    return x._op2(mod._mclBnG1_mul, y)
  }
  if (x instanceof G2 && y instanceof Fr) {
    return x._op2(mod._mclBnG2_mul, y)
  }
  if (x instanceof GT && y instanceof GT) {
    return x._op2(mod._mclBnGT_mul, y)
  }
  if (x instanceof Fp2 && y instanceof Fp2) {
    return x._op2(mod._mclBnFp2_mul, y)
  }
  throw new Error('mul:mismatch type')
}

/*
  Fr * uint32 ; multiply by a small unsigned integer (0 <= y < 2^32)
  Fp * uint32
*/
export function mulUnit (x: Fr, y: number): Fr
export function mulUnit (x: Fp, y: number): Fp
export function mulUnit (x: Fr | Fp, y: number): Fr | Fp {
  if (!Number.isInteger(y) || y < 0 || y > 0xffffffff) throw new Error(`mulUnit:bad y=${y}`)
  if (x instanceof Fr) {
    return _mulUnit(mod._mclBnFr_mulUnit, x, y)
  }
  if (x instanceof Fp) {
    return _mulUnit(mod._mclBnFp_mulUnit, x, y)
  }
  throw new Error('mulUnit:mismatch type')
}

// z = func(x, y) where y is a uint32
const _mulUnit = <T extends Fr | Fp>(func: (zPos: number, xPos: number, y: number) => void, x: T, y: number): T => {
  const z = new (x.constructor as new () => T)()
  callOp1(func, z.a_, x.a_, y)
  return z
}

// array of the internal buffers of v (for sallocArray / saveArray)
const _toArrays = (v: Common[]): Uint32Array[] => v.map(x => x.a_)

const _mulVec = <T extends G1 | G2>(func: (zPos: number, xPos: number, yPos: number, n: number) => void, xVec: T[], yVec: Fr[], Cstr: any): T => {
  const n = xVec.length
  const z = new Cstr()
  const stack = stackSave()
  try {
    const zPos = salloc(z.a_)
    const xPos = sallocArray(_toArrays(xVec))
    const yPos = sallocArray(_toArrays(yVec))
    func(zPos, xPos, yPos, n)
    copyFromHeap32(z.a_, zPos)
    return z
  } finally {
    stackRestore(stack)
  }
}

/*
  sum G1 * Fr ; scalar mul
  sum G2 * Fr ; scalar mul
*/
export const mulVec = <T extends G1 | G2>(xVec: T[], yVec: Fr[]): T => {
  const n = xVec.length
  if (n === 0) throw new Error('mulVec:zero array')
  if (n !== yVec.length) throw new Error(`err _mulVec bad length ${n}, ${yVec.length}`)
  if (xVec[0] instanceof G1 && yVec[0] instanceof Fr) {
    return _mulVec(mod._mclBnG1_mulVec, xVec, yVec, G1)
  }
  if (xVec[0] instanceof G2 && yVec[0] instanceof Fr) {
    return _mulVec(mod._mclBnG2_mulVec, xVec, yVec, G2)
  }
  throw new Error('mulVec:mismatch type')
}

// wrap invVec and normalizeVec API
const _invVec = <T extends Fr | Fp | G1 | G2>(func: Function, yVec: T[], xVec: T[]): void => {
  const n = xVec.length
  const stack = stackSave()
  try {
    const xPos = sallocArray(_toArrays(xVec))
    func(xPos, xPos, n)
    saveArray(_toArrays(yVec), xPos)
  } finally {
    stackRestore(stack)
  }
}

export const invVecInPlace = <T extends Fr | Fp>(xVec: T[]): void => {
  const n = xVec.length
  if (n === 0) return
  if (xVec[0] instanceof Fr) {
    _invVec(mod._mclBnFr_invVec, xVec, xVec)
    return
  }
  if (xVec[0] instanceof Fp) {
    _invVec(mod._mclBnFp_invVec, xVec, xVec)
    return
  }
  throw new Error('invVec: bad type')
}

export const invVec = <T extends Fr | Fp>(xVec: T[]): T[] => {
  const n = xVec.length
  if (n === 0) return []
  const Cstr = xVec[0].constructor as new () => T
  const yVec = Array.from({ length: n }, _ => new Cstr())
  if (xVec[0] instanceof Fr) {
    _invVec(mod._mclBnFr_invVec, yVec, xVec)
    return yVec
  }
  if (xVec[0] instanceof Fp) {
    _invVec(mod._mclBnFp_invVec, yVec, xVec)
    return yVec
  }
  throw new Error('invVec: bad type')
}

// faster than normalizing each one individually
// inplace only
export const normalizeVec = <T extends G1 | G2>(xVec: T[]): void => {
  const n = xVec.length
  if (n === 0) return
  if (xVec[0] instanceof G1) {
    _invVec(mod._mclBnG1_normalizeVec, xVec, xVec)
    return
  }
  if (xVec[0] instanceof G2) {
    _invVec(mod._mclBnG2_normalizeVec, xVec, xVec)
    return
  }
  throw new Error('normalizeVec: bad type')
}

export function div (x: Fr, y: Fr): Fr
export function div (x: Fp, y: Fp): Fp
export function div (x: Fp2, y: Fp2): Fp2
export function div (x: GT, y: GT): GT
export function div (x: Common, y: Common): Common {
  if (x.constructor !== y.constructor) throw new Error('div:mismatch type')
  if (x instanceof Fp) {
    return x._op2(mod._mclBnFp_div, y)
  }
  if (x instanceof Fr) {
    return x._op2(mod._mclBnFr_div, y)
  }
  if (x instanceof GT) {
    return x._op2(mod._mclBnGT_div, y)
  }
  if (x instanceof Fp2) {
    return x._op2(mod._mclBnFp2_div, y)
  }
  throw new Error('div:bad type')
}

export const dbl = <T extends G1 | G2>(x: T): T => {
  if (x instanceof G1) {
    return x._op1(mod._mclBnG1_dbl)
  }
  if (x instanceof G2) {
    return x._op1(mod._mclBnG2_dbl)
  }
  throw new Error('dbl:bad type')
}

export const hashToFr = (s: string | Uint8Array): Fr => {
  const x = new Fr()
  x.setHashOf(s)
  return x
}

export const hashAndMapToG1 = (s: string | Uint8Array): G1 => {
  const x = new G1()
  x.setHashOf(s)
  return x
}

export const hashAndMapToG2 = (s: string | Uint8Array): G2 => {
  const x = new G2()
  x.setHashOf(s)
  return x
}

const IntToArray = (_x: bigint | number): Uint8Array => {
  let x = typeof _x === 'number' ? BigInt(_x) : _x
  if (x < 0n) {
    throw new Error('IntToArray: negative value')
  }
  if (x === 0n) return new Uint8Array(1)
  const a = []
  while (x !== 0n) {
    a.push(Number(BigInt.asUintN(8, x)))
    x >>= 8n
  }
  return new Uint8Array(a)
}

const _powArray = <T extends Fr | Fp> (powArray: Function, x: T, _y: Number | BigInt): T => {
  const Cstr = x.constructor as new () => T
  const z = new Cstr()
  const y = IntToArray(_y.valueOf())
  const stack = stackSave()
  try {
    const zPos = salloc(z.a_)
    const xPos = sallocCopy(x.a_)
    const yPos = sallocBytes(y)
    const r = powArray(zPos, xPos, yPos, y.length)
    copyFromHeap32(z.a_, zPos)
    if (r < 0) throw new Error('powArray err')
    return z
  } finally {
    stackRestore(stack)
  }
}

export function pow (x: Fr, y: Fr | Number | BigInt): Fr
export function pow (x: Fp, y: Fp | Number | BigInt): Fp
export function pow (x: GT, y: Fr): GT
export function pow (x: Common, y: Common | Number | BigInt): Common {
  if (x instanceof Fr) {
    if (y instanceof Fr) {
      return x._op2(mod._mclBnFr_pow, y)
    } else if (typeof (y) === 'number' || typeof (y) === 'bigint') {
      return _powArray<Fr>(mod._mclBnFr_powArray, x, y)
    }
  }
  if (x instanceof Fp) {
    if (y instanceof Fp) {
      return x._op2(mod._mclBnFp_pow, y)
    } else if (typeof (y) === 'number' || typeof (y) === 'bigint') {
      return _powArray<Fp>(mod._mclBnFp_powArray, x, y)
    }
  }
  if (x instanceof GT && y instanceof Fr) {
    return x._op2(mod._mclBnGT_pow, y)
  }
  throw new Error('pow:bad type')
}

export const pairing = (P: G1, Q: G2): GT => {
  if (P instanceof G1 && Q instanceof G2) {
    return P._op2(mod._mclBn_pairing, Q, GT)
  }
  throw new Error('exports.pairing:bad type')
}

export const millerLoop = (P: G1, Q: G2): GT => {
  if (P instanceof G1 && Q instanceof G2) {
    return P._op2(mod._mclBn_millerLoop, Q, GT)
  }
  throw new Error('exports.millerLoop:bad type')
}

export const precomputedMillerLoop = (P: G1, Qcoeff: PrecomputedG2): GT => {
  if (!(P instanceof G1 && Qcoeff instanceof PrecomputedG2)) throw new Error('exports.precomputedMillerLoop:bad type')
  const e = new GT()
  const stack = stackSave()
  const PPos = P._sallocAndCopy()
  const ePos = e._salloc()
  mod._mclBn_precomputedMillerLoop(ePos, PPos, Qcoeff.p)
  e._save(ePos)
  stackRestore(stack)
  return e
}

// millerLoop(P1, Q1coeff) * millerLoop(P2, Q2coeff)
export const precomputedMillerLoop2 = (P1: G1, Q1coeff: PrecomputedG2, P2: G1, Q2coeff: PrecomputedG2): GT => {
  if (!(P1 instanceof G1 && Q1coeff instanceof PrecomputedG2 && P2 instanceof G1 && Q2coeff instanceof PrecomputedG2)) throw new Error('exports.precomputedMillerLoop2mixed:bad type')
  const e = new GT()
  const stack = stackSave()
  const P1Pos = P1._sallocAndCopy()
  const P2Pos = P2._sallocAndCopy()
  const ePos = e._salloc()
  mod._mclBn_precomputedMillerLoop2(ePos, P1Pos, Q1coeff.p, P2Pos, Q2coeff.p)
  e._save(ePos)
  stackRestore(stack)
  return e
}

// millerLoop(P1, Q1) * millerLoop(P2, Q2coeff)
export const precomputedMillerLoop2mixed = (P1: G1, Q1: G2, P2: G1, Q2coeff: PrecomputedG2): GT => {
  if (!(P1 instanceof G1 && Q1 instanceof G2 && P2 instanceof G1 && Q2coeff instanceof PrecomputedG2)) throw new Error('exports.precomputedMillerLoop2mixed:bad type')
  const e = new GT()
  const stack = stackSave()
  const P1Pos = P1._sallocAndCopy()
  const Q1Pos = Q1._sallocAndCopy()
  const P2Pos = P2._sallocAndCopy()
  const ePos = e._salloc()
  mod._mclBn_precomputedMillerLoop2mixed(ePos, P1Pos, Q1Pos, P2Pos, Q2coeff.p)
  e._save(ePos)
  stackRestore(stack)
  return e
}

export const finalExp = (x: GT): GT => {
  if (x instanceof GT) {
    return x._op1(mod._mclBn_finalExp)
  }
  throw new Error('finalExp:bad type')
}

function _callShare<T extends Common> (CstrT: new() => T, func: Function, vec: T[], id: Fr): T {
  const a = new CstrT()
  callShare(func, a.a_, _toArrays(vec), id.a_)
  return a
}

function _callRecover<T extends Common> (CstrT: new() => T, func: Function, idVec: Fr[], yVec: T[]): T {
  const k = yVec.length
  if (k !== idVec.length) throw new Error('recover:bad length')
  const a = new CstrT()
  const r: number = callRecover(func, a.a_, _toArrays(idVec), _toArrays(yVec))
  if (r !== 0) throw new Error('callRecover')
  return a
}

export const shareFr = (vec: Fr[], id: Fr): Fr => {
  return _callShare(Fr, mod._mclBn_FrEvaluatePolynomial, vec, id)
}
export const shareG1 = (vec: G1[], id: Fr): G1 => {
  return _callShare(G1, mod._mclBn_G1EvaluatePolynomial, vec, id)
}
export const shareG2 = (vec: G2[], id: Fr): G2 => {
  return _callShare(G2, mod._mclBn_G2EvaluatePolynomial, vec, id)
}
export const recoverFr = (idVec: Fr[], yVec: Fr[]): Fr => {
  return _callRecover(Fr, mod._mclBn_FrLagrangeInterpolation, idVec, yVec)
}
export const recoverG1 = (idVec: Fr[], yVec: G1[]): G1 => {
  return _callRecover(G1, mod._mclBn_G1LagrangeInterpolation, idVec, yVec)
}
export const recoverG2 = (idVec: Fr[], yVec: G2[]): G2 => {
  return _callRecover(G2, mod._mclBn_G2LagrangeInterpolation, idVec, yVec)
}
