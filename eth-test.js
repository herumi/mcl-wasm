const mcl = require('./mcl.js')
const assert = require('assert')

function appendZeroToRight (s, n) {
  let z = ""
  for (let i = 0; i < n - s.length; i++) {
    z += "0"
  }
  return z + s
}

function testFpToG1 () {
  // https://github.com/matter-labs/eip1962/blob/master/src/test/test_vectors/eip2537/fp_to_g1.csv
  const tbl = [
    [
      "0000000000000000000000000000000014406e5bfb9209256a3820879a29ac2f62d6aca82324bf3ae2aa7d3c54792043bd8c791fccdb080c1a52dc68b8b69350",
      "000000000000000000000000000000000d7721bcdb7ce1047557776eb2659a444166dc6dd55c7ca6e240e21ae9aa18f529f04ac31d861b54faf3307692545db700000000000000000000000000000000108286acbdf4384f67659a8abe89e712a504cb3ce1cba07a716869025d60d499a00d1da8cdc92958918c222ea93d87f0",
    ],
    [
      "000000000000000000000000000000000e885bb33996e12f07da69073e2c0cc880bc8eff26d2a724299eb12d54f4bcf26f4748bb020e80a7e3794a7b0e47a641",
      "00000000000000000000000000000000191ba6e4c4dafa22c03d41b050fe8782629337641be21e0397dc2553eb8588318a21d30647182782dee7f62a22fd020c000000000000000000000000000000000a721510a67277eabed3f153bd91df0074e1cbd37ef65b85226b1ce4fb5346d943cf21c388f0c5edbc753888254c760a",
    ],
    [
      "000000000000000000000000000000000ba1b6d79150bdc368a14157ebfe8b5f691cf657a6bbe30e79b6654691136577d2ef1b36bfb232e3336e7e4c9352a8ed",
      "000000000000000000000000000000001658c31c0db44b5f029dba56786776358f184341458577b94d3a53c877af84ffbb1a13cc47d228a76abb4b67912991850000000000000000000000000000000018cf1f27eab0a1a66f28a227bd624b7d1286af8f85562c3f03950879dd3b8b4b72e74b034223c6fd93de7cd1ade367cb",
    ],
  ]
  tbl.forEach(v => {
    const [vs, expect] = v
    /*
      serialize() accepts only values in [0, p).
      The test values exceed p, so use setBigEndianMod to set (v mod p).
    */
    let x = new mcl.Fp()
    x.setBigEndianMod(mcl.fromHexStr(vs))
    const P = x.mapToG1()
    /*
      The test value is the form such as "000...<x>000...<y>".
    */
    const L = 128
    x.setBigEndianMod(mcl.fromHexStr(expect.substr(0, L)))
    let y = new mcl.Fp()
    y.setBigEndianMod(mcl.fromHexStr(expect.substr(L, L)))
    const Q = new mcl.G1()
    Q.setX(x)
    Q.setY(y)
    const one = new mcl.Fp()
    one.setInt(1)
    Q.setZ(one)
    assert(P.isEqual(Q))
  })
}

function testVerifyG1 () {
  const ok_x = "ad50e39253e0de4fad89440f01f1874c8bc91fdcd59ad66162984b10690e51ccf4d95e4222df14549d745d8b971199"
  const ok_y = "2f76c6f3a006f0bbfb88c02a4643702ff52ff34c1fcb59af611b7f1cf47938ffbf2c68a6e31a40bf668544087374f70"

  const ng_x = "1534fc82e2566c826b195314b32bf47576c24632444450d701de2601cec0c0d6b6090e7227850005e81f54039066602b"
  const ng_y = "15899715142d265027d1a9fba8f2f10a3f21938071b4bbdb5dce8c5caa0d93588482d33d9a62bcbbd23ab6af6d689710"

  let x = new mcl.Fp()
  let y = new mcl.Fp()
  let z = new mcl.Fp()
  let P = new mcl.G1()
  let Q = new mcl.G1()
  x.setStr(ok_x, 16)
  y.setStr(ok_y, 16)
  z.setInt(1)

  P.setX(x)
  P.setY(y)
  P.setZ(z)

  // valid point, valid order
  mcl.verifyOrderG1(false)
  assert(P.isValid())
  assert(P.isValidOrder())
  let buf = P.serialize()
  Q.deserialize(buf)
  assert(P.isEqual(Q))

  mcl.verifyOrderG1(true)
  assert(P.isValid())
  assert(P.isValidOrder())
  Q.clear()
  Q.deserialize(buf)
  assert(P.isEqual(Q))

  // invalid point
  z.setInt(2)
  P.setZ(z)
  assert(!P.isValid())

  // valid point, invalid order
  x.setStr(ng_x, 16)
  y.setStr(ng_y, 16)
  z.setInt(1)
  P.setX(x)
  P.setY(y)
  P.setZ(z)

  mcl.verifyOrderG1(false)
  assert(P.isValid())
  assert(!P.isValidOrder())
  buf = P.serialize()
  Q.clear()
  Q.deserialize(buf)
  assert(P.isEqual(Q))

  mcl.verifyOrderG1(true)
  assert(!P.isValid()) // fail because of invalid order
  Q.clear()
  try {
    Q.deserialize(buf)
    assert(false) // not here
  } catch (e) {
    // here
  }
}

mcl.init(mcl.BLS12_381).then(() => {
  console.log('ok')
  mcl.setETHserialization(true)
  mcl.setMapToMode(mcl.IRTF)
  let g1 = new mcl.G1()
  let g2 = new mcl.G2()
  console.log(`g2 zero=${g2.serializeToHexStr()}`)
  g1.setHashOf("asdf")
  g1.normalize()
  console.log(`g1.x=${g1.getX().serializeToHexStr()}`)
  console.log(`g1.y=${g1.getY().serializeToHexStr()}`)
  g2.setHashOf("asdf")
  g2.normalize()
  console.log(`g2.x=${g2.getX().serializeToHexStr()}`)
  console.log(`g2.y=${g2.getY().serializeToHexStr()}`)
  testFpToG1()
  testVerifyG1()
})
