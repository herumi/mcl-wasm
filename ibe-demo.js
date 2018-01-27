function getValue(name) { return document.getElementsByName(name)[0].value }
function setValue(name, val) { document.getElementsByName(name)[0].value = val }
function getText(name) { return document.getElementsByName(name)[0].innerText }
function setText(name, val) { document.getElementsByName(name)[0].innerText = val }

function loadScript(url, callback) {
  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = url
  if (script.readyState) {
    script.onreadystatechange = () => {
      if (script.readyState === 'loaded' || script.readyState === 'complete') {
        script.onreadystatechange = null
        callback()
      }
    }
  } else {
    script.onload = () => callback()
  }
  document.getElementsByTagName('head')[0].appendChild(script)
}

let prevSelectedCurve = 0
loadScript('./mcl_c.js', () => {
  mcl.init(prevSelectedCurve).then(() => {
    setText('status', 'ok')
  })
})

function onChangeSelectCurve() {
  const obj = document.selectCurve.curveType
  const idx = obj.selectedIndex
  const curveType = obj.options[idx].value | 0
  if (curveType == prevSelectedCurve) return
  prevSelectedCurve = curveType
  const srcName = curveType == 0 ? './mcl_c.js' : './mcl_c512.js'
  console.log(`srcName=${srcName}`)
  loadScript(srcName, () => {
    mcl.init(curveType).then(() => {
      setText('status', `curveType=${curveType} status ok`)
    })
  })
}

// Enc(m) = [r P, m + h(e(r mpk, H(id)))]
function IDenc(id, P, mpk, m) {
  const r = new mcl.Fr()
  r.setByCSPRNG()
  const Q = mcl.hashAndMapToG2(id)
  const e = mcl.pairing(mcl.mul(mpk, r), Q)
  return [mcl.mul(P, r), mcl.add(m, mcl.hashToFr(e.serialize()))]
}

// Dec([U, v]) = v - h(e(U, sk))
function IDdec(c, sk) {
  const [U, v] = c
  const e = mcl.pairing(U, sk)
  return mcl.sub(v, mcl.hashToFr(e.serialize()))
}

function onClickIBE() {
  const P = mcl.hashAndMapToG1('1')
  // keyGen
  const msk = new mcl.Fr()
  msk.setByCSPRNG()
  setText('msk', msk.serializeToHexStr())
  // mpk = msk P
  const mpk = mcl.mul(P, msk)
  setText('mpk', mpk.serializeToHexStr())

  // user KeyGen
  const id = getText('id')
  // sk = msk H(id)
  const sk = mcl.mul(mcl.hashAndMapToG2(id), msk)
  setText('sk', sk.serializeToHexStr())

  const m = new mcl.Fr()
  const msg = getValue('msg')
  console.log('msg', msg)
  m.setStr(msg)

  // encrypt
  const c = IDenc(id, P, mpk, m)
  setText('enc', c[0].serializeToHexStr() + ' ' + c[1].serializeToHexStr())
  // decrypt
  const d = IDdec(c, sk)
  setText('dec', d.getStr())
}
