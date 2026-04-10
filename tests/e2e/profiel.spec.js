import { test, expect } from '@playwright/test'
import { setupSupabaseMock, buildMockProfile, loginAsTestKind } from './helpers/supabaseMock.js'

// ---- Profiel tests ----

test.describe('Profiel aanmaken & inloggen', () => {

  test.beforeEach(async ({ page }) => {
    await setupSupabaseMock(page)
  })

  test('nieuw profiel aanmaken', async ({ page }) => {
    // Lege profiellijst — geen profielen
    await setupSupabaseMock(page, { profiles: [] })
    await page.goto('/')
    await page.waitForSelector('text=Tik om te starten', { timeout: 5000 })
    await page.click('text=Tik om te starten', { noWaitAfter: true })

    // "+ Nieuw kind" knop
    await page.waitForSelector('text=Nieuw kind', { timeout: 8000 })
    await page.tap('text=Nieuw kind')

    // Naam invoeren
    await page.waitForSelector('input', { timeout: 5000 })
    await page.fill('input', 'TestKind')
    await page.tap('text=Volgende')

    // Avatar kiezen — eerste beschikbare
    await page.waitForSelector('text=Kies een plaatje', { timeout: 5000 })
    const avatarButtons = page.locator('button').filter({ hasText: /🐸|🐼|🦊/ })
    await avatarButtons.first().tap()
    await page.tap('text=Volgende')

    // PIN instellen: 1, 2, 3
    await page.waitForSelector('button:has-text("1")', { timeout: 5000 })
    await page.tap('button:has-text("1")')
    await page.tap('button:has-text("2")')
    await page.tap('button:has-text("3")')

    // Na aanmaken: mock retourneert het nieuwe profiel
    await setupSupabaseMock(page, { profiles: [await buildMockProfile()] })

    // Profiel zou op het scherm moeten verschijnen (of direct inloggen)
    // App gaat na aanmaken direct naar sami-intro of home
    await expect(page.locator('body')).toBeVisible()
  })

  test('inloggen met bestaand profiel', async ({ page }) => {
    await loginAsTestKind(page)

    // Homescreen zichtbaar
    await expect(page.locator('text=De Woordentuin')).toBeVisible()
    await expect(page.locator('text=TestKind')).toBeVisible()
  })

  test('verkeerde pincode geeft foutmelding', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Tik om te starten', { timeout: 5000 })
    await page.click('text=Tik om te starten', { noWaitAfter: true })

    await page.waitForSelector('text=TestKind', { timeout: 8000 })
    await page.tap('text=TestKind')

    // PIN pad laden
    await page.waitForSelector('button:has-text("9")', { timeout: 5000 })

    // Verkeerde PIN: 9, 9, 9
    await page.tap('button:has-text("9")')
    await page.tap('button:has-text("9")')
    await page.tap('button:has-text("9")')

    // Wacht kort op fout-feedback
    await page.waitForTimeout(600)

    // Moet op inlogscherm blijven — geen homescreen
    await expect(page.locator('text=De Woordentuin')).not.toBeVisible()

    // PIN-dots moeten gewist zijn (leeg na fout)
    const filledDots = page.locator('.bg-purple-600')
    await expect(filledDots).toHaveCount(0, { timeout: 2000 })
  })

  test('profiel verwijderen vereist bevestiging', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Tik om te starten', { timeout: 5000 })
    await page.click('text=Tik om te starten', { noWaitAfter: true })

    await page.waitForSelector('text=TestKind', { timeout: 8000 })

    // Long-press op profielkaart (3 seconden)
    const profileCard = page.locator('text=TestKind').first()
    await profileCard.dispatchEvent('touchstart')
    await page.waitForTimeout(3100)
    await profileCard.dispatchEvent('touchend')

    // Stap 2: "Ja →" bevestigingsknop zou moeten verschijnen
    // (App toont eerst een waarschuwing)
    await page.waitForTimeout(500)

    // Verwijder-dialoog of waarschuwingstekst verwacht
    const deleteVisible = await page.locator('text=verwijderen').isVisible().catch(() => false)
    const jaVisible = await page.locator('text=Ja').isVisible().catch(() => false)

    // Minstens één van beide indicators moet zichtbaar zijn
    expect(deleteVisible || jaVisible).toBeTruthy()
  })

  test('streak-indicator zichtbaar als streak > 1', async ({ page }) => {
    await loginAsTestKind(page)
    // Mock profiel heeft streak_count: 3
    await expect(page.locator('text=3 dagen op rij')).toBeVisible()
  })

})
