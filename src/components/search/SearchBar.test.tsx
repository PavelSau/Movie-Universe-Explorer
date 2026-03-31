import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '@/test/mocks/server'
import { renderWithProviders } from '@/test/utils'
import { SearchBar } from '@/components/search/SearchBar'

beforeAll(() => server.listen())
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})
afterEach(() => {
  vi.useRealTimers()
  server.resetHandlers()
})
afterAll(() => server.close())

describe('SearchBar', () => {
  it('renders the search input with placeholder', () => {
    renderWithProviders(<SearchBar />)

    expect(
      screen.getByPlaceholderText('Search movies, actors, directors...')
    ).toBeInTheDocument()
  })

  it('shows search results after typing 2 or more characters', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    renderWithProviders(<SearchBar />)

    const input = screen.getByPlaceholderText('Search movies, actors, directors...')
    await user.type(input, 'Fi')

    // Advance past the debounce delay (300ms)
    vi.advanceTimersByTime(350)

    await waitFor(() => {
      expect(screen.getByText('Fight Club')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Brad Pitt')).toBeInTheDocument()
    })
  })

  it('does not search when only 1 character is typed', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    renderWithProviders(<SearchBar />)

    const input = screen.getByPlaceholderText('Search movies, actors, directors...')
    await user.type(input, 'F')

    // Advance past the debounce delay
    vi.advanceTimersByTime(350)

    // Wait a tick for any potential render
    await waitFor(() => {
      expect(screen.queryByText('Fight Club')).not.toBeInTheDocument()
    })
  })
})
