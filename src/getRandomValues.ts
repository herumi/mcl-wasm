const getRandomValues = (buf: Uint8Array): Uint8Array => {
  return crypto.getRandomValues(buf as Uint8Array<ArrayBuffer>) as Uint8Array
}

export default getRandomValues
