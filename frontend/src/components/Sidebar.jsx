import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Calendar,
  ChartNoAxesCombined,
  Check,
  ChevronsUpDown,
  Copy,
  FileClock,
  Images,
  LayoutDashboard,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { BrandMark } from './BrandMark'
import { AnimatedValue } from './AnimatedValue'
import { useApp } from '../context/AppContext'
import { cx } from '../lib/utils'
import { animateSlidingPill } from '../lib/animations'

const items = [
  { to: '/', key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/studio', key: 'studio', label: 'Creator Studio', icon: Sparkles },
  { to: '/reviews', key: 'reviews', label: 'Reviews', icon: FileClock, badge: true },
  { to: '/calendar', key: 'calendar', label: 'Calendar', icon: Calendar },
  { to: '/guidelines', key: 'guidelines', label: 'Guidelines', icon: BookOpen },
  { to: '/assets', key: 'assets', label: 'Brand assets', icon: Images },
  { to: '/insights', key: 'insights', label: 'Insights', icon: ChartNoAxesCombined },
]

export function Sidebar({ open, onClose, onNewReview }) {
  const {
    data,
    toast,
    isLead,
    currentUser,
    canViewModule,
    isOwner,
    pendingApprovalsCount,
    activeBrand,
    allBrands = [],
    switchBrand,
  } = useApp()
  const [brandsOpen, setBrandsOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)
  const location = useLocation()
  const queue = isLead
    ? (data?.stats?.pending_reviews ?? 0)
    : (data?.submissions || []).filter((item) => {
        const author = (item.submitted_by || '').toLowerCase().trim()
        const userLower = (currentUser || '').toLowerCase().trim()
        const isMine = userLower && (author === userLower || author.includes(userLower) || userLower.includes(author))
        return isMine && (item.status === 'reviewing' || item.status === 'pending' || item.status === 'needs_changes')
      }).length
  const score = data?.stats?.avg_score ?? 88

  const navRef = useRef(null)
  const pillRef = useRef(null)
  const initialRef = useRef(false)

  const updatePill = () => {
    animateSlidingPill({
      containerEl: navRef.current,
      pillEl: pillRef.current,
      activeSelector: '.nav-item.is-active',
      isInitialRef: initialRef,
      isVertical: true,
    })
  }

  useLayoutEffect(() => {
    const timer = requestAnimationFrame(() => {
      updatePill()
    })
    const handleResize = () => updatePill()
    window.addEventListener('resize', handleResize)
    return () => {
      cancelAnimationFrame(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [location.pathname])

  const handleCopyCode = (e, code, brandName) => {
    e.stopPropagation()
    try {
      navigator.clipboard?.writeText(code)
      setCopiedCode(code)
      toast(`Copied code: ${code} (${brandName})`, 'good')
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      toast(`Code: ${code}`, 'info')
    }
  }

  const handleSelectBrand = (brand) => {
    switchBrand(brand)
    setBrandsOpen(false)
  }

  const currentBrandMark = activeBrand?.mark || 'A&O'
  const currentBrandName = activeBrand?.brand_name || 'Aster & Oak'
  const currentBrandColor = activeBrand?.color || 'var(--sage)'

  return (
    <aside className={cx('sidebar', open && 'is-open')} aria-label="Primary navigation">
      <div className="sidebar__top">
        <NavLink to="/" className="brand-lockup" onClick={onClose}>
          <BrandMark size={34} />
          <span className="brand-lockup__word">Klarity</span>
        </NavLink>

        <div className="workspace-switch-wrap" style={{ position: 'relative' }}>
          <button
            className={cx('workspace-switch', brandsOpen && 'is-expanded')}
            type="button"
            onClick={() => setBrandsOpen(prev => !prev)}
            title="Click to check brands and switch workspace"
            aria-expanded={brandsOpen}
          >
            <span
              className="workspace-switch__mark"
              style={{ background: currentBrandColor, color: '#ffffff' }}
            >
              {currentBrandMark}
            </span>
            <span className="workspace-switch__copy">
              <strong>{currentBrandName}</strong>
              <small>{isLead ? 'Brand workspace' : 'Assigned workspace'}</small>
            </span>
            <ChevronsUpDown
              size={15}
              style={{
                marginLeft: 'auto',
                opacity: 0.65,
                transform: brandsOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 180ms ease',
              }}
            />
          </button>

          {brandsOpen && (
            <div className="sidebar-brands-dropdown" role="menu">
              <div className="sidebar-brands-dropdown__header">
                <div>
                  <strong>Brand Directory</strong>
                  <p>Check codes &amp; switch workspace</p>
                </div>
                <span className="sidebar-brands-dropdown__count">{allBrands.length} brands</span>
              </div>

              <div className="sidebar-brands-dropdown__list">
                {allBrands.map((brand) => {
                  const isActive = (brand.brand_name || brand.name) === currentBrandName
                  const code = brand.brand_code || brand.code || 'KLARITY-2026'
                  const bName = brand.brand_name || brand.name
                  const bMark = brand.mark || bName.slice(0, 2).toUpperCase()
                  const bColor = brand.color || 'var(--sage)'
                  const isCopied = copiedCode === code

                  return (
                    <div
                      key={code}
                      className={cx('sidebar-brand-item', isActive && 'is-active')}
                      onClick={() => handleSelectBrand(brand)}
                      role="menuitem"
                      tabIndex={0}
                    >
                      <span
                        className="sidebar-brand-item__mark"
                        style={{ background: bColor }}
                      >
                        {bMark}
                      </span>
                      <div className="sidebar-brand-item__info">
                        <div className="sidebar-brand-item__name">
                          <span>{bName}</span>
                          {isActive && <Check size={13} className="sidebar-brand-item__check" />}
                        </div>
                        <div className="sidebar-brand-item__code-row">
                          <code className="sidebar-brand-item__code">{code}</code>
                          <button
                            type="button"
                            className="sidebar-brand-item__copy-btn"
                            title={`Copy code ${code}`}
                            onClick={(e) => handleCopyCode(e, code, bName)}
                          >
                            {isCopied ? <Check size={11} color="#22c55e" /> : <Copy size={11} />}
                            <span>{isCopied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="sidebar__nav sidebar__nav--animated" ref={navRef}>
        <div className="nav-highlight-pill" ref={pillRef} aria-hidden="true" />
        <p className="sidebar__label">Workspace</p>
        {items.filter(item => canViewModule(item.key)).map((item) => {
          const Icon = item.icon
          const label = item.to === '/reviews' && !isLead ? 'My submissions' : item.label
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => cx('nav-item', isActive && 'is-active')}
              onClick={onClose}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {item.badge && queue > 0 ? <span className="nav-item__badge">{queue}</span> : null}
            </NavLink>
          )
        })}

        <p className="sidebar__label sidebar__label--second">Manage</p>
        {(isOwner || canViewModule('brandControls')) && (
          <NavLink
            to="/brand-controls"
            className={({ isActive }) => cx('nav-item', isActive && 'is-active')}
            onClick={onClose}
            title="Brand Owner Command & Access Controls"
          >
            <ShieldCheck size={18} strokeWidth={1.8} />
            <span>Brand Owner Controls</span>
            {pendingApprovalsCount > 0 && isOwner && (
              <span
                className="nav-item__badge"
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '10.5px',
                  minWidth: '18px',
                  height: '18px',
                }}
              >
                {pendingApprovalsCount}
              </span>
            )}
          </NavLink>
        )}
      </nav>

      <div className="sidebar__bottom">
        <NavLink to="/insights" className="rail-health" onClick={onClose}>
          <div className="rail-health__head">
            <span>Brand health</span>
          </div>
          <div className="rail-health__value">
            <AnimatedValue value={Math.round(score)} suffix="/100" />
          </div>
          <div className="rail-health__track">
            <span style={{ width: `${score}%` }} />
          </div>
          <p>Up 1.6 points over the last 30 days</p>
        </NavLink>
      </div>
    </aside>
  )
}
