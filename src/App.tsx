import { useMemo, useRef, useState, useCallback, useEffect, lazy, Suspense, type ReactElement } from 'react'
import { Navigation } from './components/Navigation'
import { NavigateProvider } from './hooks/useNavigate'
import { PageNavProvider } from './hooks/usePageNav'
import { SignalTear, type SignalTearHandle } from './components/SignalTear'
import { Ticker } from './components/Ticker'
import { SplashScreen } from './pages/SplashScreen'
import { CoverPage } from './pages/CoverPage'
import { BlankPage } from './pages/BlankPage'
import { RedactedPage } from './pages/RedactedPage'
import { CreditsPage } from './pages/CreditsPage'
import { TemplatePage } from './pages/TemplatePage'
import { usePageScroll } from './hooks/usePageScroll'
import { ariaVex } from './data/characters/aria-vex'
import { yaelMox } from './data/characters/yael-mox'
import { pallidWatcher } from './data/bestiary/pallid-watcher'
import { greyfieldChoir } from './data/bestiary/greyfield-choir'
import { hollowBlade } from './data/items/hollow-blade'
import { spectralCaul } from './data/items/spectral-caul'
import { sunkenRelay } from './data/locations/sunken-relay'
import { outpostKaya } from './data/locations/outpost-kaya'
import { wastingExpanse } from './data/maps/wasting-expanse'
import { omicronCollapse } from './data/lore/omicron-collapse'
import { thresholdAccords } from './data/lore/threshold-accords'
import { sableThreshold } from './data/reports/sable-threshold'
import { glassLitany } from './data/reports/glass-litany'
import { tmp1Email } from './data/templates/tmp1-email'
import { tmp2Transfer } from './data/templates/tmp2-transfer'
import { tmp3Profile } from './data/templates/tmp3-profile'
import { tmp4COE } from './data/templates/tmp4-coe'
import { tmp5Artifact } from './data/templates/tmp5-artifact'
import { tmp6Survey } from './data/templates/tmp6-survey'
import styles from './styles/App.module.css'
import type { TickerVariant } from './components/Ticker'

const MuseumPage = lazy(() => import('./pages/MuseumPage').then(m => ({ default: m.MuseumPage })))

interface PageEntry {
  path: string
  component: () => ReactElement
  isPlaceholder?: boolean
  ticker?: TickerVariant
}

const PAGES: PageEntry[] = [
  { path: '/', component: SplashScreen },
  { path: '/cover', component: CoverPage },
  { path: '/blank', component: BlankPage },
  { path: '/character/aria-vex', component: () => <TemplatePage {...ariaVex} />, isPlaceholder: true, ticker: 'placeholder' },
  { path: '/character/yael-mox', component: () => <TemplatePage {...yaelMox} />, isPlaceholder: true, ticker: 'placeholder' },
  { path: '/bestiary/pallid-watcher', component: () => <TemplatePage {...pallidWatcher} />, isPlaceholder: true, ticker: 'placeholder' },
  { path: '/bestiary/greyfield-choir', component: () => <TemplatePage {...greyfieldChoir} />, isPlaceholder: true, ticker: 'placeholder' },
  { path: '/item/hollow-blade', component: () => <TemplatePage {...hollowBlade} />, isPlaceholder: true, ticker: 'placeholder' },
  { path: '/item/spectral-caul', component: () => <TemplatePage {...spectralCaul} />, isPlaceholder: true, ticker: 'placeholder' },
  { path: '/location/sunken-relay', component: () => <TemplatePage {...sunkenRelay} />, isPlaceholder: true, ticker: 'placeholder' },
  { path: '/location/outpost-kaya', component: () => <TemplatePage {...outpostKaya} />, isPlaceholder: true, ticker: 'placeholder' },
  { path: '/map/wasting-expanse', component: () => <TemplatePage {...wastingExpanse} />, isPlaceholder: true, ticker: 'placeholder' },
  { path: '/redacted/067', component: RedactedPage },
  { path: '/lore/omicron-collapse', component: () => <TemplatePage {...omicronCollapse} />, isPlaceholder: true, ticker: 'placeholder' },
  { path: '/lore/threshold-accords', component: () => <TemplatePage {...thresholdAccords} />, isPlaceholder: true, ticker: 'placeholder' },
  { path: '/report/sable-threshold', component: () => <TemplatePage {...sableThreshold} />, isPlaceholder: true, ticker: 'placeholder' },
  { path: '/report/glass-litany', component: () => <TemplatePage {...glassLitany} />, isPlaceholder: true, ticker: 'placeholder' },
  { path: '/template/tmp1-email', component: () => <TemplatePage {...tmp1Email} />, isPlaceholder: true, ticker: 'template' },
  { path: '/template/tmp2-transfer', component: () => <TemplatePage {...tmp2Transfer} />, isPlaceholder: true, ticker: 'template' },
  { path: '/template/tmp3-profile', component: () => <TemplatePage {...tmp3Profile} />, isPlaceholder: true, ticker: 'template' },
  { path: '/template/tmp4-coe', component: () => <TemplatePage {...tmp4COE} />, isPlaceholder: true, ticker: 'template' },
  { path: '/template/tmp5-artifact', component: () => <TemplatePage {...tmp5Artifact} />, isPlaceholder: true, ticker: 'template' },
  { path: '/template/tmp6-survey', component: () => <TemplatePage {...tmp6Survey} />, isPlaceholder: true, ticker: 'template' },
  { path: '/credits', component: CreditsPage },
]

export function App() {
  const contentRef = useRef<HTMLDivElement>(null)
  const tearRef = useRef<SignalTearHandle>(null)
  const [navOpen, setNavOpen] = useState(false)
  const [pathname, setPathname] = useState(window.location.pathname)
  const [effectsOn] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)
  // bitmapsReady gates the loading overlay: flips true once the post-fonts
  // MutationObserver settle fires, signalling that PixelatedText/Heading
  // bitmaps have finished their async render → setState dance and the DOM
  // is stable. Resets to false on every pathname change so the overlay
  // re-shows during wiki-page navigation while new bitmaps render.
  const [bitmapsReady, setBitmapsReady] = useState(false)

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  // Reset the bitmap-ready gate on every navigation so the loading overlay
  // re-appears while the new page's PixelatedText bitmaps render.
  useEffect(() => {
    setBitmapsReady(false)
  }, [pathname])

  // Reclone SignalTear after fonts load AND set bitmapsReady=true once the
  // page's DOM has settled. PixelatedText/Heading render async (fonts.ready
  // → setState → render), so we use a MutationObserver to detect when the
  // staircase reflow stops, with a 1s hard fallback in case it never does.
  // Re-runs on pathname change to catch each new page's render settle.
  useEffect(() => {
    if (!fontsReady) return
    let done = false
    let timer: number
    let fallback: number

    const settle = () => {
      if (done) return
      done = true
      observer?.disconnect()
      tearRef.current?.reclone()
      setBitmapsReady(true)
    }

    const root = document.getElementById('root')
    const observer = root ? new MutationObserver(() => {
      // Each mutation means React is still rendering — reset the debounce
      clearTimeout(timer)
      timer = window.setTimeout(settle, 150)
    }) : null

    if (observer && root) {
      observer.observe(root, { childList: true, subtree: true })
      // Kick off the debounce in case no mutations fire (everything already rendered)
      timer = window.setTimeout(settle, 150)
    }

    // Hard fallback in case observer misses something
    fallback = window.setTimeout(settle, 1000)

    return () => {
      done = true
      observer?.disconnect()
      clearTimeout(timer)
      clearTimeout(fallback)
    }
  }, [fontsReady, pathname])

  const navigate = useCallback((to: string) => {
    window.history.pushState({}, '', to)
    setPathname(to)
  }, [])

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const onScroll = useCallback((scrollY: number) => {
    tearRef.current?.syncScroll(scrollY)
  }, [])

  usePageScroll(contentRef, onScroll, pathname)

  useEffect(() => {
    tearRef.current?.syncRoute(pathname)
    // Reclone after React finishes rendering so clones reflect new DOM state
    const timeout = setTimeout(() => {
      tearRef.current?.reclone()
      // Re-sync nav scroll position after reclone so clones match the real list
      const navList = document.querySelector('[data-nav-list]') as HTMLElement | null
      if (navList) tearRef.current?.syncNavScroll(navList.scrollTop)
    }, 150)
    return () => clearTimeout(timeout)
  }, [pathname])

  // Sync nav list scroll into SignalTear clones
  useEffect(() => {
    if (!fontsReady) return
    const navList = document.querySelector('[data-nav-list]') as HTMLElement | null
    if (!navList) return
    function onNavScroll() {
      tearRef.current?.syncNavScroll(navList!.scrollTop)
    }
    navList.addEventListener('scroll', onNavScroll, { passive: true })
    return () => navList.removeEventListener('scroll', onNavScroll)
  }, [pathname, fontsReady])

  // Alternating palette swap (dark ↔ blue)
  useEffect(() => {
    if (!effectsOn) {
      delete document.documentElement.dataset.palette
      tearRef.current?.syncPalette(false)
      return
    }

    let timeout: number
    let blue = false

    function swapPalette() {
      blue = !blue
      if (blue) {
        document.documentElement.dataset.palette = 'blue'
      } else {
        delete document.documentElement.dataset.palette
      }
      tearRef.current?.syncPalette(blue)
    }

    function toggle() {
      if (tearRef.current) {
        tearRef.current.triggerSurge(() => {
          swapPalette()
        })
      } else {
        swapPalette()
      }
      timeout = window.setTimeout(toggle, 30000)
    }

    timeout = window.setTimeout(toggle, 30000)
    return () => {
      clearTimeout(timeout)
      delete document.documentElement.dataset.palette
    }
  }, [effectsOn])

  // Random color inversion effect — all DOM updates in one frame
  useEffect(() => {
    const root = document.getElementById('root')

    if (!effectsOn) {
      if (root) root.style.filter = ''
      tearRef.current?.syncInvert(false)
      return
    }

    let timeout: number
    if (root) root.style.transition = 'filter 0.3s ease'

    function applyInvert(on: boolean) {
      if (root) root.style.filter = on ? 'invert(1)' : ''
      tearRef.current?.syncInvert(on)
    }

    function schedule() {
      const wait = 30000 + Math.random() * 60000 // 30–90s
      timeout = window.setTimeout(() => {
        applyInvert(true)
        timeout = window.setTimeout(() => {
          applyInvert(false)
          schedule()
        }, 10000) // 10s inversion
      }, wait)
    }
    schedule()
    return () => clearTimeout(timeout)
  }, [effectsOn])

  const handleNavToggle = useCallback((open: boolean) => {
    setNavOpen(open)
    tearRef.current?.syncNavOpen(open)
  }, [])

  const navigablePages = useMemo(
    () => PAGES.filter(({ path }) => path !== '/'),
    [],
  )

  const navIndex = navigablePages.findIndex(({ path }) => path === pathname)
  const prevPath = navIndex > 0 ? navigablePages[navIndex - 1].path : undefined
  const nextPath = navIndex >= 0 && navIndex < navigablePages.length - 1 ? navigablePages[navIndex + 1].path : undefined

  const isKnownPage = PAGES.some(({ path }) => path === pathname)

  // Loading overlay sits above content while fonts are loading or the
  // page's PixelatedText bitmaps haven't finished their async render →
  // setState dance. Mounting this as an overlay (z-index 9999) instead of
  // an early-return lets the wiki content mount underneath so its effects
  // run; the overlay covers the staircase reflow until the MutationObserver
  // signals settle.
  //
  // On initial load (!fontsReady) the overlay is full-screen — the sidebar
  // bitmaps are also rendering and would look wonky. After fonts are loaded,
  // per-page transitions use a content-area-only overlay so the sidebar
  // stays visible and navigation feels responsive.
  const showOverlay = !fontsReady || !bitmapsReady
  const fullScreenOverlay = showOverlay ? (
    <div className={styles.loadingOverlay}>
      <span className={styles.loadingRing} role="img" aria-hidden="true" />
      <span className={styles.loadingText}>Loading</span>
    </div>
  ) : null
  const mainOverlay = showOverlay ? (
    <div className={!fontsReady ? styles.loadingOverlay : styles.loadingOverlayContent}>
      <span className={styles.loadingRing} role="img" aria-hidden="true" />
      <span className={styles.loadingText}>Loading</span>
    </div>
  ) : null

  if (pathname === '/museum') {
    return (
      <NavigateProvider value={navigate}>
        <Suspense fallback={<div style={{ background: '#0a0a0a', position: 'fixed', inset: 0 }} />}>
          <MuseumPage />
        </Suspense>
        {fullScreenOverlay}
      </NavigateProvider>
    )
  }

  if (!isKnownPage) {
    return (
      <NavigateProvider value={navigate}>
        <RedactedPage />
        <SignalTear ref={tearRef} effectsOn={effectsOn} />
        <ChromaticAberrationFilter />
        {fullScreenOverlay}
      </NavigateProvider>
    )
  }

  const currentPage = PAGES.find(({ path }) => path === pathname)
  const showTicker = currentPage?.isPlaceholder ?? false
  const tickerVariant = currentPage?.ticker ?? 'placeholder'

  return (
    <NavigateProvider value={navigate}>
      <Navigation onToggle={handleNavToggle} pathname={pathname} navigate={navigate} />
        <div ref={contentRef} className={`${styles.content}${navOpen ? ` ${styles.contentPushed}` : ''}${showTicker ? ` ${styles.contentWithTicker}` : ''}`} data-content>
          <div className={styles.contentInner} data-content-inner>
            {PAGES.map(({ path, component: Page }) => (
              <div key={path} data-page={path} style={{ display: pathname === path ? 'block' : 'none' }}>
                <PageNavProvider value={pathname === path ? { prev: prevPath, next: nextPath } : {}}>
                  <Page />
                </PageNavProvider>
              </div>
            ))}
          </div>
        </div>
      {showTicker && <Ticker position="top" variant={tickerVariant} />}
      {showTicker && <Ticker position="bottom" variant={tickerVariant} />}
      <SignalTear ref={tearRef} effectsOn={effectsOn} />
      <ChromaticAberrationFilter />
      {mainOverlay}
    </NavigateProvider>
  )
}

// Hidden SVG filter used by .ca-fx. Splits the source into R/G/B channel-
// isolated layers, offsets red left and blue right by a fraction of a pixel,
// and screen-blends them. Two important wrinkles:
//   1. Each channel's alpha is set equal to its color value (matrix row
//      `1 0 0 0 0` for the alpha row of rOnly, etc). If we kept A=A like a
//      naive split would, a channel that's zero in the source (e.g. blue in
//      lime #BFFF00, or all three in black) would still produce an opaque
//      black silhouette — and screen-blending three offset opaque silhouettes
//      just dilates the alpha union, fattening the glyphs into a "cutout"
//      shape with no visible color fringe. Tying alpha to channel value means
//      a zero channel contributes nothing.
//   2. The split layers are merged on top of SourceGraphic so pure-black
//      text (where all three channels are zero and the split produces nothing)
//      still renders as the original silhouette. For colored text the split
//      is fully opaque at the stationary position and overrides the source.
function ChromaticAberrationFilter() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'fixed', pointerEvents: 'none' }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="wiki-ca" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0"
            result="rOnly"
          />
          <feOffset in="rOnly" dx="-2.5" dy="0" result="rShift" />
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 1 0 0 0"
            result="gOnly"
          />
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 1 0 0"
            result="bOnly"
          />
          <feOffset in="bOnly" dx="2.5" dy="0" result="bShift" />
          <feBlend in="rShift" in2="gOnly" mode="screen" result="rg" />
          <feBlend in="rg" in2="bShift" mode="screen" result="ca" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="ca" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}
