import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  EyeOff,
  FileCheck2,
  KeyRound,
  Lock,
  Mail,
  ShieldAlert,
  Sparkles,
  User,
} from 'lucide-react'
import { BrandMark } from '../components/BrandMark'
import { useApp } from '../context/AppContext'
import { api, setStoredToken } from '../lib/api'

export function Login() {
  const { user, data, authenticate } = useApp()
  const [register, setRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('owner')
  const [brandCode, setBrandCode] = useState('')
  const [brandName, setBrandName] = useState('Aster & Oak')
  const [brandValues, setBrandValues] = useState('Authenticity, craft, sustainability, quiet confidence')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [pendingNotice, setPendingNotice] = useState(false)
  const [availableBrands, setAvailableBrands] = useState([])

  // OTP state
  const [otpStep, setOtpStep] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpFromEmail, setOtpFromEmail] = useState('goklarity@gmail.com')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [otpBusy, setOtpBusy] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [otpSuccess, setOtpSuccess] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef([])

  useEffect(() => {
    api.listBrands().then(res => {
      if (res?.brands) setAvailableBrands(res.brands)
    }).catch(() => {})
  }, [])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  if (user && data) return <Navigate to="/" replace />

  const isAdmin = role === 'owner'

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setSuccessMsg('')
    setPendingNotice(false)

    try {
      if (register) {
        const res = await api.register({
          username,
          email,
          password,
          role,
          brand_code: isAdmin ? undefined : brandCode,
          brand_name: isAdmin ? brandName : undefined,
          brand_values: isAdmin ? brandValues : undefined,
        })

        if (res?.is_approved) {
          setSuccessMsg(`Admin account "${username}" created successfully! You can sign in below.`)
          setPendingNotice(false)
        } else {
          setSuccessMsg(`Brand Value Code verified! Your ${role === 'reviewer' ? 'Reviewer' : 'Team Member'} account registration is submitted.`)
          setPendingNotice(true)
        }
        setRegister(false)
        setPassword('')
      } else {
        // Step 1: Send credentials → server validates and sends OTP
        const res = await api.login({ identifier: email.trim(), password })
        if (res?.otp_required) {
          setOtpEmail(res.email)
          setOtpFromEmail(res.from_email || 'goklarity@gmail.com')
          setOtpStep(true)
          setOtpDigits(['', '', '', '', '', ''])
          setOtpError('')
          setOtpSuccess('')
          setResendCooldown(30)
          // Auto-focus first input
          setTimeout(() => inputRefs.current[0]?.focus(), 100)
        } else if (res?.token) {
          // Direct login (no OTP required — fallback)
          setStoredToken(res.token)
          await authenticate('me', {})
        }
      }
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  // Handle OTP digit input
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // Only digits
    const newDigits = [...otpDigits]
    
    if (value.length > 1) {
      // Handle paste: distribute digits across inputs
      const digits = value.replace(/\D/g, '').slice(0, 6 - index)
      digits.split('').forEach((d, i) => {
        if (index + i < 6) newDigits[index + i] = d
      })
      setOtpDigits(newDigits)
      const nextIdx = Math.min(index + digits.length, 5)
      inputRefs.current[nextIdx]?.focus()
      return
    }

    newDigits[index] = value
    setOtpDigits(newDigits)

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!paste) return
    const newDigits = [...otpDigits]
    paste.split('').forEach((d, i) => {
      if (i < 6) newDigits[i] = d
    })
    setOtpDigits(newDigits)
    const focusIdx = Math.min(paste.length, 5)
    inputRefs.current[focusIdx]?.focus()
  }

  // Submit OTP verification
  const submitOtp = async () => {
    const code = otpDigits.join('')
    if (code.length !== 6) {
      setOtpError('Please enter all 6 digits.')
      return
    }
    setOtpBusy(true)
    setOtpError('')
    setOtpSuccess('')

    try {
      const res = await api.verifyOtp({ email: otpEmail, otp: code })
      if (res?.token) {
        setOtpSuccess('Verified! Signing you in...')
        setStoredToken(res.token)
        // Small delay for the success animation
        setTimeout(async () => {
          try {
            const me = await api.me()
            const bootstrap = await api.bootstrap()
            // Force page reload to pick up the new session
            window.location.reload()
          } catch {
            window.location.reload()
          }
        }, 800)
      }
    } catch (failure) {
      setOtpError(failure.message)
      setOtpDigits(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } finally {
      setOtpBusy(false)
    }
  }

  // Auto-submit when all digits filled
  useEffect(() => {
    if (otpStep && otpDigits.every(d => d !== '') && !otpBusy) {
      submitOtp()
    }
  }, [otpDigits, otpStep])

  // Resend OTP
  const resendOtp = async () => {
    if (resendCooldown > 0) return
    setOtpBusy(true)
    setOtpError('')
    try {
      await api.resendOtp({ email: otpEmail })
      setOtpSuccess('New code sent! Check your inbox.')
      setResendCooldown(30)
      setOtpDigits(['', '', '', '', '', ''])
      setTimeout(() => {
        setOtpSuccess('')
        inputRefs.current[0]?.focus()
      }, 2000)
    } catch (failure) {
      setOtpError(failure.message)
    } finally {
      setOtpBusy(false)
    }
  }

  // Cancel OTP → go back to login form
  const cancelOtp = () => {
    setOtpStep(false)
    setOtpEmail('')
    setOtpDigits(['', '', '', '', '', ''])
    setOtpError('')
    setOtpSuccess('')
    setPassword('')
  }

  // ─── OTP Verification Screen ──────────────────────────────────────
  if (otpStep) {
    return (
      <div className="login-page">
        <div className="login-nav">
          <Link to="/hero" className="login-back-link">
            <ArrowLeft size={16} />
            Back to Product Overview
          </Link>
        </div>
        <div className="login-container">
          <div className="login-card" style={{ maxWidth: '480px' }}>
            <div className="login-card__header">
              <Link to="/hero" className="login-brand">
                <BrandMark size={42} />
                <span className="login-brand__name">Klarity</span>
              </Link>
              <h1 className="login-title">Sign in to your workspace</h1>
              <p className="login-subtitle">Enter your username or email and password.</p>
            </div>

            <div style={{
              background: 'var(--paper)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              marginBottom: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <KeyRound size={18} color="var(--sage)" />
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>
                  Enter Verification Code
                </h2>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.4 }}>
                Check your inbox for the 6-digit OTP code sent from{' '}
                <strong style={{ color: 'var(--ink)' }}>{otpFromEmail}</strong>
              </p>

              <p style={{
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: '6px',
              }}>
                ENTER 6-DIGIT CODE
              </p>
              <p style={{
                textAlign: 'center',
                fontSize: '13px',
                color: 'var(--muted)',
                marginBottom: '16px',
              }}>
                Sent to <strong style={{ color: 'var(--ink)' }}>{otpEmail}</strong>
              </p>

              {/* OTP Input Boxes */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '10px',
                  marginBottom: '16px',
                }}
                onPaste={handleOtpPaste}
              >
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    disabled={otpBusy}
                    style={{
                      width: '48px',
                      height: '56px',
                      textAlign: 'center',
                      fontSize: '22px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      border: `2px solid ${otpError ? '#ef4444' : otpSuccess ? '#16a34a' : digit ? 'var(--sage)' : 'var(--line-strong)'}`,
                      borderRadius: '12px',
                      background: otpSuccess ? '#f0fdf4' : 'var(--surface)',
                      color: 'var(--ink)',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
                      boxShadow: digit ? '0 0 0 3px rgba(45,90,61,0.08)' : 'none',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'var(--sage)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(45,90,61,0.12)'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = digit ? 'var(--sage)' : 'var(--line-strong)'
                      e.target.style.boxShadow = digit ? '0 0 0 3px rgba(45,90,61,0.08)' : 'none'
                    }}
                  />
                ))}
              </div>

              <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)', margin: '0 0 16px' }}>
                Enter the 6-digit code above to proceed.
              </p>

              {otpError && (
                <div className="login-alert-error" role="alert" style={{ marginBottom: '12px' }}>
                  <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div style={{ fontSize: '13px' }}>{otpError}</div>
                </div>
              )}

              {otpSuccess && (
                <div className="login-alert-success" role="status" style={{ marginBottom: '12px' }}>
                  <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px', color: '#16a34a' }} />
                  <div style={{ fontSize: '13px' }}>{otpSuccess}</div>
                </div>
              )}

              {/* Resend + Cancel buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={resendCooldown > 0 || otpBusy}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? 'var(--muted)' : 'var(--sage)',
                    cursor: resendCooldown > 0 ? 'default' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '4px 0',
                    textDecoration: resendCooldown > 0 ? 'none' : 'underline',
                  }}
                >
                  {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={cancelOtp}
                  disabled={otpBusy}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '4px 0',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Normal Login / Register Form ─────────────────────────────────
  return (
    <div className="login-page">
      <div className="login-nav">
        <Link to="/hero" className="login-back-link">
          <ArrowLeft size={16} />
          Back to Product Overview
        </Link>
      </div>
      <div className="login-container">
        <div className="login-card" style={{ maxWidth: register ? '540px' : '480px' }}>
          <div className="login-card__header">
            <Link to="/hero" className="login-brand">
              <BrandMark size={42} />
              <span className="login-brand__name">Klarity</span>
            </Link>
            <h1 className="login-title">{register ? 'Create your account' : 'Sign in to your workspace'}</h1>
            <p className="login-subtitle">
              {register
                ? isAdmin
                  ? 'Define brand identity & core values to create a new workspace.'
                  : 'Join an existing workspace using your organization brand code.'
                : 'Enter your username or email and password.'}
            </p>
          </div>

          {successMsg && (
            <div className="login-alert-success" role="status" style={{ marginBottom: '18px' }}>
              {pendingNotice ? (
                <Clock size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#b45309' }} />
              ) : (
                <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#16a34a' }} />
              )}
              <div>
                <strong>{pendingNotice ? 'Pending Admin / Owner Verification' : 'Registration Complete'}</strong>
                <div style={{ marginTop: '2px', fontSize: '12.5px' }}>{successMsg}</div>
                {pendingNotice && (
                  <div style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--muted)' }}>
                    Your account needs to be verified by a Brand Owner/Admin before you can log in.
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="login-alert-error" role="alert" style={{ marginBottom: '18px' }}>
              <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          <form className="login-form" onSubmit={submit}>
            {register && (
              <div className="login-field">
                <label>Account Role &amp; Permission Tier</label>
                <div className="login-role-selector">
                  <button
                    type="button"
                    className={`login-role-card ${role === 'owner' ? 'is-active' : ''}`}
                    onClick={() => setRole('owner')}
                  >
                    <div className="login-role-card__header">
                      <Crown size={14} color={role === 'owner' ? 'var(--sage)' : 'var(--muted)'} />
                      <span>Admin</span>
                    </div>
                    <small>Stage 1 · Creates Workspace</small>
                  </button>
                  <button
                    type="button"
                    className={`login-role-card ${role === 'reviewer' ? 'is-active' : ''}`}
                    onClick={() => setRole('reviewer')}
                  >
                    <div className="login-role-card__header">
                      <FileCheck2 size={14} color={role === 'reviewer' ? 'var(--sage)' : 'var(--muted)'} />
                      <span>Reviewer</span>
                    </div>
                    <small>Stage 2 · Editorial Auditor</small>
                  </button>
                  <button
                    type="button"
                    className={`login-role-card ${role === 'member' ? 'is-active' : ''}`}
                    onClick={() => setRole('member')}
                  >
                    <div className="login-role-card__header">
                      <User size={14} color={role === 'member' ? 'var(--sage)' : 'var(--muted)'} />
                      <span>User</span>
                    </div>
                    <small>Stage 3 · Team Member</small>
                  </button>
                </div>
              </div>
            )}

            {register && (
              <div className="login-field">
                <label htmlFor="username">Username</label>
                <div className="login-input-wrap">
                  <User size={16} className="login-input-icon" />
                  <input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    minLength={3}
                    maxLength={80}
                    pattern="[a-zA-Z0-9_.-]+"
                    placeholder="e.g. alex_brand"
                    required
                  />
                </div>
              </div>
            )}

            <div className="login-field">
              <label htmlFor="login-email">{register ? 'Email' : 'Username or email'}</label>
              <div className="login-input-wrap">
                <Mail size={16} className="login-input-icon" />
                <input
                  id="login-email"
                  type={register ? 'email' : 'text'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete={register ? 'email' : 'username'}
                  maxLength={254}
                  placeholder={register ? 'you@company.com' : 'username or email'}
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Password</label>
              <div className="login-input-wrap">
                <Lock size={16} className="login-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  minLength={register ? 8 : 1}
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  className="login-pw-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {register && <small>Use at least 8 characters.</small>}
            </div>

            {/* BRAND VALUE CODE: Required for User & Reviewer */}
            {register && !isAdmin && (
              <div className="login-field" style={{ background: 'var(--paper)', border: '1px solid var(--line-strong)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label htmlFor="brand-code" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <KeyRound size={13} color="var(--sage)" />
                    Brand Value Code
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', background: 'var(--cream)', padding: '2px 6px', borderRadius: '4px' }}>
                    Ask your Brand Owner
                  </span>
                </div>
                <div className="login-input-wrap">
                  <input
                    id="brand-code"
                    type="text"
                    value={brandCode}
                    onChange={(e) => setBrandCode(e.target.value)}
                    placeholder="Enter brand code (e.g. BRAND-XXXX)"
                    required
                  />
                </div>
                {availableBrands.length > 0 && (
                  <div style={{ margin: '8px 0 0', fontSize: '11px', color: 'var(--muted)', lineHeight: 1.4 }}>
                    <strong>Available brands:</strong>{' '}
                    {availableBrands.map(b => b.brand_name).join(', ')}
                  </div>
                )}
                <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--muted)', lineHeight: 1.35 }}>
                  🛡️ Workspace creation is reserved for <strong>Brand Owners</strong>. Team members and reviewers join an existing workspace with a verified Brand Value Code and admin authorization.
                </p>
              </div>
            )}

            {/* BRAND IDENTITY & VALUES: ONLY FOR ADMIN */}
            {register && isAdmin && (
              <div className="login-brand-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <Sparkles size={14} color="var(--sage)" />
                  <strong style={{ fontSize: '12px', color: 'var(--ink)' }}>Brand Identity &amp; Values (Admin Only)</strong>
                </div>
                <div>
                  <label htmlFor="brand-name">Brand / Organization Name</label>
                  <input
                    id="brand-name"
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Aster & Oak"
                  />
                </div>
                <div>
                  <label htmlFor="brand-values">Core Brand Values &amp; Guidance</label>
                  <textarea
                    id="brand-values"
                    rows={2}
                    value={brandValues}
                    onChange={(e) => setBrandValues(e.target.value)}
                    placeholder="e.g. Authenticity, craftsmanship, quiet confidence..."
                  />
                </div>
              </div>
            )}

            <button type="submit" className="login-submit-btn" disabled={busy}>
              <span>{busy ? 'Please wait…' : register ? (isAdmin ? 'Create Admin Account' : 'Submit for Verification') : 'Sign in'}</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="login-sso-btn"
              disabled={busy}
              onClick={() => {
                setRegister(!register)
                setError('')
                setSuccessMsg('')
                setPassword('')
              }}
            >
              {register ? 'Already have an account? Sign in' : 'Create an account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
