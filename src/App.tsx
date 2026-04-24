import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { Navigation } from './components/Navigation'
import { NavigateProvider } from './hooks/useNavigate'
import { PageNavProvider } from './hooks/usePageNav'
import { SignalTear, type SignalTearHandle } from './components/SignalTear'
import { Ticker } from './components/Ticker'
import { SplashScreen } from './pages/SplashScreen'
import { CoverPage } from './pages/CoverPage'
import { BlankPage } from './pages/BlankPage'
import { CharacterPage } from './pages/CharacterPage'
import { BestiaryEntry } from './pages/BestiaryEntry'
import { ItemPage } from './pages/ItemPage'
import { LocationPage } from './pages/LocationPage'
import { MapPage } from './pages/MapPage'
import { LorePage } from './pages/LorePage'
import { ReportPage } from './pages/ReportPage'
import { RedactedPage } from './pages/RedactedPage'
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
import styles from './styles/App.module.css'

const PAGES = [
  { path: '/', component: SplashScreen },
  { path: '/cover', component: CoverPage },
  { path: '/blank', component: BlankPage },
  { path: '/character/aria-vex', component: () => <CharacterPage {...ariaVex} />, isPlaceholder: true },
  { path: '/character/yael-mox', component: () => <CharacterPage {...yaelMox} />, isPlaceholder: true },
  { path: '/bestiary/pallid-watcher', component: () => <BestiaryEntry {...pallidWatcher} />, isPlaceholder: true },
  { path: '/bestiary/greyfield-choir', component: () => <BestiaryEntry {...greyfieldChoir} />, isPlaceholder: true },
  { path: '/item/hollow-blade', component: () => <ItemPage {...hollowBlade} />, isPlaceholder: true },
  { path: '/item/spectral-caul', component: () => <ItemPage {...spectralCaul} />, isPlaceholder: true },
  { path: '/location/sunken-relay', component: () => <LocationPage {...sunkenRelay} />, isPlaceholder: true },
  { path: '/location/outpost-kaya', component: () => <LocationPage {...outpostKaya} />, isPlaceholder: true },
  { path: '/map/wasting-expanse', component: () => <MapPage {...wastingExpanse} />, isPlaceholder: true },
  { path: '/redacted/067', component: RedactedPage },
  { path: '/lore/omicron-collapse', component: () => <LorePage {...omicronCollapse} />, isPlaceholder: true },
  { path: '/lore/threshold-accords', component: () => <LorePage {...thresholdAccords} />, isPlaceholder: true },
  { path: '/report/sable-threshold', component: () => <ReportPage {...sableThreshold} />, isPlaceholder: true },
  { path: '/report/glass-litany', component: () => <ReportPage {...glassLitany} />, isPlaceholder: true },
]

export function App() {
  const contentRef = useRef<HTMLDivElement>(null)
  const tearRef = useRef<SignalTearHandle>(null)
  const [navOpen, setNavOpen] = useState(false)
  const [pathname, setPathname] = useState(window.location.pathname)
  const [effectsOn, setEffectsOn] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  // Reclone SignalTear after fonts load so the initial clone has full DOM.
  // PixelatedText renders async (fonts.ready → setState → render), so we need
  // to wait for the DOM to stabilize. Use a MutationObserver to detect when
  // rendering settles, with a fallback timeout.
  useEffect(() => {
    if (!fontsReady) return
    let done = false
    let timer: number
    let fallback: number

    const root = document.getElementById('root')
    const observer = root ? new MutationObserver(() => {
      // Each mutation means React is still rendering — reset the debounce
      clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (done) return
        done = true
        observer.disconnect()
        tearRef.current?.reclone()
      }, 150)
    }) : null

    if (observer && root) {
      observer.observe(root, { childList: true, subtree: true })
      // Kick off the debounce in case no mutations fire (everything already rendered)
      timer = window.setTimeout(() => {
        if (done) return
        done = true
        observer.disconnect()
        tearRef.current?.reclone()
      }, 150)
    }

    // Hard fallback in case observer misses something
    fallback = window.setTimeout(() => {
      if (done) return
      done = true
      observer?.disconnect()
      tearRef.current?.reclone()
    }, 1000)

    return () => {
      done = true
      observer?.disconnect()
      clearTimeout(timer)
      clearTimeout(fallback)
    }
  }, [fontsReady])

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

  if (!fontsReady) {
    return (
      <div style={{ background: '#0a0a0a', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', letterSpacing: '0.3em', color: '#bfff00', textTransform: 'uppercase' }}>
          Loading
        </span>
      </div>
    )
  }

  if (!isKnownPage) {
    return (
      <NavigateProvider value={navigate}>
        <RedactedPage />
        <SignalTear ref={tearRef} effectsOn={effectsOn} />
      </NavigateProvider>
    )
  }

  const showTicker = PAGES.find(({ path }) => path === pathname)?.isPlaceholder ?? false

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
      {showTicker && <Ticker position="top" />}
      {showTicker && <Ticker position="bottom" />}
      <SignalTear ref={tearRef} effectsOn={effectsOn} />
    </NavigateProvider>
  )
}
