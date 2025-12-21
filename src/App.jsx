import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import heroImage from './assets/farm.png'
import './App.css'

const LeafMark = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15.5 2.5C10.5 2.5 7 5 7 9C7 12.5 9 14 10.5 15.5C12 17 13 18.5 13 18.5C13 18.5 14.5 16.5 16 14.5C17.5 12.5 18.5 10 18.5 7.5C18.5 5.5 17.5 2.5 15.5 2.5Z"
      stroke="#7AAE24"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M11 9.5C11 9.5 12 7.5 15 6" stroke="#7AAE24" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

const AuthLayout = ({ children, heading, subheading }) => {
  const location = useLocation()
  const isLogin = location.pathname === '/' || location.pathname === '/login'

  return (
    <div className="auth-shell">
      <div className="hero-side">
        <img src={heroImage} alt="Lush greenhouse" />
        <div className="hero-copy">
          <p className="hero-title">Cultivating Intelligence</p>
          <p className="hero-sub">Access your AI-powered greenhouse environment monitoring system.</p>
        </div>
      </div>

      <div className="form-side">
        <div className="admin-chip">
          <Link to="/login?role=ADMIN">Admin panel</Link>
        </div>
        <div className="brand-row">
          <LeafMark />
          <span className="brand-name">EcoGrow</span>
        </div>
        <div className="intro">
          <h2>{heading || (isLogin ? 'Welcome back' : 'Join EcoGrow')}</h2>
          <p className="sub-text">Please enter your details to continue.</p>
        </div>
        {children}
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <AuthLayout heading="Welcome back">
            <LoginPage />
          </AuthLayout>
        }
      />
      <Route
        path="/login"
        element={
          <AuthLayout heading="Welcome back">
            <LoginPage />
          </AuthLayout>
        }
      />
      <Route
        path="/signup"
        element={
          <AuthLayout heading="Create account">
            <SignupPage />
          </AuthLayout>
        }
      />
      <Route
        path="/forgot"
        element={
          <AuthLayout heading="Reset access">
            <ForgotPasswordPage />
          </AuthLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
