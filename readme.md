[![Build Status](https://travis-ci.org/herumi/mcl-wasm.png)](https://travis-ci.org/herumi/mcl-wasm)
# A portable and fast pairing-based cryptography library for Node.js by WebAssembly

# Abstract

see [mcl](https://github.com/herumi/mcl)

## News
* add mcl.precomputedMillerLoop2 and mcl.precomputedMillerLoop2mixed

## for Node.js
node test.js

## browser demo
[ID-based encryption](https://herumi.github.io/mcl-wasm/ibe-demo.html)

# usages

## init

```
mcl.init(mcl.BLS12_381)
  .then(() => {
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

see [test.js](https://github.com/herumi/mcl-wasm/blob/master/test.js)

# License

modified new BSD License
http://opensource.org/licenses/BSD-3-Clause

# History

2019/Jan/31 add Fp.mapToG1

# Author

光成滋生 MITSUNARI Shigeo(herumi@nifty.com)
