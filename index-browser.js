const crypto = window.crypto || window.msCrypto
const getRandomValues = x => crypto.getRandomValues(x)
window.mcl = mclSetupFactory(mclCreateModule, getRandomValues)
