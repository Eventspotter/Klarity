import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BrandMark } from './components/BrandMark'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { ToastRegion } from './components/UI'
import { useApp } from './context/AppContext'
import { animatePageEnter } from './lib/animations'

// Route-based code splitting so only the active page JS is downloaded initially
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const CreatorStudioPage = lazy(() => import('./pages/CreatorStudioPage').then((m) => ({ default: m.CreatorStudioPage })))
const Reviews = lazy(() => import('./pages/Reviews').then((m) => ({ default: m.Reviews })))
const ReviewDetail = lazy(() => import('./pages/ReviewDetail').then((m) => ({ default: m.ReviewDetail })))
const Guidelines = lazy(() => import('./pages/Guidelines').then((m) => ({ default: m.Guidelines })))
const Assets = lazy(() => import('./pages/Assets').then((m) => ({ default: m.Assets })))
const Insights = lazy(() => import('./pages/Insights').then((m) => ({ default: m.Insights })))
const Calendar = lazy(() => import('./pages/Calendar').then((m) => ({ default: m.Calendar })))
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })))
const Hero = lazy(() => import('./pages/Hero').then((m) => ({ default: m.Hero })))
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })))
const NewReviewDrawer = lazy(() => import('./components/NewReviewDrawer').then((m) => ({ default: m.NewReviewDrawer })))

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

function PageFallback() {
  return (
    <div className="loading-screen" style={{ minHeight: '45vh' }}>
      <div className="loading-screen__bar">
        <span />
      </div>
    </div>
  )
}

function AppShell() {
  const { user, data, loading, toasts, dismissToast, refresh } = useApp()
  const [navOpen, setNavOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const location = useLocation()
  const pageRef = useRef(null)

  useEffect(() => {
    setNavOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname, location.search])

  useEffect(() => {
    if (pageRef.current) {
      const cancel = animatePageEnter(pageRef.current)
      return cancel
    }
  }, [location.pathname])

  const isPublic = location.pathname === '/hero' || location.pathname === '/login'

  // Never block public landing or login routes behind an API auth waterfall
  if (isPublic) {
    return (
      <div className="public-shell">
        <Suspense fallback={<PageFallback />}>
          <Routes location={location}>
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
          <div ref={pageRef} key={location.pathname} className="page-view-wrapper">
            <Suspense fallback={<PageFallback />}>
              <Routes location={location}>
                <Route path="/" element={<Dashboard onNewReview={() => setReviewOpen(true)} />} />
                <Route path="/studio" element={<CreatorStudioPage onNewReview={() => setReviewOpen(true)} />} />
                <Route path="/reviews" element={<Reviews onNewReview={() => setReviewOpen(true)} />} />
                <Route path="/reviews/:id" element={<ReviewDetail />} />
                <Route path="/guidelines" element={<Guidelines />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/calendar" element={<Calendar onNewReview={() => setReviewOpen(true)} />} />
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
