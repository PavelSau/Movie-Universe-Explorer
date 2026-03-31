import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('returns a single class unchanged', () => {
    expect(cn('bg-background')).toBe('bg-background')
  })

  it('merges multiple classes', () => {
    expect(cn('p-4', 'mt-2')).toBe('p-4 mt-2')
  })

  it('handles conditional classes via clsx', () => {
    expect(cn('p-4', false && 'hidden', 'mt-2')).toBe('p-4 mt-2')
  })

  it('includes truthy conditional classes', () => {
    expect(cn('p-4', true && 'hidden', 'mt-2')).toBe('p-4 hidden mt-2')
  })

  it('resolves conflicting Tailwind classes (last wins)', () => {
    const result = cn('p-4', 'p-8')
    expect(result).toBe('p-8')
  })

  it('resolves conflicting background classes', () => {
    const result = cn('bg-red-500', 'bg-blue-500')
    expect(result).toBe('bg-blue-500')
  })

  it('handles undefined and null values', () => {
    expect(cn('p-4', undefined, null, 'mt-2')).toBe('p-4 mt-2')
  })

  it('handles empty string', () => {
    expect(cn('')).toBe('')
  })

  it('handles array inputs', () => {
    expect(cn(['p-4', 'mt-2'])).toBe('p-4 mt-2')
  })

  it('handles object inputs', () => {
    expect(cn({ 'p-4': true, hidden: false, 'mt-2': true })).toBe('p-4 mt-2')
  })

  it('merges conflicting text size classes', () => {
    const result = cn('text-sm', 'text-lg')
    expect(result).toBe('text-lg')
  })

  it('does not merge non-conflicting classes', () => {
    const result = cn('p-4', 'mt-2', 'text-foreground')
    expect(result).toBe('p-4 mt-2 text-foreground')
  })
})
