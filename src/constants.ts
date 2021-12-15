export enum CurveType {
  BN254 = 0,
  BN_SNARK1 = 4,
  BLS12_381 = 5,

  SECP224K1 = 101,
  SECP256K1 = 102,
  SECP384R1 = 102,
  NIST_P192 = 105,
  NIST_P224 = 106,
  NIST_P256 = 107,
}

export const BN254 = CurveType.BN254
export const BN381_1 = 1
export const BN381_2 = 2
export const BN462 = 3
export const BN_SNARK1 = CurveType.BN_SNARK1
export const BLS12_381 = CurveType.BLS12_381
export const SECP224K1 = CurveType.SECP224K1
export const SECP256K1 = CurveType.SECP256K1
export const SECP384R1 = 103
export const NIST_P192 = CurveType.NIST_P192
export const NIST_P224 = CurveType.NIST_P224
export const NIST_P256 = CurveType.NIST_P256

/* MCL_MAP_TO_MODE_HASH_TO_CURVE_07 */
export const IRTF = 5

/* flag for G1/G2.getStr */
export const EC_PROJ = 1024

export const MCLBN_FP_UNIT_SIZE = 6
export const MCLBN_FR_UNIT_SIZE = 4
export const MCLBN_COMPILED_TIME_VAR = MCLBN_FR_UNIT_SIZE * 10 + MCLBN_FP_UNIT_SIZE
export const MCLBN_FP_SIZE = MCLBN_FP_UNIT_SIZE * 8
export const MCLBN_FR_SIZE = MCLBN_FR_UNIT_SIZE * 8
export const MCLBN_G1_SIZE = MCLBN_FP_SIZE * 3
export const MCLBN_G2_SIZE = MCLBN_FP_SIZE * 6
export const MCLBN_GT_SIZE = MCLBN_FP_SIZE * 12
