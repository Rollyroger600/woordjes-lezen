#!/usr/bin/env node
// ============================================================
// generateRapport.js — Testrapport generator
// Gebruik: node tests/generateRapport.js
// Combineert Vitest JSON + Playwright JSON output in één rapport
// ============================================================

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

function leesJSON(pad) {
  const vollePad = resolve(ROOT, pad)
  if (!existsSync(vollePad)) return null
  try {
    return JSON.parse(readFileSync(vollePad, 'utf8'))
  } catch {
    return null
  }
}

function tijdstempel() {
  return new Date().toLocaleString('nl-NL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ---- Verwerk Vitest resultaten ----
function verwerkVitest(data) {
  if (!data) return { totaal: 0, geslaagd: 0, gefaald: 0, tests: [] }

  const tests = []
  let geslaagd = 0
  let gefaald = 0

  // Vitest JSON formaat: { testResults: [{ name, assertionResults: [{ title, status }] }] }
  const suites = data.testResults || []
  for (const suite of suites) {
    const bestand = (suite.name || suite.testFilePath || 'onbekend').replace(ROOT + '/', '')
    for (const test of suite.assertionResults || []) {
      const ok = test.status === 'passed'
      if (ok) geslaagd++; else gefaald++
      tests.push({ bestand, naam: test.fullName || test.title, ok, duur: test.duration || 0 })
    }
  }

  return { totaal: geslaagd + gefaald, geslaagd, gefaald, tests }
}

// ---- Verwerk Playwright resultaten ----
function verwerkPlaywright(data) {
  if (!data) return { totaal: 0, geslaagd: 0, gefaald: 0, tests: [] }

  const tests = []
  let geslaagd = 0
  let gefaald = 0

  function doorloopSuites(suites, bestand = '') {
    for (const suite of suites || []) {
      const bestandNaam = suite.file || bestand
      for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) {
          const ok = test.results?.[0]?.status === 'passed'
          if (ok) geslaagd++; else gefaald++
          tests.push({
            bestand: bestandNaam.replace(ROOT + '/', ''),
            naam: `${suite.title} › ${spec.title}`,
            ok,
            duur: test.results?.[0]?.duration || 0,
          })
        }
      }
      doorloopSuites(suite.suites, bestandNaam)
    }
  }

  doorloopSuites(data.suites)
  return { totaal: geslaagd + gefaald, geslaagd, gefaald, tests }
}

// ---- Druk rapport af ----
function drukRapport(vitest, playwright) {
  const totaalGeslaagd = vitest.geslaagd + playwright.geslaagd
  const totaalGefaald = vitest.gefaald + playwright.gefaald
  const totaal = vitest.totaal + playwright.totaal

  const lijn = '─'.repeat(60)
  const ok = totaalGefaald === 0

  console.log()
  console.log('╔' + '═'.repeat(58) + '╗')
  console.log('║  TESTRAPPORT — Woordjes Lezen'.padEnd(59) + '║')
  console.log('║  ' + tijdstempel().padEnd(57) + '║')
  console.log('╚' + '═'.repeat(58) + '╝')
  console.log()

  // Samenvatting
  console.log(`  Totaal: ${totaal} tests  |  ✓ ${totaalGeslaagd} geslaagd  |  ${totaalGefaald > 0 ? '✗' : '✓'} ${totaalGefaald} gefaald`)
  console.log()

  // Unit tests
  console.log('  UNIT TESTS (Vitest)')
  console.log('  ' + lijn.slice(2))
  if (!leesJSON('tests/results/vitest-results.json')) {
    console.log('  ⚠ Geen resultaten. Voer eerst: npm test')
  } else {
    console.log(`  ${vitest.geslaagd}/${vitest.totaal} geslaagd`)
    for (const t of vitest.tests) {
      const icoon = t.ok ? '  ✓' : '  ✗'
      const naam = `${t.naam}`.slice(0, 50)
      console.log(`${icoon} ${naam}`)
    }
  }
  console.log()

  // E2E tests
  console.log('  E2E TESTS (Playwright)')
  console.log('  ' + lijn.slice(2))
  if (!leesJSON('tests/results/playwright-results.json')) {
    console.log('  ⚠ Geen resultaten. Voer eerst: npm run test:e2e')
  } else {
    console.log(`  ${playwright.geslaagd}/${playwright.totaal} geslaagd`)
    let huidigBestand = ''
    for (const t of playwright.tests) {
      if (t.bestand !== huidigBestand) {
        huidigBestand = t.bestand
        console.log(`\n  [${huidigBestand}]`)
      }
      const icoon = t.ok ? '  ✓' : '  ✗'
      const naam = t.naam.slice(0, 52)
      console.log(`${icoon} ${naam}`)
    }
  }
  console.log()

  // Eindoordeel
  if (ok) {
    console.log('  ✅ Alle tests geslaagd!')
  } else {
    console.log(`  ❌ ${totaalGefaald} test(s) gefaald — zie details hierboven`)
  }
  console.log()

  process.exit(ok ? 0 : 1)
}

// ---- Hoofd ----
const vitestData = leesJSON('tests/results/vitest-results.json')
const playwrightData = leesJSON('tests/results/playwright-results.json')

const vitest = verwerkVitest(vitestData)
const playwright = verwerkPlaywright(playwrightData)

drukRapport(vitest, playwright)
