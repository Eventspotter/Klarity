import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { animateSlidingPill, isReducedMotion } from '../../lib/animations'

// Wren's section tracking, adapted to Klarity's native anchor navigation.
export function useActiveSection(ids, offset = 150) {
  const [active, setActive] = useState(ids[0])
  const hold = useRef(null)
  const timer = useRef(0)
  const key = ids.join(',')
  useEffect(() => {
    const update = () => {
      if (hold.current) return
      let current = key.split(',')[0]
      for (const id of key.split(',')) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= offset) current = id
      }
      setActive(current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      window.clearTimeout(timer.current)
    }
  }, [key, offset])
  const select = useCallback((id) => {
    hold.current = id
    setActive(id)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => { hold.current = null }, isReducedMotion() ? 0 : 1200)
  }, [])
  return { active, select }
}

// Uses the exact same GSAP geometry and easing as the dashboard sidebar.
export function SlidingGroup({ as: Tag = 'div', active, children, className = '', vertical = false, ...props }) {
  const root = useRef(null)
  const pill = useRef(null)
  const initial = useRef(false)
  useLayoutEffect(() => {
    const containerEl = root.current
    const pillEl = pill.current
    const update = (targetEl) => {
      const selected = targetEl || containerEl.querySelector('[data-selected="true"]')
      if (!selected) return
      if (isReducedMotion()) {
        gsap.set(pillEl, { x: selected.offsetLeft, y: selected.offsetTop, width: selected.offsetWidth, height: selected.offsetHeight, opacity: 1 })
      } else {
        animateSlidingPill({ containerEl, pillEl, targetEl: selected, isInitialRef: initial, isVertical: vertical })
      }
    }
    update()
    const resize = new ResizeObserver(() => update())
    resize.observe(containerEl)
    for (const el of containerEl.querySelectorAll('a, button')) resize.observe(el)
    const preview = (e) => {
      const item = e.target.closest('a, button')
      if (item && containerEl.contains(item)) update(item)
    }
    const restore = () => update()
    const blur = (e) => { if (!containerEl.contains(e.relatedTarget)) restore() }
    containerEl.addEventListener('pointerover', preview)
    containerEl.addEventListener('pointerleave', restore)
    containerEl.addEventListener('focusin', preview)
    containerEl.addEventListener('focusout', blur)
    return () => {
      resize.disconnect()
      gsap.killTweensOf(pillEl)
      containerEl.removeEventListener('pointerover', preview)
      containerEl.removeEventListener('pointerleave', restore)
      containerEl.removeEventListener('focusin', preview)
      containerEl.removeEventListener('focusout', blur)
    }
  }, [active, vertical])
  return <Tag ref={root} className={`sliding-group ${className}`} {...props}>
    <span ref={pill} className="dashboard-pill" aria-hidden="true" />
    {children}
  </Tag>
}

export const spring = { type: 'spring', bounce: 0.18, duration: 0.5 }
