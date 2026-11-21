import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Calendar,
  ChartNoAxesCombined,
  Check,
  ChevronsUpDown,
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
    user,
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
  const isDemo = Boolean(user?.is_demo || ['ashwik', 'sunless'].includes(user?.username))
  const canSwitchBrands = isDemo && allBrands.length > 1
  const [brandsOpen, setBrandsOpen] = useState(false)
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
  const hoverPillRef = useRef(null)
  const initialRef = useRef(false)
  const hoverInitialRef = useRef(false)
  const switchWrapRef = useRef(null)

  useEffect(() => {
    if (!brandsOpen) return
    const handleClickOutside = (e) => {
      if (switchWrapRef.current && !switchWrapRef.current.contains(e.target)) {
        setBrandsOpen(false)
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setBrandsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [brandsOpen])

  const updatePill = () => {
    animateSlidingPill({
      containerEl: navRef.current,
      pillEl: pillRef.current,
      activeSelector: '.nav-item.is-active',
      isInitialRef: initialRef,
      isVertical: true,
    })
  }

  const handleNavItemMouseEnter = (e) => {
    const target = e.currentTarget
    if (!target || target.classList.contains('is-active')) {
      if (hoverPillRef.current) {
        animateSlidingPill({
          containerEl: navRef.current,
          pillEl: hoverPillRef.current,
          targetEl: null,
          isVertical: true,
        })
      }
      return
    }
    animateSlidingPill({
      containerEl: navRef.current,
      pillEl: hoverPillRef.current,
      targetEl: target,
      isInitialRef: hoverInitialRef,
      isVertical: true,
    })
  }

  const handleNavMouseLeave = () => {
    hoverInitialRef.current = false
    if (hoverPillRef.current) {
      animateSlidingPill({
        containerEl: navRef.current,
        pillEl: hoverPillRef.current,
        targetEl: null,
        isVertical: true,
      })
    }
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

        <div ref={switchWrapRef} className="workspace-switch-wrap" style={{ position: 'relative' }}>
          <button
            className={cx('workspace-switch', canSwitchBrands && brandsOpen && 'is-expanded')}
            type="button"
            onClick={() => {
              if (canSwitchBrands) setBrandsOpen(prev => !prev)
            }}
            title={canSwitchBrands ? "Click to check brands and switch workspace" : `Workspace: ${currentBrandName}`}
            style={{ cursor: canSwitchBrands ? 'pointer' : 'default' }}
            aria-expanded={canSwitchBrands ? brandsOpen : undefined}
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
            {canSwitchBrands && (
              <ChevronsUpDown
                size={15}
                style={{
                  marginLeft: 'auto',
                  opacity: 0.65,
                  transform: brandsOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 180ms ease',
                }}
              />
            )}
          </button>

          {canSwitchBrands && brandsOpen && (
            <div className="sidebar-brands-dropdown" role="menu">
              <div className="sidebar-brands-dropdown__header">
                <div>
                  <strong>Brand Directory</strong>
                  <p>Switch workspace</p>
                </div>
                <span className="sidebar-brands-dropdown__count">{allBrands.length} brands</span>
              </div>

              <div className="sidebar-brands-dropdown__list">
                {allBrands.map((brand) => {
                  const isActive = (brand.brand_name || brand.name) === currentBrandName
                  const bName = brand.brand_name || brand.name
                  const bMark = brand.mark || bName.slice(0, 2).toUpperCase()
                  const bColor = brand.color || 'var(--sage)'

                  return (
                    <div
                      key={bName}
                      className={cx('sidebar-brand-item', isActive && 'is-active')}
                      onClick={() => handleSelectBrand(brand)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSelectBrand(brand)
                        }
                      }}
                      role="menuitem"
                      tabIndex={0}
                    >
                      <span
                        className="sidebar-brand-item__mark"
                        style={{ background: bColor }}
                      >
                        {bMark}
                      </span>
                      <span className="sidebar-brand-item__name">{bName}</span>
                      {isActive && <Check size={14} className="sidebar-brand-item__check" />}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <nav
        className="sidebar__nav sidebar__nav--animated"
        ref={navRef}
        onMouseLeave={handleNavMouseLeave}
      >
        <div className="nav-highlight-pill" ref={pillRef} aria-hidden="true" />
        <div className="nav-hover-pill" ref={hoverPillRef} aria-hidden="true" />
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
              onMouseEnter={handleNavItemMouseEnter}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span className="reserved-bold" data-text={label}>{label}</span>
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
            onMouseEnter={handleNavItemMouseEnter}
            title="Brand Owner Command & Access Controls"
          >
            <ShieldCheck size={18} strokeWidth={1.8} />
            <span className="reserved-bold" data-text="Brand Owner Controls">Brand Owner Controls</span>
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
          <p>
            {data?.stats?.total_submissions > 0
              ? (data?.stats?.score_delta > 0
                  ? `Up ${data.stats.score_delta.toFixed(1)} points over the last 30 days`
                  : data?.stats?.score_delta < 0
                    ? `Down ${Math.abs(data.stats.score_delta).toFixed(1)} points over the last 30 days`
                    : 'Score holding steady over the last 30 days')
              : 'Awaiting first review'}
          </p>
        </NavLink>
      </div>
    </aside>
  )
}
