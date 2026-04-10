// ============================================================
// debugLogger.js — debug logging voor Cowork/handmatig testen
//
// AAN/UIT: zet DEBUG_ENABLED op true of false hieronder.
// In productie (Vercel) logt dit NOOIT — de DEV-check voorkomt dat.
//
// Wat wordt gelogd:
//   - Schermwisselingen (Root.jsx)
//   - Audio: welk bestand of TTS fallback (speech.js)
//   - Sami state-wisselingen
//   - Antwoorden: correct / fout + detail
//   - Level-transities
//   - Module-specifieke events (ronde start, vraag gegenereerd, etc.)
// ============================================================

const DEBUG_ENABLED = true  // ← zet op false om logging uit te zetten

export const debugLog = (event, detail) => {
  if (import.meta.env.DEV && DEBUG_ENABLED) {
    console.log(`[${new Date().toLocaleTimeString()}] ${event}${detail !== undefined ? ': ' + detail : ''}`)
  }
}
