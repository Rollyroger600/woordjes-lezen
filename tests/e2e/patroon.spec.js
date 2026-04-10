import { test, expect } from '@playwright/test'
import { setupSupabaseMock, loginAsTestKind } from './helpers/supabaseMock.js'

test.describe('Module 4: Patroon herkennen', () => {

  test.beforeEach(async ({ page }) => {
    // Patroon zit in Het Geheugenpaleis (unlock na 10 sterren)
    // Mock profiel met genoeg sterren
    await setupSupabaseMock(page, {
      profiles: [Object.assign(await (await import('./helpers/supabaseMock.js')).buildMockProfile(), {})],
      progress: [
        { profile_id: 'test-uuid-123', module: 1, total_stars: 6, current_level: 1, words_visible: 2, consecutive_correct: 0, consecutive_wrong: 0, clock_intro_seen: false, simon_highscore: 0 },
        { profile_id: 'test-uuid-123', module: 2, total_stars: 4, current_level: 0, words_visible: 2, consecutive_correct: 0, consecutive_wrong: 0, clock_intro_seen: false, simon_highscore: 0 },
        { profile_id: 'test-uuid-123', module: 4, total_stars: 0, current_level: 0, words_visible: 2, consecutive_correct: 0, consecutive_wrong: 0, clock_intro_seen: false, simon_highscore: 0 },
      ],
    })
    await loginAsTestKind(page)

    // Navigeer naar Geheugenpaleis → Patroon
    await page.tap('text=Het Geheugenpaleis')
    await page.waitForSelector('text=Patroon', { timeout: 5000 })
    await page.tap('text=Patroon')
    await page.waitForTimeout(800) // wacht op ronde start
  })

  test('patroon basisflow — 3×3 grid zichtbaar', async ({ page }) => {
    // Gridcellen zijn lege knoppen (geen tekst) met vaste breedte/hoogte
    // Gebruik de grid-container om de terugknop uit te sluiten
    await page.waitForTimeout(500)
    // Grid container heeft display:grid style
    const gridContainer = page.locator('div[style*="grid-template-columns"]').first()
    const cells = gridContainer.locator('button')
    const count = await cells.count()
    expect(count).toBeGreaterThanOrEqual(9)
  })

  test('check-knop verschijnt pas na eerste selectie', async ({ page }) => {
    // Wacht tot input-fase: audio (max 8s fallback) + showMs (3s) = ~12s
    await page.waitForSelector('text=Tik de vakjes', { timeout: 15000 })

    // Check-knop moet NIET zichtbaar zijn vóór selectie
    await expect(page.locator('text=Check!')).not.toBeVisible()

    // Klik eerste gridcel (lege knop in grid-container, niet de terugknop)
    const gridContainer = page.locator('div[style*="grid-template-columns"]').first()
    const firstCell = gridContainer.locator('button').first()
    await firstCell.click({ force: true })
    await page.waitForTimeout(300)

    // Nu moet Check! ✓ verschijnen
    await expect(page.locator('button', { hasText: 'Check!' })).toBeVisible({ timeout: 3000 })
  })

  test('patroon — feedback na check: groen of rood', async ({ page }) => {
    // Wacht tot input-fase
    await page.waitForSelector('text=Tik de vakjes', { timeout: 15000 })

    // Klik 2 gridcellen via grid-container (niet de terugknop)
    const gridContainer = page.locator('div[style*="grid-template-columns"]').first()
    const cells = gridContainer.locator('button')
    await cells.nth(0).click({ force: true })
    await cells.nth(1).click({ force: true })

    // Check klikken
    await page.locator('button', { hasText: 'Check!' }).click({ force: true })
    await page.waitForTimeout(500)

    // Feedback: cellen hebben groene (#4CAF50) of rode (#F44336) achtergrond
    const greenCell = page.locator('button[style*="rgb(76, 175, 80)"]')
    const redCell   = page.locator('button[style*="rgb(244, 67, 54)"]')

    const hasGreen = await greenCell.count() > 0
    const hasRed   = await redCell.count() > 0

    expect(hasGreen || hasRed).toBeTruthy()
  })

  test('level-info balk toont raster-configuratie', async ({ page }) => {
    // "3×3 raster" tekst bovenaan verwacht
    await expect(page.locator('text=/3.*raster/')).toBeVisible({ timeout: 5000 })
  })

})
