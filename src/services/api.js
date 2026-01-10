
const API_BASE = 'http://localhost:5000/api'

// Helper for requests
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Important for sending session cookies
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'API request failed')
  }

  return data
}

// Auth API
export const handleLogin = async (credentials) => {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export const handleSignup = async (userData) => {
  return request('/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

export const requestPasswordReset = async (email) => {
  return request('/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export const resetPassword = async ({ token, password }) => {
  return request('/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

export const startGoogleOAuth = () => {
  window.location.href = `${API_BASE}/google/start`
}

// User API
export const getAccountProfile = async () => {
  return await request('/account/profile')
}

export const updateAccountProfile = async (profileData) => {
  return request('/account/profile', {
    method: 'POST', // user_account.py uses POST for upsert
    body: JSON.stringify(profileData),
  })
}

// Admin API
export const fetchAllUsers = async () => {
  return request('/users')
}
