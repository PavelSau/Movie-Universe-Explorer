import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { server } from '@/test/mocks/server'
import { renderWithProviders } from '@/test/utils'
import { TrendingDashboard } from '@/components/trending/TrendingDashboard'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('TrendingDashboard', () => {
  it('shows loading skeletons initially', () => {
    renderWithProviders(<TrendingDashboard />)

    // The section heading should always be visible
    expect(screen.getByText('Trending Now')).toBeInTheDocument()

    // Skeletons are rendered as generic elements; check that the grid container is present
    // with skeleton placeholders (each skeleton group has 3 skeleton divs)
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows movie titles after loading', async () => {
    renderWithProviders(<TrendingDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Fight Club')).toBeInTheDocument()
    })

    expect(screen.getByText('Pulp Fiction')).toBeInTheDocument()
  })

  it('has day/week toggle buttons', () => {
    renderWithProviders(<TrendingDashboard />)

    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('This Week')).toBeInTheDocument()
  })
})
