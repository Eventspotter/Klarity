import { Suspense, lazy, useDeferredValue, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BrandMark } from './components/BrandMark'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { ToastRegion } from './components/UI'
import { useApp } from './context/AppContext'

// Route loaders (kept reusable so we can warm them in the background on idle)
const loadDashboard = () => import('./pages/Dashboard')
const loadCreatorStudio = () => import('./pages/CreatorStudioPage')
const loadReviews = () => import('./pages/Reviews')
const loadReviewDetail = () => import('./pages/ReviewDetail')
const loadGuidelines = () => import('./pages/Guidelines')
const loadAssets = () => import('./pages/Assets')
const loadInsights = () => import('./pages/Insights')
const loadCalendar = () => import('./pages/Calendar')
const loadSettings = () => import('./pages/Settings')
const loadBrandControls = () => import('./pages/BrandControls')
const loadHero = () => import('./pages/Hero')
const loadLogin = () => import('./pages/Login')
const loadNewReviewDrawer = () => import('./components/NewReviewDrawer')

const Dashboard = lazy(() => loadDashboard().then((m) => ({ default: m.Dashboard })))
const CreatorStudioPage = lazy(() => loadCreatorStudio().then((m) => ({ default: m.CreatorStudioPage })))
const Reviews = lazy(() => loadReviews().then((m) => ({ default: m.Reviews })))
const ReviewDetail = lazy(() => loadReviewDetail().then((m) => ({ default: m.ReviewDetail })))
const Guidelines = lazy(() => loadGuidelines().then((m) => ({ default: m.Guidelines })))
const Assets = lazy(() => loadAssets().then((m) => ({ default: m.Assets })))
const Insights = lazy(() => loadInsights().then((m) => ({ default: m.Insights })))
const Calendar = lazy(() => loadCalendar().then((m) => ({ default: m.Calendar })))
const Settings = lazy(() => loadSettings().then((m) => ({ default: m.Settings })))
const BrandControls = lazy(() => loadBrandControls().then((m) => ({ default: m.BrandControls })))
const Hero = lazy(() => loadHero().then((m) => ({ default: m.Hero })))
const Login = lazy(() => loadLogin().then((m) => ({ default: m.Login })))
const NewReviewDrawer = lazy(() => loadNewReviewDrawer().then((m) => ({ default: m.NewReviewDrawer })))

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-screen__brand">
        <BrandMark size={44} />
        <span>Klarity</span>
      </div>
      <div className="loading-screen__bar">
        <span />
      </div>
      <p>Opening the brand workspace…</p>
    </div>
  )
}

// Inline subtle placeholder (never position:fixed full-screen overlay)
function InlinePageFallback() {
  return <div className="page-inline-fallback" aria-busy="true" />
}

function AppShell() {
  const { user, data, loading, toasts, dismissToast, refresh } = useApp()
  const [navOpen, setNavOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const location = useLocation()
  // Keep previous page rendered while a lazy chunk resolves so routes never flash blank
  const deferredLocation = useDeferredValue(location)

  useEffect(() => {
    setNavOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [deferredLocation.pathname, deferredLocation.search])

  // Warm workspace page chunks in the background after initial paint for zero-latency tab switches
  useEffect(() => {
    if (!user || !data) return
    const prefetch = () => {
      loadDashboard()
      loadReviews()
      loadCalendar()
      loadGuidelines()
      loadAssets()
      loadInsights()
      loadCreatorStudio()
      loadSettings()
      loadBrandControls()
      loadReviewDetail()
      loadNewReviewDrawer()
    }
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(prefetch, { timeout: 1500 })
      return () => window.cancelIdleCallback(id)
    }
    const timer = window.setTimeout(prefetch, 300)
    return () => window.clearTimeout(timer)
  }, [user, data])

  const isPublic = location.pathname === '/hero' || location.pathname === '/login'

  // Never block public landing or login routes behind an API auth waterfall
  if (isPublic) {
    return (
      <div className="public-shell">
        <Suspense fallback={<InlinePageFallback />}>
          <Routes location={deferredLocation}>
            <Route path="/hero" element={<Hero />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/hero" replace />} />
          </Routes>
        </Suspense>
        <ToastRegion toasts={toasts} onDismiss={dismissToast} />
      </div>
    )
  }

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!data) return <div className="loading-screen"><p>Workspace unavailable.</p><button onClick={() => refresh().catch(() => {})}>Try again</button></div>

  return (
    <div className="app-shell">
      <Sidebar
        open={navOpen}
        onClose={() => setNavOpen(false)}
        onNewReview={() => {
          setNavOpen(false)
          setReviewOpen(true)
        }}
      />
      {navOpen ? <button className="nav-scrim" aria-label="Close navigation" onClick={() => setNavOpen(false)} /> : null}
      <div className="app-main">
        <Topbar
          currentPath={location.pathname}
          onMenu={() => setNavOpen(true)}
          onNewReview={() => setReviewOpen(true)}
        />
        <main className="page" id="main">
          <div key={deferredLocation.pathname} className="page-view-wrapper">
            <Suspense fallback={<InlinePageFallback />}>
              <Routes location={deferredLocation}>
                <Route path="/" element={<Dashboard onNewReview={() => setReviewOpen(true)} />} />
                <Route path="/studio" element={<CreatorStudioPage onNewReview={() => setReviewOpen(true)} />} />
                <Route path="/reviews" element={<Reviews onNewReview={() => setReviewOpen(true)} />} />
                <Route path="/reviews/:id" element={<ReviewDetail />} />
                <Route path="/guidelines" element={<Guidelines />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/calendar" element={<Calendar onNewReview={() => setReviewOpen(true)} />} />
                <Route path="/brand-controls" element={<BrandControls />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/hero" element={<Hero />} />
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
      {reviewOpen ? (
        <Suspense fallback={null}>
          <NewReviewDrawer open={reviewOpen} onClose={() => setReviewOpen(false)} />
        </Suspense>
      ) : null}
      <ToastRegion toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

export default function App() {
  return <AppShell />
}
