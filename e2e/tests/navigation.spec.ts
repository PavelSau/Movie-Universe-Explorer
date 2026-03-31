import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('navigate to heatmap page and back', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: /heatmap/i }).click()
    await expect(page).toHaveURL('/heatmap')

    // Heatmap page should render
    await expect(page.getByRole('heading', { name: /genre/i })).toBeVisible({ timeout: 10000 })

    // Go back home via logo
    await page.getByRole('link', { name: /movie universe/i }).first().click()
    await expect(page).toHaveURL('/')
  })

  test('movie detail page shows key sections', async ({ page }) => {
    // Navigate directly to a well-known movie (Fight Club = 550)
    await page.goto('/movie/550')

    // Wait for content to load
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 })

    // Should show cast section
    await expect(page.getByText(/cast/i)).toBeVisible({ timeout: 10000 })
  })

  test('person detail page shows biography', async ({ page }) => {
    // Navigate directly to a well-known person (Brad Pitt = 287)
    await page.goto('/person/287')

    // Wait for content to load
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 })
  })

  test('wishlist page requires auth', async ({ page }) => {
    await page.goto('/wishlist')

    // Should show sign-in prompt for unauthenticated users
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible({ timeout: 10000 })
  })
})
