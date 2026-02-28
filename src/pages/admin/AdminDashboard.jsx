import { useState, useEffect } from 'react'
import StatCard from '../../components/admin/StatCard'
import { fetchAllUsers } from '../../services/api'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.max(0, Math.floor((Date.now() - new Date(dateStr)) / 1000))
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const METRIC_LABEL = { temp: 'Temperature', humidity: 'Humidity', co2: 'CO₂' }

const AdminDashboard = () => {
  const [totalUsers, setTotalUsers] = useState(0)
  const [healthScore, setHealthScore] = useState(null)
  const [totalAlertsCount, setTotalAlertsCount] = useState(0)
  const [activeAlerts, setActiveAlerts] = useState([])   // last 3 for display
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const loadAll = async () => {
    setLoading(true)
    try {
      // 1. Users
      const usersRes = await fetchAllUsers()
      const users = usersRes.users || []
      setTotalUsers(users.length)
      setRecentUsers(
        users.slice(0, 3).map(u => ({
          id: u.id,
          email: u.email,
          role: u.role,
          joined: new Date(u.createdAt).toISOString().split('T')[0],
        }))
      )

      // 2. Alerts
      const alertsRes = await fetch('http://localhost:5000/api/admin/alerts')
      if (alertsRes.ok) {
        const alertData = await alertsRes.json()
        const arr = Array.isArray(alertData) ? alertData : []
        setTotalAlertsCount(arr.length)
        setActiveAlerts(arr.slice(0, 3))
      }

      // 3. System health
      const sumRes = await fetch('http://localhost:5000/api/analytics/summary')
      if (sumRes.ok) {
        const sumData = await sumRes.json()
        setHealthScore(sumData.health_score ?? null)
      }
    } catch (err) {
      console.error('Admin dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    const id = setInterval(loadAll, 30_000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="admin-dashboard">
      {/* System Overview */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>System Overview</h2>
          <button className="secondary-btn" onClick={loadAll} disabled={loading}>
            REFRESH
          </button>
        </div>

        <div className="stats-grid">
          <StatCard
            title="Total Users"
            value={loading ? '...' : totalUsers}
            subtitle="Active farmer accounts"
            trend={{ direction: 'up', text: 'All time' }}
            variant="users"
          />
          <StatCard
            title="Active Alerts"
            value={loading ? '...' : totalAlertsCount}
            subtitle="Latest sensor alerts"
            trend={{ direction: totalAlertsCount > 5 ? 'down' : 'up', text: totalAlertsCount > 5 ? 'Attention needed' : 'In range' }}
            variant="alerts"
          />
          <StatCard
            title="System Health"
            value={loading || healthScore === null ? '...' : `${healthScore}%`}
            subtitle="Based on alert rate"
            variant="health"
          />
        </div>
      </section>

      {/* Active Alerts */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Recent Alerts</h2>
          <a href="/admin/alerts" className="link-btn">View all →</a>
        </div>

        <div className="alerts-container">
          {loading ? (
            <p style={{ padding: '16px', color: '#666' }}>Loading alerts…</p>
          ) : activeAlerts.length === 0 ? (
            <div className="empty-state">
              <p>No alerts recorded yet. System running smoothly.</p>
            </div>
          ) : (
            <ul className="alerts-list">
              {activeAlerts.map((alert) => (
                <li
                  key={alert.id}
                  className={`alert-item alert-severity-${alert.severity === 'critical' ? 'high' : 'medium'}`}
                >
                  <div className="alert-content">
                    <p className="alert-device">
                      {METRIC_LABEL[alert.metric] || alert.metric} · {alert.user_name || alert.user_email || `User ${alert.user_id}`}
                    </p>
                    <p className="alert-message">{alert.message}</p>
                  </div>
                  <div className="alert-meta">
                    <span className={`alert-badge alert-badge-${alert.severity === 'critical' ? 'high' : 'medium'}`}>
                      {alert.severity}
                    </span>
                    <span className="alert-time">{timeAgo(alert.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Recent Users */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Recent Users</h2>
          <a href="/admin/users" className="link-btn">View all →</a>
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

      {/* Quick Actions */}
      <section className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <a href="/admin/users" className="action-card">
            <span className="action-icon">👥</span>
            <h3>Manage Users</h3>
            <p>Create, edit, or disable user accounts</p>
          </a>
          <a href="/admin/alerts" className="action-card">
            <span className="action-icon">🔔</span>
            <h3>View Alerts</h3>
            <p>Monitor system alerts and incidents</p>
          </a>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
