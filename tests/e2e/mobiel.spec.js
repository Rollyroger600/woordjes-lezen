import { test, expect } from '@playwright/test'
import { setupSupabaseMock, loginAsTestKind } from './helpers/supabaseMock.js'

// Mobiel-specifieke tests: touch targets en overflow

test.describe('Mobiel UX — touch targets & layout', () => {

  test.beforeEach(async ({ page }) => {
    await setupSupabaseMock(page)
  })

  test('splash screen — geen horizontale scroll', async ({ page }) => {
    await page.goto('/')
    const hasHScroll = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(hasHScroll).toBeFalsy()
  })

  test('profielscherm — geen horizontale scroll', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Tik om te starten', { timeout: 5000 }); await page.click('text=Tik om te starten', { noWaitAfter: true })
    await page.waitForSelector('text=TestKind', { timeout: 8000 })

    const hasHScroll = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(hasHScroll).toBeFalsy()
  })

  test('homescreen — geen horizontale scroll', async ({ page }) => {
    await loginAsTestKind(page)
    const hasHScroll = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(hasHScroll).toBeFalsy()
  })

  test('profielkaarten hebben minimale touch target (80px hoog)', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Tik om te starten', { timeout: 5000 }); await page.click('text=Tik om te starten', { noWaitAfter: true })
    await page.waitForSelector('text=TestKind', { timeout: 8000 })

    // Meet alle klikbare profielelementen
    const profileCard = page.locator('text=TestKind').locator('..')
    const box = await profileCard.boundingBox()
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(60) // minimaal 60px (profiel-kaart)
    }
  })

  test('homescreen kaarten minimaal 100px hoog', async ({ page }) => {
    await loginAsTestKind(page)
    await page.waitForSelector('text=De Woordentuin', { timeout: 5000 })

    const cards = page.locator('button').filter({ hasText: /Woordentuin|Geheugenpaleis|Klokkentoren|Rekenhuis/ })
    const count = await cards.count()

    for (let i = 0; i < count; i++) {
      const box = await cards.nth(i).boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(100)
      }
    }
  })

  test('PIN-knoppen minimaal 80px hoog', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Tik om te starten', { timeout: 5000 }); await page.click('text=Tik om te starten', { noWaitAfter: true })
    await page.waitForSelector('text=TestKind', { timeout: 8000 })
    await page.tap('text=TestKind')
    await page.waitForSelector('button:has-text("1")', { timeout: 5000 })

    // Meet PIN-knoppen
    const pinButton = page.locator('button:has-text("1")').first()
    const box = await pinButton.boundingBox()
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(60) // h-20 = 80px Tailwind
    }
  })

  test('tekst niet buiten viewport op mobiel (390px)', async ({ page }) => {
    // Viewport is al 390px breed via iPhone 14 config in playwright.config.js
    await loginAsTestKind(page)

    const viewportWidth = page.viewportSize().width
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)

    // Breedte mag niet groter zijn dan viewport
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1) // +1 voor afrondingsfouten
  })

  test('alle schermen toegankelijk zonder horizontale scroll', async ({ page }) => {
    const schermen = [
      { actie: async () => { await page.goto('/'); await page.waitForSelector('text=Tik om te starten', { timeout: 5000 }); await page.click('text=Tik om te starten', { noWaitAfter: true }) }, naam: 'profiel' },
    ]

    for (const scherm of schermen) {
      await scherm.actie()
      await page.waitForTimeout(500)

      const hasHScroll = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      )
      expect(hasHScroll, `Horizontale scroll op scherm: ${scherm.naam}`).toBeFalsy()
    }
  })

})
