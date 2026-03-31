import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { screen } from '@testing-library/react'
import { server } from '@/test/mocks/server'
import { renderWithProviders } from '@/test/utils'
import { WishlistButton } from '@/components/shared/WishlistButton'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('WishlistButton', () => {
  it('renders a button element', () => {
    renderWithProviders(
      <WishlistButton
        entityType="movie"
        entityId={550}
        title="Fight Club"
        posterPath="/poster1.jpg"
      />
    )

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('displays "Add to Watchlist" text for movie type when not in list', () => {
    renderWithProviders(
      <WishlistButton
        entityType="movie"
        entityId={550}
        title="Fight Club"
        posterPath="/poster1.jpg"
      />
    )

    expect(screen.getByText('Add to Watchlist')).toBeInTheDocument()
  })

  it('displays "Add to Favorites" text for person type when not in list', () => {
    renderWithProviders(
      <WishlistButton
        entityType="person"
        entityId={287}
        title="Brad Pitt"
        posterPath="/profile2.jpg"
      />
    )

    expect(screen.getByText('Add to Favorites')).toBeInTheDocument()
  })
})
