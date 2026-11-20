import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { api, getStoredToken, setStoredToken } from '../lib/api'
import { DEFAULT_BRANDS } from '../lib/brands'

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
  const [currentRole, setCurrentRole] = useState(() => localStorage.getItem('klarity_role') || 'owner')
  const [visibilitySettings, setVisibilitySettings] = useState(() => {
    try {
      const stored = localStorage.getItem(VISIBILITY_STORAGE_KEY)
      return stored ? { ...DEFAULT_VISIBILITY, ...JSON.parse(stored) } : DEFAULT_VISIBILITY
    } catch {
      return DEFAULT_VISIBILITY
    }
  })
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('klarity_theme')
      if (stored) return stored
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
    } catch {}
    return 'dark'
  })

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme)
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      localStorage.setItem('klarity_theme', theme)
    } catch {}
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const [toasts, setToasts] = useState([])
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0)
  const [allBrands, setAllBrands] = useState(DEFAULT_BRANDS)
  const [activeBrand, setActiveBrand] = useState(() => {
    try {
      const stored = localStorage.getItem('klarity_active_brand')
      if (stored) {
        const parsed = JSON.parse(stored)
        const match = DEFAULT_BRANDS.find(b => b.brand_name === parsed.brand_name || b.name === parsed.name)
        if (match) return match
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
      api.pendingAccounts().then(accs => {
        if (Array.isArray(accs)) setPendingApprovalsCount(accs.length)
      }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (user) {
      api.brandDirectory().then(res => {
        if (res?.brands && Array.isArray(res.brands)) {
          setAllBrands(prev => {
            return DEFAULT_BRANDS.map(db => {
              const serverBrand = res.brands.find(sb => sb.brand_name === db.brand_name)
              return serverBrand ? { ...db, ...serverBrand } : db
            })
          })
        }
      }).catch(() => {})
    }
  }, [user])

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
    Promise.all([api.me(), api.bootstrap()])
      .then(([account, payload]) => {
        if (!alive) return
        setUser(account)
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
    const account = await api[mode](payload)
    if (account?.token) {
      setStoredToken(account.token)
    }
    setUser(account)
    const bootstrapPayload = await refresh(account)
    writeCachedWorkspace(account, bootstrapPayload)
  }
  const logout = async () => {
    try {
      await api.logout()
    } finally {
      setStoredToken(null)
      clearCachedWorkspace()
      setUser(null)
      setData(null)
      setConnected(false)
    }
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

  const switchRole = (newRole) => {
    setCurrentRole(newRole)
    localStorage.setItem('klarity_role', newRole)
    const roleLabels = {
      owner: 'Stage 1 · Brand Owner (Executive Governance)',
      reviewer: 'Stage 2 · Reviewer (Compliance Inspector)',
      member: 'Stage 3 · Team Member (Creator Studio)',
    }
    toast(`Active Perspective: ${roleLabels[newRole] || newRole}`, 'good')
  }

  const userAccountRole = (user?.role || 'owner').toLowerCase()
  const activeRole = currentRole || userAccountRole

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
    user, data, loading, connected, toasts, toast, dismissToast, refresh, authenticate, logout,
    theme, isDark: theme === 'dark', toggleTheme,
    currentUser: user?.username || '',
    currentRole: activeRole,
    switchRole,
    activeBrand,
    allBrands,
    switchBrand,
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
