import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute component that enforces role-based access control
 * Redirects unauthorized users based on their role
 *
 * @param {React.ReactNode} children - Route element to render if authorized
 * @param {string} requiredRole - Required role to access this route (ADMIN or USER)
 * @returns {React.ReactNode}
 */
const ProtectedRoute = ({ children, requiredRole = 'USER' }) => {
  const { user, loading } = useAuth()

  // Show nothing while checking authentication
  if (loading) {
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
