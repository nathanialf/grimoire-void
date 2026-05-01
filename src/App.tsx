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
import { buildNavEntries } from './data/navOrder'
import { useCartridgeStates } from './data/loadState'
import styles from './styles/App.module.css'

const MuseumPage = lazy(() => import('./pages/MuseumPage').then(m => ({ default: m.MuseumPage })))

interface PageEntry {
  path: string
  component: () => ReactElement
  ticker: TickerVariant
}

const PAGES: PageEntry[] = [
  { path: '/', component: SplashScreen, ticker: 'none' },
  { path: '/cover', component: CoverPage, ticker: 'none' },
  { path: '/blank', component: BlankPage, ticker: 'none' },
  ...REGISTRY.map(({ data, route, ticker }) => ({
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

  // Prev/next walks the same page-number-sorted list the sidebar shows, so
  // the buttons land on whatever the user sees as the visually adjacent
  // entry. Splash (`/`) is intentionally absent from the sequence.
  const navEntries = useMemo(() => buildNavEntries(cartridgeStates), [cartridgeStates])
  const navIndex = navEntries.findIndex((e) => e.to === pathname)
  const prevPath = navIndex > 0 ? navEntries[navIndex - 1].to : undefined
  const nextPath = navIndex >= 0 && navIndex < navEntries.length - 1 ? navEntries[navIndex + 1].to : undefined

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

// Hidden SVG filters used by .ca-fx{,-soft,-strong}. Tints two copies of
// the source's alpha silhouette (cyan and magenta), offsets them in
// opposite directions, and merges the originals on top. Tinting via
// feFlood + feComposite=in instead of channel-isolating the source means
// the fringe colors are independent of source color — so red glyphs show
// cyan/magenta CA fringes instead of red-on-red invisibility.
// SourceGraphic merged last keeps the body of the glyph in its native
// color; the fringes only show where the offset layers extend past the
// source silhouette.
//
// Three strengths are defined so callers can dial intensity per-element
// (e.g. white pixelated text reads better with stronger fringe; subtle
// chrome wants soft).
const CA_FILTERS: Array<{ id: string; dx: number; alpha: number }> = [
  { id: 'wiki-ca-soft', dx: 0.9, alpha: 0.4 },
  { id: 'wiki-ca',      dx: 1.6, alpha: 0.7  },
  { id: 'wiki-ca-strong', dx: 2.4, alpha: 0.9 },
]

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
        {CA_FILTERS.map(({ id, dx, alpha }) => (
          <filter key={id} id={id} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feFlood floodColor="#00e8de" result="cyanFlood" />
            <feComposite in="cyanFlood" in2="SourceAlpha" operator="in" result="cyanLayer" />
            <feColorMatrix in="cyanLayer" type="matrix" values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${alpha} 0`} result="cyanDim" />
            <feOffset in="cyanDim" dx={-dx} dy="0" result="cyanShift" />
            <feFlood floodColor="#e800c4" result="magentaFlood" />
            <feComposite in="magentaFlood" in2="SourceAlpha" operator="in" result="magentaLayer" />
            <feColorMatrix in="magentaLayer" type="matrix" values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${alpha} 0`} result="magentaDim" />
            <feOffset in="magentaDim" dx={dx} dy="0" result="magentaShift" />
            <feMerge>
              <feMergeNode in="cyanShift" />
              <feMergeNode in="magentaShift" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>
    </svg>
  )
}
