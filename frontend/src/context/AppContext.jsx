import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { api, getStoredToken, setStoredToken } from '../lib/api'
import { DEFAULT_BRANDS, createDefaultBrand } from '../lib/brands'

const AppContext = createContext(null)

const DEFAULT_VISIBILITY = {
  admin: {
    overview: true,
    studio: false,       // Admins & Reviewers govern and audit; they do not author content
    reviews: true,
    calendar: true,
    guidelines: true,
    assets: true,
    insights: true,
    brandControls: true,
  },
  member: {
    overview: true,
    studio: true,        // Team member authoring workspace
    reviews: true,       // personal submissions
    calendar: false,
    guidelines: true,
    assets: true,
    insights: false,
    brandControls: false,
  },
}

const VISIBILITY_STORAGE_KEY = 'klarity_role_visibility_matrix.v1'
const CACHE_STORAGE_KEY = 'klarity_workspace_cache.v1'

function readCachedWorkspace() {
  try {
    const raw = sessionStorage.getItem(CACHE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.user && parsed?.data) return parsed
  } catch {
    // ignore cache errors
  }
  return null
}

function writeCachedWorkspace(user, data) {
  try {
    if (user && data) {
      sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ user, data, ts: Date.now() }))
    }
  } catch {
    // ignore quota errors
  }
}

function clearCachedWorkspace() {
  try {
    sessionStorage.removeItem(CACHE_STORAGE_KEY)
  } catch {
    // ignore storage errors
  }
}

export function AppProvider({ children }) {
  const initialCache = useRef(readCachedWorkspace()).current
  const [user, setUser] = useState(() => initialCache?.user ?? null)
  const [data, setData] = useState(() => initialCache?.data ?? null)
  const [loading, setLoading] = useState(() => !(initialCache?.user && initialCache?.data))
  const [connected, setConnected] = useState(() => Boolean(initialCache?.data))
  const [currentRole, setCurrentRole] = useState(null)
  const [visibilitySettings, setVisibilitySettings] = useState(() => {
    try {
      const stored = localStorage.getItem(VISIBILITY_STORAGE_KEY)
      return stored ? { ...DEFAULT_VISIBILITY, ...JSON.parse(stored) } : DEFAULT_VISIBILITY
    } catch {
      return DEFAULT_VISIBILITY
    }
  })
  const [toasts, setToasts] = useState([])
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0)
  const [allBrands, setAllBrands] = useState(DEFAULT_BRANDS)
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('klarity_theme')
      if (stored === 'dark' || stored === 'light') return stored
    } catch {}
    return 'light'
  })

  useEffect(() => {
    try {
      localStorage.setItem('klarity_theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
      document.documentElement.style.colorScheme = theme
      const meta = document.querySelector('meta[name="color-scheme"]')
      if (meta) meta.content = theme
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } catch {}
  }, [theme])

  const toggleTheme = useCallback((event) => {
    const isSwitchingToDark = (theme !== 'dark')

    // If browser supports native View Transitions API, animate a true organic wave mask
    if (typeof document.startViewTransition === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Create full-screen SVG wave wipe keyframes
      // The wave travels diagonally across the viewport (0% to 100%)
      // An S-curve profile is defined using 4 control points across the leading edge
      const steps = 30
      const clipKeyframes = []
      const w = window.innerWidth
      const h = window.innerHeight

      for (let s = 0; s <= steps; s++) {
        const p = s / steps
        // Non-linear progress for natural fluid inertia
        const progress = Math.min(1.2, Math.max(-0.2, (p - 0.5) * 1.6 + 0.5))

        if (isSwitchingToDark) {
          // Flow from top-right to bottom-left:
          // We construct an organic S-curved diagonal boundary
          // The edge sweeps from (w + extra) down to (-extra)
          const offset = (1 - p) * (w + h * 0.8) - h * 0.4
          
          // Generate an elegant, undulating curved wave front with smooth bezier-like points
          const wavePoints = []
          const curveSteps = 24
          for (let i = 0; i <= curveSteps; i++) {
            const t = i / curveSteps
            const yPos = t * h
            // Organic wave distortion across the boundary: S-curve inflection
            const waveDelta = Math.sin(t * Math.PI) * 120 * Math.sin(p * Math.PI) + 
                              Math.sin(t * 2 * Math.PI - p * Math.PI * 0.5) * 45
            const xPos = Math.max(-20, Math.min(w + 20, offset + (1 - t) * (h * 0.6) + waveDelta))
            wavePoints.push(`${xPos.toFixed(1)}px ${yPos.toFixed(1)}px`)
          }
          
          // Close the polygon along the top-right corner where dark mode is active
          const polygon = `polygon(${w + 50}px -50px, ${wavePoints[0]}, ${wavePoints.join(', ')}, ${wavePoints[wavePoints.length - 1]}, ${w + 50}px ${h + 50}px)`
          clipKeyframes.push(polygon)
        } else {
          // Flow from bottom-left back to top-right
          const offset = p * (w + h * 0.8) - h * 0.4
          const wavePoints = []
          const curveSteps = 24
          for (let i = 0; i <= curveSteps; i++) {
            const t = i / curveSteps
            const yPos = (1 - t) * h
            const waveDelta = Math.sin(t * Math.PI) * 120 * Math.sin(p * Math.PI) + 
                              Math.sin(t * 2 * Math.PI - p * Math.PI * 0.5) * 45
            const xPos = Math.max(-20, Math.min(w + 20, offset + (1 - t) * (h * 0.6) + waveDelta))
            wavePoints.push(`${xPos.toFixed(1)}px ${yPos.toFixed(1)}px`)
          }
          const polygon = `polygon(-50px ${h + 50}px, ${wavePoints[0]}, ${wavePoints.join(', ')}, ${wavePoints[wavePoints.length - 1]}, -50px -50px)`
          clipKeyframes.push(polygon)
        }
      }

      // Guarantee clean initial & terminal bounds
      if (isSwitchingToDark) {
        clipKeyframes[0] = `polygon(${w + 50}px -50px, ${w + 50}px -50px, ${w + 50}px -50px, ${w + 50}px -50px)`
        clipKeyframes[clipKeyframes.length - 1] = `polygon(-50px -50px, ${w + 50}px -50px, ${w + 50}px ${h + 50}px, -50px ${h + 50}px)`
      } else {
        clipKeyframes[0] = `polygon(-50px ${h + 50}px, -50px ${h + 50}px, -50px ${h + 50}px, -50px ${h + 50}px)`
        clipKeyframes[clipKeyframes.length - 1] = `polygon(-50px -50px, ${w + 50}px -50px, ${w + 50}px ${h + 50}px, -50px ${h + 50}px)`
      }

      const transition = document.startViewTransition(() => {
        setTheme(curr => (curr === 'dark' ? 'light' : 'dark'))
      })

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: clipKeyframes
          },
          {
            duration: 850,
            easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
            pseudoElement: '::view-transition-new(root)'
          }
        )
      }).catch(() => {})
    } else {
      setTheme(curr => (curr === 'dark' ? 'light' : 'dark'))
    }
  }, [theme])
  const [activeBrand, setActiveBrand] = useState(() => {
    try {
      const stored = localStorage.getItem('klarity_active_brand')
      if (stored) {
        const parsed = JSON.parse(stored)
        const match = DEFAULT_BRANDS.find(b => b.brand_name === parsed.brand_name || b.name === parsed.name)
        if (match) return match
        if (parsed.swatches?.length === 6 &&
            parsed.swatches.every(s => ['#FFFFFF', '#111827', '#298EE4', '#64748B', '#F8FAFC', '#E0F2FE'].includes(s.hex))) {
          parsed.swatches = []
        }
        return parsed
      }
    } catch {}
    return DEFAULT_BRANDS[0]
  })
  const timers = useRef(new Map())
  const toast = useCallback((message, tone = 'good') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(items => [...items, { id, message, tone }])
    timers.current.set(id, setTimeout(() => {
      setToasts(items => items.filter(item => item.id !== id))
      timers.current.delete(id)
    }, 4200))
  }, [])
  const dismissToast = id => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts(items => items.filter(item => item.id !== id))
  }
  const fetchPendingCount = useCallback((account) => {
    const r = (account?.role || '').toLowerCase()
    if (r === 'owner' || r === 'admin') {
      // Call without brand_name so the backend uses the token's canonical
      // brand_name — this is the same approach BrandControls.fetchPending uses,
      // keeping the sidebar badge count and the detail list in sync.
      api.pendingAccounts().then(accs => {
        if (Array.isArray(accs)) setPendingApprovalsCount(accs.length)
      }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (user) {
      const isDemo = Boolean(user.is_demo || ['ashwik', 'sunless'].includes(user.username))
      const userRole = (user.role || 'owner').toLowerCase()
      const isOwnerRole = userRole === 'owner' || userRole === 'admin'

      if (!isDemo || !isOwnerRole) {
        const targetBrandName = user.brand_name || 'Aster & Oak'
        const matched = DEFAULT_BRANDS.find(
          b => (b.brand_name || b.name || '').toLowerCase() === targetBrandName.toLowerCase()
        )
        const brandObj = matched || createDefaultBrand(targetBrandName, user.brand_values || '', user.brand_code || '')
        setAllBrands([brandObj])
        setActiveBrand(brandObj)
        try {
          localStorage.setItem('klarity_active_brand', JSON.stringify(brandObj))
        } catch {}
        return
      }

      api.brandDirectory().then(res => {
        if (res?.brands && Array.isArray(res.brands)) {
          const demoBrandNames = new Set(DEFAULT_BRANDS.map(b => (b.brand_name || b.name || '').toLowerCase()))
          const filtered = res.brands.filter(sb => demoBrandNames.has((sb.brand_name || '').toLowerCase()))

          const merged = [...DEFAULT_BRANDS]
          filtered.forEach(sb => {
            const idx = merged.findIndex(
              b => (b.brand_name || b.name || '').toLowerCase() === (sb.brand_name || '').toLowerCase()
            )
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...sb }
            }
          })
          setAllBrands(merged)

          const targetName = user.brand_name
          if (targetName) {
            const matched = merged.find(
              b => (b.brand_name || b.name || '').toLowerCase() === targetName.toLowerCase()
            )
            if (matched) {
              setActiveBrand(matched)
              try {
                localStorage.setItem('klarity_active_brand', JSON.stringify(matched))
              } catch {}
            }
          }
        }
      }).catch(() => {})
    }
  }, [user])

  const updateActiveBrand = useCallback((updates) => {
    setActiveBrand(prev => {
      const next = { ...prev, ...updates }
      try {
        localStorage.setItem('klarity_active_brand', JSON.stringify(next))
      } catch {}
      return next
    })
    setUser(prev => prev ? {
      ...prev,
      brand_name: updates.brand_name || updates.name || prev.brand_name,
      brand_code: updates.brand_code || updates.code || prev.brand_code,
      brand_values: updates.brand_values !== undefined ? updates.brand_values : prev.brand_values,
    } : prev)
    setAllBrands(prev => {
      return prev.map(b => {
        if ((b.brand_name || b.name) === (updates.old_brand_name || updates.brand_name || updates.name)) {
          return { ...b, ...updates }
        }
        return b
      })
    })
  }, [])

  const refresh = useCallback(async (accountOverride) => {
    try {
      const payload = await api.bootstrap()
      setData(payload)
      setConnected(true)
      const activeUser = accountOverride || user
      if (activeUser) {
        writeCachedWorkspace(activeUser, payload)
        fetchPendingCount(activeUser)
      }
      return payload
    } catch (error) {
      setConnected(false)
      if (error.status === 401) {
        setStoredToken(null)
        clearCachedWorkspace()
        setUser(null)
        setData(null)
      }
      throw error
    }
  }, [user, fetchPendingCount])

  const switchBrand = useCallback(async (brand) => {
    const fullBrand = DEFAULT_BRANDS.find(b => b.brand_name === brand.brand_name || b.name === brand.name) || brand
    setActiveBrand(fullBrand)
    try {
      localStorage.setItem('klarity_active_brand', JSON.stringify(fullBrand))
    } catch {}
    try {
      await api.switchBrand(brand.brand_name)
      await refresh()
    } catch {}
    toast(`Active workspace: ${fullBrand.brand_name || fullBrand.name}`, 'good')
  }, [toast, refresh])
  useEffect(() => {
    let alive = true
    const token = getStoredToken()
    if (!token && !document.cookie.includes('klarity_session=')) {
      setLoading(false)
      return
    }
    Promise.all([api.me(), api.bootstrap()])
      .then(([account, payload]) => {
        if (!alive) return
        setUser(account)
        if (account?.brand_name) {
          const targetName = account.brand_name
          const existing = DEFAULT_BRANDS.find(
            b => (b.brand_name || b.name || '').toLowerCase() === targetName.toLowerCase()
          )
          const brandObj = existing
            ? { ...existing, brand_name: targetName }
            : createDefaultBrand(targetName, account.brand_values, account.brand_code)
          setActiveBrand(brandObj)
          try {
            localStorage.setItem('klarity_active_brand', JSON.stringify(brandObj))
          } catch {}
        }
        setData(payload)
        setConnected(true)
        writeCachedWorkspace(account, payload)
        fetchPendingCount(account)
      })
      .catch(error => {
        if (!alive) return
        if (error.status === 401) {
          setStoredToken(null)
          clearCachedWorkspace()
          setUser(null)
          setData(null)
          setConnected(false)
        } else {
          toast('Cannot reach the workspace. Please try again.', 'warn')
        }
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => {
      alive = false
      timers.current.forEach(clearTimeout)
    }
  }, [toast, fetchPendingCount])
  const authenticate = async (mode, payload) => {
    const res = await api[mode](payload)
    if (res?.otp_required) {
      return res
    }
    const account = res
    if (account?.token) {
      setStoredToken(account.token)
    }
    setUser(account)
    if (account?.brand_name) {
      const isDemo = Boolean(account.is_demo || ['ashwik', 'sunless'].includes(account.username))
      const targetName = account.brand_name
      if (!isDemo) {
        const brandObj = createDefaultBrand(targetName, account.brand_values, account.brand_code)
        setActiveBrand(brandObj)
        setAllBrands([brandObj])
        try {
          localStorage.setItem('klarity_active_brand', JSON.stringify(brandObj))
        } catch {}
      } else {
        const existing = DEFAULT_BRANDS.find(
          b => (b.brand_name || b.name || '').toLowerCase() === targetName.toLowerCase()
        )
        const brandObj = existing
          ? { ...existing, brand_name: targetName }
          : createDefaultBrand(targetName, account.brand_values, account.brand_code)
        setActiveBrand(brandObj)
        try {
          localStorage.setItem('klarity_active_brand', JSON.stringify(brandObj))
        } catch {}
      }
    }
    // Optimistic cache hydration: use bootstrap included in login response or cached workspace
    const bootstrapData = account?.bootstrap || readCachedWorkspace()?.data
    if (bootstrapData) {
      setData(bootstrapData)
      setConnected(true)
      writeCachedWorkspace(account, bootstrapData)
    }
    setLoading(false)
    const refreshPromise = refresh(account)
    if (!bootstrapData) {
      const liveData = await refreshPromise
      writeCachedWorkspace(account, liveData)
    } else {
      refreshPromise.catch(() => {})
    }
    return account
  }
  const cleanWorkspace = async () => {
    try {
      const res = await api.cleanWorkspace()
      await refresh()
      toast(res?.message || 'Workspace submissions cleared.', 'good')
      return res
    } catch (error) {
      toast(error.message || 'Failed to clear workspace', 'warn')
      throw error
    }
  }
  const logout = async () => {
    // 1. Instantly wipe client session state for 0ms perceived latency
    setStoredToken(null)
    clearCachedWorkspace()
    setUser(null)
    setData(null)
    setConnected(false)
    setAllBrands(DEFAULT_BRANDS)
    setActiveBrand(DEFAULT_BRANDS[0])
    try {
      localStorage.removeItem('klarity_active_brand')
      localStorage.removeItem('klarity_role')
      sessionStorage.removeItem('klarity_redirect')
    } catch {}

    // 2. Invalidate server-side session asynchronously in background
    api.logout().catch(() => {})
  }
  const mutate = async (operation, message) => {
    try {
      const result = await operation()
      await refresh()
      toast(message)
      return result
    } catch (error) {
      if (error.status === 401) {
        setStoredToken(null)
        clearCachedWorkspace()
        setUser(null)
        setData(null)
      }
      toast(error.message, 'warn')
      throw error
    }
  }

  const switchRole = () => {}

  const userAccountRole = (user?.role || 'owner').toLowerCase()
  const activeRole = userAccountRole

  const isOwner = activeRole === 'owner' || activeRole === 'admin'
  const isReviewer = activeRole === 'reviewer'
  const isMember = activeRole === 'member' || activeRole === 'creator'
  const isLead = isOwner || isReviewer

  const updateRoleVisibility = (targetRole, moduleKey, isVisible) => {
    if (!isOwner) {
      toast('Only the Brand Owner can modify role visibility permissions.', 'warn')
      return
    }
    setVisibilitySettings((prev) => {
      const updated = {
        ...prev,
        [targetRole]: {
          ...(prev[targetRole] || {}),
          [moduleKey]: isVisible,
        },
      }
      try {
        localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(updated))
      } catch {}
      return updated
    })
    toast(`Updated ${targetRole} visibility for ${moduleKey}.`, 'good')
  }

  const canViewModule = (moduleKey) => {
    // Creator studio is an authoring workstation exclusively for Team Members (creators).
    // Brand Owners and Reviewers audit and govern; they do not author content.
    if (moduleKey === 'studio') {
      return isMember && (visibilitySettings.member?.studio ?? true)
    }
    if (isOwner) return true // Brand Owner has full executive governance visibility
    if (isReviewer) {
      // Reviewers inherit admin visibility matrix
      return visibilitySettings.admin?.[moduleKey] ?? true
    }
    // Team member view matrix
    return visibilitySettings.member?.[moduleKey] ?? false
  }

  return <AppContext.Provider value={{
    user, data, loading, connected, toasts, toast, dismissToast, refresh, authenticate, logout, cleanWorkspace,
    theme, isDark: theme === 'dark', toggleTheme, setTheme,
    currentUser: user?.username || '',
    currentRole: activeRole,
    switchRole,
    activeBrand,
    allBrands,
    switchBrand,
    updateActiveBrand,
    isOwner,
    isReviewer,
    isMember,
    isLead,
    visibilitySettings,
    updateRoleVisibility,
    canViewModule,
    pendingApprovalsCount,
    setPendingApprovalsCount,
    createSubmission: payload => mutate(() => api.createSubmission(payload), 'Review complete. The report is ready.'),
    reviewSubmission: (id, action, comment) => mutate(() => api.reviewSubmission(id, {
      action, comment: comment || null, performed_by: user.username,
    }), 'Review decision saved.'),
    createGuideline: payload => {
      if (!isLead) {
        toast('Only Brand Leads and Higher-ups can author guidelines.', 'warn')
        throw new Error('Unauthorized: higherups and leads author guidelines.')
      }
      return mutate(() => api.createGuideline(payload), 'Guideline published.')
    },
    updateGuideline: (id, payload) => {
      if (!isLead) {
        toast('Only Brand Leads and Higher-ups can edit guidelines.', 'warn')
        throw new Error('Unauthorized: higherups and leads author guidelines.')
      }
      return mutate(() => api.updateGuideline(id, payload), 'Guideline updated.')
    },
  }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
