import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAccountProfile } from '../services/api'

/**
 * ProtectedRoute component that enforces role-based access control
 * Redirects unauthorized users based on their role
 * Verifies backend session if no local user data exists
 *
 * @param {React.ReactNode} children - Route element to render if authorized
 * @param {string} requiredRole - Required role to access this route (ADMIN or USER)
 * @returns {React.ReactNode}
 */
const ProtectedRoute = ({ children, requiredRole = 'USER' }) => {
  const { user, loading, login } = useAuth()
  const [checking, setChecking] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)

  // Check backend session if no user in context
  useEffect(() => {
    if (!loading && !user && !sessionChecked && !checking) {
      setChecking(true)
      getAccountProfile()
        .then((data) => {
          if (data && data.email) {
            login({
              id: data.id || 0,
              email: data.email,
              role: data.role || 'USER',
              ...data.profile,
            })
          }
        })
        .catch((error) => {
          console.error('Session check failed:', error)
        })
        .finally(() => {
          setChecking(false)
          setSessionChecked(true)
        })
    }
  }, [user, loading, sessionChecked, checking, login])

  // Show nothing while checking authentication
  if (loading || checking) {
    return null
  }

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  // Check if user has required role
  if (user.role !== requiredRole.toUpperCase()) {
    // Admin trying to access user route - redirect to admin panel
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />
    }

    // User trying to access admin route - redirect to user dashboard
    if (user.role === 'USER') {
      return <Navigate to="/dashboard" replace />
    }
  }

  // User has required role - render the route
  return children
}

export default ProtectedRoute
