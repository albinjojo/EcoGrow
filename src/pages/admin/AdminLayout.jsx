import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import icon from '../../assets/icon.png'
import './AdminPanel.css'

/**
 * AdminLayout - Main layout for admin panel with sidebar navigation
 * Features:
 * - Sidebar navigation with admin-specific routes
 * - Responsive header with user info and logout
 * - Role-based navigation sections
 * - Professional eco-friendly theme (light green + white)
 */

const AdminLayout = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  // Navigation sections for admin panel
  const navSections = [
    {
      title: 'Main',
      links: [
        { label: 'Dashboard', to: '/admin', end: true, icon: '📊' },
      ],
    },
    {
      title: 'Management',
      links: [
        { label: 'Users', to: '/admin/users', icon: '👥' },
        { label: 'User Crops', to: '/admin/user-crops', icon: '🌱' },
        { label: 'Alerts', to: '/admin/alerts', icon: '🔔' },
      ],
    },
  ]

  return (
    <div className="admin-shell">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <img src={icon} alt="EcoGrow" style={{ width: '24px', height: '24px' }} />
          <div>
            <p className="brand-title">EcoGrow</p>
            <p className="brand-sub">Admin Panel</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Admin navigation">
          {navSections.map((section) => (
            <div className="nav-section" key={section.title}>
              <p className="nav-section-title">{section.title}</p>
              <ul>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <NavLink
                      to={link.to}
                      end={Boolean(link.end)}
                      className={({ isActive }) =>
                        `nav-link ${isActive ? 'nav-link-active' : ''}`
                      }
                    >
                      {/* <span className="nav-icon">{link.icon}</span> */}
                      <span className="nav-label">{link.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Top Bar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <h1>
              <span style={{ color: 'var(--c-text-tertiary)' }}>///</span>
              Administration
            </h1>
          </div>

          <div className="topbar-right">
            <div className="user-profile">
              <div className="profile-avatar">{user?.email?.[0].toUpperCase() || 'A'}</div>
              <div className="profile-info">
                <p className="profile-name">{user?.email || 'Administrator'}</p>
                <p className="profile-role">System Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
