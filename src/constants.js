exports.BN254 = 0
exports.BN381_1 = 1
exports.BN381_2 = 2
exports.BN462 = 3
exports.BN_SNARK1 = 4
exports.BLS12_381 = 5

exports.SECP224K1 = 101
exports.SECP256K1 = 102
exports.SECP384R1 = 103
exports.NIST_P192 = 105
exports.NIST_P224 = 106
exports.NIST_P256 = 107

exports.MCLBN_FP_UNIT_SIZE = 6
exports.MCLBN_FR_UNIT_SIZE = 4
exports.MCLBN_COMPILED_TIME_VAR = (exports.MCLBN_FR_UNIT_SIZE * 10 + exports.MCLBN_FP_UNIT_SIZE)
exports.MCLBN_FP_SIZE = exports.MCLBN_FP_UNIT_SIZE * 8
exports.MCLBN_FR_SIZE = exports.MCLBN_FR_UNIT_SIZE * 8
exports.MCLBN_G1_SIZE = exports.MCLBN_FP_SIZE * 3
exports.MCLBN_G2_SIZE = exports.MCLBN_FP_SIZE * 6
exports.MCLBN_GT_SIZE = exports.MCLBN_FP_SIZE * 12
