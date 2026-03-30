import { useState, useEffect, useRef, type RefObject } from 'react'

interface Size {
  width: number
  height: number
}

export function useResizeObserver(): [RefObject<HTMLDivElement | null>, Size] {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({
          width: Math.round(entry.contentRect.width),
          height: Math.round(entry.contentRect.height),
        })
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, size]
}
