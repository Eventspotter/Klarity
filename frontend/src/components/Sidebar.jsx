import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Calendar,
  ChartNoAxesCombined,
  FileClock,
  Images,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { BrandMark } from './BrandMark'
import { AnimatedValue } from './AnimatedValue'
import { SpectrumSwitcher } from './SpectrumSwitcher'
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
  } = useApp()
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

  return (
    <aside className={cx('sidebar', open && 'is-open')} aria-label="Primary navigation">
      <div className="sidebar__top">
        <NavLink to="/" className="brand-lockup" onClick={onClose}>
          <BrandMark size={34} />
          <span className="brand-lockup__word">Klarity</span>
        </NavLink>

        <div className="workspace-switch-wrap" style={{ position: 'relative', width: '100%', marginTop: '12px', marginBottom: '8px' }}>
          <SpectrumSwitcher />
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
          <p>Up 1.6 points over the last 30 days</p>
        </NavLink>
      </div>
    </aside>
  )
}
