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
})
