const getRandomValues = (buf: Uint8Array): Uint8Array => {
  if (typeof self === 'object' && typeof self.crypto === 'object' && typeof self.crypto.getRandomValues === 'function') {
    // for Browser and Worker
    return self.crypto.getRandomValues(buf)
  } else {
    // for Node.js
    const crypto = require('crypto')
    return crypto.randomFillSync(buf)
  }
}

export default getRandomValues
