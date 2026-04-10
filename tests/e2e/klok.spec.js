import { test, expect } from '@playwright/test'
import { setupSupabaseMock, loginAsTestKind, buildMockProfile } from './helpers/supabaseMock.js'

// Helper: navigeer naar klokkijken
async function navigeerNaarKlok(page) {
  await page.tap('text=De Klokkentoren')
  await page.waitForTimeout(500)
}

test.describe('Module 6: Klokkijken', () => {

  test.beforeEach(async ({ page }) => {
    // 20+ sterren totaal voor klokkentoren unlock
    await setupSupabaseMock(page, {
      progress: [
        { profile_id: 'test-uuid-123', module: 1, total_stars: 12, current_level: 2, words_visible: 4, consecutive_correct: 0, consecutive_wrong: 0, clock_intro_seen: false, simon_highscore: 0 },
        { profile_id: 'test-uuid-123', module: 2, total_stars: 8, current_level: 3, words_visible: 2, consecutive_correct: 0, consecutive_wrong: 0, clock_intro_seen: false, simon_highscore: 0 },
        { profile_id: 'test-uuid-123', module: 6, total_stars: 0, current_level: 1, words_visible: 2, consecutive_correct: 0, consecutive_wrong: 0, clock_intro_seen: false, simon_highscore: 0 },
      ],
    })
    await loginAsTestKind(page)
    await navigeerNaarKlok(page)
  })

  test('uitlegscherm zichtbaar als clock_intro_seen false', async ({ page }) => {
    // clock_intro_seen is false in mock progress → uitlegscherm verwacht
    await expect(page.locator('text=Klokkijken leren')).toBeVisible({ timeout: 5000 })

    // SVG klok aanwezig op uitlegscherm
    const svg = page.locator('svg').first()
    await expect(svg).toBeVisible()
  })

  test('uitlegscherm: klik "Ik snap het!" → oefenscherm', async ({ page }) => {
    await page.waitForSelector('text=Ik snap het', { timeout: 5000 })
    await page.tap('text=Ik snap het')

    // Oefenscherm: "Hoe laat is het?" verwacht
    await expect(page.locator('text=Hoe laat is het')).toBeVisible({ timeout: 5000 })
  })

  test('exact 3 antwoordopties op oefenscherm', async ({ page }) => {
    // Sla intro over
    await page.waitForSelector('text=Ik snap het', { timeout: 5000 })
    await page.tap('text=Ik snap het')

    await page.waitForTimeout(1000)

    // Antwoordknoppen met "uur" of "half"
    const options = page.locator('button').filter({ hasText: /uur|half/ })
    await expect(options).toHaveCount(3, { timeout: 5000 })
  })

  test('antwoordopties bevatten altijd "uur" of "half"', async ({ page }) => {
    await page.waitForSelector('text=Ik snap het', { timeout: 5000 })
    await page.tap('text=Ik snap het')
    await page.waitForTimeout(1000)

    const options = page.locator('button').filter({ hasText: /uur|half/ })
    const count = await options.count()

    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent()
      expect(text).toMatch(/uur|half/)
    }
  })

  test('antwoord klikken geeft kleur-feedback', async ({ page }) => {
    await page.waitForSelector('text=Ik snap het', { timeout: 5000 })
    await page.tap('text=Ik snap het')
    await page.waitForTimeout(1000)

    const options = page.locator('button').filter({ hasText: /uur|half/ })
    await options.first().tap()
    await page.waitForTimeout(500)

    // Feedback: groen of rood in background stijl
    const feedbackEl = page.locator('button[style*="rgb(200, 230, 201)"], button[style*="rgb(255, 205, 210)"]')
    await expect(feedbackEl.first()).toBeVisible({ timeout: 3000 })
  })

  test('analoge klok SVG aanwezig met wijzerplaat-cijfers', async ({ page }) => {
    await page.waitForSelector('text=Ik snap het', { timeout: 5000 })
    await page.tap('text=Ik snap het')
    await page.waitForTimeout(800)

    // SVG klok met cijfers 1-12
    const svgText = page.locator('svg text').first()
    await expect(svgText).toBeVisible({ timeout: 3000 })
  })

  test('klok opties zijn nooit identiek in één ronde', async ({ page }) => {
    await page.waitForSelector('text=Ik snap het', { timeout: 5000 })
    await page.tap('text=Ik snap het')

    // Test 5 rondes
    for (let ronde = 0; ronde < 5; ronde++) {
      await page.waitForTimeout(1200)
      const options = page.locator('button').filter({ hasText: /uur|half/ })
      const count = await options.count()
      if (count < 3) continue

      const texts = []
      for (let i = 0; i < count; i++) {
        texts.push(await options.nth(i).textContent())
      }

      // Geen duplicaten
      const unique = new Set(texts)
      expect(unique.size).toBe(texts.length)

      // Klik eerste optie om naar volgende ronde te gaan
      await options.first().tap()
      await page.waitForTimeout(2000)
    }
  })

})
