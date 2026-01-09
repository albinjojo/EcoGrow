import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
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
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <img src={icon} alt="EcoGrow" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
          <div>
            <p className="brand-title">EcoGrow</p>
            <p className="brand-sub">Control Center</p>
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
                      <span className="nav-link nav-link-disabled" aria-disabled="true">
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
              color: '#dc2626',
              fontSize: '14px',
              paddingLeft: '12px'
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
            <button className="ghost-action" type="button">Refresh</button>
            <div className="user-chip" aria-label="Admin user">
              <div className="user-avatar">A</div>
              <div>
                <p className="user-name">Admin</p>
                <p className="user-role">Administrator</p>
              </div>
            </div>
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
