import { NavLink, Outlet } from 'react-router-dom'
import './Dashboard.css'

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
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden>
            *
          </span>
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
    </div>
  )
}

export default DashboardLayout
