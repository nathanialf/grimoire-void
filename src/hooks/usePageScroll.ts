import { useCallback, useEffect } from 'react'

export function usePageScroll(
  contentRef: React.RefObject<HTMLDivElement | null>,
  onScroll?: (scrollY: number) => void,
  pathname?: string,
) {
  const handleScroll = useCallback(() => {
    const el = contentRef.current
    if (!el) return
    onScroll?.(el.scrollTop)
  }, [contentRef, onScroll])

  // Native scroll listener
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [contentRef, handleScroll])

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const el = contentRef.current
      if (!el) return

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        el.scrollBy({ top: 300 })
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        el.scrollBy({ top: -300 })
      } else if (e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        el.scrollBy({ top: 600 })
      } else if (e.key === 'PageUp') {
        e.preventDefault()
        el.scrollBy({ top: -600 })
      } else if (e.key === 'Home') {
        e.preventDefault()
        el.scrollTo({ top: 0 })
      } else if (e.key === 'End') {
        e.preventDefault()
        el.scrollTo({ top: el.scrollHeight })
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [contentRef])

  // Reset scroll on route change
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    el.scrollTop = 0
    onScroll?.(0)
  }, [pathname, contentRef, onScroll])
}
