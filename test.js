const mcl = require('./mcl.js')
const assert = require('assert')

mcl.init()
  .then(() => {
    FrTest()
    pairingTest()
    console.log('all ok')
    benchAll()
  })

function FrTest() {
  const a = new mcl.Fr()
  a.setInt(5)
  assert.equal(a.getStr(), '5')
  a.setStr('65535')
  assert.equal(a.getStr(), '65535')
  assert.equal(a.getStr(16), 'ffff')
  a.setStr('ff', 16)
  assert.equal(a.getStr(), '255')
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
}

function pairingTest() {
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

  mod._mclBn_pairing(e1, P, Q);
  mod._mclBn_pairing(e2, aP, bQ);
  mod._mclBnGT_pow(e1, e1, ab)
  assert(mod._mclBnGT_isEqual(e1, e2), 'e(aP, bQ) == e(P, Q)^ab')

  mod.free(e2)
  mod.free(e1)
  mod.free(bQ)
  mod.free(Q)
  mod.free(aP)
  mod.free(P)
  mod.free(ab)
  mod.free(b)
  mod.free(a)
}

function bench(label, count, func) {
  const start = Date.now()
  for (let i = 0; i < count; i++) {
    func()
  }
  const end = Date.now()
  const t = (end - start) / count
  console.log(label + ' ' + t)
}

function benchPairing() {
  const mod = mcl.mod
  const a = mod.mclBnFr_malloc()
  const P = mod.mclBnG1_malloc()
  const Q = mod.mclBnG2_malloc()
  const e = mod.mclBnGT_malloc()

  const msg = 'hello wasm'

  mod._mclBnFr_setByCSPRNG(a)
  mod.mclBnG1_hashAndMapTo(P, 'abc')
  mod.mclBnG2_hashAndMapTo(Q, 'abc')
  bench('time_pairing', 50, () => mod._mclBn_pairing(e, P, Q))
  bench('time_g1mul', 50, () => mod._mclBnG1_mulCT(P, P, a))
  bench('time_g2mul', 50, () => mod._mclBnG2_mulCT(Q, Q, a))
  bench('time_mapToG1', 50, () => mod.mclBnG1_hashAndMapTo(P, msg))

  mod.free(e)
  mod.free(Q)
  mod.free(P)
}

function benchAll() {
  benchPairing()
}

