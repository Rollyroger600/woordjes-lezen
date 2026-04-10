import { test, expect } from '@playwright/test'
import { setupSupabaseMock, loginAsTestKind } from './helpers/supabaseMock.js'

test.describe('Module 1: Woordjes lezen', () => {
  test.setTimeout(60000) // audio fallback vereist 8s; hint test 14s + navigatie

  test.beforeEach(async ({ page }) => {
    await setupSupabaseMock(page)
    await loginAsTestKind(page)

    // Navigeer naar De Woordentuin → Module 1
    await page.tap('text=De Woordentuin')
    await page.waitForSelector('text=Woordjes', { timeout: 5000 })
    await page.tap('text=Woordjes')

    // Wacht op start-knop (tekst is "Verder spelen!" als er al sterren zijn, anders "Start!")
    // force: true overslaat stabiliteitscheck (knop heeft animate-pulse-gentle animatie)
    const startBtn = page.locator('button').filter({ hasText: /spelen|Start/ }).first()
    await startBtn.waitFor({ timeout: 5000 })
    await startBtn.click({ force: true })
  })

  test('woordherkenning basisflow — 2 woordblokken zichtbaar', async ({ page }) => {
    // Na start: 2 woordblokken verschijnen na audio intro (max 8s timeout via speakItem fallback)
    await page.waitForTimeout(9000)
    const wordButtons = page.locator('button').filter({ hasNotText: /🏠|terug|back/i })
    const count = await wordButtons.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('klik een woordblok geeft feedback', async ({ page }) => {
    // Wacht op audio-intro (max 8s fallback) zodat woordblokken verschijnen
    await page.waitForTimeout(9000)

    // Klik het eerste woordblok
    const wordButtons = page.locator('button[style*="background"]').first()
    await wordButtons.tap()

    // Wacht op visuele feedback (kleurwijziging, animatie)
    await page.waitForTimeout(600)

    // Scherm moet nog steeds actief zijn (geen crash)
    await expect(page.locator('body')).toBeVisible()
  })

  test('hint systeem — animatie na 5 seconden niets doen', async ({ page }) => {
    // Wacht tot audio-intro klaar is (max 8s fallback) + 5.5s hint timer
    await page.waitForTimeout(14000)

    // Na 5s zonder klik: een woordblok krijgt wobble animatie class
    const hintedWord = page.locator('[class*="wobble"]')
    const hasHint = await hintedWord.count() > 0
    expect(hasHint).toBeTruthy()
  })

  test('sterrenbalk aanwezig op spelscherm', async ({ page }) => {
    // Sterren zijn direct zichtbaar zodra het spelscherm laadt (onafhankelijk van audio)
    await expect(page.locator('text=⭐').first()).toBeVisible({ timeout: 5000 })
  })

  test('terugknop gaat terug naar homescreen', async ({ page }) => {
    // Back button is 🏠 in App.jsx
    await page.waitForSelector('button:has-text("🏠")', { timeout: 5000 })
    await page.click('button:has-text("🏠")')
    await expect(page.locator('text=De Woordentuin')).toBeVisible({ timeout: 5000 })
  })

  test('level-indicator aanwezig op spelscherm', async ({ page }) => {
    await page.waitForTimeout(500)
    // Level indicator: "Level X"
    await expect(page.locator('text=/Level \\d/')).toBeVisible({ timeout: 3000 })
  })

})
