import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEffect, useState } from 'react'
import { getAccountProfile } from '../../services/api'
import CompleteProfileModal from '../../components/CompleteProfileModal'
import './Dashboard.css'
import icon from '../../assets/icon.png'

const navSections = [
  {
    title: 'Main View',
    links: [
      { label: 'Overview', to: '/dashboard', end: true },
      { label: 'Sensors', to: '/dashboard/sensors' },
    ],
  },
  {
    title: 'Management',
    links: [
      { label: 'AI Risk Prediction', to: '/dashboard/ai-risk' },
      { label: 'Alerts', to: '/dashboard/alerts' },
      { label: 'Reports', to: '/dashboard/reports' },
      { label: 'Historic Analysis', to: '/dashboard/history' },
      { label: 'Configuration', to: null },
    ],
  },
]

const DashboardLayout = () => {
  const { logout } = useAuth()
  const [userProfile, setUserProfile] = useState({
    name: 'User',
    email: '',
    role: 'USER'
  })
  const [showCompleteProfile, setShowCompleteProfile] = useState(false)

  const loadProfile = async () => {
    try {
      const data = await getAccountProfile()
      const profile = data.profile || {}

      setUserProfile({
        name: profile.full_name || data.email?.split('@')[0] || 'User',
        email: data.email || '',
        role: data.role || 'USER'
      })

      // Check if profile is incomplete
      // Consider it incomplete if full_name, phone_number, or country is missing
      const isProfileIncomplete = !profile.full_name || !profile.phone_number || !profile.country
      if (isProfileIncomplete) {
        setShowCompleteProfile(true)
      }
    } catch (err) {
      console.error('Failed to load user profile:', err)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleProfileComplete = () => {
    loadProfile() // Reload to get updated name etc.
  }

  return (
    <div className="dashboard-shell">
      <CompleteProfileModal
        isOpen={showCompleteProfile}
        onClose={() => setShowCompleteProfile(false)}
        onComplete={handleProfileComplete}
      />

      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">E</div>
          <div>
            <p className="brand-title">EcoGrow</p>
            <p className="nav-section-title" style={{ margin: 0 }}>Control Center</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          {navSections.map((section) => (
            <div className="nav-section" key={section.title}>
              <p className="nav-section-title">{section.title}</p>
              <ul>
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <NavLink
                        to={link.to}
                        end={Boolean(link.end)}
                        className={({ isActive }) =>
                          `nav-link ${isActive ? 'nav-link-active' : ''}`
                        }
                      >
                        {link.label}
                      </NavLink>
                    ) : (
                      <span className="nav-link" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                        {link.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={logout}
            className="nav-link"
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#d14343'
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <p className="crumb">Home / Dashboard</p>
            <h1>Dashboard</h1>
          </div>
          <div className="topbar-actions">
            <input className="search-input" type="search" placeholder="Search sensors..." aria-label="Search" />
            <button className="btn-ghost" type="button">Refresh</button>
            <NavLink to="/dashboard/account" className="user-chip" aria-label={`${userProfile.name} - ${userProfile.role}`} style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div className="user-avatar">{userProfile.name.charAt(0).toUpperCase()}</div>
              <div>
                <p className="user-name">{userProfile.name}</p>
                <p className="user-role">{userProfile.role === 'ADMIN' ? 'Administrator' : 'User'}</p>
              </div>
            </NavLink>
          </div>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div >
  )
}

export default DashboardLayout
