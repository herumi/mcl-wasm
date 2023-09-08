[![Build Status](https://github.com/herumi/mcl-wasm/actions/workflows/main.yml/badge.svg)](https://github.com/herumi/mcl-wasm/actions/workflows/main.yml)

# A portable and fast pairing-based cryptography library for Node.js by WebAssembly

# Abstract

see [mcl](https://github.com/herumi/mcl)

## News
- 2023/Sep/08 improve the performance a little
- 2023/Aug/17 improve the invMod performance
- 2023/Jun/10 add share/recover functions of Fr, G1, G2 for secret sharing.
- 2022/May/08 fix get{X,Y,Z} and get\_{a,b}.
- 2021/Dec/15 rewritten by TypeScript (Thanks to asa-taka)
- 2021/Nov/11 unify index.js of Node.js and browser (Thanks to Futa HIRAKOBA)
- 2021/Aug/28 improve performance of `{G1,G2}::isValidOrder()`
- 2021/Jun/22 add index.d.ts
- 2021/Mar/02 improve performance
- 2020/Nov/10 setup function has changed.
- add `mulVec(xVec, yVec)` where xVec is an array of G1 or G2 and yVec is an array of Fr, which returns `sum of xVec[i] yVec[i]`.
- G1.setHashOf is compatible with [hash-to-curve-09 BLS12381G1_XMD:SHA-256_SSWU_RO_](https://www.ietf.org/id/draft-irtf-cfrg-hash-to-curve-09.html#name-bls12381g1_xmdsha-256_sswu_)
- support only BN254, ZKSNARK, BLS12-381 to remove mcl_c512.js
- add mcl.precomputedMillerLoop2 and mcl.precomputedMillerLoop2mixed

## How to use
The version `v0.6.0` breaks backward compatibility of the entry point.

- Node.js : `const mcl = require('mcl-wasm')`
- React : `const mcl = require('mcl-wasm')`
- HTML : `<script src="https://herumi.github.io/mcl-wasm/browser/mcl.js"></script>`

## for Node.js
```
node test/test.js
```

## browser demo
[ID-based encryption](https://herumi.github.io/mcl-wasm/browser/demo.html)

# usages

## init

```
// Ethereum 2.0 spec mode
mcl.init(mcl.BLS12_381)
  .then(() => {
    mcl.setETHserialization(true) // Ethereum serialization
    mcl.setMapToMode(mcl.IRTF) // for G2.setHashOf(msg)
    ...
  })
```

## string conversion

```
a = new mcl.Fr()
a.setStr('255') // set 255
a.setStr('0xff') // set 0xff = 255
a.setStr('ff', 16) // set ff as hex-string

a.getStr() // '255'
a.getStr(16) // 'ff'
```

## serialization

```
// byte array serialization
b.deserialize(a.serialize()) // b.isEqualTo(a)
// hex string of serialization()
b.deserializeHexStr(a.serializeToHexStr())
```

```
// serialization like Ethereum 2.0 only for BLS12-381
mcl.setETHserialization(true)
```

## deserialization
```
/*
  it is big cost to to verify the order
  call once after init() if you want to disable it
  cf. sub group problem
*/
mcl.verifyOrderG1(false)
mcl.verifyOrderG2(false)
```

see [test.js](https://github.com/herumi/mcl-wasm/blob/master/test/test.js)

## Secret Sharing

```typescript
shareFr = (cVec: Fr[], id: Fr): Fr
shareG1 = (cVec: G1[], id: Fr): G1
shareG2 = (cVec: G2[], id: Fr): G2
```
Evaluate the value of the polynomial `f(x)` whose coefficients `cVec[]` are vec with x=id.
Return `f(id)`.

```typescript
recoverFr = (idVec: Fr[], yVec: Fr[]): Fr
recoverG1 = (idVec: Fr[], yVec: G1[]): G1
recoverG2 = (idVec: Fr[], yVec: G2[]): G2
```
Recover the polynomial `f(x)` through the point `(idVec[0], yVec[0])`, `(idVec[1], yVec[1])`, ... and return `f(0)`.
Note that the order of arguments is reversed from that of the recover function in bls-eth-wasm.

# License

modified new BSD License
http://opensource.org/licenses/BSD-3-Clause

# History

2019/Jan/31 add Fp.mapToG1

# Author

MITSUNARI Shigeo(herumi@nifty.com)

# Sponsors welcome
[GitHub Sponsor](https://github.com/sponsors/herumi)
