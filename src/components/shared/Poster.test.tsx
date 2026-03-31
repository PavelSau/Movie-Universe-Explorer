import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { Poster } from '@/components/shared/Poster'

describe('Poster', () => {
  it('renders an image with the TMDb URL when path is provided', () => {
    renderWithProviders(
      <Poster path="/pB8BM7pdSp6B6Ih7QI4S2t0POhQ.jpg" alt="Fight Club" />
    )

    const img = screen.getByRole('img', { name: 'Fight Club' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute(
      'src',
      'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QI4S2t0POhQ.jpg'
    )
  })

  it('renders a fallback icon when path is null', () => {
    renderWithProviders(<Poster path={null} alt="No poster" />)

    // When path is null, no <img> is rendered
    expect(screen.queryByRole('img')).not.toBeInTheDocument()

    // The fallback container with the icon should be in the document
    // The Film icon (lucide) renders an SVG
    const fallback = document.querySelector('svg')
    expect(fallback).toBeInTheDocument()
  })

  it('renders person icon for type="person" with null path', () => {
    renderWithProviders(<Poster path={null} alt="Unknown actor" type="person" />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('uses the correct size prefix for thumbnail', () => {
    renderWithProviders(
      <Poster path="/poster.jpg" alt="Thumbnail poster" size="thumbnail" />
    )

    const img = screen.getByRole('img', { name: 'Thumbnail poster' })
    expect(img).toHaveAttribute(
      'src',
      'https://image.tmdb.org/t/p/w185/poster.jpg'
    )
  })
})
