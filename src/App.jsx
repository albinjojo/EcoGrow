import { Navigate, Route, Routes } from 'react-router-dom'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import LandingPage from './pages/LandingPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import AuthLayout from './pages/auth/AuthLayout'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/login" replace />} />
      <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
      <Route
        path="/auth/login"
        element={
          <AuthLayout heading="Welcome back">
            <LoginPage />
          </AuthLayout>
        }
      />
      <Route
        path="/auth/signup"
        element={
          <AuthLayout heading="Create account">
            <SignupPage />
          </AuthLayout>
        }
      />
      <Route
        path="/auth/forgot"
        element={
          <AuthLayout heading="Reset access">
            <ForgotPasswordPage />
          </AuthLayout>
        }
      />
      <Route path="/welcome" element={<LandingPage />} />
      <Route
        path="/auth/reset"
        element={
          <AuthLayout heading="Create a new password">
            <ResetPasswordPage />
          </AuthLayout>
        }
      />
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  )
}

export default App
