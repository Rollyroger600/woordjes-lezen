// ============================================================
// adaptief.test.js — Unit tests voor adaptief progressiesysteem
// Test de progressielogica zoals geïmplementeerd in App.jsx
// ============================================================

import { describe, it, expect } from 'vitest'

// Spiegel van de progressielogica uit App.jsx
// (pure functie, geen React state)

const LEVELS = [
  ['de', 'het', 'een'],
  ['de', 'het', 'een', 'en', 'is', 'in'],
  ['de', 'het', 'een', 'en', 'is', 'in', 'op', 'aan', 'of', 'bij', 'dit', 'dat', 'ik', 'je', 'wij'],
]

const MIN_VISIBLE = 2

function berekenVolgendNiveau({ level, visibleCount, streak, errorStreak }) {
  const maxVisible = LEVELS[level].length

  if (streak >= 5) {
    // 5 goed op rij → meer woorden of hoger level
    if (visibleCount < maxVisible) {
      return { level, visibleCount: visibleCount + 1, streak: 0, errorStreak: 0 }
    } else if (level < LEVELS.length - 1) {
      return { level: level + 1, visibleCount: MIN_VISIBLE, streak: 0, errorStreak: 0 }
    }
    return { level, visibleCount, streak: 0, errorStreak: 0 } // al op max
  }

  if (errorStreak >= 2) {
    // 2 fouten → minder woorden
    if (visibleCount > MIN_VISIBLE) {
      return { level, visibleCount: visibleCount - 1, streak: 0, errorStreak: 0 }
    } else if (level > 0) {
      // Op minimum en 3+ fouten → level terug
      return { level: level - 1, visibleCount: LEVELS[level - 1].length, streak: 0, errorStreak: 0 }
    }
  }

  return { level, visibleCount, streak, errorStreak }
}

describe('Adaptief systeem — Module 1 progressie', () => {

  it('5 correct op rij → meer woordblokken', () => {
    const resultaat = berekenVolgendNiveau({ level: 0, visibleCount: 2, streak: 5, errorStreak: 0 })
    expect(resultaat.visibleCount).toBe(3)
    expect(resultaat.streak).toBe(0) // streak reset na doorgang
  })

  it('5 correct met max woorden → level omhoog', () => {
    const maxVanLevel0 = LEVELS[0].length // 3
    const resultaat = berekenVolgendNiveau({ level: 0, visibleCount: maxVanLevel0, streak: 5, errorStreak: 0 })
    expect(resultaat.level).toBe(1)
    expect(resultaat.visibleCount).toBe(MIN_VISIBLE) // reset naar minimum
  })

  it('3 correct — niet genoeg voor doorgang', () => {
    const resultaat = berekenVolgendNiveau({ level: 0, visibleCount: 2, streak: 3, errorStreak: 0 })
    expect(resultaat.level).toBe(0)
    expect(resultaat.visibleCount).toBe(2) // ongewijzigd
  })

  it('2 fouten op rij → minder woordblokken', () => {
    const resultaat = berekenVolgendNiveau({ level: 1, visibleCount: 4, streak: 0, errorStreak: 2 })
    expect(resultaat.visibleCount).toBe(3)
    expect(resultaat.errorStreak).toBe(0)
  })

  it('2 fouten op minimum → level terug', () => {
    const resultaat = berekenVolgendNiveau({ level: 1, visibleCount: MIN_VISIBLE, streak: 0, errorStreak: 2 })
    expect(resultaat.level).toBe(0)
  })

  it('minimaal aantal woorden nooit onder 2', () => {
    const resultaat = berekenVolgendNiveau({ level: 0, visibleCount: MIN_VISIBLE, streak: 0, errorStreak: 2 })
    // Op level 0 minimum: kan niet verder omlaag
    expect(resultaat.visibleCount).toBeGreaterThanOrEqual(MIN_VISIBLE)
  })

  it('maximaal aantal woorden nooit boven level-max', () => {
    // Level 0 heeft 3 woorden maximaal
    const resultaat = berekenVolgendNiveau({ level: 0, visibleCount: 3, streak: 5, errorStreak: 0 })
    // Gaat naar level 1, niet visibleCount > 3 op level 0
    expect(resultaat.visibleCount).toBeLessThanOrEqual(LEVELS[resultaat.level].length)
  })

  it('al op max level en max woorden: geen wijziging', () => {
    const maxLevel = LEVELS.length - 1
    const maxVisible = LEVELS[maxLevel].length
    const resultaat = berekenVolgendNiveau({ level: maxLevel, visibleCount: maxVisible, streak: 5, errorStreak: 0 })
    expect(resultaat.level).toBe(maxLevel)
    expect(resultaat.visibleCount).toBe(maxVisible)
  })

})

// ---- Patroon herkennen adaptief systeem ----

const DIFFICULTY_STEPS = [
  [3, 2, 3000], [3, 3, 3000], [3, 3, 2000],
  [3, 4, 3000], [4, 3, 3000], [4, 4, 3000],
  [4, 4, 2000], [4, 5, 3000], [4, 5, 2000],
]

function berekenPatroonNiveau({ step, consecutiveCorrect, consecutiveWrong }) {
  if (consecutiveCorrect >= 3 && step < DIFFICULTY_STEPS.length - 1) {
    return { step: step + 1, consecutiveCorrect: 0, consecutiveWrong: 0 }
  }
  if (consecutiveWrong >= 2 && step > 0) {
    return { step: step - 1, consecutiveCorrect: 0, consecutiveWrong: 0 }
  }
  return { step, consecutiveCorrect, consecutiveWrong }
}

describe('Adaptief systeem — Patroon herkennen', () => {

  it('3 correct op rij → moeilijker niveau', () => {
    const r = berekenPatroonNiveau({ step: 0, consecutiveCorrect: 3, consecutiveWrong: 0 })
    expect(r.step).toBe(1)
  })

  it('2 fouten op rij → makkelijker niveau', () => {
    const r = berekenPatroonNiveau({ step: 3, consecutiveCorrect: 0, consecutiveWrong: 2 })
    expect(r.step).toBe(2)
  })

  it('moeilijkheid nooit onder 0', () => {
    const r = berekenPatroonNiveau({ step: 0, consecutiveCorrect: 0, consecutiveWrong: 2 })
    expect(r.step).toBeGreaterThanOrEqual(0)
  })

  it('moeilijkheid nooit boven maximum', () => {
    const max = DIFFICULTY_STEPS.length - 1
    const r = berekenPatroonNiveau({ step: max, consecutiveCorrect: 3, consecutiveWrong: 0 })
    expect(r.step).toBeLessThanOrEqual(max)
  })

})
