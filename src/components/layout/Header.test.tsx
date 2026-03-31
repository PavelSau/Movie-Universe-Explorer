import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { screen } from '@testing-library/react'
import { server } from '@/test/mocks/server'
import { renderWithProviders } from '@/test/utils'
import { Header } from '@/components/layout/Header'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Header', () => {
  it('renders the logo and title', () => {
    renderWithProviders(<Header />)

    expect(screen.getByText('Movie Universe')).toBeInTheDocument()
  })

  it('has navigation links for Heatmap and My Lists', () => {
    renderWithProviders(<Header />)

    expect(screen.getByText('Heatmap')).toBeInTheDocument()
    expect(screen.getByText('My Lists')).toBeInTheDocument()
  })

  it('has the theme toggle with light, dark, and system options', () => {
    renderWithProviders(<Header />)

    expect(screen.getByRole('button', { name: 'Switch to Light theme' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Switch to Dark theme' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Switch to System theme' })).toBeInTheDocument()
  })

  it('shows the Sign In button when user is not authenticated', () => {
    renderWithProviders(<Header />)

    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })
})
