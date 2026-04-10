// ============================================================
// streak.test.js — Unit tests voor streak-logica
// Test de dagelijkse streak berekening zoals in Root.jsx
// ============================================================

import { describe, it, expect } from 'vitest'

// Spiegel van de streak-logica uit Root.jsx
function berekenNieuweStreak({ lastPlayedDate, streakCount, vandaag }) {
  if (!lastPlayedDate) {
    // Eerste keer ooit gespeeld
    return 1
  }

  const laatste = new Date(lastPlayedDate)
  const today = new Date(vandaag)

  // Bereken verschil in dagen (negeer tijdzone door alleen datum te vergelijken)
  const ms = today.setHours(0,0,0,0) - laatste.setHours(0,0,0,0)
  const dagenGeleden = Math.round(ms / (1000 * 60 * 60 * 24))

  if (dagenGeleden === 0) {
    // Vandaag al gespeeld → ongewijzigd
    return streakCount
  } else if (dagenGeleden === 1) {
    // Gisteren gespeeld → streak verhogen
    return streakCount + 1
  } else {
    // 2+ dagen geleden → streak reset
    return 1
  }
}

describe('Streak systeem', () => {

  it('eerste keer gespeeld → streak = 1', () => {
    const streak = berekenNieuweStreak({
      lastPlayedDate: null,
      streakCount: 0,
      vandaag: '2026-04-06',
    })
    expect(streak).toBe(1)
  })

  it('gisteren gespeeld → streak + 1', () => {
    const streak = berekenNieuweStreak({
      lastPlayedDate: '2026-04-05',
      streakCount: 3,
      vandaag: '2026-04-06',
    })
    expect(streak).toBe(4)
  })

  it('vandaag al gespeeld → streak ongewijzigd', () => {
    const streak = berekenNieuweStreak({
      lastPlayedDate: '2026-04-06',
      streakCount: 5,
      vandaag: '2026-04-06',
    })
    expect(streak).toBe(5)
  })

  it('2 dagen geleden gespeeld → streak reset naar 1', () => {
    const streak = berekenNieuweStreak({
      lastPlayedDate: '2026-04-04',
      streakCount: 7,
      vandaag: '2026-04-06',
    })
    expect(streak).toBe(1)
  })

  it('week geleden gespeeld → streak reset naar 1', () => {
    const streak = berekenNieuweStreak({
      lastPlayedDate: '2026-03-30',
      streakCount: 14,
      vandaag: '2026-04-06',
    })
    expect(streak).toBe(1)
  })

  it('streak bouwt meerdere dagen op', () => {
    // Simuleer 4 opeenvolgende dagen
    let streakCount = 0
    let lastPlayedDate = null

    const dagen = ['2026-04-01', '2026-04-02', '2026-04-03', '2026-04-04']
    for (const dag of dagen) {
      streakCount = berekenNieuweStreak({ lastPlayedDate, streakCount, vandaag: dag })
      lastPlayedDate = dag
    }

    expect(streakCount).toBe(4)
  })

  it('onderbreking reset streak; opbouw daarna opnieuw', () => {
    let streakCount = berekenNieuweStreak({
      lastPlayedDate: '2026-04-03',
      streakCount: 5,
      vandaag: '2026-04-06', // 3 dagen gap
    })
    expect(streakCount).toBe(1)

    // Dag erna: streak = 2
    streakCount = berekenNieuweStreak({
      lastPlayedDate: '2026-04-06',
      streakCount,
      vandaag: '2026-04-07',
    })
    expect(streakCount).toBe(2)
  })

})
