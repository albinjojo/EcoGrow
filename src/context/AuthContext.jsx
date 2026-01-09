import { createContext, useContext, useState, useEffect } from 'react'

/**
 * AuthContext provides global access to user authentication state and role information
 * Manages login/logout state and user role (ADMIN or USER)
 */
const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('ecogrow_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('ecogrow_user')
      }
    }
    setLoading(false)
  }, [])

  /**
   * Login user with role information
   * @param {Object} userData - User object containing { id, email, role: 'ADMIN' | 'USER', ... }
   */
  const login = (userData) => {
    const user = {
      ...userData,
      role: userData.role?.toUpperCase() || 'USER',
    }
    setUser(user)
    localStorage.setItem('ecogrow_user', JSON.stringify(user))
  }

  /**
   * Logout user and clear session
   */
  const logout = () => {
    setUser(null)
    localStorage.removeItem('ecogrow_user')
  }

  /**
   * Check if user has a specific role
   * @param {string} role - Role to check (ADMIN or USER)
   * @returns {boolean}
   */
  const hasRole = (role) => {
    if (!user) return false
    return user.role === role.toUpperCase()
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  const isAuthenticated = () => Boolean(user)

  const value = {
    user,
    loading,
    login,
    logout,
    hasRole,
    isAuthenticated,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Custom hook to use AuthContext
 * Must be used within AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
