const mcl = require('./mcl.js')

mcl.init(mcl.BLS12_381).then(() => {
  console.log('ok')
  mcl.setETHserialization(true)
  mcl.setMapToMode(mcl.IRTF)
  const g2 = new mcl.G2()
  console.log(`g2 zero=${g2.serializeToHexStr()}`)
  g2.setHashOf("asdf")
  mcl.normalize(g2)
  console.log(`g2=${g2.getStr(10)}`)
  console.log(`g2=${g2.serializeToHexStr()}`)
})
