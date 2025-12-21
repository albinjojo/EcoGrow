// Point to Flask backend (default http://localhost:5000/api). Override with VITE_API_URL in .env.local.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data?.message || 'Unexpected server error.'
    throw new Error(message)
  }
  return data
}

export const handleLogin = async (payload) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  return parseResponse(res)
}

export const handleSignup = async (payload) => {
  const res = await fetch(`${API_BASE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  return parseResponse(res)
}

export const handleGoogleAuth = async (token) => {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token }),
  })
  return parseResponse(res)
}

export const startGoogleOAuth = () => {
  window.location.href = `${API_BASE}/auth/google/start`
}

export const requestPasswordReset = async (email) => {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return parseResponse(res)
}
