import { chromium } from '@playwright/test'

async function captureScreenshots() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()

  // Home page
  await page.goto('http://localhost:5173/')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'e2e/screenshots/home.png' })

  // Home - dark mode trending
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'e2e/screenshots/home-trending.png', fullPage: false })

  // Search results
  await page.getByPlaceholder('Search movies, actors, directors...').fill('Fight Club')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'e2e/screenshots/search-results.png' })

  // Movie detail page
  const movieLink = page.locator('a[href^="/movie/"]').first()
  await movieLink.click()
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'e2e/screenshots/movie-detail.png' })

  // Scroll to cast
  await page.evaluate(() => window.scrollBy(0, 600))
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'e2e/screenshots/movie-cast.png' })

  // Person detail page
  await page.goto('http://localhost:5173/person/287')
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'e2e/screenshots/person-detail.png' })

  // Scroll to timeline/graph
  await page.evaluate(() => window.scrollBy(0, 500))
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'e2e/screenshots/person-viz.png' })

  // Heatmap page
  await page.goto('http://localhost:5173/heatmap')
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'e2e/screenshots/heatmap.png' })

  // Wishlist auth gate
  await page.goto('http://localhost:5173/wishlist')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'e2e/screenshots/wishlist-auth.png' })

  // Light mode - go home and toggle theme
  await page.goto('http://localhost:5173/')
  await page.waitForTimeout(2000)
  // Try clicking theme toggle
  const themeToggle = page.locator('button:has-text("Light"), [aria-label*="light"], [aria-label*="theme"]').first()
  try {
    await themeToggle.click({ timeout: 2000 })
    await page.waitForTimeout(1000)
  } catch {
    // If toggle not found by that selector, try another approach
  }
  await page.screenshot({ path: 'e2e/screenshots/home-light.png' })

  await browser.close()
  console.log('Screenshots captured!')
}

captureScreenshots().catch(console.error)
