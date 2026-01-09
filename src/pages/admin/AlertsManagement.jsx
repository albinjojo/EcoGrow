import { useState } from 'react'

/**
 * AlertsManagement - Admin page for viewing and managing system alerts
 * Features:
 * - View alert history with severity levels
 * - Filter alerts by severity and time range
 * - Search alerts by device or message
 * - Read-only access to alert data
 * - Severity indicators and timestamps
 */
const AlertsManagement = () => {
  // Mock alert data - Replace with API calls in production
  const [alerts] = useState([
    {
      id: 1,
      device: 'Greenhouse A Temperature',
      deviceId: 'DEV-001',
      severity: 'high',
      type: 'Temperature Alert',
      message: 'Temperature exceeds threshold (35°C)',
      timestamp: '2024-01-09T14:30:00',
      status: 'active',
      user: 'John Farmer',
    },
    {
      id: 2,
      device: 'Greenhouse C Light Sensor',
      deviceId: 'DEV-004',
      severity: 'medium',
      type: 'Connectivity Alert',
      message: 'Device offline for more than 2 hours',
      timestamp: '2024-01-09T12:15:00',
      status: 'acknowledged',
      user: 'Admin',
    },
    {
      id: 3,
      device: 'Field B Soil Moisture',
      deviceId: 'DEV-006',
      severity: 'high',
      type: 'Sensor Alert',
      message: 'Soil moisture critically low',
      timestamp: '2024-01-09T10:45:00',
      status: 'resolved',
      user: 'Mike Monitor',
    },
    {
      id: 4,
      device: 'Greenhouse B Humidity',
      deviceId: 'DEV-003',
      severity: 'low',
      type: 'Information',
      message: 'Humidity trend unusual - investigate',
      timestamp: '2024-01-09T08:20:00',
      status: 'acknowledged',
      user: 'Sarah Greenhouse',
    },
    {
      id: 5,
      device: 'Greenhouse A Temperature',
      deviceId: 'DEV-001',
      severity: 'medium',
      type: 'Sensor Alert',
      message: 'Temperature below minimum threshold',
      timestamp: '2024-01-08T22:10:00',
      status: 'resolved',
      user: 'John Farmer',
    },
    {
      id: 6,
      device: 'Field A Soil Moisture',
      deviceId: 'DEV-005',
      severity: 'low',
      type: 'Battery Alert',
      message: 'Battery level dropping - consider replacement',
      timestamp: '2024-01-08T18:55:00',
      status: 'acknowledged',
      user: 'Mike Monitor',
    },
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.deviceId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter
    return matchesSearch && matchesSeverity && matchesStatus
  })

  const formatTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString()
  }

  const stats = {
    total: alerts.length,
    active: alerts.filter((a) => a.status === 'active').length,
    high: alerts.filter((a) => a.severity === 'high').length,
    medium: alerts.filter((a) => a.severity === 'medium').length,
    low: alerts.filter((a) => a.severity === 'low').length,
  }

  return (
    <div className="admin-page">
      {/* Page Header */}
      <section className="page-header">
        <div className="header-content">
          <h2>Alerts & Monitoring</h2>
          <p className="header-subtitle">View system alerts with severity levels and timestamps</p>
        </div>
      </section>

      {/* Alert Stats */}
      <section className="alerts-stats">
        <div className="alert-stat-card alert-stat-total">
          <span className="stat-icon">📊</span>
          <div>
            <p className="stat-label">Total Alerts</p>
            <p className="stat-number">{stats.total}</p>
          </div>
        </div>
        <div className="alert-stat-card alert-stat-active">
          <span className="stat-icon">🔴</span>
          <div>
            <p className="stat-label">Active</p>
            <p className="stat-number">{stats.active}</p>
          </div>
        </div>
        <div className="alert-stat-card alert-stat-high">
          <span className="stat-icon">⚠️</span>
          <div>
            <p className="stat-label">High Severity</p>
            <p className="stat-number">{stats.high}</p>
          </div>
        </div>
        <div className="alert-stat-card alert-stat-medium">
          <span className="stat-icon">📋</span>
          <div>
            <p className="stat-label">Medium Severity</p>
            <p className="stat-number">{stats.medium}</p>
          </div>
        </div>
        <div className="alert-stat-card alert-stat-low">
          <span className="stat-icon">ℹ️</span>
          <div>
            <p className="stat-label">Low Severity</p>
            <p className="stat-number">{stats.low}</p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="page-controls">
        <div className="control-left">
          <input
            type="search"
            placeholder="Search by device, message, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            aria-label="Search alerts"
          />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="filter-select"
            aria-label="Filter by severity"
          >
            <option value="all">All Severity</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div className="control-stats">
          Showing {filteredAlerts.length} of {alerts.length} alerts
        </div>
      </section>

      {/* Alerts List */}
      <section className="page-content">
        {filteredAlerts.length === 0 ? (
          <div className="empty-state">
            <p>No alerts found matching your filters.</p>
          </div>
        ) : (
          <div className="alerts-list-container">
            {filteredAlerts.map((alert) => (
              <article key={alert.id} className={`alert-card alert-severity-${alert.severity}`}>
                <div className="alert-header">
                  <div className="alert-title-section">
                    <h3 className="alert-title">{alert.device}</h3>
                    <p className="alert-type">{alert.type}</p>
                  </div>
                  <div className="alert-badges">
                    <span className={`severity-badge severity-${alert.severity}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className={`status-badge status-${alert.status}`}>
                      {alert.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="alert-body">
                  <p className="alert-message">{alert.message}</p>
                  <div className="alert-meta">
                    <span className="meta-item">
                      <strong>Device ID:</strong> <code>{alert.deviceId}</code>
                    </span>
                    <span className="meta-item">
                      <strong>Reported by:</strong> {alert.user}
                    </span>
                    <span className="meta-item">
                      <strong>Time:</strong> {formatTime(alert.timestamp)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Legend and Info */}
      <section className="page-footer">
        <div className="alerts-legend">
          <h4>Severity Levels</h4>
          <ul>
            <li>
              <span className="legend-color severity-high"></span>
              <strong>High:</strong> Requires immediate action - critical issue detected
            </li>
            <li>
              <span className="legend-color severity-medium"></span>
              <strong>Medium:</strong> Needs attention - potential issue or threshold violation
            </li>
            <li>
              <span className="legend-color severity-low"></span>
              <strong>Low:</strong> Informational - monitor for patterns or trends
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}

export default AlertsManagement
