import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTimelineData } from '@/hooks/useTimelineData'
import type { PersonCredits, PersonCreditItem } from '@/types/person.types'

function makeCreditItem(overrides?: Partial<PersonCreditItem>): PersonCreditItem {
  return {
    id: 1,
    title: 'Test Movie',
    mediaType: 'movie',
    character: 'Hero',
    job: null,
    department: null,
    posterPath: '/poster.jpg',
    releaseDate: '2020-06-15',
    voteAverage: 7.5,
    popularity: 50,
    genreIds: [28, 12],
    ...overrides,
  }
}

function makeCredits(cast: PersonCreditItem[]): PersonCredits {
  return { cast, crew: [] }
}

describe('useTimelineData', () => {
  it('returns empty array when credits is undefined', () => {
    const { result } = renderHook(() => useTimelineData(undefined))

    expect(result.current).toEqual([])
  })

  it('returns empty array when credits has empty cast', () => {
    const { result } = renderHook(() => useTimelineData(makeCredits([])))

    expect(result.current).toEqual([])
  })

  it('filters out credits without releaseDate', () => {
    const credits = makeCredits([
      makeCreditItem({ id: 1, releaseDate: '2020-01-01' }),
      makeCreditItem({ id: 2, releaseDate: null }),
    ])

    const { result } = renderHook(() => useTimelineData(credits))

    expect(result.current).toHaveLength(1)
    expect(result.current[0].id).toBe(1)
  })

  it('filters out credits with empty string releaseDate', () => {
    const credits = makeCredits([
      makeCreditItem({ id: 1, releaseDate: '2020-01-01' }),
      makeCreditItem({ id: 2, releaseDate: '' }),
    ])

    const { result } = renderHook(() => useTimelineData(credits))

    expect(result.current).toHaveLength(1)
    expect(result.current[0].id).toBe(1)
  })

  it('filters out credits with releaseDate shorter than 4 characters', () => {
    const credits = makeCredits([
      makeCreditItem({ id: 1, releaseDate: '2020-01-01' }),
      makeCreditItem({ id: 2, releaseDate: '20' }),
    ])

    const { result } = renderHook(() => useTimelineData(credits))

    expect(result.current).toHaveLength(1)
    expect(result.current[0].id).toBe(1)
  })

  it('filters out credits with invalid dates', () => {
    const credits = makeCredits([
      makeCreditItem({ id: 1, releaseDate: '2020-06-15' }),
      makeCreditItem({ id: 2, releaseDate: 'invalid-date' }),
    ])

    const { result } = renderHook(() => useTimelineData(credits))

    expect(result.current).toHaveLength(1)
    expect(result.current[0].id).toBe(1)
  })

  it('sorts items chronologically (earliest first)', () => {
    const credits = makeCredits([
      makeCreditItem({ id: 3, title: 'Third', releaseDate: '2022-01-01' }),
      makeCreditItem({ id: 1, title: 'First', releaseDate: '2018-05-20' }),
      makeCreditItem({ id: 2, title: 'Second', releaseDate: '2020-06-15' }),
    ])

    const { result } = renderHook(() => useTimelineData(credits))

    expect(result.current).toHaveLength(3)
    expect(result.current[0].title).toBe('First')
    expect(result.current[1].title).toBe('Second')
    expect(result.current[2].title).toBe('Third')
  })

  it('maps fields correctly', () => {
    const credits = makeCredits([
      makeCreditItem({
        id: 42,
        title: 'Inception',
        mediaType: 'movie',
        character: 'Dom Cobb',
        posterPath: '/inception.jpg',
        releaseDate: '2010-07-16',
        voteAverage: 8.4,
        genreIds: [28, 878],
      }),
    ])

    const { result } = renderHook(() => useTimelineData(credits))

    const item = result.current[0]
    expect(item.id).toBe(42)
    expect(item.title).toBe('Inception')
    expect(item.mediaType).toBe('movie')
    expect(item.character).toBe('Dom Cobb')
    expect(item.posterPath).toBe('/inception.jpg')
    expect(item.releaseDate).toBeInstanceOf(Date)
    expect(item.year).toBe(2010)
    expect(item.voteAverage).toBe(8.4)
    expect(item.genreIds).toEqual([28, 878])
  })

  it('sets primaryGenreId to the first genre id', () => {
    const credits = makeCredits([
      makeCreditItem({ id: 1, genreIds: [35, 18, 28] }),
    ])

    const { result } = renderHook(() => useTimelineData(credits))

    expect(result.current[0].primaryGenreId).toBe(35)
  })

  it('sets primaryGenreId to null when genreIds is empty', () => {
    const credits = makeCredits([
      makeCreditItem({ id: 1, genreIds: [] }),
    ])

    const { result } = renderHook(() => useTimelineData(credits))

    expect(result.current[0].primaryGenreId).toBeNull()
  })

  it('defaults voteAverage to 0 when null', () => {
    const credits = makeCredits([
      makeCreditItem({ id: 1, voteAverage: null }),
    ])

    const { result } = renderHook(() => useTimelineData(credits))

    expect(result.current[0].voteAverage).toBe(0)
  })

  it('sets character to null when character is null', () => {
    const credits = makeCredits([
      makeCreditItem({ id: 1, character: null }),
    ])

    const { result } = renderHook(() => useTimelineData(credits))

    expect(result.current[0].character).toBeNull()
  })

  it('handles tv mediaType', () => {
    const credits = makeCredits([
      makeCreditItem({ id: 1, mediaType: 'tv', releaseDate: '2019-11-12' }),
    ])

    const { result } = renderHook(() => useTimelineData(credits))

    expect(result.current[0].mediaType).toBe('tv')
  })
})
