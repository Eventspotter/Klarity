import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Bell,
  Check,
  Clock,
  Clock3,
  Copy,
  Edit3,
  Globe,
  KeyRound,
  Lock,
  Mail,
  Plus,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  Workflow,
  X,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Avatar, Button, Drawer, Field, Panel, SectionHead, Select } from '../components/UI'
import { api } from '../lib/api'
import { cx } from '../lib/utils'
import { animateSlidingPill } from '../lib/animations'
import WakeSlider from '../components/WakeSlider'

const getSettingsKey = (name) => `klarity.settings.v2_${(name || 'default').toLowerCase().replace(/[^a-z0-9]/g, '_')}`
const getTeamKey = (name) => `klarity.team_roster.v2_${(name || 'default').toLowerCase().replace(/[^a-z0-9]/g, '_')}`

const roleOptions = [
  'Brand Owner',
  'Reviewer',
  'Team Member',
]

const statusOptions = [
  'Active',
  'Invited',
  'Suspended',
]

const defaultSettings = {
  workspace: 'Aster & Oak',
  website: 'asterandoak.studio',
  timezone: 'Asia/Kolkata (GMT+5:30)',
  defaultReviewer: 'Ashwik Saxena',
  threshold: '85',
  autoAssign: true,
  requireEvidence: true,
  weeklyDigest: true,
  assignedEmails: true,
  mentions: false,
  slack: false,
  zeroDataRetention: true,
  confidentialMasking: true,
  discloseAi: true,
}

const defaultTeam = [
  { name: 'Elena Vance (Brand Owner)', email: 'judge.owner@klarity.local', role: 'Brand Owner', status: 'Active' },
  { name: 'Marcus Chen (Reviewer)', email: 'judge.reviewer@klarity.local', role: 'Reviewer', status: 'Active' },
  { name: 'Maya Iyer (Team Member)', email: 'judge.member@klarity.local', role: 'Team Member', status: 'Active' },
  { name: 'Ashwik Saxena (Topper)', email: 'ashwik@topper', role: 'Brand Owner', status: 'Active' },
  { name: 'Kruthik Kamegaonkar', email: 'kruthik@klarity.ai', role: 'Brand Owner', status: 'Active' },
  { name: 'Maddi Abhinav', email: 'abhinav@klarity.ai', role: 'Reviewer', status: 'Active' },
  { name: 'G N Sreekar', email: 'sreekar@klarity.ai', role: 'Team Member', status: 'Active' },
  { name: 'Rohan Mehta', email: 'rohan@asterandoak.studio', role: 'Team Member', status: 'Invited' },
]

function ToggleRow({ label, description, checked, onChange, disabled = false }) {
  return (
    <div className={cx('toggle-row', disabled && 'is-disabled')} style={disabled ? { opacity: 0.65 } : undefined}>
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className={cx('switch', checked && 'is-on')}
        onClick={() => !disabled && onChange(!checked)}
        style={disabled ? { cursor: 'not-allowed' } : undefined}
      >
        <span />
      </button>
    </div>
  )
}

export function BrandControls() {
  const {
    toast,
    currentUser,
    user,
    isLead,
    isOwner,
    visibilitySettings,
    setPendingApprovalsCount,
    activeBrand,
    updateActiveBrand,
    cleanWorkspace,
  } = useApp()

  const currentBrandName = activeBrand?.brand_name || activeBrand?.name || user?.brand_name || 'Aster & Oak'
  const currentBrandCode = activeBrand?.brand_code || activeBrand?.code || user?.brand_code || 'KLARITY-2026'
  const currentBrandValues = activeBrand?.values || activeBrand?.brand_values || user?.brand_values || ''

  const [settings, setSettings] = useState(() => {
    try {
      const stored = window.localStorage.getItem(getSettingsKey(currentBrandName))
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored), workspace: currentBrandName }
      }
    } catch {}
    return {
      ...defaultSettings,
      workspace: currentBrandName,
      website: `${currentBrandName.toLowerCase().replace(/[^a-z0-9]/g, '')}.studio`,
    }
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clearingWorkspace, setClearingWorkspace] = useState(false)

  const [pendingAccounts, setPendingAccounts] = useState([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [verifyingId, setVerifyingId] = useState(null)

  const [brandMeta, setBrandMeta] = useState(() => ({
    brand_name: currentBrandName,
    brand_values: currentBrandValues,
    brand_code: currentBrandCode,
  }))

  useEffect(() => {
    if (activeBrand) {
      const bName = activeBrand.brand_name || activeBrand.name || currentBrandName
      const bCode = activeBrand.brand_code || activeBrand.code || brandMeta.brand_code || ''
      const bValues = activeBrand.values || activeBrand.brand_values || brandMeta.brand_values || ''
      setBrandMeta({
        brand_name: bName,
        brand_values: bValues,
        brand_code: bCode,
      })
      try {
        const stored = window.localStorage.getItem(getSettingsKey(bName))
        if (stored) {
          setSettings(prev => ({ ...prev, ...JSON.parse(stored), workspace: bName }))
          return
        }
      } catch {}
      setSettings(prev => ({
        ...prev,
        workspace: bName || prev.workspace,
        website: `${bName.toLowerCase().replace(/[^a-z0-9]/g, '')}.studio`,
      }))
    }
  }, [activeBrand?.brand_name, activeBrand?.name, activeBrand?.brand_code])

  const handleClearWorkspace = async () => {
    if (!window.confirm('Are you sure you want to clear all sample/demo review submissions? This will give you a completely clean review desk.')) {
      return
    }
    setClearingWorkspace(true)
    try {
      await cleanWorkspace()
    } finally {
      setClearingWorkspace(false)
    }
  }

  // Team Governance Roster State
  const [team, setTeam] = useState(() => {
    const isDemo = Boolean(user?.is_demo || ['ashwik', 'sunless'].includes(user?.username))
    const bName = activeBrand?.brand_name || activeBrand?.name || user?.brand_name || currentBrandName
    if (isDemo && bName.toLowerCase() === 'aster & oak') {
      try {
        const stored = window.localStorage.getItem(getTeamKey(bName))
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch {}
      return defaultTeam
    }
    try {
      const stored = window.localStorage.getItem(getTeamKey(bName))
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    if (user) {
      const ownerName = user.name || (user.username?.replace?.(/_/g, ' ')?.replace(/\b\w/g, (c) => c.toUpperCase()) || user.username)
      return [
        {
          id: user.id,
          name: ownerName,
          username: user.username,
          email: user.email,
          role: isOwner ? 'Brand Owner' : isReviewer ? 'Reviewer' : 'Team Member',
          status: 'Active',
          is_approved: true,
        },
      ]
    }
    return []
  })

  const persistTeam = (updatedTeam) => {
    setTeam(updatedTeam)
    try {
      const targetBrand = activeBrand?.brand_name || activeBrand?.name || brandMeta.brand_name || currentBrandName
      window.localStorage.setItem(getTeamKey(targetBrand), JSON.stringify(updatedTeam))
    } catch {}
  }

  const fetchTeamRoster = async () => {
    const targetBrand = activeBrand?.brand_name || activeBrand?.name || user?.brand_name || currentBrandName
    try {
      const list = await api.teamMembers(targetBrand)
      if (Array.isArray(list)) {
        setTeam(list)
        try {
          window.localStorage.setItem(getTeamKey(targetBrand), JSON.stringify(list))
        } catch {}
        return
      }
    } catch {
      // offline / fallback
    }

    const isDemo = Boolean(user?.is_demo || ['ashwik', 'sunless'].includes(user?.username))
    if (isDemo && targetBrand.toLowerCase() === 'aster & oak') {
      try {
        const stored = window.localStorage.getItem(getTeamKey(targetBrand))
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTeam(parsed)
            return
          }
        }
      } catch {}
      setTeam(defaultTeam)
    } else {
      if (user) {
        const ownerName = user.name || (user.username?.replace?.(/_/g, ' ')?.replace(/\b\w/g, (c) => c.toUpperCase()) || user.username)
        setTeam([
          {
            id: user.id,
            name: ownerName,
            username: user.username,
            email: user.email,
            role: isOwner ? 'Brand Owner' : isReviewer ? 'Reviewer' : 'Team Member',
            status: 'Active',
            is_approved: true,
          },
        ])
      } else {
        setTeam([])
      }
    }
  }

  // Member Audit Drawer State
  const [auditTarget, setAuditTarget] = useState(null)
  const [auditForm, setAuditForm] = useState({
    name: '',
    email: '',
    role: 'Team Member',
    status: 'Active',
  })

  const handleOpenAudit = (member, index) => {
    setAuditTarget({ ...member, index })
    setAuditForm({
      name: member.name || '',
      email: member.email || '',
      role: member.role || 'Team Member',
      status: member.status || 'Active',
    })
  }

  const handleSaveAudit = async (e) => {
    e?.preventDefault?.()
    if (!auditForm.name.trim() || !auditForm.email.trim()) {
      toast('Name and email are required.', 'warn')
      return
    }
    try {
      if (auditTarget?.id) {
        await api.updateTeamMember(auditTarget.id, {
          name: auditForm.name.trim(),
          role: auditForm.role,
          status: auditForm.status,
        })
      }
      toast(`Governance details updated for ${auditForm.name}.`, 'good')
      setAuditTarget(null)
      await fetchTeamRoster()
    } catch {
      const updated = [...team]
      if (auditTarget?.index !== undefined) {
        updated[auditTarget.index] = {
          ...updated[auditTarget.index],
          name: auditForm.name.trim(),
          email: auditForm.email.trim(),
          role: auditForm.role,
          status: auditForm.status,
        }
        persistTeam(updated)
      }
      toast(`Governance details updated for ${auditForm.name}.`, 'good')
      setAuditTarget(null)
    }
  }

  const handleDeleteMember = async () => {
    if (!auditTarget) return
    const confirmDelete = window.confirm(`Remove ${auditTarget.name} from the workspace governance roster?`)
    if (!confirmDelete) return
    try {
      if (auditTarget.id) {
        await api.deleteTeamMember(auditTarget.id)
      }
      toast(`Removed ${auditTarget.name} from roster.`, 'good')
      setAuditTarget(null)
      await fetchTeamRoster()
    } catch {
      const updated = team.filter((_, idx) => idx !== auditTarget.index)
      persistTeam(updated)
      toast(`Removed ${auditTarget.name} from roster.`, 'good')
      setAuditTarget(null)
    }
  }

  // Invite & Add Member Drawer State
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'Team Member',
    status: 'Active',
  })

  const handleOpenInvite = () => {
    setInviteForm({
      name: '',
      email: '',
      role: 'Team Member',
      status: 'Active',
    })
    setIsInviteOpen(true)
  }

  const handleAddMember = async (e) => {
    e?.preventDefault?.()
    if (!inviteForm.name.trim()) {
      toast('Please enter the member name.', 'warn')
      return
    }
    if (!inviteForm.email.trim()) {
      toast('Please enter a valid email address.', 'warn')
      return
    }
    const existing = team.find(
      (m) => m.email.toLowerCase() === inviteForm.email.trim().toLowerCase()
    )
    if (existing) {
      toast(`Member with email "${inviteForm.email}" already exists in the roster.`, 'warn')
      return
    }

    try {
      const targetBrand = activeBrand?.brand_name || activeBrand?.name || brandMeta.brand_name || currentBrandName
      const res = await api.inviteTeamMember({
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim(),
        role: inviteForm.role,
        status: inviteForm.status,
        brand_name: targetBrand,
      })
      toast(res?.message || `Added ${inviteForm.name} directly to the brand roster!`, 'good')
      setIsInviteOpen(false)
      await fetchTeamRoster()
    } catch {
      const newMember = {
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim(),
        role: inviteForm.role,
        status: inviteForm.status,
      }
      const updated = [newMember, ...team]
      persistTeam(updated)
      toast(`Added ${newMember.name} directly to the brand roster!`, 'good')
      setIsInviteOpen(false)
    }
  }

  const [activeSection, setActiveSection] = useState('brand-identity')
  const navRef = useRef(null)
  const pillRef = useRef(null)
  const initialPillRef = useRef(false)

  // Scrollspy: update activeSection based on scroll position
  useEffect(() => {
    const sectionIds = [
      'brand-identity',
      'review-defaults',
      'pending-approvals',
      'team-roster',
      'role-visibility',
      'notifications',
      'ai-disclosure',
    ]
    const handleScroll = () => {
      const scrollY = window.scrollY + 130
      let current = sectionIds[0]
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el) {
          const top = el.offsetTop
          if (scrollY >= top) {
            current = id
          }
        }
      }
      setActiveSection(current)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Animate sliding pill whenever activeSection changes
  useLayoutEffect(() => {
    if (!navRef.current || !pillRef.current) return
    animateSlidingPill({
      containerEl: navRef.current,
      pillEl: pillRef.current,
      activeSelector: '.settings-nav a.is-active',
      isInitialRef: initialPillRef,
      isVertical: true,
    })
  }, [activeSection])

  const fetchPending = async () => {
    try {
      setLoadingPending(true)
      // First try without brand filter — lets the backend use the token's own
      // brand_name, which is the canonical source-of-truth and matches what
      // AppContext.fetchPendingCount uses for the sidebar badge count.
      let list
      try {
        list = await api.pendingAccounts()
      } catch {
        // Fallback: try with the frontend's activeBrand name
        const targetBrand = activeBrand?.brand_name || activeBrand?.name || user?.brand_name || currentBrandName
        list = await api.pendingAccounts(targetBrand)
      }
      const arr = Array.isArray(list) ? list : []
      setPendingAccounts(arr)
      if (typeof setPendingApprovalsCount === 'function') {
        setPendingApprovalsCount(arr.length)
      }
    } catch {
      // non-owner or network error
    } finally {
      setLoadingPending(false)
    }
  }

  const fetchWorkspaceMeta = async () => {
    try {
      const bName = activeBrand?.brand_name || activeBrand?.name || user?.brand_name || currentBrandName
      const res = await api.workspaceSettings(bName)
      if (res && res.brand_code) {
        setBrandMeta({
          brand_name: res.brand_name || bName,
          brand_values: res.brand_values !== undefined ? res.brand_values : '',
          brand_code: res.brand_code,
        })
        setSettings((prev) => ({
          ...prev,
          workspace: res.brand_name || bName,
        }))
        if (typeof updateActiveBrand === 'function') {
          updateActiveBrand({
            name: res.brand_name || bName,
            brand_name: res.brand_name || bName,
            code: res.brand_code,
            brand_code: res.brand_code,
            values: res.brand_values,
            brand_values: res.brand_values,
          })
        }
      }
    } catch {
      // offline / demo fallback: keep current brandMeta
    }
  }

  useEffect(() => {
    const targetBrand = activeBrand?.brand_name || activeBrand?.name || user?.brand_name || currentBrandName
    try {
      const stored = window.localStorage.getItem(getSettingsKey(targetBrand))
      if (stored) setSettings((prev) => ({ ...prev, ...JSON.parse(stored), workspace: targetBrand }))
    } catch {
      // ignore malformed local settings
    }
    fetchPending()
    fetchWorkspaceMeta()
    fetchTeamRoster()
  }, [activeBrand?.brand_name, activeBrand?.name, user?.username])

  const handleVerify = async (accountId, approve) => {
    try {
      setVerifyingId(accountId)
      const res = await api.verifyAccount({ account_id: accountId, approve })
      toast(res.message, approve ? 'good' : 'warn')
      await fetchPending()
      await fetchTeamRoster()
    } catch (err) {
      toast(err.message, 'warn')
    } finally {
      setVerifyingId(null)
    }
  }

  const updateSetting = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  const updateBrandMeta = (field, value) => {
    setBrandMeta((current) => ({ ...current, [field]: value }))
    if (field === 'brand_name') {
      setSettings((current) => ({ ...current, workspace: value }))
    }
    setSaved(false)
  }

  const generateNewCode = () => {
    const slug = (brandMeta.brand_name || activeBrand?.brand_name || 'BRAND')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 6)
      .toUpperCase() || 'BRAND'
    const rand = Math.floor(1000 + Math.random() * 9000)
    const newCode = `${slug}-${rand}`
    updateBrandMeta('brand_code', newCode)
    toast(`Generated unique brand code "${newCode}". Click "Save changes" to apply.`, 'good')
  }

  const copyBrandCode = () => {
    const code = brandMeta.brand_code || currentBrandCode || 'KLARITY-2026'
    navigator.clipboard.writeText(code)
    toast(`Brand Code "${code}" copied to clipboard!`, 'good')
  }

  const saveAll = async () => {
    try {
      setSaving(true)
      const targetBrandName = activeBrand?.brand_name || activeBrand?.name || brandMeta.brand_name || currentBrandName
      let savedMeta = { ...brandMeta }
      if (isOwner) {
        const res = await api.updateWorkspaceSettings({
          old_brand_name: targetBrandName,
          brand_name: brandMeta.brand_name.trim(),
          brand_code: brandMeta.brand_code.trim().toUpperCase(),
          brand_values: brandMeta.brand_values.trim(),
        })
        if (res?.brand_code) {
          savedMeta = {
            brand_name: res.brand_name || brandMeta.brand_name,
            brand_code: res.brand_code,
            brand_values: res.brand_values !== undefined ? res.brand_values : brandMeta.brand_values,
          }
          setBrandMeta(savedMeta)
        }
      }
      const savedKey = (savedMeta.brand_name || targetBrandName).toLowerCase().replace(/[^a-z0-9]/g, '_')
      window.localStorage.setItem(getSettingsKey(savedKey), JSON.stringify(settings))
      window.localStorage.setItem(getTeamKey(savedKey), JSON.stringify(team))

      if (typeof updateActiveBrand === 'function') {
        updateActiveBrand({
          old_brand_name: targetBrandName,
          name: savedMeta.brand_name,
          brand_name: savedMeta.brand_name,
          code: savedMeta.brand_code,
          brand_code: savedMeta.brand_code,
          values: savedMeta.brand_values,
          brand_values: savedMeta.brand_values,
        })
      }

      setSaved(true)
      toast(`Brand controls and unique code (${savedMeta.brand_code}) saved successfully.`, 'good')
    } catch (err) {
      toast(err.message || 'Failed to save settings.', 'warn')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-page brand-controls-page">
      {/* Top Header */}
      <section className="page-head">
        <div>
          <div style={{ marginBottom: '4px' }}>
            <h1 style={{ margin: 0 }}>Brand Owner Controls</h1>
          </div>
          <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: '13.5px' }}>
            Master workspace configuration, review thresholds, account verification, team roles, and privacy governance.
          </p>
        </div>

        <div className="page-head__actions">
          {/* Brand Code Quick Pill */}
          <div className="brand-code-quick-pill">
            <KeyRound size={14} className="brand-code-quick-pill__icon" />
            <span className="brand-code-quick-pill__label">Brand Code:</span>
            <strong className="brand-code-quick-pill__code">
              {brandMeta.brand_code || 'KLARITY-2026'}
            </strong>
            <button
              type="button"
              onClick={copyBrandCode}
              title="Copy Brand Code"
              className="brand-code-quick-pill__btn"
              aria-label="Copy Brand Code"
            >
              <Copy size={13} />
            </button>
          </div>

          {(saved || !isLead) && (
            <span className={cx('settings-saved', saved && 'is-saved')}>
              {saved ? <><Check size={14} /> Saved</> : 'Member view-only'}
            </span>
          )}

          {isLead ? (
            <Button icon={Save} onClick={saveAll} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--cream)',
                  border: '1px solid var(--line-strong)',
                  fontSize: '12px',
                  color: 'var(--muted)',
                  fontWeight: 600,
                }}
              >
                <Lock size={13} color="var(--sage)" />
                Governed by Brand Leads
              </span>
              <Button
                variant="secondary"
                icon={Save}
                onClick={() => {
                  try {
                    window.localStorage.setItem(getSettingsKey(brandMeta.brand_name || currentBrandName), JSON.stringify(settings))
                  } catch {}
                  setSaved(true)
                  toast('Personal notification preferences saved.', 'good')
                }}
              >
                Save preferences
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Main Two-Column Layout with Animated Side Navigation */}
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Brand controls sections" ref={navRef}>
          <div className="nav-highlight-pill" ref={pillRef} aria-hidden="true" />
          <a href="#brand-identity" className={cx(activeSection === 'brand-identity' && 'is-active')}>
            <Globe size={15} /> <span>Brand &amp; Workspace</span>
          </a>
          <a href="#review-defaults" className={cx(activeSection === 'review-defaults' && 'is-active')}>
            <SlidersHorizontal size={15} /> <span>Review Defaults</span>
          </a>
          <a href="#pending-approvals" className={cx(activeSection === 'pending-approvals' && 'is-active')}>
            <UserCheck size={15} />
            <span>Account Approvals</span>
            {pendingAccounts.length > 0 && (
              <span
                style={{
                  marginLeft: 'auto',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                }}
              >
                {pendingAccounts.length}
              </span>
            )}
          </a>
          <a href="#team-roster" className={cx(activeSection === 'team-roster' && 'is-active')}>
            <Users size={15} /> <span>Team &amp; Governance</span>
          </a>
          <a href="#role-visibility" className={cx(activeSection === 'role-visibility' && 'is-active')}>
            <ShieldAlert size={15} /> <span>Role Permissions</span>
          </a>
          <a href="#notifications" className={cx(activeSection === 'notifications' && 'is-active')}>
            <Bell size={15} /> <span>Notifications</span>
          </a>
          <a href="#ai-disclosure" className={cx(activeSection === 'ai-disclosure' && 'is-active')}>
            <ShieldCheck size={15} /> <span>AI &amp; Confidentiality</span>
          </a>
        </nav>

        <div className="settings-content">
          {/* Section 1: Brand & Workspace Identity */}
          <Panel className="settings-section" id="brand-identity">
            <SectionHead
              title="Brand Identity &amp; Workspace"
              description="The brand essence, security code, and domain identity attached to every review."
              action={
                isLead ? (
                  <Globe size={18} className="settings-section__icon" />
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11.5px',
                      color: 'var(--muted)',
                      background: 'var(--cream)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <Lock size={12} color="var(--sage)" />
                    Lead Exclusive
                  </span>
                )
              }
            />

            {!isLead && (
              <div className="lead-notice-banner">
                <Lock size={16} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Read-only access:</strong> Workspace creation, custom domain configuration, and governance defaults are restricted to <strong>Brand Owners and Reviewers</strong>. Team members work within their assigned workspace.
                </span>
              </div>
            )}

            <div className="settings-form">
              <div className="form-row form-row--two">
                <Field label="Brand / Workspace Name" htmlFor="ctrl-brand-name">
                  <input
                    id="ctrl-brand-name"
                    value={brandMeta.brand_name}
                    disabled={!isOwner}
                    onChange={(e) => updateBrandMeta('brand_name', e.target.value)}
                    style={!isOwner ? { cursor: 'not-allowed', background: 'var(--paper-deep)', opacity: 0.8 } : undefined}
                    placeholder="e.g. Acme Corp, Lumina Studios"
                  />
                </Field>

                <Field
                  label="Brand Access Code (Required for Sign-up)"
                  htmlFor="ctrl-brand-code"
                  hint="Unique workspace code shared with incoming team members and reviewers upon registration. Fully editable."
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      id="ctrl-brand-code"
                      className="brand-code-input"
                      value={brandMeta.brand_code}
                      disabled={!isOwner}
                      onChange={(e) => updateBrandMeta('brand_code', e.target.value.toUpperCase())}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        ...(!isOwner ? { cursor: 'not-allowed', background: 'var(--paper-deep)', opacity: 0.8 } : {}),
                      }}
                      placeholder="e.g. GNR-2026"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={copyBrandCode}
                      title="Copy code"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        lineHeight: 'normal',
                        padding: '0 16px',
                        flexShrink: 0,
                      }}
                    >
                      Copy
                    </Button>
                    {isOwner && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={generateNewCode}
                        title="Generate a new unique brand code"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          lineHeight: 'normal',
                          padding: '0 16px',
                          flexShrink: 0,
                        }}
                      >
                        Generate
                      </Button>
                    )}
                  </div>
                </Field>
              </div>

              <Field
                label="Core Brand Values &amp; Tenets"
                htmlFor="ctrl-brand-values"
                hint="Guiding principles used by the governance engine when evaluating tone and narrative alignment."
              >
                <input
                  id="ctrl-brand-values"
                  value={brandMeta.brand_values}
                  disabled={!isOwner}
                  onChange={(e) => updateBrandMeta('brand_values', e.target.value)}
                  style={!isOwner ? { cursor: 'not-allowed', background: 'var(--paper-deep)', opacity: 0.8 } : undefined}
                  placeholder="e.g. Authenticity, craft, sustainability, quiet confidence"
                />
              </Field>

              <div className="form-row form-row--two">
                <Field label="Brand Website" htmlFor="workspace-site">
                  <input
                    id="workspace-site"
                    value={settings.website}
                    disabled={!isLead}
                    onChange={(event) => updateSetting('website', event.target.value)}
                    style={!isLead ? { cursor: 'not-allowed', background: 'var(--paper-deep)', opacity: 0.8 } : undefined}
                    placeholder="e.g. asterandoak.studio"
                  />
                </Field>

                <Field label="Timezone" htmlFor="workspace-timezone">
                  <Select
                    id="workspace-timezone"
                    value={settings.timezone}
                    disabled={!isLead}
                    onChange={(val) => updateSetting('timezone', val)}
                    options={[
                      'Asia/Kolkata (GMT+5:30)',
                      'Europe/London (GMT+0)',
                      'America/New_York (GMT-5)',
                      'Asia/Singapore (GMT+8)',
                    ]}
                  />
                </Field>
              </div>

              <Field
                label="Default Reviewer"
                htmlFor="workspace-reviewer"
                hint={isLead ? 'New submissions are routed here first for compliance audit.' : 'Primary reviewer assigned to review your submissions.'}
              >
                <Select
                  id="workspace-reviewer"
                  value={settings.defaultReviewer}
                  disabled={!isLead}
                  onChange={(val) => updateSetting('defaultReviewer', val)}
                  options={[
                    'Ashwik Saxena',
                    'Maya Iyer',
                    'Maddi Abhinav',
                    'Kruthik Kamegaonkar',
                  ]}
                />
              </Field>
            </div>
          </Panel>

          {/* Section 2: Review Defaults */}
          <Panel className="settings-section" id="review-defaults">
            <SectionHead
              title="Review Defaults &amp; Quality Thresholds"
              description="How strict the workspace is by default. Individual rules can still override this."
              action={
                isLead ? (
                  <ShieldCheck size={18} className="settings-section__icon" />
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11.5px',
                      color: 'var(--muted)',
                      background: 'var(--cream)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <Lock size={12} color="var(--sage)" />
                    Lead Governed
                  </span>
                )
              }
            />

            <div className="settings-form">
              <Field
                label="Publish Clearance Threshold"
                htmlFor="workspace-threshold"
                hint={
                  isLead
                    ? 'A piece below this score needs explicit reviewer sign-off before it can be cleared for publish.'
                    : 'Minimum score required for automatic clearance (configured by Brand Leads).'
                }
              >
                <div className="threshold-field">
                  <div style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
                    <WakeSlider
                      value={Number(settings.threshold) || 85}
                      min={60}
                      max={95}
                      step={1}
                      bars={28}
                      height={36}
                      restHeight={8}
                      gap={3}
                      fillColor="var(--sage, #298EE4)"
                      trackColor="rgba(41, 142, 228, 0.15)"
                      disabled={!isLead}
                      readOnly={!isLead}
                      onChange={(val) => updateSetting('threshold', String(Math.round(val)))}
                      ariaLabel="Publish Clearance Threshold"
                    />
                  </div>
                  <span>
                    <strong>{settings.threshold}</strong>
                    <small>/100</small>
                  </span>
                </div>
              </Field>

              <div className="toggle-stack">
                <ToggleRow
                  label="Auto-assign new reviews"
                  description="Route a submission to the default reviewer as soon as the report is ready."
                  checked={settings.autoAssign}
                  disabled={!isLead}
                  onChange={(value) => updateSetting('autoAssign', value)}
                />
                <ToggleRow
                  label="Require evidence on critical findings"
                  description="A blocking issue cannot be overridden without a cited guideline or verifiable source."
                  checked={settings.requireEvidence}
                  disabled={!isLead}
                  onChange={(value) => updateSetting('requireEvidence', value)}
                />
              </div>
            </div>
          </Panel>

          {/* Section 3: Pending Verification & Approval Requests */}
          <Panel className="settings-section" id="pending-approvals">
            <SectionHead
              title="Pending Verification &amp; Approval Requests"
              description="Review incoming registration requests. Accounts cannot access workspace data until verified by the Brand Owner."
              action={
                pendingAccounts.length > 0 ? (
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: '10px',
                    }}
                  >
                    {pendingAccounts.length} waiting
                  </span>
                ) : (
                  <span
                    style={{
                      background: 'var(--good-soft, rgba(34, 197, 94, 0.15))',
                      color: 'var(--good-text, #15803d)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: '6px',
                    }}
                  >
                    All accounts cleared
                  </span>
                )
              }
            />

            {loadingPending ? (
              <div style={{ padding: '28px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                Checking for incoming registration requests…
              </div>
            ) : pendingAccounts.length === 0 ? (
              <div className="empty-approvals-box">
                <ShieldCheck size={26} color="var(--clay)" />
                <div>
                  <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>
                    No pending verification requests right now.
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                    When a new reviewer or creator signs up with your brand code (<code>{brandMeta.brand_code || 'KLARITY-2026'}</code>), their request will appear right here for your immediate Allow / Decline decision.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                {pendingAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="pending-account-card"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'rgba(169, 122, 50, 0.12)',
                          color: 'var(--clay-deep)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px',
                        }}
                      >
                        {acc.username ? acc.username.slice(0, 2).toUpperCase() : 'US'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>{acc.username}</strong>
                          <span
                            style={{
                              fontSize: '10.5px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: acc.role === 'reviewer' ? 'rgba(56, 189, 248, 0.14)' : 'rgba(169, 122, 50, 0.12)',
                              color: acc.role === 'reviewer' ? 'var(--sage)' : 'var(--clay-deep)',
                              border: acc.role === 'reviewer' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(169, 122, 50, 0.22)',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                            }}
                          >
                            Requested: {acc.role === 'reviewer' ? 'Reviewer' : 'Team Member'}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          {acc.email} · Validated Brand Code · Awaiting Owner Authorization
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={UserCheck}
                        disabled={verifyingId === acc.id}
                        onClick={() => handleVerify(acc.id, true)}
                        className="btn--good"
                      >
                        {verifyingId === acc.id ? 'Processing…' : 'Allow / Verify'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={UserX}
                        disabled={verifyingId === acc.id}
                        onClick={() => handleVerify(acc.id, false)}
                        style={{ color: '#dc2626' }}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Section 4: Team & Governance Hierarchy */}
          <Panel className="settings-section" id="team-roster">
            <SectionHead
              title="Team &amp; Governance Roster"
              description="Roles decide who can author, audit, and clear brand content for publication."
              action={
                isLead ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="brand-code-badge">
                      Brand Code: <strong>{brandMeta.brand_code || 'KLARITY-2026'}</strong>
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={UserPlus}
                      onClick={handleOpenInvite}
                    >
                      Invite member
                    </Button>
                  </div>
                ) : (
                  <span style={{ fontSize: '11.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--cream)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--line)' }}>
                    <ShieldCheck size={14} color="var(--sage)" />
                    Audited by Brand Leads
                  </span>
                )
              }
            />

            <div className="team-list" style={{ marginTop: '16px' }}>
              {team.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                  <Users size={28} style={{ opacity: 0.4, margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>
                    No team members on this brand yet
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                    Share your Brand Access Code (<code>{brandMeta.brand_code || 'KLARITY-2026'}</code>) with reviewers or team members to let them join.
                  </p>
                </div>
              ) : (
                team.map((member, index) => (
                  <div className="team-row" key={`${member.email}-${index}`}>
                    <Avatar name={member.name} />
                    <div className="team-row__identity">
                      <strong>{member.name}</strong>
                      <small>{member.email}</small>
                    </div>
                    <span className="team-row__role">{member.role}</span>
                    <span
                      className={cx(
                        'team-row__status',
                        member.status === 'Invited' && 'is-invited'
                      )}
                      style={member.status === 'Suspended' ? { color: '#dc2626' } : undefined}
                    >
                      <span style={member.status === 'Suspended' ? { background: '#dc2626' } : undefined} />
                      {member.status}
                    </span>
                    {isLead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenAudit(member, index)}
                      >
                        Audit
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="settings-note" style={{ marginTop: '16px' }}>
              <Workflow size={16} />
              <p>
                <strong>3-Stage Governance Hierarchy:</strong><br />
                <strong>1. Brand Owner / Lead:</strong> Exclusive authority to create workspaces, publish guidelines, verify users, and define thresholds.<br />
                <strong>2. Reviewer / Higher-up:</strong> Audits submissions, verifies guideline evidence, and approves or requests changes.<br />
                <strong>3. Team Member / Employee:</strong> Assigned to approved workspaces, runs pre-flight checks, and submits drafts. Cannot create or configure workspaces.
              </p>
            </div>
          </Panel>

          {/* Section 5: Role Viewability & Permission Governance */}
          <Panel className="settings-section" id="role-visibility">
            <SectionHead
              title="Role Viewability &amp; Permission Governance"
              description="Brand Owner controls: Determine exactly which screens, queues, and intelligence modules are visible to Reviewers (Admins) vs Team Members."
              action={<ShieldAlert size={18} className="settings-section__icon" />}
            />

            <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={16} color="var(--ink)" />
                <span style={{ fontSize: '12.5px', color: 'var(--ink)' }}>
                  <strong>Owner Power:</strong> You have absolute governance authority to toggle visibility. Toggles take effect live across workspace navigation and route access.
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Reviewer / Admin Visibility */}
              <div className="role-perm-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '13.5px', display: 'block', color: 'var(--ink)' }}>Reviewer (Admin)</strong>
                    <small style={{ color: 'var(--muted)', fontSize: '11px' }}>Compliance, audits &amp; approvals</small>
                  </div>
                  <span style={{ fontSize: '11px', background: 'var(--sage-soft)', color: 'var(--sage-deep)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>Reviewer Access</span>
                </div>
                <div className="toggle-stack toggle-stack--flush">
                  <ToggleRow
                    label="Executive Overview"
                    description="Access executive dashboard scores and volume metrics."
                    checked={visibilitySettings?.admin?.overview ?? true}
                    onChange={(val) => updateRoleVisibility('admin', 'overview', val)}
                  />
                  <ToggleRow
                    label="Creator Studio"
                    description="Authoring suite is exclusive to Stage 3 Team Members; reviewers and admins do not draft content."
                    checked={false}
                    disabled={true}
                    onChange={() => {}}
                  />
                  <ToggleRow
                    label="Reviews Queue"
                    description="Audit desk, filter all incoming pieces, and review history."
                    checked={visibilitySettings?.admin?.reviews ?? true}
                    onChange={(val) => updateRoleVisibility('admin', 'reviews', val)}
                  />
                  <ToggleRow
                    label="Calendar"
                    description="Content release and review schedule deadlines."
                    checked={visibilitySettings?.admin?.calendar ?? true}
                    onChange={(val) => updateRoleVisibility('admin', 'calendar', val)}
                  />
                  <ToggleRow
                    label="Guidelines Library"
                    description="Inspect and reference live brand rules."
                    checked={visibilitySettings?.admin?.guidelines ?? true}
                    onChange={(val) => updateRoleVisibility('admin', 'guidelines', val)}
                  />
                  <ToggleRow
                    label="Brand Assets"
                    description="Typography, palettes, logos, and approved tokens."
                    checked={visibilitySettings?.admin?.assets ?? true}
                    onChange={(val) => updateRoleVisibility('admin', 'assets', val)}
                  />
                  <ToggleRow
                    label="Governance Insights"
                    description="Heatmaps, issue distribution, and repeated violations."
                    checked={visibilitySettings?.admin?.insights ?? true}
                    onChange={(val) => updateRoleVisibility('admin', 'insights', val)}
                  />
                </div>
              </div>

              {/* Team Member Visibility */}
              <div className="role-perm-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '13.5px', display: 'block', color: 'var(--ink)' }}>Team Member</strong>
                    <small style={{ color: 'var(--muted)', fontSize: '11px' }}>Content authoring &amp; pre-flight checks</small>
                  </div>
                  <span style={{ fontSize: '11px', background: 'var(--cream)', color: 'var(--ink-soft)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>Member Access</span>
                </div>
                <div className="toggle-stack toggle-stack--flush">
                  <ToggleRow
                    label="Personal Overview"
                    description="View personal submission scorecard and progress."
                    checked={visibilitySettings?.member?.overview ?? true}
                    onChange={(val) => updateRoleVisibility('member', 'overview', val)}
                  />
                  <ToggleRow
                    label="Creator Studio"
                    description="Access Creator Studio editor and instant pre-flight checks."
                    checked={visibilitySettings?.member?.studio ?? true}
                    onChange={(val) => updateRoleVisibility('member', 'studio', val)}
                  />
                  <ToggleRow
                    label="My Submissions Queue"
                    description="View status and feedback on their own submitted pieces."
                    checked={visibilitySettings?.member?.reviews ?? true}
                    onChange={(val) => updateRoleVisibility('member', 'reviews', val)}
                  />
                  <ToggleRow
                    label="Editorial Calendar"
                    description="Visibility into upcoming launch deadlines and campaign dates."
                    checked={visibilitySettings?.member?.calendar ?? false}
                    onChange={(val) => updateRoleVisibility('member', 'calendar', val)}
                  />
                  <ToggleRow
                    label="Guidelines Library"
                    description="Reference brand guidelines for tone, lexicon, and claims."
                    checked={visibilitySettings?.member?.guidelines ?? true}
                    onChange={(val) => updateRoleVisibility('member', 'guidelines', val)}
                  />
                  <ToggleRow
                    label="Brand Assets"
                    description="Download approved logos, palette tokens, and typography."
                    checked={visibilitySettings?.member?.assets ?? true}
                    onChange={(val) => updateRoleVisibility('member', 'assets', val)}
                  />
                  <ToggleRow
                    label="Governance Insights"
                    description="Access high-level analytics, violation heatmaps, and trends."
                    checked={visibilitySettings?.member?.insights ?? false}
                    onChange={(val) => updateRoleVisibility('member', 'insights', val)}
                  />
                  <ToggleRow
                    label="Brand Controls"
                    description="Allow team member to inspect workspace governance defaults."
                    checked={visibilitySettings?.member?.brandControls ?? false}
                    onChange={(val) => updateRoleVisibility('member', 'brandControls', val)}
                  />
                </div>
              </div>
            </div>
          </Panel>

          {/* Section 6: Notifications & Alerts */}
          <Panel className="settings-section" id="notifications">
            <SectionHead
              title="Notifications &amp; Alerts"
              description="What the team hears about, and where."
              action={<Bell size={18} className="settings-section__icon" />}
            />
            <div className="toggle-stack toggle-stack--flush">
              <ToggleRow
                label="Weekly governance digest"
                description="A Monday summary of scores, open issues, and the guidelines doing the most work."
                checked={settings.weeklyDigest}
                onChange={(value) => updateSetting('weeklyDigest', value)}
              />
              <ToggleRow
                label="Review assigned to me"
                description="An email when a new report is routed to your queue."
                checked={settings.assignedEmails}
                onChange={(value) => updateSetting('assignedEmails', value)}
              />
              <ToggleRow
                label="Mentions in reviewer notes"
                description="Notify me when someone names me in a decision comment."
                checked={settings.mentions}
                onChange={(value) => updateSetting('mentions', value)}
              />
              <ToggleRow
                label="Slack digest"
                description="Post the daily review summary into #brand-governance."
                checked={settings.slack}
                onChange={(value) => updateSetting('slack', value)}
              />
            </div>
          </Panel>

          {/* Section 7: AI Transparency & Confidentiality */}
          <Panel className="settings-section" id="ai-disclosure">
            <SectionHead
              title="AI Transparency &amp; Confidentiality"
              description="Privacy controls, zero-retention guarantees, and ethical AI disclosures."
              action={<ShieldCheck size={18} className="settings-section__icon" />}
            />
            <div className="toggle-stack toggle-stack--flush">
              <ToggleRow
                label="Zero Data Retention (ZDR)"
                description="Content evaluated in Klarity is never used for training foundational models or retained by third parties."
                checked={settings.zeroDataRetention ?? true}
                onChange={(value) => updateSetting('zeroDataRetention', value)}
              />
              <ToggleRow
                label="Confidential Material Masking"
                description="Automatically redact unreleased codenames, customer PII, and financial figures before pre-flight analysis."
                checked={settings.confidentialMasking ?? true}
                onChange={(value) => updateSetting('confidentialMasking', value)}
              />
              <ToggleRow
                label="Disclose AI Review Watermark"
                description="Clearly disclose on review reports that content was evaluated with Klarity's hybrid rule-based and AI pipeline."
                checked={settings.discloseAi ?? true}
                onChange={(value) => updateSetting('discloseAi', value)}
              />
            </div>
            <div className="settings-note">
              <ShieldCheck size={16} />
              <p>
                <strong>Architecture Disclosure:</strong> Klarity uses a hybrid evaluation engine combining deterministic AST rule-checking (for terminology, facts, and WCAG accessibility) with localized RAG for tone nuances. All decisions remain strictly human-controlled.
              </p>
            </div>
          </Panel>

          {/* Clean Slate & Data Management */}
          {isOwner && (
            <Panel
              title="Workspace Data Management"
              badge="Owner Only"
              description="Manage sample submissions and reset to a clean slate."
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '12px 0' }}>
                <div>
                  <strong style={{ fontSize: '13.5px', color: 'var(--ink)' }}>Clean Submissions Queue</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
                    Clear all sample/demo review submissions to start with a fresh, empty workspace for {activeBrand?.brand_name || 'your brand'}.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={clearingWorkspace}
                  onClick={handleClearWorkspace}
                  style={{ flexShrink: 0, color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.3)' }}
                >
                  {clearingWorkspace ? 'Clearing…' : 'Clear Sample Submissions'}
                </Button>
              </div>
            </Panel>
          )}

          {/* Page Footer */}
          <div className="settings-foot">
            <div>
              <Mail size={15} />
              <span>Questions? The workspace owner is {currentUser || user?.username || 'Owner'}.</span>
            </div>
            <span className="settings-foot__version">
              <Clock3 size={14} /> Klarity v0.1 · Brand Controls
            </span>
          </div>
        </div>
      </div>

      {/* Audit Member Drawer */}
      <Drawer
        open={Boolean(auditTarget)}
        onClose={() => setAuditTarget(null)}
        title={auditTarget ? `Audit: ${auditTarget.name}` : 'Audit Member'}
        description="Audit and modify member credentials, governance stage, and account standing."
        width="540px"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Button
              type="button"
              variant="ghost"
              icon={Trash2}
              onClick={handleDeleteMember}
              style={{ color: '#dc2626' }}
            >
              Remove member
            </Button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="button" variant="ghost" onClick={() => setAuditTarget(null)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" icon={Save} onClick={handleSaveAudit}>
                Save changes
              </Button>
            </div>
          </div>
        }
      >
        {auditTarget && (
          <form onSubmit={handleSaveAudit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: 'var(--cream)', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <Avatar name={auditForm.name || auditTarget.name} size="lg" />
              <div>
                <strong style={{ fontSize: '15px', color: 'var(--ink)', display: 'block' }}>{auditForm.name || auditTarget.name}</strong>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{auditForm.email || auditTarget.email}</span>
              </div>
            </div>

            <Field label="Full Name" htmlFor="audit-name">
              <input
                id="audit-name"
                value={auditForm.name}
                onChange={(e) => setAuditForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Member full name"
              />
            </Field>

            <Field label="Email Address" htmlFor="audit-email">
              <input
                id="audit-email"
                type="email"
                value={auditForm.email}
                onChange={(e) => setAuditForm((prev) => ({ ...prev, email: e.target.value }))}
                required
                placeholder="member@asterandoak.studio"
              />
            </Field>

            <Field
              label="Governance Role & Stage"
              htmlFor="audit-role"
              hint={
                auditForm.role.includes('Stage 1')
                  ? 'Full executive authority: can configure brand settings, create guidelines, and approve access.'
                  : auditForm.role.includes('Stage 2')
                  ? 'Compliance authority: audits submissions, validates guideline evidence, and clears reviews.'
                  : 'Authoring authority: uses Creator Studio to draft content and run pre-flight checks.'
              }
            >
              <Select
                id="audit-role"
                value={auditForm.role}
                onChange={(val) => setAuditForm((prev) => ({ ...prev, role: val }))}
                options={roleOptions}
              />
            </Field>

            <Field label="Account Status" htmlFor="audit-status" hint="Active members can access the workspace immediately; Invited requires onboarding.">
              <Select
                id="audit-status"
                value={auditForm.status}
                onChange={(val) => setAuditForm((prev) => ({ ...prev, status: val }))}
                options={statusOptions}
              />
            </Field>
          </form>
        )}
      </Drawer>

      {/* Invite Member Drawer */}
      <Drawer
        open={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite & Add Team Member"
        description="Directly add a new team member or reviewer to the brand workspace roster."
        width="540px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
            <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" icon={UserPlus} onClick={handleAddMember}>
              Add member to roster
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Field label="Full Name" htmlFor="invite-name" hint="Display name across reviews, guidelines, and audit logs.">
            <input
              id="invite-name"
              value={inviteForm.name}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              placeholder="e.g. Priya Sharma"
              autoFocus
            />
          </Field>

          <Field label="Email Address" htmlFor="invite-email" hint="Login email address used to authenticate into Klarity.">
            <input
              id="invite-email"
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
              required
              placeholder="e.g. priya@asterandoak.studio"
            />
          </Field>

          <Field
            label="Governance Role"
            htmlFor="invite-role"
            hint="Brand Owners configure brand specs, Reviewers audit & inspect, Team Members draft in Creator Studio."
          >
            <Select
              id="invite-role"
              value={inviteForm.role}
              onChange={(val) => setInviteForm((prev) => ({ ...prev, role: val }))}
              options={roleOptions}
            />
          </Field>

          <Field label="Initial Account Status" htmlFor="invite-status">
            <Select
              id="invite-status"
              value={inviteForm.status}
              onChange={(val) => setInviteForm((prev) => ({ ...prev, status: val }))}
              options={statusOptions}
            />
          </Field>

          <div className="invite-brand-code-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={15} className="brand-code-quick-pill__icon" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>Brand Access Code</span>
              </div>
              <code className="brand-code-quick-pill__code">
                {brandMeta.brand_code || 'KLARITY-2026'}
              </code>
            </div>
            <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--muted)', lineHeight: 1.45 }}>
              Once added, the member can immediately sign in using this email and Brand Access Code.
            </p>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
