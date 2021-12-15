const getRandomValues = (buf: Uint8Array): Uint8Array => {
  if (typeof window === 'object') {
    // for Browser
    const crypto = window.crypto || (window as any).msCrypto as Crypto
    return crypto.getRandomValues(buf)
    /* eslint no-unused-vars: 0 */
  } else if (typeof self === 'object' && typeof self.crypto === 'object' && typeof self.crypto.getRandomValues === 'function') { // eslint-disable-line no-undef
    // for Worker
    const crypto = self.crypto // eslint-disable-line no-undef
    return crypto.getRandomValues(buf)
  } else {
    // for Node.js
    const crypto = require('crypto')
    return crypto.randomFillSync(buf)
  }
}

export default getRandomValues
