import * as mcl from '../dist'
import * as assert from 'assert'

async function curveTest (curveType, name) {
  await mcl.init(curveType)
  try {
    console.log(`name=${name}`)
    blsTest()
  } catch (e) {
    console.log(`TEST FAIL ${e}`)
    assert(false)
  }
}

async function curveTestAll() {
  // can't parallel
  await curveTest(mcl.BN_SNARK1, 'SNARK')
}

curveTestAll()

const sign = (sec: mcl.Fr, msg: string | Uint8Array): [mcl.G1, mcl.G1] => {
  const h = mcl.hashAndMapToG1(msg)
  const sig = mcl.mul(h, sec)
  return [sig, h]
}

const g_gen = new mcl.G2()
let g_neg_gen = new mcl.G2()
let g_Q2coeff:mcl.PrecomputedG2 = null

/*
  e(h, pub) == e(sig, gen)
  <=> e(h, pub)e(sig, -gen) == 1
  <=> FE(ML(h, pub)) FE(ML(sig, -gen)) == 1
  <=> FE(ML(h, pub) ML(sig, -gen)) == 1
  <=> FE(precomputedMillerLoop2mixed(h, pub, sig, g_Q2coeff)) == 1
*/
const verify = (pub: mcl.G2, sig: mcl.G1, msg: string | Uint8Array): boolean => {
  const h = mcl.hashAndMapToG1(msg)
  const opti:number = 2
  switch (opti) {
  default: {
      const e1 = mcl.pairing(h, pub)
      const e2 = mcl.pairing(sig, g_gen)
      return e1.isEqual(e2)
    }
  case 1: {
      const e1 = mcl.millerLoop(h, pub)
      const e2 = mcl.millerLoop(sig, g_neg_gen)
      return mcl.finalExp(mcl.mul(e1, e2)).isOne()
    }
  case 2: {
      const e = mcl.precomputedMillerLoop2mixed(h, pub, sig, g_Q2coeff)
      return mcl.finalExp(e).isOne()
    }
  }
}

const blsTest = () => {
  console.log('BLS signature')
  // G1 : Signature
  // G2 : PublicKey
  const genStr = '1 10857046999023057135944570762232829481370756359578518086990519993285655852781 11559732032986387107991004021392285783925812861821192530917403151452391805634 8495653923123431417604973247489272438418190587263600148770280649306958101930 4082367875863433681332203403145435568316851327593401208105741076214120093531'

  // init system param
  g_gen.setStr(genStr)
  g_neg_gen = mcl.neg(g_gen)
  g_Q2coeff = new mcl.PrecomputedG2(g_neg_gen)

  const secStr = 'a3e9769b84c095eca6b98449ac86b6e2c589834fe24cb8fbb7b36f814fd06113'
  const sec = mcl.deserializeHexStrToFr(secStr)
  const pub = mcl.mul(g_gen, sec)
  console.log(`sec=${sec.serializeToHexStr()}`)
  console.log(`gen=${g_gen.serializeToHexStr()}`)
  console.log(`pub=${pub.serializeToHexStr()}`)
  const msg = 'hello wolrd'
  const [sig, h] = sign(sec, msg)
  console.log(`sig=${sig.serializeToHexStr()}`)
  console.log(`h=${h.serializeToHexStr()}`)
  console.log(`verify ok=${verify(pub, sig, msg)}`)
  console.log(`verify ng=${verify(pub, sig, msg+'a')}`)
}
