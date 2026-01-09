import { useState, useEffect } from 'react'
import StatCard from '../../components/admin/StatCard'
import { fetchAllUsers } from '../../services/api'

/**
 * AdminDashboard - Overview of system metrics and health
 * Displays:
 * - Total users count (from database)
 * - Total devices count
 * - Active alerts count
 * - System health status
 * - Quick action buttons
 */
const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDevices: 18, // Will be fetched when device API is available
    activeAlerts: 3,  // Will be fetched when alerts API is available
    systemHealth: 98,
  })

  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch user statistics from API
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetchAllUsers()
        const users = response.users || []
        
        // Update total users count
        setStats((prev) => ({
          ...prev,
          totalUsers: users.length,
        }))

        // Get 3 most recent users for the dashboard
        const recent = users.slice(0, 3).map((user) => ({
          id: user.id,
          name: user.email.split('@')[0],
          email: user.email,
          role: user.role,
          joined: new Date(user.createdAt).toISOString().split('T')[0],
        }))
        setRecentUsers(recent)
      } catch (err) {
        console.error('Error loading dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  // Mock active alerts
  const activeAlerts = [
    { id: 1, device: 'Sensor A-1', severity: 'high', message: 'Temperature exceeds threshold', time: '5 min ago' },
    { id: 2, device: 'Sensor B-2', severity: 'medium', message: 'Humidity level low', time: '15 min ago' },
    { id: 3, device: 'Device C-3', severity: 'low', message: 'Device offline', time: '2 hours ago' },
  ]

  const handleRefresh = () => {
    setLoading(true)
    window.location.reload()
  }

  return (
    <div className="admin-dashboard">
      {/* System Overview Section */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>System Overview</h2>
          <button className="secondary-btn" onClick={handleRefresh} disabled={loading}>
            🔄 Refresh
          </button>
        </div>

        <div className="stats-grid">
          <StatCard
            title="Total Users"
            value={loading ? '...' : stats.totalUsers}
            subtitle="Active farmer accounts"
            icon="👥"
            trend={{ direction: 'up', text: '+5 this month' }}
            variant="users"
          />
          <StatCard
            title="Total Devices"
            value={stats.totalDevices}
            subtitle="IoT sensors & hardware"
            icon="📱"
            trend={{ direction: 'up', text: '+2 this month' }}
            variant="devices"
          />
          <StatCard
            title="Active Alerts"
            value={stats.activeAlerts}
            subtitle="Require attention"
            icon="🔔"
            trend={{ direction: 'down', text: '-1 from yesterday' }}
            variant="alerts"
          />
          <StatCard
            title="System Health"
            value={`${stats.systemHealth}%`}
            subtitle="Overall uptime"
            icon="💚"
            variant="health"
          />
        </div>
      </section>

      {/* Active Alerts Section */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Active Alerts</h2>
          <a href="/admin/alerts" className="link-btn">
            View all →
          </a>
        </div>

        <div className="alerts-container">
          {activeAlerts.length === 0 ? (
            <div className="empty-state">
              <p>No active alerts. System running smoothly.</p>
            </div>
          ) : (
            <ul className="alerts-list">
              {activeAlerts.map((alert) => (
                <li key={alert.id} className={`alert-item alert-severity-${alert.severity}`}>
                  <div className="alert-content">
                    <p className="alert-device">{alert.device}</p>
                    <p className="alert-message">{alert.message}</p>
                  </div>
                  <div className="alert-meta">
                    <span className={`alert-badge alert-badge-${alert.severity}`}>
                      {alert.severity}
                    </span>
                    <span className="alert-time">{alert.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Recent Users Section */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Recent Users</h2>
          <a href="/admin/users" className="link-btn">
            View all →
          </a>
        </div>

        <div className="table-container">
          {loading ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Loading recent users...</p>
          ) : (
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                      No users yet
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>
                        <span className="role-badge role-badge-user">{user.role}</span>
                      </td>
                      <td>{user.joined}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <a href="/admin/users" className="action-card">
            <span className="action-icon">👥</span>
            <h3>Manage Users</h3>
            <p>Create, edit, or disable user accounts</p>
          </a>
          <a href="/admin/devices" className="action-card">
            <span className="action-icon">📱</span>
            <h3>Manage Devices</h3>
            <p>View and assign IoT devices</p>
          </a>
          <a href="/admin/alerts" className="action-card">
            <span className="action-icon">🔔</span>
            <h3>View Alerts</h3>
            <p>Monitor system alerts and incidents</p>
          </a>
          <a href="/admin/settings" className="action-card">
            <span className="action-icon">⚙️</span>
            <h3>System Settings</h3>
            <p>Configure thresholds and preferences</p>
          </a>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard

