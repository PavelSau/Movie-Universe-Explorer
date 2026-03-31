import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatRuntime, formatCurrency, formatDate, calculateAge } from './formatters'

describe('formatRuntime', () => {
  it('returns "N/A" for null', () => {
    expect(formatRuntime(null)).toBe('N/A')
  })

  it('returns "N/A" for 0', () => {
    expect(formatRuntime(0)).toBe('N/A')
  })

  it('formats minutes only when less than 60', () => {
    expect(formatRuntime(45)).toBe('45m')
  })

  it('formats hours and minutes for 90 minutes', () => {
    expect(formatRuntime(90)).toBe('1h 30m')
  })

  it('formats exact hours with 0 minutes', () => {
    expect(formatRuntime(120)).toBe('2h 0m')
  })

  it('formats a large value correctly', () => {
    expect(formatRuntime(195)).toBe('3h 15m')
  })

  it('formats 1 minute', () => {
    expect(formatRuntime(1)).toBe('1m')
  })

  it('formats 59 minutes without hours', () => {
    expect(formatRuntime(59)).toBe('59m')
  })

  it('formats exactly 60 minutes as 1h 0m', () => {
    expect(formatRuntime(60)).toBe('1h 0m')
  })
})

describe('formatCurrency', () => {
  it('returns "N/A" for 0', () => {
    expect(formatCurrency(0)).toBe('N/A')
  })

  it('formats a typical movie budget', () => {
    expect(formatCurrency(63000000)).toBe('$63,000,000')
  })

  it('formats a small amount', () => {
    expect(formatCurrency(1)).toBe('$1')
  })

  it('formats a large amount', () => {
    expect(formatCurrency(2000000000)).toBe('$2,000,000,000')
  })

  it('formats a number without fractional digits', () => {
    expect(formatCurrency(1234567)).toBe('$1,234,567')
  })
})

describe('formatDate', () => {
  it('returns "N/A" for null', () => {
    expect(formatDate(null)).toBe('N/A')
  })

  it('returns "N/A" for empty string', () => {
    expect(formatDate('')).toBe('N/A')
  })

  it('formats a valid date string', () => {
    const result = formatDate('1999-10-15')
    expect(result).toBe('October 15, 1999')
  })

  it('formats another valid date string', () => {
    const result = formatDate('2023-01-01')
    expect(result).toBe('January 1, 2023')
  })

  it('formats a date with month/day edge', () => {
    const result = formatDate('2000-12-31')
    expect(result).toBe('December 31, 2000')
  })
})

describe('calculateAge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-31'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null for null birthday', () => {
    expect(calculateAge(null)).toBeNull()
  })

  it('returns null for empty string birthday', () => {
    expect(calculateAge('')).toBeNull()
  })

  it('calculates age for a living person', () => {
    // Born 1990-01-15, today is 2026-03-31 => 36 years old
    expect(calculateAge('1990-01-15')).toBe(36)
  })

  it('calculates age correctly when birthday has not occurred yet this year', () => {
    // Born 1990-06-15, today is 2026-03-31 => still 35 (birthday not yet)
    expect(calculateAge('1990-06-15')).toBe(35)
  })

  it('calculates age at death when deathday is provided', () => {
    // Born 1950-05-10, died 2020-08-20 => 70
    expect(calculateAge('1950-05-10', '2020-08-20')).toBe(70)
  })

  it('calculates age at death when death is before birthday in same year', () => {
    // Born 1950-09-10, died 2020-03-05 => 69 (birthday not reached in death year)
    expect(calculateAge('1950-09-10', '2020-03-05')).toBe(69)
  })

  it('calculates age correctly on exact birthday', () => {
    // Born 2000-03-31, today is 2026-03-31 => 26
    expect(calculateAge('2000-03-31')).toBe(26)
  })

  it('calculates age correctly day before birthday', () => {
    // Born 2000-04-01, today is 2026-03-31 => 25 (birthday tomorrow)
    expect(calculateAge('2000-04-01')).toBe(25)
  })
})
