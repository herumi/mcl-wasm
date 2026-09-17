'use strict'
const mcl = require('../dist/index.js')
const assert = require('assert')
const { performance } = require('perf_hooks')

async function curveTest (curveType, name) {
  await mcl.init(curveType)
  try {
    console.log(`name=${name}`)
    FrTest()
    G1Test()
    G2Test()
    GTTest()
    FpTest()
    Fp2Test()
    mulVecTest()
    serializeTest()
    IDbasedEncryptionTest()
    PairingTest()
    PairingCapiTest()
    modTest()
    console.log('all ok')
    benchAll()
  } catch (e) {
    console.log(`TEST FAIL ${e}`)
    assert(false)
  }
}

async function stdCurveTest (curveType, name) {
  await mcl.init(curveType)
  try {
    console.log(`name=${name}`)
    arithTest()
  } catch (e) {
    console.log(`TEST FAIL ${e}`)
    assert(false)
  }
}

function arithTest () {
  const P = mcl.getBasePointG1()
  console.log(`basePoint=${P.getStr(16)}`)
  let Q = mcl.add(P, P) // x2
  Q = mcl.add(Q, Q) // x4
  Q = mcl.add(Q, Q) // x8
  Q = mcl.add(Q, P) // x9
  const r = new mcl.Fr()
  r.setStr('9')
  const R = mcl.mul(P, r)
  assert(R.isEqual(Q))
}

async function curveTestAll () {
  await curveTest(mcl.BLS12_381, 'BLS12_381')
}

curveTestAll()

function FrTest () {
  const a = new mcl.Fr()
  a.setInt(5)
  assert.equal(a.getStr(), '5')
  a.setStr('65535')
  assert.equal(a.getStr(), '65535')
  assert.equal(a.getStr(16), 'ffff')
  a.setStr('ff', 16)
  assert.equal(a.getStr(), '255')
  a.setStr('0x10')
  assert.equal(a.getStr(), '16')
  assert.equal(a.getStr(16), '10')
  const b = new mcl.Fr()
  a.setByCSPRNG()
  b.deserialize(a.serialize())
  assert.deepEqual(a.serialize(), b.serialize())
  a.setStr('1000000000020')
  b.setInt(-15)
  assert.equal(mcl.add(a, b).getStr(), '1000000000005')
  assert.equal(mcl.sub(a, b).getStr(), '1000000000035')
  a.setInt(200)
  b.setInt(20)
  assert.equal(mcl.mul(a, b).getStr(), '4000')
  assert.equal(mcl.div(a, b).getStr(), '10')
  assert.equal(mcl.mul(mcl.div(b, a), a).getStr(), '20')
  a.setInt(-123)
  assert.equal(mcl.neg(a).getStr(), '123')
  assert.equal(mcl.mul(a, mcl.inv(a)).getStr(), '1')
  a.setInt(123459)
  assert(mcl.mul(a, a).isEqual(mcl.sqr(a)))

  a.setInt(3)
  assert(!a.isZero())
  assert(!a.isOne())
  a.setInt(1)
  assert(!a.isZero())
  assert(a.isOne())
  a.setInt(0)
  assert(a.isZero())
  assert(!a.isOne())
  a.setInt(5)
  b.setInt(3)
  assert(!a.isEqual(b))
  b.setInt(5)
  assert(a.isEqual(b))

  a.setHashOf('abc')
  a.dump()
  b.setHashOf([97, 98, 99])
  assert(a.isEqual(b))
}

function FpTest () {
  const a = new mcl.Fp()
  a.setHashOf('abc')
  serializeSubTest(mcl.Fp, a, mcl.deserializeHexStrToFp)
  const b = new Uint8Array(a.serialize().length)
  for (let i = 0; i < b.length; i++) {
    b[i] = i
  }
  a.setLittleEndian(b)
  const c = a.serialize()
  // b[b.length - 1] may be masked
  for (let i = 0; i < b.length - 1; i++) {
    assert(b[i] === c[i])
  }
  const P1 = mcl.hashAndMapToG1('abc')
  a.setHashOf('abc')
  const P2 = a.mapToG1()
  assert(P1.isEqual(P2))
}

function Fp2Test () {
  const x = new mcl.Fp2()
  let xs = x.serialize()
  for (let i = 0; i < xs.length; i++) {
    assert(xs[i] === 0)
  }
  const a = new mcl.Fp()
  const b = new mcl.Fp()
  a.setHashOf('abc')
  b.setHashOf('123')
  x.set_a(a)
  x.set_b(b)
  serializeSubTest(mcl.Fp2, x, mcl.deserializeHexStrToFp2)
  xs = x.serialize()
  const as = a.serialize()
  const bs = b.serialize()
  for (let i = 0; i < as.length; i++) {
    assert(xs[i] === as[i])
  }
  const n = xs.length / 2
  for (let i = 0; i < bs.length; i++) {
    assert(xs[n + i] === bs[i])
  }
  const y = new mcl.Fp2()
  y.set_a(x.get_a())
  y.set_b(x.get_b())
  assert(x.isEqual(y))

  /*
    hashAndMapToG2(msg) = [setHashOf(msg), 0].mapToG2()
  */
  const Q1 = mcl.hashAndMapToG2('xyz')
  a.setHashOf('xyz')
  b.clear()
  x.set_a(a)
  x.set_b(b)
  const Q2 = x.mapToG2()
  assert(Q1.isEqual(Q2))
}

function G1Test () {
  const P = new mcl.G1()
  assert(P.isZero())
  P.clear()
  assert(P.isZero())
  P.setHashOf('abc')
  const Q = new mcl.G1()
  Q.setHashOf('abc')
  assert(P.isEqual(Q))
  Q.setHashOf('abcd')
  assert(!P.isEqual(Q))
  let R1 = mcl.add(P, Q)
  let R2 = mcl.add(Q, P)
  assert(R1.isEqual(R2))
  R1 = mcl.sub(R1, R2)
  assert(R1.isZero())
  R1 = mcl.add(P, P) // 3P
  R1 = mcl.add(R1, P)
  const r = new mcl.Fr()
  r.setInt(3)
  R2 = mcl.mul(P, r) // 3P
  assert(R1.isEqual(R2))
  R1 = mcl.dbl(P)
  R2 = mcl.add(P, P)
  assert(R1.isEqual(R2))
  const R3 = mcl.normalize(R1)
  assert(R1.isEqual(R3))
  const R4 = new mcl.G1()
  R4.setX(R1.getX())
  assert(R4.isZero())
  assert(R4.isValid())
  R4.setY(R1.getY())
  assert(R4.isZero())
  assert(R4.isValid())
  R4.setZ(R1.getZ())
  assert(R4.isValid())
  assert(R1.isEqual(R4))
}

function G2Test () {
  const P = new mcl.G2()
  assert(P.isZero())
  P.clear()
  assert(P.isZero())
  P.setHashOf('abc')
  const Q = new mcl.G2()
  Q.setHashOf('abc')
  assert(P.isEqual(Q))
  Q.setHashOf('abcd')
  assert(!P.isEqual(Q))
  let R1 = mcl.add(P, Q)
  let R2 = mcl.add(Q, P)
  assert(R1.isEqual(R2))
  R1 = mcl.sub(R1, R2)
  assert(R1.isZero())
  R1 = mcl.add(P, P) // 3P
  R1 = mcl.add(R1, P)
  const r = new mcl.Fr()
  r.setInt(3)
  R2 = mcl.mul(P, r) // 3P
  assert(R1.isEqual(R2))
  R1 = mcl.dbl(P)
  R2 = mcl.add(P, P)
  assert(R1.isEqual(R2))
  const R3 = mcl.normalize(R1)
  assert(R1.isEqual(R3))
  const R4 = new mcl.G2()
  R4.setX(R1.getX())
  assert(R4.isZero())
  assert(R4.isValid())
  R4.setY(R1.getY())
  assert(R4.isZero())
  assert(R4.isValid())
  R4.setZ(R1.getZ())
  assert(R4.isValid())
  assert(R1.isEqual(R4))
}

function GTTest () {
  const P = new mcl.G1()
  const Q = new mcl.G2()
  P.setHashOf('abc')
  Q.setHashOf('abc')
  const x = mcl.pairing(P, Q)
  const n = 200
  let y = x
  let t = new mcl.Fr()
  t.setInt(1)
  for (let i = 0; i < n; i++) {
    y = mcl.sqr(y)
    t = mcl.add(t, t)
  }
  const z = mcl.pow(x, t)
  assert(y.isEqual(z))
}

function PairingTest () {
  const a = new mcl.Fr()
  const b = new mcl.Fr()

  a.setStr('123')
  b.setStr('456')
  const ab = mcl.mul(a, b)
  assert.equal(ab.getStr(), 123 * 456)

  const P = mcl.hashAndMapToG1('aaa')
  const Q = mcl.hashAndMapToG2('bbb')
  const aP = mcl.mul(P, a)
  const bQ = mcl.mul(Q, b)

  const ePQ = mcl.pairing(P, Q)
  {
    const e2 = mcl.pairing(aP, bQ)
    assert(mcl.pow(ePQ, ab).isEqual(e2))
  }

  // pairing = millerLoop + finalExp
  {
    const e2 = mcl.millerLoop(P, Q)
    const e3 = mcl.finalExp(e2)
    assert(ePQ.isEqual(e3))
  }
  // precompute Q for fixed G2 point
  {
    const Qcoeff = new mcl.PrecomputedG2(Q)
    const e2 = mcl.precomputedMillerLoop(P, Qcoeff)
    const e3 = mcl.finalExp(e2)
    assert(ePQ.isEqual(e3))
    Qcoeff.destroy() // call this function to avoid memory leak
  }
  const P2 = mcl.hashAndMapToG1('ccc')
  const Q2 = mcl.hashAndMapToG2('ddd')
  {
    const Q1coeff = new mcl.PrecomputedG2(Q)
    const Q2coeff = new mcl.PrecomputedG2(Q2)
    const e1 = mcl.mul(mcl.pairing(P, Q), mcl.pairing(P2, Q2))
    let e2 = mcl.precomputedMillerLoop2(P, Q1coeff, P2, Q2coeff)
    e2 = mcl.finalExp(e2)
    let e3 = mcl.precomputedMillerLoop2mixed(P, Q, P2, Q2coeff)
    e3 = mcl.finalExp(e3)
    assert(e1.isEqual(e2))
    assert(e1.isEqual(e3))
    // call this function to avoid memory leak
    Q2coeff.destroy()
    Q1coeff.destroy()
  }
}

function mulVecGeneric (Cstr, xVec, yVec) {
  let z = new Cstr()
  for (let i = 0; i < xVec.length; i++) {
    z = mcl.add(z, mcl.mul(xVec[i], yVec[i]))
  }
  return z
}

function mulVecTest () {
  [1, 2, 3, 15, 30, 100].forEach(n => {
    const xs = []
    const g1s = []
    const g2s = []
    for (let i = 0; i < n; i++) {
      const x = new mcl.Fr()
      x.setByCSPRNG()
      xs.push(x)
      g1s.push(mcl.hashAndMapToG1('A' + String(i)))
      g2s.push(mcl.hashAndMapToG2('A' + String(i)))
    }
    const z1 = mulVecGeneric(mcl.G1, g1s, xs)
    const w1 = mcl.mulVec(g1s, xs)
    assert(z1.isEqual(w1))
    const z2 = mulVecGeneric(mcl.G2, g2s, xs)
    const w2 = mcl.mulVec(g2s, xs)
    assert(z2.isEqual(w2))
    /*
    const C = 100
    bench('mulVecGen', C, () => mulVecGeneric(mcl.G1, g1s, xs))
    bench('mulVecG1',  C, () => mcl.mulVec(g1s, xs))
    bench('mulVecGen', C, () => mulVecGeneric(mcl.G2, g2s, xs))
    bench('mulVecG2',  C, () => mcl.mulVec(g2s, xs))
*/
  })
}

// Enc(m) = [r P, m + h(e(r mpk, H(id)))]
function IDenc (id, P, mpk, m) {
  const r = new mcl.Fr()
  r.setByCSPRNG()
  const Q = mcl.hashAndMapToG2(id)
  const e = mcl.pairing(mcl.mul(mpk, r), Q)
  return [mcl.mul(P, r), mcl.add(m, mcl.hashToFr(e.serialize()))]
}

// Dec([U, v]) = v - h(e(U, sk))
function IDdec (c, sk) {
  const [U, v] = c
  const e = mcl.pairing(U, sk)
  return mcl.sub(v, mcl.hashToFr(e.serialize()))
}

function IDbasedEncryptionTest () {
  // system parameter
  const P = mcl.hashAndMapToG1('1')
  /*
    KeyGen
    msk in Fr ; master secret key
    mpk = msk P in G1 ; master public key
  */
  const msk = new mcl.Fr()
  msk.setByCSPRNG()
  const mpk = mcl.mul(P, msk)

  /*
    user KeyGen
    sk = msk H(id) in G2 ; secret key
  */
  const id = '@herumi'
  const sk = mcl.mul(mcl.hashAndMapToG2(id), msk)

  // encrypt
  const m = new mcl.Fr()
  m.setInt(123)
  const c = IDenc(id, P, mpk, m)
  // decrypt
  const d = IDdec(c, sk)
  assert(d.isEqual(m))
}

function PairingCapiTest () {
  const mod = mcl.mod
  const a = mod.mclBnFr_malloc()
  const b = mod.mclBnFr_malloc()
  const ab = mod.mclBnFr_malloc()
  const P = mod.mclBnG1_malloc()
  const aP = mod.mclBnG1_malloc()
  const Q = mod.mclBnG2_malloc()
  const bQ = mod.mclBnG2_malloc()
  const e1 = mod.mclBnGT_malloc()
  const e2 = mod.mclBnGT_malloc()

  mod.mclBnFr_setStr(a, '123')
  mod.mclBnFr_setStr(b, '456')
  mod._mclBnFr_mul(ab, a, b)
  assert.equal(mod.mclBnFr_getStr(ab), 123 * 456)

  mod.mclBnG1_hashAndMapTo(P, 'aaa')
  mod.mclBnG2_hashAndMapTo(Q, 'bbb')
  mod._mclBnG1_mul(aP, P, a)
  mod._mclBnG2_mul(bQ, Q, b)

  mod._mclBn_pairing(e1, P, Q)
  mod._mclBn_pairing(e2, aP, bQ)
  mod._mclBnGT_pow(e1, e1, ab)
  assert(mod._mclBnGT_isEqual(e1, e2), 'e(aP, bQ) == e(P, Q)^ab')

  mcl.free(e2)
  mcl.free(e1)
  mcl.free(bQ)
  mcl.free(Q)
  mcl.free(aP)
  mcl.free(P)
  mcl.free(ab)
  mcl.free(b)
  mcl.free(a)
}

function serializeSubTest (Cstr, x, newDeserializeHexStr) {
  const y = new Cstr()
  y.deserialize(x.serialize())
  assert(y.isEqual(x))
  y.clear()
  const s = x.serializeToHexStr()
  y.deserializeHexStr(s)
  assert(y.isEqual(x))
  const z = newDeserializeHexStr(s)
  assert(z.isEqual(x))
}

function serializeTest () {
  const a = new mcl.Fr()
  a.setStr('12345678')
  serializeSubTest(mcl.Fr, a, mcl.deserializeHexStrToFr)
  const P = mcl.hashAndMapToG1('abc')
  serializeSubTest(mcl.G1, P, mcl.deserializeHexStrToG1)
  const Q = mcl.hashAndMapToG2('abc')
  serializeSubTest(mcl.G2, Q, mcl.deserializeHexStrToG2)
  const e = mcl.pairing(P, Q)
  serializeSubTest(mcl.GT, e, mcl.deserializeHexStrToGT)
}

function shiftAndSetTest (a, b) {
  a.setStr('1')
  a = mcl.neg(a)
  const s = Array.from(a.serialize())
  s.unshift(0)
  s.unshift(6) // [<-1>data][0][6] = -65536 + 6 = -65530
  a.setLittleEndianMod(s)
  a = mcl.neg(a)
  b.setStr('65530')
  assert(a.isEqual(b))
}
function modTest () {
  {
    const a = new mcl.Fr()
    const b = new mcl.Fr()
    shiftAndSetTest(a, b)
  }
  {
    const a = new mcl.Fp()
    const b = new mcl.Fp()
    shiftAndSetTest(a, b)
  }
}

/*
  benchmark
  Each row shows the time of one call (usec) of the C API (Capi) and
  the TypeScript wrapper (wrapper) for the same function.
  The wrapper time includes the copy of the operands to the wasm stack
  and the copy of the result back to the JS side.
*/

function measure (count, func) {
  const start = performance.now()
  for (let i = 0; i < count; i++) {
    func()
  }
  const end = performance.now()
  return (end - start) * 1000 / count // usec
}

const NAME_WIDTH = 32
const VALUE_WIDTH = 14

function fmtTime (t) {
  if (t === null) return '-'
  return t.toFixed(3)
}

function benchHeader () {
  console.log('name'.padEnd(NAME_WIDTH) + 'Capi(usec)'.padStart(VALUE_WIDTH) + 'wrapper(usec)'.padStart(VALUE_WIDTH))
}

// capiFunc or wrapperFunc may be null if not available
function bench (name, count, capiFunc, wrapperFunc) {
  const capi = capiFunc ? measure(count, capiFunc) : null
  const wrapper = wrapperFunc ? measure(count, wrapperFunc) : null
  console.log(name.padEnd(NAME_WIDTH) + fmtTime(capi).padStart(VALUE_WIDTH) + fmtTime(wrapper).padStart(VALUE_WIDTH))
}

// copy an array of objects to newly malloc'ed wasm memory
function allocArray (v) {
  const size = v[0].a_.length * 4
  const pos = mcl.mod._malloc(size * v.length)
  for (let i = 0; i < v.length; i++) {
    v[i].copyToMem(pos + size * i)
  }
  return pos
}

// copy a Uint8Array to newly malloc'ed wasm memory
function allocBuf (buf) {
  const pos = mcl.mod._malloc(buf.length)
  mcl.mod.HEAP8.set(buf, pos)
  return pos
}

// field (Fr, Fp, Fp2) benchmark
function benchField (name, a, b) {
  const mod = mcl.mod
  const C = 100000
  const C2 = 1000
  let x = b
  const xp = a._allocAndCopy()
  const yp = b._allocAndCopy()
  bench(`${name}::add`, C, () => mod[`_mclBn${name}_add`](yp, yp, xp), () => { x = mcl.add(x, a) })
  bench(`${name}::sub`, C, () => mod[`_mclBn${name}_sub`](yp, yp, xp), () => { x = mcl.sub(x, a) })
  bench(`${name}::mul`, C, () => mod[`_mclBn${name}_mul`](yp, yp, xp), () => { x = mcl.mul(x, a) })
  if (name !== 'Fp2') { // mulUnit is defined for Fr and Fp only
    bench(`${name}::mulUnit`, C, () => mod[`_mclBn${name}_mulUnit`](yp, yp, 100), () => { x = mcl.mulUnit(x, 100) })
  }
  bench(`${name}::sqr`, C, () => mod[`_mclBn${name}_sqr`](yp, yp), () => { x = mcl.sqr(x) })
  bench(`${name}::inv`, C, () => mod[`_mclBn${name}_inv`](yp, yp), () => { x = mcl.inv(x) })
  bench(`${name}::div`, C, () => mod[`_mclBn${name}_div`](yp, yp, xp), () => { x = mcl.div(x, a) })
  x = mcl.sqr(x)
  x.copyToMem(xp)
  bench(`${name}::squareRoot`, C2, () => mod[`_mclBn${name}_squareRoot`](yp, xp), () => { mcl.squareRoot(x) })
  mcl.free(yp)
  mcl.free(xp)
}

// setLittleEndianMod for n-byte inputs (n = 32, 48, 64)
function benchSetMod (name, Cstr) {
  const mod = mcl.mod
  const C = 100000
  const a = new Cstr()
  const xp = a._alloc()
  const le = mod[`_mclBn${name}_setLittleEndianMod`];
  [32, 48, 64].forEach(n => {
    const buf = new Uint8Array(n)
    for (let i = 0; i < n; i++) {
      buf[i] = (i * 37 + 11) & 0xff
    }
    const p = allocBuf(buf)
    bench(`${name}::setLittleEndianMod(${n})`, C, () => le(xp, p, n), () => a.setLittleEndianMod(buf))
    mcl.free(p)
  })
  mcl.free(xp)
}

function benchInvVec (name, Cstr) {
  const mod = mcl.mod
  const n = 1000
  const C = 100
  const x = Array(n)
  x[0] = new Cstr()
  x[0].setStr('1232353525205982904')
  for (let i = 1; i < n; i++) {
    x[i] = mcl.sqr(x[i - 1])
  }
  const xp = allocArray(x)
  const yp = mod._malloc(x[0].a_.length * 4 * n)
  const inv = mod[`_mclBn${name}_invVec`]
  bench(`${name}::invVec(${n})`, C, () => inv(yp, xp, n), () => mcl.invVec(x))
  mcl.free(yp)
  mcl.free(xp)
}

// group (G1, G2) benchmark
function benchGroup (name, Cstr, a) {
  const mod = mcl.mod
  const C = 100000
  const C2 = 1000
  const msg = 'hello wasm'
  const msgBuf = new TextEncoder().encode(msg)
  let P = mcl[`hashAndMapTo${name}`]('abc')
  const P2 = mcl[`hashAndMapTo${name}`]('abce')
  const ap = a._allocAndCopy()
  const pp = P._allocAndCopy()
  const p2p = P2._allocAndCopy()
  const zp = new Cstr()._alloc()
  const msgp = allocBuf(msgBuf)
  bench(`${name}::add`, C, () => mod[`_mclBn${name}_add`](pp, pp, p2p), () => { P = mcl.add(P, P2) })
  bench(`${name}::dbl`, C, () => mod[`_mclBn${name}_dbl`](pp, pp), () => { P = mcl.dbl(P) })
  bench(`${name}::mul`, C2, () => mod[`_mclBn${name}_mul`](pp, pp, ap), () => { P = mcl.mul(P, a) })
  bench(`${name}::normalize`, C2, () => mod[`_mclBn${name}_normalize`](zp, pp), () => mcl.normalize(P))
  bench(`${name}::isValidOrder`, C2, () => mod[`_mclBn${name}_isValidOrder`](pp), () => P.isValidOrder())
  bench(`hashAndMapTo${name}`, C2, () => mod[`_mclBn${name}_hashAndMapTo`](zp, msgp, msgBuf.length), () => mcl[`hashAndMapTo${name}`](msg))
  mcl.free(msgp)
  mcl.free(zp)
  mcl.free(p2p)
  mcl.free(pp)
  mcl.free(ap)
}

function benchMulVec (name, Cstr) {
  const mod = mcl.mod
  const n = 100
  const C = 10
  const xs = []
  const gs = []
  for (let i = 0; i < n; i++) {
    const x = new mcl.Fr()
    x.setByCSPRNG()
    xs.push(x)
    gs.push(mcl[`hashAndMapTo${name}`]('A' + String(i)))
  }
  const gp = allocArray(gs)
  const xp = allocArray(xs)
  const zp = new Cstr()._alloc()
  const mulVec = mod[`_mclBn${name}_mulVec`]
  bench(`${name}::mulVec(${n})`, C, () => mulVec(zp, gp, xp, n), () => mcl.mulVec(gs, xs))
  mcl.free(zp)
  mcl.free(xp)
  mcl.free(gp)
}

function benchGT (e) {
  const mod = mcl.mod
  const C = 100000
  const C2 = 1000
  let x = e
  const xp = e._allocAndCopy()
  const yp = e._allocAndCopy()
  bench('GT::add', C, () => mod._mclBnGT_add(yp, yp, xp), () => { x = mcl.add(x, e) })
  bench('GT::mul', C, () => mod._mclBnGT_mul(yp, yp, xp), () => { x = mcl.mul(x, e) })
  bench('GT::sqr', C, () => mod._mclBnGT_sqr(yp, yp), () => { x = mcl.sqr(x) })
  bench('GT::inv', C2, () => mod._mclBnGT_inv(yp, yp), () => { x = mcl.inv(x) })
  mcl.free(yp)
  mcl.free(xp)
}

function benchPairing (P, Q, P2, Q2) {
  const mod = mcl.mod
  const C = 1000
  const C2 = 100
  const e = mcl.pairing(P, Q)
  const Qcoeff = new mcl.PrecomputedG2(Q)
  const Q2coeff = new mcl.PrecomputedG2(Q2)
  const pp = P._allocAndCopy()
  const qp = Q._allocAndCopy()
  const p2p = P2._allocAndCopy()
  const q2p = Q2._allocAndCopy()
  const ep = e._allocAndCopy()
  const zp = e._alloc()
  bench('pairing', C, () => mod._mclBn_pairing(zp, pp, qp), () => mcl.pairing(P, Q))
  bench('millerLoop', C, () => mod._mclBn_millerLoop(zp, pp, qp), () => mcl.millerLoop(P, Q))
  bench('finalExp', C, () => mod._mclBn_finalExp(zp, ep), () => mcl.finalExp(e))
  bench('precomputedMillerLoop', C, () => mod._mclBn_precomputedMillerLoop(zp, pp, Qcoeff.p), () => mcl.precomputedMillerLoop(P, Qcoeff))
  bench('precomputedMillerLoop2', C2, () => mod._mclBn_precomputedMillerLoop2(zp, pp, Qcoeff.p, p2p, Q2coeff.p), () => mcl.precomputedMillerLoop2(P, Qcoeff, P2, Q2coeff))
  bench('precomputedMillerLoop2mixed', C2, () => mod._mclBn_precomputedMillerLoop2mixed(zp, pp, qp, p2p, Q2coeff.p), () => mcl.precomputedMillerLoop2mixed(P, Q, P2, Q2coeff))
  mcl.free(zp)
  mcl.free(ep)
  mcl.free(q2p)
  mcl.free(p2p)
  mcl.free(qp)
  mcl.free(pp)
  Q2coeff.destroy()
  Qcoeff.destroy()
}

function benchAll () {
  console.log('benchmark')
  benchHeader()
  const C = 1000
  {
    const a = new mcl.Fr()
    // no C API of setByCSPRNG in wasm
    bench('Fr::setByCSPRNG', C, null, () => a.setByCSPRNG())
  }
  {
    const a = new mcl.Fr()
    const b = new mcl.Fr()
    a.setByCSPRNG()
    b.setByCSPRNG()
    benchField('Fr', a, b)
    benchSetMod('Fr', mcl.Fr)
    benchInvVec('Fr', mcl.Fr)
  }
  {
    const a = new mcl.Fp()
    const b = new mcl.Fp()
    a.setByCSPRNG()
    b.setByCSPRNG()
    benchField('Fp', a, b)
    benchSetMod('Fp', mcl.Fp)
    benchInvVec('Fp', mcl.Fp)
  }
  {
    const a = new mcl.Fp2()
    const b = new mcl.Fp2()
    a.setInt(3, 4)
    b.setInt(-3, 9)
    benchField('Fp2', a, b)
  }
  const a = new mcl.Fr()
  a.setByCSPRNG()
  benchGroup('G1', mcl.G1, a)
  benchMulVec('G1', mcl.G1)
  benchGroup('G2', mcl.G2, a)
  benchMulVec('G2', mcl.G2)
  const P = mcl.hashAndMapToG1('abc')
  const Q = mcl.hashAndMapToG2('abc')
  const P2 = mcl.hashAndMapToG1('abce')
  const Q2 = mcl.hashAndMapToG2('abce')
  benchGT(mcl.pairing(P, Q))
  benchPairing(P, Q, P2, Q2)
}
