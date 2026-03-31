import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300))

    expect(result.current).toBe('hello')
  })

  it('does not update value before delay has elapsed', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } },
    )

    rerender({ value: 'updated', delay: 300 })

    // Value should still be the old one before delay
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current).toBe('initial')
  })

  it('returns updated value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } },
    )

    rerender({ value: 'updated', delay: 300 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('updated')
  })

  it('cancels previous timer on rapid changes and only applies the last value', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 300 } },
    )

    rerender({ value: 'second', delay: 300 })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    rerender({ value: 'third', delay: 300 })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Neither 'second' nor 'third' should have been applied yet
    expect(result.current).toBe('first')

    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Only the last value should be applied
    expect(result.current).toBe('third')
  })

  it('works with number values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: number; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 500 } },
    )

    expect(result.current).toBe(0)

    rerender({ value: 42, delay: 500 })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe(42)
  })

  it('respects different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 'start', delay: 1000 } },
    )

    rerender({ value: 'end', delay: 1000 })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    // 500ms is not enough for a 1000ms delay
    expect(result.current).toBe('start')

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('end')
  })
})
