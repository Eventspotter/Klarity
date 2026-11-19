import { useEffect, useState } from 'react'
import {
  Check,
  Clock,
  Copy,
  Edit3,
  Globe,
  KeyRound,
  Lock,
  Save,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  Workflow,
  X,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Avatar, Button, Field, Panel, SectionHead } from '../components/UI'
import { api } from '../lib/api'
import { cx } from '../lib/utils'

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

const defaultTeam = [
  { name: 'Ashwik Saxena (Topper)', email: 'ashwik@topper', role: 'Stage 1 · Brand Owner', status: 'Active' },
  { name: 'Kruthik Kamegaonkar', email: 'kruthik@localhost5000.dev', role: 'Stage 1 · Brand Owner', status: 'Active' },
  { name: 'Maddi Abhinav', email: 'abhinav@localhost5000.dev', role: 'Stage 2 · Reviewer', status: 'Active' },
  { name: 'Maya Iyer', email: 'maya@asterandoak.studio', role: 'Stage 2 · Reviewer', status: 'Active' },
  { name: 'G N Sreekar', email: 'sreekar@localhost5000.dev', role: 'Stage 3 · Team Member', status: 'Active' },
  { name: 'Rohan Mehta', email: 'rohan@asterandoak.studio', role: 'Stage 3 · Team Member', status: 'Invited' },
]

export function BrandControls() {
  const { toast, currentUser, isOwner, visibilitySettings, updateRoleVisibility, setPendingApprovalsCount } = useApp()

  const [pendingAccounts, setPendingAccounts] = useState([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [verifyingId, setVerifyingId] = useState(null)

  const [brandMeta, setBrandMeta] = useState({
    brand_name: 'Aster & Oak',
    brand_values: 'Authenticity, craft, sustainability, quiet confidence',
    brand_code: 'KLARITY-2026',
  })
  const [isEditingBrand, setIsEditingBrand] = useState(false)
  const [editBrandName, setEditBrandName] = useState('Aster & Oak')
  const [editBrandCode, setEditBrandCode] = useState('KLARITY-2026')
  const [editBrandValues, setEditBrandValues] = useState('Authenticity, craft, sustainability, quiet confidence')
  const [savingBrand, setSavingBrand] = useState(false)

  const fetchPending = async () => {
    try {
      setLoadingPending(true)
      const list = await api.pendingAccounts()
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
      const res = await api.workspaceSettings()
      if (res?.brand_code) {
        setBrandMeta(res)
        setEditBrandName(res.brand_name || 'Aster & Oak')
        setEditBrandCode(res.brand_code || 'KLARITY-2026')
        setEditBrandValues(res.brand_values || '')
      }
    } catch {
      api.brandCodeHint().then((res) => {
        if (res?.brand_code) {
          setBrandMeta((prev) => ({ ...prev, ...res }))
          setEditBrandName(res.brand_name || 'Aster & Oak')
          setEditBrandCode(res.brand_code || 'KLARITY-2026')
        }
      }).catch(() => {})
    }
  }

  useEffect(() => {
    fetchPending()
    fetchWorkspaceMeta()
  }, [])

  const handleVerify = async (accountId, approve) => {
    try {
      setVerifyingId(accountId)
      const res = await api.verifyAccount({ account_id: accountId, approve })
      toast(res.message, approve ? 'good' : 'warn')
      await fetchPending()
    } catch (err) {
      toast(err.message, 'warn')
    } finally {
      setVerifyingId(null)
    }
  }

  const handleSaveBrand = async (e) => {
    e.preventDefault()
    try {
      setSavingBrand(true)
      const res = await api.updateWorkspaceSettings({
        brand_name: editBrandName,
        brand_code: editBrandCode,
        brand_values: editBrandValues,
      })
      setBrandMeta({
        brand_name: res.brand_name,
        brand_code: res.brand_code,
        brand_values: res.brand_values,
      })
      setIsEditingBrand(false)
      toast('Workspace brand identity & security code updated successfully!', 'good')
    } catch (err) {
      toast(err.message, 'warn')
    } finally {
      setSavingBrand(false)
    }
  }

  const copyBrandCode = () => {
    const code = brandMeta.brand_code || 'KLARITY-2026'
    navigator.clipboard.writeText(code)
    toast(`Brand Code "${code}" copied to clipboard!`, 'good')
  }

  return (
    <div className="brand-controls-page" style={{ maxWidth: '1160px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Page Header */}
      <section className="page-head" style={{ marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0 }}>Brand Owner Command &amp; Access Controls</h1>
            <span
              style={{
                fontSize: '11px',
                padding: '3px 9px',
                borderRadius: '12px',
                background: 'var(--clay)',
                color: '#fff',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Owner Exclusive
            </span>
          </div>
          <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: '13.5px' }}>
            Authorize incoming reviewer/creator sign-ups, govern brand access credentials, and audit workspace governance permissions.
          </p>
        </div>
        <div className="page-head__actions">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: '#ffffff',
              border: '1px solid var(--line-strong)',
              borderRadius: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            }}
          >
            <KeyRound size={14} color="var(--clay)" />
            <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Brand Code:</span>
            <strong style={{ fontFamily: 'monospace', letterSpacing: '0.05em', color: 'var(--clay-deep)', fontSize: '13px' }}>
              {brandMeta.brand_code || 'KLARITY-2026'}
            </strong>
            <button
              type="button"
              onClick={copyBrandCode}
              title="Copy Brand Code"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--ink-soft)',
                borderRadius: '4px',
              }}
            >
              <Copy size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* Primary Brand Command Identity Card */}
      <Panel className="settings-section" style={{ marginBottom: '24px' }}>
        <SectionHead
          title="Brand Identity &amp; Access Credentials"
          description="The secret brand code is required by all incoming team members and reviewers upon registration."
          action={
            <Button
              size="sm"
              variant={isEditingBrand ? 'ghost' : 'secondary'}
              icon={isEditingBrand ? X : Edit3}
              onClick={() => setIsEditingBrand(!isEditingBrand)}
            >
              {isEditingBrand ? 'Cancel' : 'Edit Brand & Code'}
            </Button>
          }
        />

        {isEditingBrand ? (
          <form onSubmit={handleSaveBrand} style={{ marginTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <Field label="Brand / Workspace Name" htmlFor="ctrl-brand-name">
                <input
                  id="ctrl-brand-name"
                  type="text"
                  value={editBrandName}
                  onChange={(e) => setEditBrandName(e.target.value)}
                  required
                />
              </Field>

              <Field label="Brand Access Code (Required for Sign-up)" htmlFor="ctrl-brand-code">
                <input
                  id="ctrl-brand-code"
                  type="text"
                  value={editBrandCode}
                  onChange={(e) => setEditBrandCode(e.target.value.toUpperCase())}
                  required
                  placeholder="e.g. KLARITY-2026"
                  style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--clay-deep)' }}
                />
              </Field>

              <Field label="Core Brand Values &amp; Tenets" htmlFor="ctrl-brand-values">
                <input
                  id="ctrl-brand-values"
                  type="text"
                  value={editBrandValues}
                  onChange={(e) => setEditBrandValues(e.target.value)}
                  placeholder="e.g. Authenticity, craft, sustainability"
                />
              </Field>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="submit" size="sm" variant="primary" icon={Save} disabled={savingBrand}>
                {savingBrand ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditingBrand(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginTop: '16px',
              padding: '16px',
              background: 'var(--cream)',
              borderRadius: '8px',
              border: '1px solid var(--line)',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Active Workspace</span>
              <p style={{ margin: '4px 0 0', fontWeight: 700, color: 'var(--ink)', fontSize: '14.5px' }}>
                {brandMeta.brand_name || 'Aster & Oak'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Security Access Code</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <code style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clay-deep)', background: '#fff', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--line)' }}>
                  {brandMeta.brand_code || 'KLARITY-2026'}
                </code>
                <button
                  type="button"
                  onClick={copyBrandCode}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--muted)' }}
                  title="Copy code"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Core Tenets &amp; Brand Values</span>
              <p style={{ margin: '4px 0 0', color: 'var(--ink-soft)', fontSize: '13px' }}>
                {brandMeta.brand_values || 'Authenticity, craft, sustainability, quiet confidence'}
              </p>
            </div>
          </div>
        )}
      </Panel>

      {/* Pending Account Verification & Approval Center */}
      <Panel className="settings-section" style={{ marginBottom: '24px' }}>
        <SectionHead
          title="Pending Verification & Approval Requests"
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
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#15803d',
                  fontSize: '11.5px',
                  fontWeight: 600,
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
          <div
            style={{
              padding: '24px 20px',
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '8px',
              border: '1px dashed var(--line-strong)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginTop: '16px',
            }}
          >
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  padding: '14px 18px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid var(--line-strong)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
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
                    {acc.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>{acc.username}</strong>
                      <span
                        style={{
                          fontSize: '10.5px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: acc.role === 'reviewer' ? 'rgba(41, 142, 228, 0.12)' : 'rgba(169, 122, 50, 0.12)',
                          color: acc.role === 'reviewer' ? '#1d4ed8' : 'var(--clay-deep)',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        Requested: {acc.role === 'reviewer' ? 'Stage 2 · Reviewer' : 'Stage 3 · Team Member'}
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
                    style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
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

      {/* Accessible Role Viewability Matrix */}
      <Panel className="settings-section" style={{ marginBottom: '24px' }}>
        <SectionHead
          title="Role Viewability &amp; Permission Governance"
          description="Brand Owner controls: Determine exactly which screens, queues, and intelligence modules are visible to Reviewers (Admins) vs Team Members."
          action={<ShieldAlert size={18} className="settings-section__icon" />}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '16px' }}>
          {/* Reviewer / Admin Visibility */}
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '12px' }}>
              <div>
                <strong style={{ fontSize: '13.5px', display: 'block', color: 'var(--ink)' }}>Stage 2 · Reviewer (Admin)</strong>
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
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '12px' }}>
              <div>
                <strong style={{ fontSize: '13.5px', display: 'block', color: 'var(--ink)' }}>Stage 3 · Team Member</strong>
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
                label="Workspace Settings"
                description="Allow team member to inspect workspace configuration."
                checked={visibilitySettings?.member?.settings ?? false}
                onChange={(val) => updateRoleVisibility('member', 'settings', val)}
              />
            </div>
          </div>
        </div>
      </Panel>

      {/* Team Governance Hierarchy */}
      <Panel className="settings-section">
        <SectionHead
          title="Active Workspace Governance Roster"
          description="Members authorized to inspect, review, or submit content under the Aster & Oak brand."
          action={
            <Button
              variant="secondary"
              size="sm"
              icon={UserPlus}
              onClick={() => toast(`Share Brand Value Code "${brandMeta.brand_code || 'KLARITY-2026'}" with new team members.`, 'info')}
            >
              Invite member
            </Button>
          }
        />

        <div className="team-list" style={{ marginTop: '16px' }}>
          {defaultTeam.map((member) => (
            <div className="team-row" key={member.email}>
              <Avatar name={member.name} />
              <div className="team-row__identity">
                <strong>{member.name}</strong>
                <small>{member.email}</small>
              </div>
              <span className="team-row__role">{member.role}</span>
              <span className={cx('team-row__status', member.status === 'Invited' && 'is-invited')}>
                <span /> {member.status}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast(`Role governance audited for ${member.name.split(' ')[0]}.`, 'info')}
              >
                Audit
              </Button>
            </div>
          ))}
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
    </div>
  )
}
