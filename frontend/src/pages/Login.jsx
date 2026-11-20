import { useEffect, useState } from 'react'
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
import OtpInput from '../components/OtpInput'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'

export function Login() {
  const { user, data, authenticate } = useApp()
  const [register, setRegister] = useState(false)
  const [forgotMode, setForgotMode] = useState(false) // false | 'email' | 'otp'
  const [forgotEmail, setForgotEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [devCode, setDevCode] = useState('')
  const [otpStatus, setOtpStatus] = useState('idle') // 'idle' | 'combining' | 'success' | 'error'
  const [otpVerified, setOtpVerified] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('owner')
  const [brandCode, setBrandCode] = useState('')
  const [brandName, setBrandName] = useState('')
  const [brandValues, setBrandValues] = useState('')
  const [cleanWorkspace, setCleanWorkspace] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [pendingNotice, setPendingNotice] = useState(false)
  const [availableBrands, setAvailableBrands] = useState([])

  useEffect(() => {
    api.listBrands().then(res => {
      if (res?.brands) setAvailableBrands(res.brands)
    }).catch(() => {})
  }, [])

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
          brand_name: isAdmin ? (brandName.trim() || undefined) : undefined,
          brand_values: isAdmin ? (brandValues.trim() || undefined) : undefined,
          clean_workspace: isAdmin ? cleanWorkspace : false,
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
        await authenticate('login', { identifier: email.trim(), password })
      }
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      setError('Please enter your account email.')
      return
    }
    setBusy(true)
    setError('')
    setSuccessMsg('')
    setOtpCode('')
    setOtpStatus('idle')
    setOtpVerified(false)
    try {
      const res = await api.forgotPassword({ email: forgotEmail.trim() })
      setSuccessMsg(res?.message || 'Verification code sent to your email!')
      setForgotMode('otp')
      if (res?.dev_code) {
        setDevCode(res.dev_code)
      }
    } catch (err) {
      setError(err.message || 'Failed to send verification code.')
    } finally {
      setBusy(false)
    }
  }

  const handleOtpComplete = async (code) => {
    if (!code || code.length !== 6) return
    setOtpStatus('combining')
    setError('')
    setSuccessMsg('')

    // Allow the combine boxes animation to visually slide into the center
    await new Promise((resolve) => setTimeout(resolve, 500))

    try {
      // Validate OTP with backend
      await api.verifyOtp({
        email: forgotEmail.trim(),
        otp: code.trim(),
      })
      // OTP is valid! Show success tick in the central combined badge
      setOtpStatus('success')
      setOtpVerified(true)
      setSuccessMsg('Code verified! Please set your new password below.')
    } catch (err) {
      // Wrong or expired OTP! Show red cross in central combined badge, shake, then expand back
      setOtpStatus('error')
      setError(err.message || 'Incorrect verification code. Please check and try again.')
      setTimeout(() => {
        setOtpStatus('idle')
        setOtpCode('')
        setOtpVerified(false)
      }, 1600)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!otpCode.trim() || otpCode.trim().length !== 6 || !newPassword) {
      setError('Please provide the 6-digit verification code and new password.')
      return
    }
    setBusy(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await api.resetPassword({
        email: forgotEmail.trim(),
        otp: otpCode.trim(),
        new_password: newPassword,
      })
      setSuccessMsg(res?.message || 'Password reset successful! You can now sign in.')
      setForgotMode(false)
      setRegister(false)
      setPassword('')
      setEmail(forgotEmail.trim())
      setForgotEmail('')
      setOtpCode('')
      setOtpStatus('idle')
      setOtpVerified(false)
      setNewPassword('')
    } catch (err) {
      setOtpStatus('error')
      setTimeout(() => {
        setOtpStatus('idle')
        setOtpVerified(false)
      }, 1500)
      setError(err.message || 'Failed to reset password.')
    } finally {
      setBusy(false)
    }
  }

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

          {successMsg && (!forgotMode || forgotMode === 'email') && (
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

          {error && (!forgotMode || forgotMode === 'email') && (
            <div className="login-alert-error" role="alert" style={{ marginBottom: '18px' }}>
              <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          {forgotMode ? (
            <div className="login-forgot-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <KeyRound size={20} color="var(--sage, #298EE4)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--ink)' }}>
                    {forgotMode === 'otp' ? 'Enter Verification Code' : 'Reset Your Password'}
                  </h3>
                  <small style={{ color: 'var(--muted)' }}>
                    {forgotMode === 'otp'
                      ? 'Check your inbox for the 6-digit OTP code sent from goklarity@gmail.com'
                      : 'We will send a 6-digit verification code to your email address.'}
                  </small>
                </div>
              </div>

              {forgotMode === 'email' ? (
                <form className="login-form" onSubmit={handleSendOtp}>
                  <div className="login-field">
                    <label htmlFor="forgot-email">Account Email</label>
                    <div className="login-input-wrap">
                      <Mail size={16} className="login-input-icon" />
                      <input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@company.com"
                        autoCapitalize="none"
                        autoCorrect="off"
                        enterKeyHint="send"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button type="submit" className="login-submit-btn" disabled={busy}>
                    <span>{busy ? 'Sending OTP…' : 'Send Verification Code'}</span>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    className="login-sso-btn"
                    onClick={() => {
                      setForgotMode(false)
                      setError('')
                      setSuccessMsg('')
                    }}
                  >
                    Back to Sign in
                  </button>
                </form>
              ) : (
                <form className="login-form" onSubmit={handleResetPassword}>
                  <div className="login-field" style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '4px' }}>Enter 6-Digit Code</label>
                    <small style={{ color: 'var(--muted)', display: 'block', marginBottom: '12px' }}>
                      Sent to <strong>{forgotEmail}</strong>
                    </small>

                    {devCode && (
                      <div
                        style={{
                          background: 'var(--sage-soft)',
                          border: '1px solid var(--sage)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          marginBottom: '14px',
                          fontSize: '12.5px',
                          color: 'var(--ink)',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                        }}
                      >
                        <div>
                          <strong>Demo Mode Code:</strong> <span style={{ letterSpacing: '0.15em', fontWeight: '800' }}>{devCode}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpCode(devCode)
                            handleOtpComplete(devCode)
                          }}
                          style={{
                            background: 'var(--sage)',
                            color: '#ffffff',
                            border: 0,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          Auto-fill
                        </button>
                      </div>
                    )}
                    
                    {/* Animated OTP Input Component with glowing boxes, collapse and tick/cross */}
                    <OtpInput
                      length={6}
                      value={otpCode}
                      onChange={(val) => {
                        setOtpCode(val)
                        if (otpStatus !== 'idle') setOtpStatus('idle')
                        if (error) setError('')
                      }}
                      onComplete={handleOtpComplete}
                      status={otpStatus}
                      disabled={busy}
                    />

                    {/* Error alert displayed immediately below the OTP boxes */}
                    {error && (
                      <div
                        className="login-alert-error"
                        role="alert"
                        style={{
                          marginTop: '12px',
                          marginBottom: '4px',
                          textAlign: 'left',
                          animation: 'fadeIn 0.25s ease-out'
                        }}
                      >
                        <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>{error}</div>
                      </div>
                    )}

                    {/* Success notification below the OTP boxes */}
                    {successMsg && otpVerified && (
                      <div
                        className="login-alert-success"
                        role="status"
                        style={{
                          marginTop: '12px',
                          marginBottom: '4px',
                          textAlign: 'left',
                          animation: 'fadeIn 0.25s ease-out'
                        }}
                      >
                        <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#16a34a' }} />
                        <div>{successMsg}</div>
                      </div>
                    )}
                  </div>

                  {/* Only reveal New Password form AFTER OTP is verified */}
                  {otpVerified && (
                    <div className="login-field" style={{ marginTop: '14px', animation: 'fadeIn 0.35s ease-out' }}>
                      <label htmlFor="new-password">New Password</label>
                      <div className="login-input-wrap">
                        <Lock size={16} className="login-input-icon" />
                        <input
                          id="new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          minLength={8}
                          maxLength={128}
                          placeholder="At least 8 characters"
                          required
                          autoFocus
                        />
                        <button
                          type="button"
                          className="login-pw-toggle"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {otpVerified ? (
                    <button
                      type="submit"
                      className="login-submit-btn"
                      disabled={busy || !newPassword}
                      style={{ marginTop: '14px' }}
                    >
                      <span>{busy ? 'Saving Password…' : 'Save New Password'}</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                        {otpStatus === 'combining'
                          ? 'Verifying code…'
                          : otpStatus === 'error'
                          ? 'Invalid code. Resetting boxes…'
                          : 'Enter the 6-digit code above to proceed.'}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '12px' }}>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--sage, #38bdf8)', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                      onClick={() => {
                        setForgotMode('email')
                        setOtpStatus('idle')
                        setOtpCode('')
                      }}
                    >
                      Resend code
                    </button>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                      onClick={() => {
                        setForgotMode(false)
                        setError('')
                        setSuccessMsg('')
                        setOtpStatus('idle')
                        setOtpCode('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
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
                    autoCapitalize="none"
                    autoCorrect="off"
                    enterKeyHint="next"
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
                  autoCapitalize="none"
                  autoCorrect="off"
                  enterKeyHint="next"
                  maxLength={254}
                  placeholder={register ? 'you@company.com' : 'username or email'}
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label htmlFor="login-password" style={{ margin: 0 }}>Password</label>
                {!register && (
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--sage, #298EE4)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    onClick={() => {
                      setForgotMode('email')
                      setForgotEmail(email || '')
                      setError('')
                      setSuccessMsg('')
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
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
                    placeholder="e.g. Acme Corp, Lumina Studios"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="brand-values">Core Brand Values &amp; Guidance</label>
                  <textarea
                    id="brand-values"
                    rows={2}
                    value={brandValues}
                    onChange={(e) => setBrandValues(e.target.value)}
                    placeholder="e.g. Authenticity, craft, excellence, quiet confidence..."
                  />
                </div>
                <div className={`clean-workspace-toggle-card ${cleanWorkspace ? 'is-active' : ''}`}>
                  <label htmlFor="clean-workspace-chk" className="clean-workspace-toggle-row">
                    <div className="clean-workspace-toggle-info">
                      <div className="clean-workspace-toggle-title">
                        <Sparkles size={13} className="clean-workspace-sparkle" />
                        <span>Start with a clean workspace</span>
                        <span className="clean-workspace-badge">Recommended</span>
                      </div>
                      <p className="clean-workspace-toggle-sub">
                        Empty review queue, zero pre-loaded guidelines, and fresh asset directory right off the bat.
                      </p>
                    </div>
                    <div className="clean-workspace-switch-wrap">
                      <input
                        id="clean-workspace-chk"
                        type="checkbox"
                        checked={cleanWorkspace}
                        onChange={(e) => setCleanWorkspace(e.target.checked)}
                        className="clean-workspace-checkbox"
                      />
                      <span className="clean-workspace-slider" />
                    </div>
                  </label>
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
          )}
        </div>
      </div>
    </div>
  )
}
