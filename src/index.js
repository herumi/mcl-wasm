const { BN254, BN381_1, BN381_2, BN462, BN_SNARK1, BLS12_381, SECP224K1, SECP256K1, SECP384R1, NIST_P192, NIST_P224, NIST_P256, IRTF, EC_PROJ } = require('./constants')
const valueTypes = require('./value-types')
const getRandomValues = require('./getRandomValues')
const { mod, initializeMcl: init, fromHexStr, free, ptrToAsciiStr, toHex, toHexStr, asciiStrToPtr, initializedCurveType: curveType } = require('./mcl')

module.exports = {
  BN254,
  BN381_1,
  BN381_2,
  BN462,
  BN_SNARK1,
  BLS12_381,
  SECP224K1,
  SECP256K1,
  SECP384R1,
  NIST_P192,
  NIST_P224,
  NIST_P256,
  IRTF,
  EC_PROJ,
  ...valueTypes,
  getRandomValues,
  mod,
  init,
  fromHexStr,
  free,
  ptrToAsciiStr,
  toHex,
  toHexStr,
  asciiStrToPtr,
  curveType
}
