// ============================================================
// supabaseMock.js — Playwright route-interceptor voor Supabase
// Onderschept alle REST calls naar Supabase en retourneert
// in-memory testdata. Geen echte database nodig.
// ============================================================

import bcrypt from 'bcryptjs'

const today = new Date().toISOString().split('T')[0]

// Bereken eenmalig een echte bcrypt hash voor PIN '123'
// (bcryptjs draait ook in Node, dus dit werkt in Playwright setup)
let MOCK_PIN_HASH = null
export async function getMockPinHash() {
  if (!MOCK_PIN_HASH) {
    MOCK_PIN_HASH = await bcrypt.hash('123', 8) // cost 8 is sneller voor tests
  }
  return MOCK_PIN_HASH
}

export async function buildMockProfile(overrides = {}) {
  const pinHash = await getMockPinHash()
  return {
    id: 'test-uuid-123',
    child_name: 'TestKind',
    avatar: '🦊',
    color: '#FF6B6B',
    streak_count: 3,
    last_played_date: today,
    sami_introduced: true,
    pin_hash: pinHash,
    ...overrides,
  }
}

export const MOCK_PROGRESS = [
  {
    profile_id: 'test-uuid-123',
    module: 1,
    current_level: 1,
    words_visible: 2,
    total_stars: 5,
    consecutive_correct: 0,
    consecutive_wrong: 0,
    clock_intro_seen: false,
    simon_highscore: 0,
  },
  {
    profile_id: 'test-uuid-123',
    module: 2,
    current_level: 0,
    words_visible: 2,
    total_stars: 3,
    consecutive_correct: 0,
    consecutive_wrong: 0,
    clock_intro_seen: false,
    simon_highscore: 0,
  },
]

/**
 * Activeer de Supabase mock voor een Playwright pagina.
 * Onderschept alle /rest/v1/* calls en retourneert testdata.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} options
 * @param {object[]} options.profiles  - Array van profielen om terug te geven
 * @param {object[]} options.progress  - Array van voortgang om terug te geven
 */
export async function setupSupabaseMock(page, options = {}) {
  const profiles = options.profiles ?? [await buildMockProfile()]
  const progress = options.progress ?? MOCK_PROGRESS

  // Onderschep alle Supabase REST calls
  await page.route('**/rest/v1/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    // ---- profiles tabel ----
    if (url.includes('/rest/v1/profiles')) {
      if (method === 'GET') {
        await route.fulfill({ json: profiles, status: 200 })
      } else if (method === 'POST') {
        // INSERT: geef het eerste profiel terug als bevestiging
        await route.fulfill({ json: [profiles[0]], status: 201 })
      } else if (method === 'PATCH' || method === 'PUT') {
        await route.fulfill({ json: [profiles[0]], status: 200 })
      } else {
        await route.fulfill({ json: [], status: 200 })
      }
      return
    }

    // ---- progress tabel ----
    if (url.includes('/rest/v1/progress')) {
      if (method === 'GET') {
        await route.fulfill({ json: progress, status: 200 })
      } else {
        await route.fulfill({ json: progress, status: 200 })
      }
      return
    }

    // Alle andere Supabase calls (auth, storage, etc.) doorlaten / leeg
    await route.fulfill({ json: {}, status: 200 })
  })
}

/**
 * Helper: log in als TestKind met PIN 123.
 * Navigeert van splash → profiel → home.
 */
export async function loginAsTestKind(page) {
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')

  // Wacht op splash screen knop en klik specifiek
  // noWaitAfter: true voorkomt dat Playwright blijft wachten op navigatie
  // terwijl React de DOM updatet (state change, geen echte navigatie)
  await page.waitForSelector('text=Tik om te starten', { timeout: 5000 })
  await page.click('text=Tik om te starten', { noWaitAfter: true })

  // Wacht op profiellijst
  await page.waitForSelector('text=TestKind', { timeout: 8000 })
  await page.tap('text=TestKind')

  // PIN invoeren: 1, 2, 3
  await page.waitForSelector('button:has-text("1")', { timeout: 5000 })
  await page.tap('button:has-text("1")')
  await page.tap('button:has-text("2")')
  await page.tap('button:has-text("3")')

  // Wacht op homescreen
  await page.waitForSelector('text=De Woordentuin', { timeout: 8000 })
}
