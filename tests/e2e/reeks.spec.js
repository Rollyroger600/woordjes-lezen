import { test, expect } from '@playwright/test'
import { setupSupabaseMock, loginAsTestKind } from './helpers/supabaseMock.js'

test.describe('Module 5: Kleurenreeks (Simon)', () => {

  test.beforeEach(async ({ page }) => {
    // 10+ sterren voor Geheugenpaleis unlock
    await setupSupabaseMock(page, {
      progress: [
        { profile_id: 'test-uuid-123', module: 1, total_stars: 6, current_level: 1, words_visible: 2, consecutive_correct: 0, consecutive_wrong: 0, clock_intro_seen: false, simon_highscore: 0 },
        { profile_id: 'test-uuid-123', module: 2, total_stars: 4, current_level: 0, words_visible: 2, consecutive_correct: 0, consecutive_wrong: 0, clock_intro_seen: false, simon_highscore: 0 },
        { profile_id: 'test-uuid-123', module: 5, total_stars: 0, current_level: 2, words_visible: 2, consecutive_correct: 0, consecutive_wrong: 0, clock_intro_seen: false, simon_highscore: 3 },
      ],
    })
    await loginAsTestKind(page)

    await page.tap('text=Het Geheugenpaleis')
    await page.waitForSelector('text=Reeks', { timeout: 5000 })
    await page.tap('text=Reeks')
    await page.waitForTimeout(1000)
  })

  test('2 gekleurde blokken zichtbaar bij start', async ({ page }) => {
    // Beginstand: 2 kleuren (blauw + rood)
    const colorBlocks = page.locator('button[style*="background"]').filter({ hasNotText: /←|terug/i })
    const count = await colorBlocks.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('reeks-teller boven in scherm zichtbaar', async ({ page }) => {
    await expect(page.locator('text=Reeks van')).toBeVisible({ timeout: 5000 })
  })

  test('highscore teller aanwezig (mock heeft highscore: 3)', async ({ page }) => {
    await expect(page.locator('text=Beste reeks: 3')).toBeVisible({ timeout: 5000 })
  })

  test('kleurenblokken lichten op tijdens afspelen reeks', async ({ page }) => {
    const logs = []
    page.on('console', msg => {
      if (msg.text().includes('SimonGame')) logs.push(msg.text())
    })

    // Wacht op reeks afspelen (audio + oplichten)
    await page.waitForTimeout(4000)

    // Debug log verwacht
    const heeftReeksLog = logs.some(l => l.includes('SimonGame ronde'))
    expect(heeftReeksLog).toBeTruthy()
  })

  test('na reeks afspelen: tekst "Nu jij!" zichtbaar', async ({ page }) => {
    // Wacht tot intro klaar is en reeks gespeeld is
    await page.waitForTimeout(5000)
    await expect(page.locator('text=Nu jij!')).toBeVisible({ timeout: 5000 })
  })

  test('terugknop werkt', async ({ page }) => {
    await page.tap('text=←')
    await expect(page.locator('text=Het Geheugenpaleis')).toBeVisible({ timeout: 5000 })
  })

})
