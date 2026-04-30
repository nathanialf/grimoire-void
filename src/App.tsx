import { useMemo, useRef, useState, useCallback, useEffect, lazy, Suspense, type ReactElement } from 'react'
import { Navigation } from './components/Navigation'
import { NavigateProvider } from './hooks/useNavigate'
import { PageNavProvider } from './hooks/usePageNav'
import { Ticker, type TickerVariant as TickerRenderVariant } from './components/Ticker'
import { SplashScreen } from './pages/SplashScreen'
import { CoverPage } from './pages/CoverPage'
import { BlankPage } from './pages/BlankPage'
import { RedactedPage } from './pages/RedactedPage'
import { CreditsPage } from './pages/CreditsPage'
import { TemplatePage } from './pages/TemplatePage'
import { usePageScroll } from './hooks/usePageScroll'
import { REGISTRY, isDocVisible, type TickerVariant } from './data'
import { useCartridgeStates } from './data/loadState'
import styles from './styles/App.module.css'

const MuseumPage = lazy(() => import('./pages/MuseumPage').then(m => ({ default: m.MuseumPage })))

interface PageEntry {
  path: string
  component: () => ReactElement
  ticker: TickerVariant
}

// `/redacted/067` sits between the wiki entries and `/credits`; the
// registry's order preserves the legacy prev/next sweep.
const REDACTED_INSERT_INDEX = REGISTRY.length

const PAGES: PageEntry[] = [
  { path: '/', component: SplashScreen, ticker: 'none' },
  { path: '/cover', component: CoverPage, ticker: 'none' },
  { path: '/blank', component: BlankPage, ticker: 'none' },
  ...REGISTRY.slice(0, REDACTED_INSERT_INDEX).map(({ data, route, ticker }) => ({
    path: route,
    component: () => <TemplatePage {...data} />,
    ticker,
  })),
  { path: '/redacted/067', component: RedactedPage, ticker: 'none' },
  { path: '/credits', component: CreditsPage, ticker: 'none' },
]

export function App() {
  const contentRef = useRef<HTMLDivElement>(null)
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

  // Set bitmapsReady=true once the page's DOM has settled. PixelatedText/
  // Heading render async (fonts.ready → setState → render), so we use a
  // MutationObserver to detect when the staircase reflow stops, with a 1s
  // hard fallback in case it never does. Re-runs on pathname change to
  // catch each new page's render settle.
  useEffect(() => {
    if (!fontsReady) return
    let done = false
    let timer: number
    let fallback: number

    const settle = () => {
      if (done) return
      done = true
      observer?.disconnect()
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

  usePageScroll(contentRef, undefined, pathname)

  // Alternating palette swap (dark ↔ blue)
  useEffect(() => {
    if (!effectsOn) {
      delete document.documentElement.dataset.palette
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
    }

    function toggle() {
      swapPalette()
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
      return
    }

    let timeout: number
    if (root) root.style.transition = 'filter 0.3s ease'

    function applyInvert(on: boolean) {
      if (root) root.style.filter = on ? 'invert(1)' : ''
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
  }, [])

  const cartridgeStates = useCartridgeStates()

  // Wiki entries gate on cartridge state. Chrome pages (no REGISTRY entry
  // for the route) bypass the gate and stay always-known. An invisible
  // route falls through to the existing RedactedPage 404 branch.
  const navigablePages = useMemo(
    () => PAGES.filter(({ path }) => {
      if (path === '/') return false
      const entry = REGISTRY.find(({ route }) => route === path)
      return !entry || isDocVisible(entry, cartridgeStates)
    }),
    [cartridgeStates],
  )

  const navIndex = navigablePages.findIndex(({ path }) => path === pathname)
  const prevPath = navIndex > 0 ? navigablePages[navIndex - 1].path : undefined
  const nextPath = navIndex >= 0 && navIndex < navigablePages.length - 1 ? navigablePages[navIndex + 1].path : undefined

  const isKnownPage = useMemo(() => {
    const page = PAGES.find(({ path }) => path === pathname)
    if (!page) return false
    const entry = REGISTRY.find(({ route }) => route === page.path)
    if (!entry) return true
    return isDocVisible(entry, cartridgeStates)
  }, [pathname, cartridgeStates])

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
    const museumFallback = (
      <div className={styles.loadingOverlay}>
        <span className={styles.loadingRing} role="img" aria-hidden="true" />
        <span className={styles.loadingText}>Loading</span>
      </div>
    )
    return (
      <NavigateProvider value={navigate}>
        <Suspense fallback={museumFallback}>
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
        <ChromaticAberrationFilter />
        {fullScreenOverlay}
      </NavigateProvider>
    )
  }

  const currentPage = PAGES.find(({ path }) => path === pathname)
  const showTicker = currentPage?.ticker !== undefined && currentPage.ticker !== 'none'
  const tickerVariant: TickerRenderVariant = currentPage?.ticker === 'template' ? 'template' : 'placeholder'

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
