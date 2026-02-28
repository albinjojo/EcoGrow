import { useState, useEffect } from 'react'

const AlertsManagement = () => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true)
        const response = await fetch('http://localhost:5000/api/admin/alerts')
        if (response.ok) {
          const data = await response.json()
          setAlerts(data)
        }
      } catch (err) {
        console.error('Failed to fetch alerts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredAlerts = alerts.filter((alert) => {
    return severityFilter === 'all' || alert.severity === severityFilter
  })

  // Basic "X ago" logic
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    const now = new Date()
    // Let's assume server dates are UTC roughly or local, Math.abs to be safe if client clocks mismatch slightly
    const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000))

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const getMetricIcon = (metric) => {
    if (!metric) return ''
    const m = metric.toLowerCase()
    if (m.includes('temp')) return '🌡️'
    if (m.includes('humid')) return '💧'
    if (m.includes('co2')) return '☁️'
    return '📊'
  }

  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
  }

  return (
    <div style={{
      padding: '32px 48px',
      minHeight: '100vh',
      backgroundColor: '#f6f7f5',
      fontFamily: '"SF Mono", "Roboto Mono", "Courier New", monospace',
      color: '#333'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', color: '#999', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
          NOTIFICATIONS
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #ddd', paddingBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', letterSpacing: '0.5px', color: '#111' }}>
            CROP ALERTS
          </h2>
          <div style={{ fontSize: '11px', color: '#888' }}>
            {stats.total} total · auto-refreshes every 30s
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setSeverityFilter('all')}
          style={{
            padding: '8px 16px',
            background: severityFilter === 'all' ? '#111' : 'transparent',
            color: severityFilter === 'all' ? '#fff' : '#111',
            border: '1px solid #111',
            fontWeight: 'bold',
            fontSize: '11px',
            cursor: 'pointer',
            letterSpacing: '0.5px'
          }}
        >
          ALL ({stats.total})
        </button>
        <button
          onClick={() => setSeverityFilter('critical')}
          style={{
            padding: '8px 16px',
            background: severityFilter === 'critical' ? '#111' : 'transparent',
            color: severityFilter === 'critical' ? '#fff' : '#777',
            border: severityFilter === 'critical' ? '1px solid #111' : '1px solid #ccc',
            fontWeight: 'bold',
            fontSize: '11px',
            cursor: 'pointer',
            letterSpacing: '0.5px'
          }}
        >
          CRITICAL
        </button>
        <button
          onClick={() => setSeverityFilter('warning')}
          style={{
            padding: '8px 16px',
            background: severityFilter === 'warning' ? '#111' : 'transparent',
            color: severityFilter === 'warning' ? '#fff' : '#777',
            border: severityFilter === 'warning' ? '1px solid #111' : '1px solid #ccc',
            fontWeight: 'bold',
            fontSize: '11px',
            cursor: 'pointer',
            letterSpacing: '0.5px'
          }}
        >
          WARNING
        </button>
      </div>

      <div style={{ background: '#fdfdfc', border: '1px solid #d4d5d3', borderRadius: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #d4d5d3', display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px', color: '#111' }}>
          <div>ALERT HISTORY</div>
          <div style={{ color: '#888', fontWeight: 'normal' }}>Page 1 of 1</div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead>
              <tr style={{ color: '#999', borderBottom: '1px solid #eee', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <th style={{ padding: '16px 24px', fontWeight: 'normal' }}>TIME</th>
                <th style={{ padding: '16px 24px', fontWeight: 'normal' }}>SEVERITY</th>
                <th style={{ padding: '16px 24px', fontWeight: 'normal' }}>METRIC</th>
                <th style={{ padding: '16px 24px', fontWeight: 'normal' }}>CROP</th>
                <th style={{ padding: '16px 24px', fontWeight: 'normal' }}>USER</th>
                <th style={{ padding: '16px 24px', fontWeight: 'normal' }}>MESSAGE + SUGGESTION</th>
                <th style={{ padding: '16px 24px', fontWeight: 'normal', textAlign: 'right' }}>READING VS IDEAL</th>
              </tr>
            </thead>
            <tbody>
              {loading && alerts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: '#888', fontSize: '12px' }}>Loading alerts...</td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: '#888', fontSize: '12px' }}>No alerts found in this view.</td>
                </tr>
              ) : (
                filteredAlerts.map(alert => {
                  const isCrit = alert.severity === 'critical';
                  const badgeColor = isCrit ? '#dc3545' : '#f39c12';
                  const badgeBg = isCrit ? '#f8d7da' : '#fcf3cf';
                  const valueColor = isCrit ? '#e74c3c' : '#d68910';

                  return (
                    <tr key={alert.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '16px 24px', color: '#999', fontSize: '11px', whiteSpace: 'nowrap' }}>
                        {formatTimeAgo(alert.created_at)}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          border: `1px solid ${badgeColor}`,
                          color: badgeColor,
                          background: badgeBg,
                          padding: '3px 6px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          letterSpacing: '1px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          textTransform: 'uppercase'
                        }}>
                          {isCrit ? '🚨 CRITICAL' : '⚠️ WARNING'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#444' }}>
                        <span style={{ marginRight: '6px' }}>{getMetricIcon(alert.metric)}</span>
                        {alert.metric?.toUpperCase()}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ color: '#333', fontSize: '13px' }}>{alert.crop_type}</div>
                        <div style={{ color: '#999', fontSize: '11px', marginTop: '4px' }}>{alert.crop_stage}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ color: '#333', fontSize: '12px' }}>{alert.user_email?.split('@')[0]}</div>
                        <div style={{ color: '#999', fontSize: '10px', marginTop: '4px' }}>{alert.user_email}</div>
                      </td>
                      <td style={{ padding: '16px 24px', maxWidth: '350px' }}>
                        <div style={{ color: '#222', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                          {alert.message}
                        </div>
                        <div style={{ color: '#666', fontSize: '12px', fontStyle: 'italic', display: 'flex', gap: '6px' }}>
                          <span style={{ color: '#d4ac0d' }}>💡</span>
                          <span>{alert.suggestion}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ color: valueColor, fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                          {alert.value}
                        </div>
                        <div style={{ color: '#aaa', fontSize: '10px' }}>
                          ideal: {alert.ideal_min}-{alert.ideal_max}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AlertsManagement
