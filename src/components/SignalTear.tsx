import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import styles from '../styles/SignalTear.module.css'

export interface SignalTearHandle {
  syncScroll: (scrollY: number) => void
  syncRoute: (pathname: string) => void
  syncNavOpen: (open: boolean) => void
  syncNavScroll: (scrollTop: number) => void
  syncInvert: (inverted: boolean) => void
  syncPalette: (dark: boolean) => void
  triggerSurge: (onPeak: () => void) => void
  reclone: () => void
}

// Channel groups: each group surges independently
const CHANNEL_GROUPS = [
  {
    // Green (near right)
    layers: [
      { className: styles.bleedR1, baseTranslateX: 2,   maxTranslateX: 5,   baseOpacity: 0.18, maxOpacity: 0.32, baseSkewX: 0, maxSkewX: 0.3 },
      { className: styles.bleedR2, baseTranslateX: 3,   maxTranslateX: 12,  baseOpacity: 0.13, maxOpacity: 0.26, baseSkewX: 0, maxSkewX: 0.6 },
    ],
  },
  {
    // Red (far right)
    layers: [
      { className: styles.bleedR3, baseTranslateX: 6,   maxTranslateX: 22,  baseOpacity: 0.14, maxOpacity: 0.28, baseSkewX: 0, maxSkewX: 1.0 },
      { className: styles.bleedR4, baseTranslateX: 10,  maxTranslateX: 38,  baseOpacity: 0.07, maxOpacity: 0.18, baseSkewX: 0, maxSkewX: 1.5 },
      { className: styles.bleedR5, baseTranslateX: 16,  maxTranslateX: 60,  baseOpacity: 0.04, maxOpacity: 0.12, baseSkewX: 0, maxSkewX: 2.0 },
    ],
  },
  {
    // Cyan/blue (left)
    layers: [
      { className: styles.bleedL1, baseTranslateX: -0.75, maxTranslateX: -3,  baseOpacity: 0.18, maxOpacity: 0.36, baseSkewX: 0, maxSkewX: -0.3 },
      { className: styles.bleedL2, baseTranslateX: -1.5,  maxTranslateX: -7,  baseOpacity: 0.10, maxOpacity: 0.20, baseSkewX: 0, maxSkewX: -0.6 },
    ],
  },
] as const

interface BleedLayer {
  className: string
  baseTranslateX: number
  maxTranslateX: number
  baseOpacity: number
  maxOpacity: number
  baseSkewX: number
  maxSkewX: number
}

// Flat list for rendering
const ALL_LAYERS: readonly BleedLayer[] = CHANNEL_GROUPS.flatMap(g => g.layers as readonly BleedLayer[])

// Random float in [min, max]
function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

// Lerp between a and b
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function syncRouteInClones(layerRefs: (HTMLDivElement | null)[], pathname: string) {
  for (const container of layerRefs) {
    if (!container) continue
    // Sync page visibility
    const pages = container.querySelectorAll<HTMLElement>('[data-page]')
    for (const page of pages) {
      page.style.display = page.getAttribute('data-page') === pathname ? 'block' : 'none'
    }
    // Sync nav active states via inline styles + class removal
    const navLinks = container.querySelectorAll<HTMLElement>('[data-nav]')
    for (const link of navLinks) {
      const isActive = link.getAttribute('data-nav') === pathname
      // Remove any linkActive class left over from cloning
      for (const cls of Array.from(link.classList)) {
        if (cls.toLowerCase().includes('active')) link.classList.remove(cls)
      }
      link.style.color = isActive ? 'var(--color-accent)' : ''
      link.style.background = isActive ? 'var(--color-accent-dim)' : ''
      // Also handle the ::before pseudo-element opacity via a data attribute
      link.style.setProperty('--nav-active', isActive ? '1' : '0')
    }
  }
}

const HAS_SCROLL_TIMELINE = 'ScrollTimeline' in window

// Track sticky elements so clones can mirror their real position
interface StickyInfo {
  selector: string     // data-attribute selector to find in clones
  realEl: HTMLElement   // reference to the live DOM element
}

interface SignalTearProps {
  effectsOn?: boolean
}

export const SignalTear = forwardRef<SignalTearHandle, SignalTearProps>(function SignalTear({ effectsOn = true }, ref) {
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const stickyInfoRef = useRef<StickyInfo[]>([])

  const setupScrollAnimations = useCallback(() => {
    if (!HAS_SCROLL_TIMELINE) return

    // Content scroll
    const realContent = document.querySelector('[data-content]') as HTMLElement | null
    if (realContent) {
      const maxScroll = realContent.scrollHeight - realContent.clientHeight
      const timeline = new (window as any).ScrollTimeline({ source: realContent, axis: 'block' })
      for (const container of layerRefs.current) {
        if (!container) continue
        const inner = container.querySelector('[data-content-inner]') as HTMLElement | null
        if (!inner) continue
        inner.getAnimations().forEach(a => a.cancel())
        if (maxScroll <= 0) continue
        inner.animate(
          [
            { transform: 'translateY(0)' },
            { transform: `translateY(${-maxScroll}px)` },
          ],
          { timeline, fill: 'both' },
        )
      }
    }

    // Nav list scroll
    const realNavList = document.querySelector('[data-nav-list]') as HTMLElement | null
    if (realNavList) {
      const navMaxScroll = realNavList.scrollHeight - realNavList.clientHeight
      if (navMaxScroll > 0) {
        const navTimeline = new (window as any).ScrollTimeline({ source: realNavList, axis: 'block' })
        for (const container of layerRefs.current) {
          if (!container) continue
          const inner = container.querySelector('[data-nav-list-inner]') as HTMLElement | null
          if (!inner) continue
          inner.getAnimations().forEach(a => a.cancel())
          inner.animate(
            [
              { transform: 'translateY(0)' },
              { transform: `translateY(${-navMaxScroll}px)` },
            ],
            { timeline: navTimeline, fill: 'both' },
          )
        }
      }
    }
  }, [])

  const reclone = useCallback(() => {
    // Detect sticky elements in the live DOM before cloning
    const realContent = document.querySelector('[data-content]') as HTMLElement | null
    const stickyInfos: StickyInfo[] = []
    let stickyIndex = 0

    if (realContent) {
      realContent.querySelectorAll<HTMLElement>('*').forEach(el => {
        if (getComputedStyle(el).position === 'sticky') {
          const marker = `data-sticky-${stickyIndex++}`
          el.setAttribute(marker, '')
          stickyInfos.push({ selector: `[${marker}]`, realEl: el })
        }
      })
    }

    // Clone body, clean it up, then copy it into each layer
    const source = document.body.cloneNode(true) as HTMLElement

    // Unmark live DOM
    for (let i = 0; i < stickyIndex; i++) {
      const attr = `data-sticky-${i}`
      document.querySelector(`[${attr}]`)?.removeAttribute(attr)
    }

    source.removeAttribute('id')
    source.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'))
    source.querySelectorAll('[data-signal-tear]').forEach(el => el.remove())
    source.querySelectorAll('[data-scroll-controls]').forEach(el => el.remove())
    source.querySelectorAll('nav').forEach(el => {
      const htmlEl = el as HTMLElement
      if (window.innerWidth > 768) {
        htmlEl.style.transform = 'none'
      }
      // On mobile, leave nav transform to CSS classes (closed by default)
    })
    source.style.height = '100%'
    source.style.minHeight = '0'
    source.style.position = 'absolute'
    source.style.inset = '0'
    source.style.overflow = 'hidden'
    source.style.mixBlendMode = 'multiply'
    const contentDiv = source.querySelector('[data-content]') as HTMLElement | null
    if (contentDiv) {
      contentDiv.style.height = '100dvh'
      contentDiv.style.overflow = 'hidden'
    }
    // Flatten sticky to relative in clones — we simulate stickiness via transforms
    for (const info of stickyInfos) {
      source.querySelectorAll<HTMLElement>(info.selector).forEach(el => {
        el.style.position = 'relative'
      })
    }

    // Disable scroll on cloned nav lists — we translate the inner wrapper instead
    source.querySelectorAll<HTMLElement>('[data-nav-list]').forEach(el => {
      el.style.overflow = 'hidden'
    })

    stickyInfoRef.current = stickyInfos

    for (const container of layerRefs.current) {
      if (!container) continue
      container.innerHTML = ''
      container.appendChild(source.cloneNode(true))
    }
    setupScrollAnimations()
  }, [setupScrollAnimations])

  // Apply intensity to a specific channel group's layers
  const applyGroupIntensity = useCallback((groupIndex: number, t: number) => {
    const group = CHANNEL_GROUPS[groupIndex]
    // Calculate flat index offset for this group
    let offset = 0
    for (let g = 0; g < groupIndex; g++) {
      offset += CHANNEL_GROUPS[g].layers.length
    }
    for (let i = 0; i < group.layers.length; i++) {
      const container = layerRefs.current[offset + i]
      if (!container) continue
      const layer = group.layers[i]
      const tx = lerp(layer.baseTranslateX, layer.maxTranslateX, t)
      const skew = lerp(layer.baseSkewX, layer.maxSkewX, t)
      const op = lerp(layer.baseOpacity, layer.maxOpacity, t)
      container.style.transform = `translateX(${tx}px) skewX(${skew}deg)`
      container.style.opacity = String(op)
    }
  }, [])

  const syncNavOpen = useCallback((open: boolean) => {
    if (window.innerWidth > 768) return
    for (const container of layerRefs.current) {
      if (!container) continue
      const content = container.querySelector('[data-content]') as HTMLElement | null
      if (content) {
        content.style.transition = 'transform 300ms ease'
        content.style.transform = open ? 'translateX(280px)' : ''
      }
      const nav = container.querySelector('nav') as HTMLElement | null
      if (nav) {
        nav.style.transition = 'transform 300ms ease'
        nav.style.transform = open ? 'translateX(0)' : 'translateX(-100%)'
      }
    }
  }, [])

  const stickyRaf = useRef(0)
  const applyStickyOffsetsOnce = useCallback(() => {
    for (const info of stickyInfoRef.current) {
      const realRect = info.realEl.getBoundingClientRect()
      // Read natural position from first available clone, then apply same offset to all
      const firstContainer = layerRefs.current.find(c => c !== null)
      if (!firstContainer) continue
      const refEl = firstContainer.querySelector<HTMLElement>(info.selector)
      if (!refEl) continue
      // Temporarily clear any existing offset to read the natural position
      refEl.style.transform = ''
      const cloneRect = refEl.getBoundingClientRect()
      const offset = realRect.top - cloneRect.top
      // Apply to all clones
      for (const container of layerRefs.current) {
        if (!container) continue
        const el = container.querySelector<HTMLElement>(info.selector)
        if (el) el.style.transform = offset ? `translateY(${offset}px)` : ''
      }
    }
  }, [])

  const applyStickyOffsets = useCallback(() => {
    applyStickyOffsetsOnce()
    // Schedule a follow-up frame to catch compositor lag (fast scroll / momentum end)
    cancelAnimationFrame(stickyRaf.current)
    stickyRaf.current = requestAnimationFrame(() => applyStickyOffsetsOnce())
  }, [applyStickyOffsetsOnce])

  // Sync scroll and route
  useImperativeHandle(ref, () => ({
    syncScroll(scrollY: number) {
      if (!HAS_SCROLL_TIMELINE) {
        for (const container of layerRefs.current) {
          if (!container) continue
          const inner = container.querySelector('[data-content-inner]') as HTMLElement | null
          if (inner) inner.style.transform = `translateY(${-scrollY}px)`
        }
      }
      applyStickyOffsets()
    },
    syncRoute(pathname: string) {
      syncRouteInClones(layerRefs.current, pathname)
    },
    syncNavOpen,
    syncNavScroll(scrollTop: number) {
      for (const container of layerRefs.current) {
        if (!container) continue
        const inner = container.querySelector('[data-nav-list-inner]') as HTMLElement | null
        if (inner) inner.style.transform = `translateY(${-scrollTop}px)`
      }
    },
    syncInvert(inverted: boolean) {
      // Mirror #root inversion into each clone's content
      for (const container of layerRefs.current) {
        if (!container) continue
        const content = container.querySelector('[data-content]') as HTMLElement | null
        if (content) {
          content.style.transition = 'filter 0.3s ease'
          content.style.filter = inverted ? 'invert(1)' : ''
        }
      }
    },
    syncPalette(blue: boolean) {
      for (const container of layerRefs.current) {
        if (!container) continue
        const body = container.querySelector(':scope > *') as HTMLElement | null
        if (body) {
          if (blue) {
            body.setAttribute('data-palette', 'blue')
          } else {
            body.removeAttribute('data-palette')
          }
        }
      }
    },
    triggerSurge(onPeak: () => void) {
      const RAMP_UP = 400
      const HOLD = 200
      const RAMP_DOWN = 600
      const PEAK = 0.85
      const total = RAMP_UP + HOLD + RAMP_DOWN
      const startTime = performance.now()
      let peakFired = false

      function animate(now: number) {
        const elapsed = now - startTime
        let t: number

        if (elapsed < RAMP_UP) {
          t = (elapsed / RAMP_UP) * PEAK
        } else if (elapsed < RAMP_UP + HOLD) {
          t = PEAK
          if (!peakFired) {
            peakFired = true
            onPeak()
          }
        } else if (elapsed < total) {
          const fadeElapsed = elapsed - RAMP_UP - HOLD
          t = PEAK * (1 - fadeElapsed / RAMP_DOWN)
        } else {
          for (let g = 0; g < CHANNEL_GROUPS.length; g++) {
            applyGroupIntensity(g, 0)
          }
          return
        }

        for (let g = 0; g < CHANNEL_GROUPS.length; g++) {
          applyGroupIntensity(g, t)
        }
        requestAnimationFrame(animate)
      }

      requestAnimationFrame(animate)
    },
    reclone,
  }), [reclone, syncNavOpen, applyStickyOffsets, applyGroupIntensity])

  // Independent surge loop per channel group
  useEffect(() => {
    // Reset all layers to baseline
    for (let g = 0; g < CHANNEL_GROUPS.length; g++) {
      applyGroupIntensity(g, 0)
    }

    if (!effectsOn) return

    const cleanups: (() => void)[] = []

    for (let g = 0; g < CHANNEL_GROUPS.length; g++) {
      let timeout: number
      let raf: number
      const groupIndex = g

      function scheduleNext() {
        const wait = rand(3000, 10000)
        timeout = window.setTimeout(startSurge, wait)
      }

      function startSurge() {
        const rampUp = rand(200, 800)
        const hold = rand(400, 2000)
        const rampDown = rand(600, 1500)
        const peak = Math.pow(Math.random(), 2.5)
        const startTime = performance.now()
        const totalDuration = rampUp + hold + rampDown

        function animate(now: number) {
          const elapsed = now - startTime
          let t: number

          if (elapsed < rampUp) {
            t = (elapsed / rampUp) * peak
          } else if (elapsed < rampUp + hold) {
            t = peak
          } else if (elapsed < totalDuration) {
            const fadeElapsed = elapsed - rampUp - hold
            t = peak * (1 - fadeElapsed / rampDown)
          } else {
            t = 0
            applyGroupIntensity(groupIndex, 0)
            scheduleNext()
            return
          }

          applyGroupIntensity(groupIndex, t)
          raf = requestAnimationFrame(animate)
        }

        raf = requestAnimationFrame(animate)
      }

      // Stagger initial delays so channels don't start in sync
      timeout = window.setTimeout(startSurge, rand(1000 + g * 1500, 3000 + g * 1500))

      cleanups.push(() => {
        clearTimeout(timeout)
        cancelAnimationFrame(raf)
      })
    }

    return () => cleanups.forEach(fn => fn())
  }, [effectsOn, applyGroupIntensity])

  // Re-sync scroll animations when content height changes
  useEffect(() => {
    if (!HAS_SCROLL_TIMELINE) return
    const inner = document.querySelector('[data-content-inner]') as HTMLElement | null
    if (!inner) return
    let lastHeight = inner.scrollHeight
    const ro = new ResizeObserver(() => {
      const h = inner.scrollHeight
      if (h !== lastHeight) {
        lastHeight = h
        setupScrollAnimations()
      }
    })
    ro.observe(inner)
    return () => ro.disconnect()
  }, [setupScrollAnimations])

  // For ScrollTimeline path: still need scroll events to update sticky offsets
  useEffect(() => {
    if (!HAS_SCROLL_TIMELINE) return
    const realContent = document.querySelector('[data-content]') as HTMLElement | null
    if (!realContent) return
    function onScroll() {
      applyStickyOffsets()
    }
    realContent.addEventListener('scroll', onScroll, { passive: true })
    realContent.addEventListener('scrollend', onScroll, { passive: true })
    return () => {
      realContent.removeEventListener('scroll', onScroll)
      realContent.removeEventListener('scrollend', onScroll)
    }
  }, [applyStickyOffsets])

  useEffect(() => {
    const delay = setTimeout(reclone, 100)

    function onResize() { reclone() }
    window.addEventListener('resize', onResize)

    return () => {
      clearTimeout(delay)
      window.removeEventListener('resize', onResize)
    }
  }, [reclone])

  return createPortal(
    <div className={styles.overlay} data-signal-tear aria-hidden="true" style={effectsOn ? undefined : { visibility: 'hidden' }}>
      {ALL_LAYERS.map((layer, i) => (
        <div
          key={i}
          ref={el => { layerRefs.current[i] = el }}
          className={layer.className}
        />
      ))}
    </div>,
    document.body
  )
})
