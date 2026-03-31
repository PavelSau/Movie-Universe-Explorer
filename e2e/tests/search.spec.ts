import { test, expect } from '@playwright/test'

test.describe('Search flow', () => {
  test('search returns results and navigates to movie detail', async ({ page }) => {
    await page.goto('/')

    const searchInput = page.getByPlaceholder('Search movies, actors, directors...')
    await searchInput.fill('Fight Club')

    // Wait for search results dropdown to appear
    const resultLink = page.locator('a[href^="/movie/"]').first()
    await expect(resultLink).toBeVisible({ timeout: 10000 })

    // Click first movie result
    await resultLink.click()

    // Should navigate to movie detail page
    await expect(page).toHaveURL(/\/movie\/\d+/)

    // Movie detail page should show title and metadata
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
  })

  test('search returns person results and navigates to person detail', async ({ page }) => {
    await page.goto('/')

    const searchInput = page.getByPlaceholder('Search movies, actors, directors...')
    await searchInput.fill('Brad Pitt')

    // Wait for results
    const personLink = page.locator('a[href^="/person/"]').first()
    await expect(personLink).toBeVisible({ timeout: 10000 })

    // Click person result
    await personLink.click()

    // Should navigate to person detail page
    await expect(page).toHaveURL(/\/person\/\d+/)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
  })

  test('shows "No results found" for gibberish query', async ({ page }) => {
    await page.goto('/')

    const searchInput = page.getByPlaceholder('Search movies, actors, directors...')
    await searchInput.fill('zzzxxx999qqq')

    await expect(page.getByText('No results found')).toBeVisible({ timeout: 10000 })
  })
})
