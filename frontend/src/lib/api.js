const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api'

const TOKEN_KEY = 'klarity_token'

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

async function request(path, options = {}) {
  const token = getStoredToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }
  const response = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  })
  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (body?.detail) detail = typeof body.detail === 'string' ? body.detail : detail
    } catch {
      // keep the status text
    }
    const error = new Error(detail)
    error.status = response.status
    throw error
  }
  if (response.status === 204) return null
  return response.json()
}

export const api = {
  me: () => request('/auth/me'),
  listBrands: () => request('/auth/brands'),
  brandDirectory: () => request('/auth/brand-directory'),
  switchBrand: (brand_name) =>
    request('/auth/switch-brand', { method: 'POST', body: JSON.stringify({ brand_name }) }),
  workspaceSettings: (brand_name) =>
    request(`/auth/workspace-settings${brand_name ? `?brand_name=${encodeURIComponent(brand_name)}` : ''}`),
  cleanWorkspace: () => request('/auth/clean-workspace', { method: 'POST' }),
  updateWorkspaceSettings: (payload) =>
    request('/auth/workspace-settings', { method: 'PATCH', body: JSON.stringify(payload) }),
  pendingAccounts: (brand_name) =>
    request(`/auth/pending-accounts${brand_name ? `?brand_name=${encodeURIComponent(brand_name)}` : ''}`),
  verifyAccount: (payload) =>
    request('/auth/verify-account', { method: 'POST', body: JSON.stringify(payload) }),
  teamMembers: (brand_name) =>
    request(`/auth/team-members${brand_name ? `?brand_name=${encodeURIComponent(brand_name)}` : ''}`),
  inviteTeamMember: (payload) =>
    request('/auth/team-members', { method: 'POST', body: JSON.stringify(payload) }),
  updateTeamMember: (id, payload) =>
    request(`/auth/team-members/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteTeamMember: (id) =>
    request(`/auth/team-members/${id}`, { method: 'DELETE' }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  forgotPassword: (payload) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  verifyOtp: (payload) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  bootstrap: () => request('/bootstrap'),
  getSubmission: (id) => request(`/submissions/${id}`),
  createSubmission: (payload) =>
    request('/submissions', { method: 'POST', body: JSON.stringify(payload) }),
  reviewSubmission: (id, payload) =>
    request(`/submissions/${id}/action`, { method: 'POST', body: JSON.stringify(payload) }),
  reevaluateSubmission: (id) =>
    request(`/submissions/${id}/re-evaluate`, { method: 'POST' }),
  rewriteCopy: (payload) =>
    request('/submissions/rewrite', { method: 'POST', body: JSON.stringify(payload) }),
  createGuideline: (payload) =>
    request('/guidelines', { method: 'POST', body: JSON.stringify(payload) }),
  updateGuideline: (id, payload) =>
    request(`/guidelines/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteGuideline: (id) => request(`/guidelines/${id}`, { method: 'DELETE' }),
  health: () => request('/health'),
}
