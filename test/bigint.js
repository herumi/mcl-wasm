'use strict'
const mcl = require('../dist/index.js')
const assert = require('assert')
const { performance } = require('perf_hooks')

const g_r = BigInt('0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001')
const g_p = BigInt('0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab')

const C2 = 100000

function FrAdd (x, y) {
  let r = BigInt(x + y)
  if (r >= g_r) {
    r -= g_r
  }
  return r
}

function FrSub (x, y) {
  let r = BigInt(x - y)
  if (r < 0) {
    r += g_r
  }
  return r
}

function FrMul (x, y) {
  return BigInt((x * y) % g_r)
}

function FrSqr (x) {
  return BigInt((x * x) % g_r)
}

function FpAdd (x, y) {
  let r = BigInt(x + y)
  if (r >= g_p) {
    r -= g_p
  }
  return r
}

function FpSub (x, y) {
  let r = BigInt(x - y)
  if (r < 0) {
    r += g_p
  }
  return r
}

function FpMul (x, y) {
  return BigInt((x * y) % g_p)
}

function FpSqr (x) {
  return BigInt((x * x) % g_p)
}

function addJacobi (P, Q) {
  const [Px, Py, Pz] = P
  const [Qx, Qy, Qz] = Q
  if (Pz === 0) return Q
  if (Qz === 0) return P

  const isPzOne = Pz === 1
  const isQzOne = Qz === 1
  let Rx = BigInt(0)
  let Ry = BigInt(0)
  let Rz = BigInt(0)
  let r = BigInt(0)
  let U1 = BigInt(0)
  let S1 = BigInt(0)
  let H = BigInt(0)
  let H3 = BigInt(0)
  if (isPzOne) {
    // r = 1;
  } else {
    r = FpSqr(Pz)
  }
  if (isQzOne) {
    U1 = Px
    if (isPzOne) {
      H = Qx
    } else {
      H = FpMul(Qx, r)
    }
    H = FpSub(H, U1)
    S1 = Py
  } else {
    S1 = FpSqr(Qz)
    U1 = FpMul(Px, S1)
    if (isPzOne) {
      H = Qx
    } else {
      H = FpMul(Qx, r)
    }
    H = FpSub(H, U1)
    S1 = FpMul(S1, Qz)
    S1 = FpMul(S1, Py)
  }
  if (isPzOne) {
    r = Qy
  } else {
    r = FpMul(r, Pz)
    r  = FpMul(r, Qy)
  }
  r= FpSub(r, S1)
  if (H === 0) {
    if (r === 0) {
      return dblJacobi(P)
    } else {
      return [BigInt(0), BigInt(0), BigInt(0)]
    }
  }
  if (isPzOne) {
    if (isQzOne) {
      Rz = H
    } else {
      Rz = FpMul(H, Qz)
    }
  } else {
    if (isQzOne) {
      Rz = FpMul(Pz, H)
    } else {
      Rz = FpMul(Pz, Qz)
      Rz = FpMul(Rz, H)
    }
  }
  H3 = FpSqr(H)
  Ry = FpSqr(r)
  U1 = FpMul(U1, H3)
  H3 = FpMul(H3, H)
  Ry = FpSub(Ry, U1)
  Ry = FpSub(Ry, U1)
  Rx = FpSub(Ry, H3)
  U1 = FpSub(U1, Rx)
  U1 = FpMul(U1, r)
  H3 = FpMul(H3, S1)
  Ry = FpSub(U1, H3)
  return [Rx, Ry, Rz]
}

const curveTest = (curveType, name) => {
  mcl.init(curveType)
    .then(() => {
//      try {
        console.log(`name=${name}`)
        benchAll()
//      } catch (e) {
 //       console.log(`TEST FAIL ${e}`)
  //      assert(false)
   //   }
    })
}

async function curveTestAll () {
  await curveTest(mcl.BLS12_381, 'BLS12_381')
}

curveTestAll()

function bench (label, count, func) {
  const start = performance.now()
  for (let i = 0; i < count; i++) {
    func()
  }
  const end = performance.now()
  const t = (end - start) / count
  const roundTime = (Math.round(t * 1e6)) / 1000
  console.log(label + ' ' + roundTime + ' usec')
}

function benchFr () {
  const a = new mcl.Fr()
  let b = new mcl.Fr()
  a.setByCSPRNG()
  b.setByCSPRNG()
  console.log('Fr')
  bench('Fr::add', C2, () => { b = mcl.add(b, a) })
  bench('Fr::sub', C2, () => { b = mcl.sub(b, a) })
  bench('Fr::mul', C2, () => { b = mcl.mul(b, a) })
  bench('Fr::sqr', C2, () => { b = mcl.sqr(b) })
  bench('Fr::inv', C2, () => { b = mcl.inv(b) })
  const aPos = a._allocAndCopy()
  const bPos = b._allocAndCopy()
  const add = mcl.mod._mclBnFr_add
  const mul = mcl.mod._mclBnFr_mul
  const div = mcl.mod._mclBnFr_div
  bench('Fr_add', C2, () => { add(bPos, bPos, aPos) })
  bench('Fr_mul', C2, () => { mul(bPos, bPos, aPos) })
  bench('Fr_div', C2, () => { div(bPos, bPos, aPos) })
  mcl.free(bPos)
  mcl.free(aPos)
}

function benchFp () {
  const a = new mcl.Fp()
  let b = new mcl.Fp()
  a.setByCSPRNG()
  b.setByCSPRNG()
  console.log('Fp')
  bench('Fp::add', C2, () => { b = mcl.add(b, a) })
  bench('Fp::sub', C2, () => { b = mcl.sub(b, a) })
  bench('Fp::mul', C2, () => { b = mcl.mul(b, a) })
  bench('Fp::sqr', C2, () => { b = mcl.sqr(b) })
  bench('Fp::inv', C2, () => { b = mcl.inv(b) })
  const aPos = a._allocAndCopy()
  const bPos = b._allocAndCopy()
  const add = mcl.mod._mclBnFp_add
  const mul = mcl.mod._mclBnFp_mul
  const div = mcl.mod._mclBnFp_div
  bench('Fp_add', C2, () => { add(bPos, bPos, aPos) })
  bench('Fp_mul', C2, () => { mul(bPos, bPos, aPos) })
  bench('Fp_div', C2, () => { div(bPos, bPos, aPos) })
  mcl.free(bPos)
  mcl.free(aPos)
}

function benchBigFr () {

  let a = BigInt(0) 
  let b = BigInt(0) 
  {
    const ma = new mcl.Fr()
    let mb = new mcl.Fr()
    ma.setByCSPRNG()
    mb.setByCSPRNG()
    a = BigInt(ma.getStr())
    b = BigInt(mb.getStr())
    console.log(`a=${a}`)
    console.log(`b=${b}`)
  }
  console.log('BigInt')
  bench('FrAdd', C2, () => { b = FrAdd(b, a) })
  bench('FrSub', C2, () => { b = FrSub(b, a) })
  bench('FrMul', C2, () => { b = FrMul(b, a) })
}

function benchBigFp () {

  let a = BigInt(0) 
  let b = BigInt(0) 
  {
    const ma = new mcl.Fp()
    let mb = new mcl.Fp()
    ma.setByCSPRNG()
    mb.setByCSPRNG()
    a = BigInt(ma.getStr())
    b = BigInt(mb.getStr())
    console.log(`a=${a}`)
    console.log(`b=${b}`)
  }
  console.log('BigInt')
  bench('FpAdd', C2, () => { b = FpAdd(b, a) })
  bench('FpSub', C2, () => { b = FpSub(b, a) })
  bench('FpMul', C2, () => { b = FpMul(b, a) })
}

function putG1(P) {
  console.log(`Px=${P.getX().getStr(16)}`)
  console.log(`Py=${P.getY().getStr(16)}`)
  console.log(`Pz=${P.getZ().getStr(16)}`)
  console.log("")
}

function benchG1 () {
  let P = new mcl.G1()
  P.setHashOf('abc')
  let Q = new mcl.G1()
  Q.setHashOf('abcd')
  console.log(`P=${P.serializeToHexStr()}`)
//  P.normalize()
//  Q.normalize()
  putG1(P)
  putG1(Q)
  const Px = BigInt(P.getX().getStr())
  const Py = BigInt(P.getY().getStr())
  const Pz = BigInt(P.getZ().getStr())
  const Qx = BigInt(Q.getX().getStr())
  const Qy = BigInt(Q.getY().getStr())
  const Qz = BigInt(Q.getZ().getStr())
  let mR = mcl.add(P, Q)
  putG1(mR)
  let R = addJacobi([Px,Py,Pz], [Qx,Qy,Qz])
  console.log(`Rx=${R[0].toString(16)}`)
  console.log(`Ry=${R[1].toString(16)}`)
  console.log(`Rz=${R[2].toString(16)}`)
  bench('G1add', 1000, () => { P = mcl.add(P, Q) })
  bench('G1add', 1000, () => { R = addJacobi([Px,Py,Pz],R) })
}

function benchAll () {
  benchBigFr()
  benchBigFp()
  benchFr()
  benchFp()
  benchG1()
  mcl.mod.showMem()
}
