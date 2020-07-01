const mcl = require('./mcl.js')


function mulVecG1(xVec, yVec) {
  let z = new mcl.G1()
  for (let i = 0; i < xVec.length; i++) {
    z = mcl.add(z, mcl.mul(xVec[i], yVec[i]))
  }
  return z
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
})
