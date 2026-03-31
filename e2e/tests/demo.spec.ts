import { test as base, expect, type Page, type BrowserContext } from '@playwright/test'

// Shared page across all tests — one browser, one session
let context: BrowserContext
let page: Page

const test = base.extend({})

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  page = await context.newPage()
})

test.afterAll(async () => {
  await context.close()
})

test.describe('Movie Explorer — Demo', () => {
  test('1. Home page loads with hero and search bar', async () => {
    await page.goto('/')

    await expect(page.getByText('Explore the Movie')).toBeVisible()
    await expect(page.getByText('Universe', { exact: true })).toBeVisible()
    await expect(page.getByPlaceholder('Search movies, actors, directors...')).toBeVisible()
  })

  test('2. Trending movies section loads', async () => {
    await expect(page.getByText('Trending')).toBeVisible({ timeout: 10000 })
    const movieCards = page.locator('a[href^="/movie/"]')
    await expect(movieCards.first()).toBeVisible({ timeout: 10000 })
  })

  test('3. Search for a movie and navigate to detail', async () => {
    await page.goto('/')

    const searchInput = page.getByPlaceholder('Search movies, actors, directors...')
    await searchInput.fill('Fight Club')

    const resultLink = page.locator('a[href^="/movie/"]').first()
    await expect(resultLink).toBeVisible({ timeout: 10000 })
    await resultLink.click()

    await expect(page).toHaveURL(/\/movie\/\d+/)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/cast/i)).toBeVisible({ timeout: 10000 })
  })

  test('4. Search for a person and navigate to detail', async () => {
    await page.goto('/')

    const searchInput = page.getByPlaceholder('Search movies, actors, directors...')
    await searchInput.fill('Brad Pitt')

    const personLink = page.locator('a[href^="/person/"]').first()
    await expect(personLink).toBeVisible({ timeout: 10000 })
    await personLink.click()

    await expect(page).toHaveURL(/\/person\/\d+/)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
  })

  test('5. Search with no results', async () => {
    await page.goto('/')

    const searchInput = page.getByPlaceholder('Search movies, actors, directors...')
    await searchInput.fill('zzzxxx999qqq')

    await expect(page.getByText('No results found')).toBeVisible({ timeout: 10000 })
  })

  test('6. Navigate to heatmap and back home', async () => {
    await page.goto('/')

    await page.getByRole('link', { name: /heatmap/i }).click()
    await expect(page).toHaveURL('/heatmap')
    await expect(page.getByRole('heading', { name: /genre/i })).toBeVisible({ timeout: 10000 })

    await page.getByRole('link', { name: /movie universe/i }).first().click()
    await expect(page).toHaveURL('/')
  })

  test('7. Movie detail page — Fight Club', async () => {
    await page.goto('/movie/550')

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/cast/i)).toBeVisible({ timeout: 10000 })
  })

  test('8. Person detail page — Brad Pitt', async () => {
    await page.goto('/person/287')

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 })
  })

  test('9. Wishlist requires authentication', async () => {
    await page.goto('/wishlist')

    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible({ timeout: 10000 })
  })
})
