import { Navigate, Route, Routes } from 'react-router-dom'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import LandingPage from './pages/LandingPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import AuthLayout from './pages/auth/AuthLayout'
import DashboardLayout from './pages/dashboard/DashboardLayout'
import DashboardHome from './pages/dashboard/DashboardHome'
import Sensors from './pages/dashboard/Sensors'
import AIRiskPrediction from './pages/dashboard/AIRiskPrediction'
import Alerts from './pages/dashboard/Alerts'
import Reports from './pages/dashboard/Reports'
import HistoricAnalysis from './pages/dashboard/HistoricAnalysis'

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
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="sensors" element={<Sensors />} />
        <Route path="ai-risk" element={<AIRiskPrediction />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="reports" element={<Reports />} />
        <Route path="history" element={<HistoricAnalysis />} />
      </Route>
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  )
}

export default App
