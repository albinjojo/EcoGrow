import { Navigate, Route, Routes } from 'react-router-dom'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import AdminLoginPage from './pages/auth/AdminLoginPage'
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
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import DeviceManagement from './pages/admin/DeviceManagement'
import AlertsManagement from './pages/admin/AlertsManagement'
import SystemSettings from './pages/admin/SystemSettings'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
        <Route path="/auth/login"
          element={
            <AuthLayout heading="Welcome back">
              <LoginPage />
            </AuthLayout>
          }
        />
        <Route path="/auth/admin-login"
          element={
            <AuthLayout heading="Admin Access">
              <AdminLoginPage />
            </AuthLayout>
          }
        />
        <Route path="/auth/signup"
          element={
            <AuthLayout heading="Create account">
              <SignupPage />
            </AuthLayout>
          }
        />
        <Route path="/auth/forgot"
          element={
            <AuthLayout heading="Reset access">
              <ForgotPasswordPage />
            </AuthLayout>
          }
        />
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/auth/reset"
          element={
            <AuthLayout heading="Create a new password">
              <ResetPasswordPage />
            </AuthLayout>
          }
        />

        {/* User Dashboard - Protected for USER role */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="USER">
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="sensors" element={<Sensors />} />
          <Route path="ai-risk" element={<AIRiskPrediction />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="history" element={<HistoricAnalysis />} />
        </Route>

        {/* Admin Panel - Protected for ADMIN role */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="devices" element={<DeviceManagement />} />
          <Route path="alerts" element={<AlertsManagement />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
