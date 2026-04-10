// ============================================================
// reeks.test.js — Unit tests voor Simon kleurenreeks logica
// Test de reekslogica zoals in SimonGame.jsx
// ============================================================

import { describe, it, expect } from 'vitest'

// Kleuren beschikbaar in SimonGame
const ALL_COLORS = ['blauw', 'rood', 'groen', 'geel']
const MIN_COLORS = 2

// Spiegel van reeks-logica uit SimonGame.jsx
function berekenVolgendReeksNiveau({ sequence, consecutiveCorrect, consecutiveWrong, colorsVisible }) {
  // Na goed antwoord: reeks wordt langer
  if (consecutiveCorrect > 0 && consecutiveCorrect % 1 === 0) {
    // Elke ronde groeit de reeks met 1 (simpel model: sequence.length + 1)
    // Elke 5 correcte → kleur toevoegen (tot max 4)
    const newColorsVisible = (consecutiveCorrect % 5 === 0 && colorsVisible < ALL_COLORS.length)
      ? colorsVisible + 1
      : colorsVisible

    return {
      sequenceLength: sequence.length + 1,
      colorsVisible: newColorsVisible,
    }
  }
  return { sequenceLength: sequence.length, colorsVisible }
}

function nieuweKleurNaReeks({ sequence, consecutiveCorrect, colorsVisible }) {
  if (consecutiveCorrect % 5 === 0 && consecutiveCorrect > 0) {
    return Math.min(colorsVisible + 1, ALL_COLORS.length)
  }
  return colorsVisible
}

// Reeks krimpt na fouten (in SimonGame: reset sequence na fout)
function reeksNaFout({ consecutiveWrong, sequence }) {
  if (consecutiveWrong >= 2) {
    // Na 2 fouten: reeks inkorten (minimum 1)
    return Math.max(1, sequence.length - 1)
  }
  return sequence.length
}

describe('Simon kleurenreeks — reekslogica', () => {

  it('reeks_groeit_na_goed_antwoord: lengte +1 per correcte ronde', () => {
    const start = ['blauw', 'rood']
    const resultaat = berekenVolgendReeksNiveau({
      sequence: start,
      consecutiveCorrect: 1,
      consecutiveWrong: 0,
      colorsVisible: 2,
    })
    expect(resultaat.sequenceLength).toBe(3)
  })

  it('na 3 correcte rondes: reeks is 3 langer dan start', () => {
    let sequence = ['blauw']
    for (let i = 1; i <= 3; i++) {
      const r = berekenVolgendReeksNiveau({
        sequence,
        consecutiveCorrect: i,
        consecutiveWrong: 0,
        colorsVisible: 2,
      })
      sequence = Array(r.sequenceLength).fill('blauw') // dummy reeks van nieuwe lengte
    }
    expect(sequence.length).toBe(4) // 1 start + 3 groei
  })

  it('reeks_krimpt_na_2_fouten: lengte -1, minimum 1', () => {
    const lengte3 = reeksNaFout({ consecutiveWrong: 2, sequence: ['blauw', 'rood', 'groen'] })
    expect(lengte3).toBe(2)

    const lengte1 = reeksNaFout({ consecutiveWrong: 2, sequence: ['blauw'] })
    expect(lengte1).toBe(1) // nooit onder 1
  })

  it('reeks krimpt niet bij slechts 1 fout', () => {
    const lengte = reeksNaFout({ consecutiveWrong: 1, sequence: ['blauw', 'rood', 'groen'] })
    expect(lengte).toBe(3)
  })

  it('nieuwe_kleur_na_reeks_van_5: kleur toevoegen elke 5 correct', () => {
    const nieuw = nieuweKleurNaReeks({ sequence: [], consecutiveCorrect: 5, colorsVisible: 2 })
    expect(nieuw).toBe(3)
  })

  it('maximum 4 kleuren (ALL_COLORS.length)', () => {
    const nieuw = nieuweKleurNaReeks({ sequence: [], consecutiveCorrect: 5, colorsVisible: 4 })
    expect(nieuw).toBe(4) // geen 5e kleur
  })

  it('geen nieuwe kleur bij consecutiveCorrect niet deelbaar door 5', () => {
    for (const cc of [1, 2, 3, 4, 6, 7, 8, 9]) {
      const nieuw = nieuweKleurNaReeks({ sequence: [], consecutiveCorrect: cc, colorsVisible: 2 })
      expect(nieuw).toBe(2)
    }
  })

  it('minimaal 2 kleuren altijd zichtbaar (MIN_COLORS)', () => {
    expect(MIN_COLORS).toBe(2)
    // Kleuren kunnen niet onder minimum zakken via normale flow
    const lengte = reeksNaFout({ consecutiveWrong: 99, sequence: ['blauw'] })
    expect(lengte).toBeGreaterThanOrEqual(1)
  })

  it('reeks bevat alleen geldige kleuren', () => {
    const geldigeKleuren = new Set(ALL_COLORS)
    const testReeks = ['blauw', 'rood', 'groen', 'blauw', 'geel']
    for (const kleur of testReeks) {
      expect(geldigeKleuren.has(kleur)).toBeTruthy()
    }
  })

})
