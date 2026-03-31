import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('loads with hero section and search bar', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Explore the Movie')).toBeVisible()
    await expect(page.getByText('Universe', { exact: true })).toBeVisible()
    await expect(page.getByPlaceholder('Search movies, actors, directors...')).toBeVisible()
  })

  test('shows trending movies section', async ({ page }) => {
    await page.goto('/')

    // Wait for trending movies to load (skeleton disappears, real content appears)
    await expect(page.getByText('Trending')).toBeVisible({ timeout: 10000 })

    // Should have at least one movie card with a title
    const movieCards = page.locator('a[href^="/movie/"]')
    await expect(movieCards.first()).toBeVisible({ timeout: 10000 })
  })

  test('has working navigation links', async ({ page }) => {
    await page.goto('/')

    // Header has nav links
    await expect(page.getByRole('link', { name: /heatmap/i })).toBeVisible()
  })
})
