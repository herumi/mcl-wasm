const getRandomValues = (buf: Uint8Array): Uint8Array => {
  return crypto.getRandomValues(buf)
}

export default getRandomValues
