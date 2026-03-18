// ============================================================
// speech.js — universele spreekfunctie
// Probeert altijd eerst een ingesproken opname uit public/audio/studio/
// Als die er niet is, valt hij terug op browser TTS (nl-NL)
// Gebruikt blob-URL's om MIME-type problemen met .webm te voorkomen
// ============================================================

const blobCache = {}   // id → blob URL (eenmalig gefetcht)
const audioCache = {}  // id → Audio element (hergebruikt)
let generation = 0     // voorkomt dat stale fetches nog afspelen

// ---- Audio unlock: browsers blokkeren audio vóór eerste user gesture ----
let unlockResolve
const audioUnlocked = new Promise(r => { unlockResolve = r })
let isUnlocked = false

function handleUnlock() {
  if (isUnlocked) return
  isUnlocked = true
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const buf = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buf; src.connect(ctx.destination); src.start(0)
  } catch (_) {}
  try {
    const u = new SpeechSynthesisUtterance('')
    u.volume = 0
    window.speechSynthesis.speak(u)
  } catch (_) {}
  unlockResolve()
  ;['touchstart', 'click', 'keydown'].forEach(e =>
    document.removeEventListener(e, handleUnlock, true)
  )
}
;['touchstart', 'click', 'keydown'].forEach(e =>
  document.addEventListener(e, handleUnlock, { capture: true })
)

function stopAll() {
  generation++
  window.speechSynthesis.cancel()
  Object.values(audioCache).forEach(a => {
    try { a.pause(); a.currentTime = 0 } catch (_) {}
  })
}

function tts(text, { onEnd, rate = 0.85 } = {}) {
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'nl-NL'
  utter.rate = rate
  utter.pitch = 1.1
  const voices = window.speechSynthesis.getVoices()
  const nlVoice = voices.find(v => v.lang.startsWith('nl'))
  if (nlVoice) utter.voice = nlVoice
  if (onEnd) utter.onend = onEnd
  window.speechSynthesis.speak(utter)
}

// Fetch audio als blob en cache de object-URL
async function loadBlob(path) {
  if (blobCache[path]) return blobCache[path]
  const res = await fetch(path)
  if (!res.ok) return null
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  blobCache[path] = url
  return url
}

// Probeer studio bestand in meerdere formaten (webm, wav)
async function loadStudio(id) {
  const cacheKey = `studio:${id}`
  if (blobCache[cacheKey]) return blobCache[cacheKey]
  for (const ext of ['webm', 'wav']) {
    const url = await loadBlob(`/audio/studio/${id}.${ext}`)
    if (url) { blobCache[cacheKey] = url; return url }
  }
  return null
}

function playBlob(id, blobUrl, onEnd) {
  if (!audioCache[id]) audioCache[id] = new Audio()
  const audio = audioCache[id]
  audio.src = blobUrl
  audio.currentTime = 0
  audio.onended = onEnd || null
  return audio.play()
}

/**
 * Spreek een item uit de speech manifest.
 * @param {string} id       - Manifest ID (bijv. 'instr-module1-start')
 * @param {string} text     - Fallback tekst voor TTS
 * @param {object} options  - { onEnd, ttsRate }
 */
export function speakItem(id, text, { onEnd, ttsRate = 0.85 } = {}) {
  stopAll()
  const gen = generation

  audioUnlocked.then(() => {
    if (gen !== generation) return
    return loadStudio(id).then(url => {
      if (gen !== generation) return
      if (!url) throw new Error('no file')
      return playBlob(id, url, onEnd)
    }).catch(() => {
      if (gen !== generation) return
      tts(text, { onEnd, rate: ttsRate })
    })
  })
}

/**
 * Spreek een Module 1 woord uit.
 * Volgorde: studio opname → legacy .m4a → TTS
 */
export function speakWord(word, onEnd) {
  stopAll()
  const gen = generation
  const id = `woord-${word}`

  audioUnlocked.then(() => {
    if (gen !== generation) return
    return loadStudio(id).then(url => {
      if (gen !== generation) return
      if (!url) throw new Error('no studio')
      return playBlob(id, url, onEnd)
    }).catch(() => {
      if (gen !== generation) return
      const legacyPath = `/audio/${word.charAt(0).toUpperCase() + word.slice(1)}.m4a`
      return loadBlob(legacyPath).then(url => {
        if (gen !== generation) return
        if (!url) throw new Error('no legacy')
        return playBlob(`legacy-${word}`, url, onEnd)
      })
    }).catch(() => {
      if (gen !== generation) return
      tts(word, { onEnd })
    })
  })
}

/**
 * Spreek een losse letter/klank uit (Module 2).
 * Studio opname → TTS met langzamere rate (0.7)
 */
export function speakLetter(letter, onEnd) {
  stopAll()
  const gen = generation
  const id = `letter-${letter}`

  audioUnlocked.then(() => {
    if (gen !== generation) return
    return loadStudio(id).then(url => {
      if (gen !== generation) return
      if (!url) throw new Error('no file')
      return playBlob(id, url, onEnd)
    }).catch(() => {
      if (gen !== generation) return
      tts(letter, { onEnd, rate: 0.7 })
    })
  })
}

export { stopAll }
