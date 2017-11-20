const mcl = require('./mcl.js')
const assert = require('assert')

mcl.init()
  .then(() => {
    pairingTest()
    console.log('all ok')
    benchAll()
  })

function pairingTest() {
  const capi = mcl.capi
  const a = capi.mclBnFr_malloc()
  const b = capi.mclBnFr_malloc()
  const ab = capi.mclBnFr_malloc()
  const P = capi.mclBnG1_malloc()
  const aP = capi.mclBnG1_malloc()
  const Q = capi.mclBnG2_malloc()
  const bQ = capi.mclBnG2_malloc()
  const e1 = capi.mclBnGT_malloc()
  const e2 = capi.mclBnGT_malloc()

  capi.mclBnFr_setStr(a, '123')
  capi.mclBnFr_setStr(b, '456')
  capi.mclBnFr_mul(ab, a, b)
  assert.equal(capi.mclBnFr_getStr(ab), 123 * 456)

  capi.mclBnG1_hashAndMapTo(P, 'aaa')
  capi.mclBnG2_hashAndMapTo(Q, 'bbb')
  capi.mclBnG1_mul(aP, P, a)
  capi.mclBnG2_mul(bQ, Q, b)

  capi.mclBn_pairing(e1, P, Q);
  capi.mclBn_pairing(e2, aP, bQ);
  capi.mclBnGT_pow(e1, e1, ab)
  assert(capi.mclBnGT_isEqual(e1, e2), 'e(aP, bQ) == e(P, Q)^ab')

  capi.mcl_free(e2)
  capi.mcl_free(e1)
  capi.mcl_free(bQ)
  capi.mcl_free(Q)
  capi.mcl_free(aP)
  capi.mcl_free(P)
  capi.mcl_free(ab)
  capi.mcl_free(b)
  capi.mcl_free(a)
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
  const capi = mcl.capi
  const a = capi.mclBnFr_malloc()
  const P = capi.mclBnG1_malloc()
  const Q = capi.mclBnG2_malloc()
  const e = capi.mclBnGT_malloc()

  const msg = 'hello wasm'

  capi.mclBnFr_setByCSPRNG(a)
  capi.mclBnG1_hashAndMapTo(P, 'abc')
  capi.mclBnG2_hashAndMapTo(Q, 'abc')
  bench('time_pairing', 50, () => capi.mclBn_pairing(e, P, Q))
  bench('time_g1mul', 50, () => capi.mclBnG1_mulCT(P, P, a))
  bench('time_g2mul', 50, () => capi.mclBnG2_mulCT(Q, Q, a))
  bench('time_mapToG1', 50, () => capi.mclBnG1_hashAndMapTo(P, msg))

  capi.mcl_free(e)
  capi.mcl_free(Q)
  capi.mcl_free(P)
}

function benchAll() {
  benchPairing()
}

