const mclCreateModule = require('./mcl_c')
const mclSetupFactory = require('./mcl')

const getRandomValues = (buf) => {
  if (typeof window === 'object') {
    // for Browser
    const crypto = window.crypto || window.msCrypto
    return crypto.getRandomValues(buf)
  } else {
    // for Node.js
    const crypto = require('crypto')
    return crypto.randomFillSync(buf)
  }
}

const mcl = mclSetupFactory(mclCreateModule, getRandomValues)

module.exports = mcl
