import { Link, useLocation } from 'react-router-dom'
import heroImage from '../../assets/farm.png'
import icon from '../../assets/icon.png'
import './authpages.css'

const AuthLayout = ({ children, heading }) => {
  const location = useLocation()
  const isLogin =
    location.pathname === '/' || location.pathname === '/auth' || location.pathname === '/auth/login'

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
          <Link to="/auth/admin-login">Admin panel</Link>
        </div>

        <div className="auth-card">
          <div className="brand-row">
            <img src={icon} alt="EcoGrow" style={{ width: '32px', height: '32px' }} />
            <span className="brand-name">EcoGrow</span>
          </div>
          <div className="intro">
            <h2>{heading || (isLogin ? 'Welcome back' : 'Join EcoGrow')}</h2>
            <p className="sub-text">Please enter your details to continue.</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
