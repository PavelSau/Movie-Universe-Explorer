import { describe, it, expect } from 'vitest'
import {
  TMDB_IMAGE_BASE,
  POSTER_SIZES,
  BACKDROP_SIZES,
  PROFILE_SIZES,
  SEARCH_DEBOUNCE_MS,
} from './constants'

describe('TMDB_IMAGE_BASE', () => {
  it('is a well-formed URL', () => {
    expect(TMDB_IMAGE_BASE).toMatch(/^https:\/\/image\.tmdb\.org\/t\/p$/)
  })
})

describe('POSTER_SIZES', () => {
  it('has thumbnail, card, and original keys', () => {
    expect(POSTER_SIZES).toHaveProperty('thumbnail')
    expect(POSTER_SIZES).toHaveProperty('card')
    expect(POSTER_SIZES).toHaveProperty('original')
  })

  it('thumbnail starts with base URL and has w185 size', () => {
    expect(POSTER_SIZES.thumbnail).toBe(`${TMDB_IMAGE_BASE}/w185`)
  })

  it('card starts with base URL and has w500 size', () => {
    expect(POSTER_SIZES.card).toBe(`${TMDB_IMAGE_BASE}/w500`)
  })

  it('original starts with base URL and has original size', () => {
    expect(POSTER_SIZES.original).toBe(`${TMDB_IMAGE_BASE}/original`)
  })

  it('all values are well-formed URLs', () => {
    for (const value of Object.values(POSTER_SIZES)) {
      expect(value).toMatch(/^https:\/\/image\.tmdb\.org\/t\/p\/(w\d+|original)$/)
    }
  })
})

describe('BACKDROP_SIZES', () => {
  it('has small, large, and original keys', () => {
    expect(BACKDROP_SIZES).toHaveProperty('small')
    expect(BACKDROP_SIZES).toHaveProperty('large')
    expect(BACKDROP_SIZES).toHaveProperty('original')
  })

  it('small starts with base URL and has w780 size', () => {
    expect(BACKDROP_SIZES.small).toBe(`${TMDB_IMAGE_BASE}/w780`)
  })

  it('large starts with base URL and has w1280 size', () => {
    expect(BACKDROP_SIZES.large).toBe(`${TMDB_IMAGE_BASE}/w1280`)
  })

  it('original starts with base URL and has original size', () => {
    expect(BACKDROP_SIZES.original).toBe(`${TMDB_IMAGE_BASE}/original`)
  })

  it('all values are well-formed URLs', () => {
    for (const value of Object.values(BACKDROP_SIZES)) {
      expect(value).toMatch(/^https:\/\/image\.tmdb\.org\/t\/p\/(w\d+|original)$/)
    }
  })
})

describe('PROFILE_SIZES', () => {
  it('has thumbnail and card keys', () => {
    expect(PROFILE_SIZES).toHaveProperty('thumbnail')
    expect(PROFILE_SIZES).toHaveProperty('card')
  })

  it('thumbnail starts with base URL and has w185 size', () => {
    expect(PROFILE_SIZES.thumbnail).toBe(`${TMDB_IMAGE_BASE}/w185`)
  })

  it('card starts with base URL and has w500 size', () => {
    expect(PROFILE_SIZES.card).toBe(`${TMDB_IMAGE_BASE}/w500`)
  })

  it('all values are well-formed URLs', () => {
    for (const value of Object.values(PROFILE_SIZES)) {
      expect(value).toMatch(/^https:\/\/image\.tmdb\.org\/t\/p\/(w\d+|original)$/)
    }
  })
})

describe('SEARCH_DEBOUNCE_MS', () => {
  it('is a positive number', () => {
    expect(SEARCH_DEBOUNCE_MS).toBeGreaterThan(0)
  })

  it('is 300ms', () => {
    expect(SEARCH_DEBOUNCE_MS).toBe(300)
  })
})
