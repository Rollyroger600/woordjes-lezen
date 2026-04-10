// ============================================================
// sounds.js — Gedeelde Web Audio context voor alle spellen
// Één AudioContext voor de hele app → geen suspend-problemen.
// ============================================================

let _ctx = null

function getCtx() {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)()
    } catch { return null }
  }
  // Hervat de context als browser hem gesuspendeerd heeft
  if (_ctx.state === 'suspended') {
    _ctx.resume()
  }
  return _ctx
}

/** Basistoon: gebruikt voor Simon-kleuren en achtergrondgeluiden */
export function playTone(freq, durationMs = 450, type = 'sine', volume = 0.4) {
  const ctx = getCtx()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + durationMs / 1000)
  } catch { /* audio niet beschikbaar */ }
}

/** Zachte klik bij het aanraken van knoppen */
export function playClick() {
  const ctx = getCtx()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.06)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.1)
  } catch { /* audio niet beschikbaar */ }
}

/** Goed antwoord: oplopende arpeggio */
export function playCorrect() {
  const freqs = [523, 659, 784, 1047] // C5 E5 G5 C6
  freqs.forEach((f, i) => setTimeout(() => playTone(f, 160, 'sine', 0.3), i * 100))
}

/** Fout antwoord: dalend gezoem */
export function playWrong() {
  const ctx = getCtx()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.4)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.45)
  } catch { /* audio niet beschikbaar */ }
}

/** Ster verdienen: sprankelend geluid */
export function playStar() {
  const freqs = [523, 659, 784, 1047, 1319]
  freqs.forEach((f, i) => setTimeout(() => playTone(f, 200, 'sine', 0.25), i * 120))
}

/** Combo (3 of 5 goed op rij): fanfare */
export function playCombo() {
  const melody = [523, 659, 784, 659, 1047]
  melody.forEach((f, i) => setTimeout(() => playTone(f, 180, 'triangle', 0.3), i * 110))
}

/** Unlock: klinkend akkoord */
export function playUnlock() {
  [262, 330, 392, 523].forEach((f, i) => setTimeout(() => playTone(f, 400, 'sine', 0.3), i * 80))
}
