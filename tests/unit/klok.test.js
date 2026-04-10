// ============================================================
// klok.test.js — Unit tests voor klokkijken tijdopties
// Test de optie-generatie zoals in KlokGame.jsx
// ============================================================

import { describe, it, expect } from 'vitest'

// Spiegel van tijdoptie-generatie uit KlokGame.jsx
// Genereert hele uren (fase 1) of halve uren (fase 2)

function formatTijd(uur, minuten) {
  if (minuten === 0) return `${uur} uur`
  if (minuten === 30) return `half ${uur + 1 > 12 ? 1 : uur + 1}`
  return `${uur}:${String(minuten).padStart(2, '0')}`
}

function genereerTijdopties(correctUur, correctMinuten, fase, aantalOpties = 3) {
  const correct = formatTijd(correctUur, correctMinuten)
  const opties = new Set([correct])

  const maxPogingen = 50
  let pogingen = 0

  while (opties.size < aantalOpties && pogingen < maxPogingen) {
    pogingen++
    let uur, min

    if (fase === 1) {
      // Alleen hele uren
      uur = Math.floor(Math.random() * 12) + 1
      min = 0
    } else {
      // Hele en halve uren
      uur = Math.floor(Math.random() * 12) + 1
      min = Math.random() < 0.5 ? 0 : 30
    }

    const kandidaat = formatTijd(uur, min)
    if (kandidaat !== correct) {
      opties.add(kandidaat)
    }
  }

  return Array.from(opties)
}

describe('Klokkijken — tijdopties genereren', () => {

  it('genereer_tijdopties_heel_uur(3) → bevat "3 uur"', () => {
    const opties = genereerTijdopties(3, 0, 1, 3)
    expect(opties).toContain('3 uur')
  })

  it('3 opties gegenereerd voor heel uur', () => {
    const opties = genereerTijdopties(6, 0, 1, 3)
    expect(opties).toHaveLength(3)
  })

  it('opties bevatten altijd "uur" bij fase 1', () => {
    for (let uur = 1; uur <= 12; uur++) {
      const opties = genereerTijdopties(uur, 0, 1, 3)
      for (const optie of opties) {
        expect(optie).toMatch(/uur/)
      }
    }
  })

  it('opties_nooit_negatief: uren altijd tussen 1 en 12', () => {
    for (let i = 0; i < 20; i++) {
      const uur = Math.floor(Math.random() * 12) + 1
      const opties = genereerTijdopties(uur, 0, 1, 3)

      for (const optie of opties) {
        const match = optie.match(/^(\d+) uur$/)
        if (match) {
          const uurGetal = parseInt(match[1])
          expect(uurGetal).toBeGreaterThanOrEqual(1)
          expect(uurGetal).toBeLessThanOrEqual(12)
        }
      }
    }
  })

  it('opties_altijd_verschillend: geen duplicaten in één ronde', () => {
    for (let i = 0; i < 30; i++) {
      const uur = Math.floor(Math.random() * 12) + 1
      const opties = genereerTijdopties(uur, 0, 1, 3)
      const uniek = new Set(opties)
      expect(uniek.size).toBe(opties.length)
    }
  })

  it('fase 2 (halve uren) → opties bevatten "half" of "uur"', () => {
    const opties = genereerTijdopties(3, 30, 2, 3)
    expect(opties).toContain('half 4')

    for (const optie of opties) {
      expect(optie).toMatch(/uur|half/)
    }
  })

  it('half 1 na 12 uur klopt (12:30 → half 1)', () => {
    const tekst = formatTijd(12, 30)
    expect(tekst).toBe('half 1')
  })

  it('half 13 bestaat niet: uur 12 half → half 1', () => {
    const opties = genereerTijdopties(12, 30, 2, 3)
    expect(opties).toContain('half 1')
    for (const optie of opties) {
      expect(optie).not.toMatch(/half 13/)
    }
  })

})
