import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { useAuth } from '../../context/AuthContext'
import './Dashboard.css'

/* ── Toast system (same as AIRiskPrediction) ───────────────────────── */
const TOAST_DURATION = 8000
const SEVERITY_STYLES = {
  warning: { border: '#f59e0b', bg: '#fffbeb', icon: '⚠️', badge: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' } },
  critical: { border: '#ef4444', bg: '#fff1f2', icon: '🚨', badge: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' } },
}
const METRIC_ICONS = { temp: '🌡️', humidity: '💧', co2: '🌿' }

const AlertToast = ({ toast, onDismiss }) => {
  const [progress, setProgress] = useState(100)
  const [exiting, setExiting] = useState(false)
  const intervalRef = useRef(null)
  useEffect(() => {
    const start = Date.now()
    intervalRef.current = setInterval(() => {
      const pct = Math.max(0, 100 - ((Date.now() - start) / TOAST_DURATION) * 100)
      setProgress(pct)
      if (pct <= 0) { clearInterval(intervalRef.current); handleDismiss() }
    }, 80)
    return () => clearInterval(intervalRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const handleDismiss = () => { setExiting(true); setTimeout(() => onDismiss(toast.id), 320) }
  const sty = SEVERITY_STYLES[toast.severity] || SEVERITY_STYLES.warning
  const metricIcon = METRIC_ICONS[toast.metric] || '📊'
  return (
    <div style={{
      background: sty.bg, border: `1px solid ${sty.border}`, borderLeft: `4px solid ${sty.border}`,
      borderRadius: '0', padding: '12px 36px 0 14px', width: '320px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.14)', position: 'relative', overflow: 'hidden',
      transform: exiting ? 'translateX(360px)' : 'translateX(0)',
      opacity: exiting ? 0 : 1,
      transition: 'transform 0.32s cubic-bezier(0.4,0,1,1), opacity 0.28s ease',
      animation: 'toast-slide-in 0.3s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <button onClick={handleDismiss} style={{
        position: 'absolute', top: '8px', right: '10px', background: 'none', border: 'none',
        cursor: 'pointer', fontSize: '14px', color: '#6b7280', lineHeight: 1, padding: '2px 4px',
      }} aria-label="Dismiss">✕</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '16px', lineHeight: 1, marginTop: '1px', flexShrink: 0 }}>{sty.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px',
              padding: '2px 7px', background: sty.badge.bg, color: sty.badge.color, border: `1px solid ${sty.badge.border}`,
            }}>{toast.severity}</span>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>{metricIcon} {toast.label?.toUpperCase() || toast.metric?.toUpperCase()}</span>
          </div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginTop: '4px', lineHeight: 1.4 }}>{toast.message}</p>
        </div>
      </div>
      {toast.suggestion && (
        <p style={{ fontSize: '11.5px', color: '#4b5563', fontStyle: 'italic', lineHeight: 1.5, marginBottom: '10px', borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: '6px' }}>
          💡 {toast.suggestion}
        </p>
      )}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(0,0,0,0.07)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: sty.border, transition: 'width 0.08s linear' }} />
      </div>
    </div>
  )
}

const AlertToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null
  return (
    <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
      {toasts.slice(0, 5).map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}><AlertToast toast={t} onDismiss={onDismiss} /></div>
      ))}
    </div>
  )
}

const DashboardHome = () => {
  const { user } = useAuth()
  const [client, setClient] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('Disconnected')
  const [systemStatus, setSystemStatus] = useState('Waiting for status...')
  const [sensorData, setSensorData] = useState({ co2: 0, temp: 0, humidity: 0 })
  const [sensorHistory, setSensorHistory] = useState([])

  // ── Live AI risk + toast state ───────────────────────────────────
  const [aiRisk, setAiRisk] = useState(null)
  const [aiLoading, setAiLoading] = useState(true)
  const [recentAlerts, setRecentAlerts] = useState([])
  const [toasts, setToasts] = useState([])
  const ALERT_REFIRE_MS = 60_000
  const lastAlertTimeRef = useRef({})

  const dismissToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  // Calculate trends (simple comparison with previous data point)
  const getTrend = (current, key) => {
    if (sensorHistory.length < 2) return 'neutral'
    const prev = sensorHistory[sensorHistory.length - 2][key]
    if (current > prev) return 'pos'
    if (current < prev) return 'neg'
    return 'neutral'
  }

  useEffect(() => {
    // 1. Fetch Historical Data from DB
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/sensors/history')
        if (response.ok) {
          const data = await response.json()
          setSensorHistory(data)
          // Set latest readings as current state
          if (data.length > 0) {
            const latest = data[data.length - 1]
            setSensorData({
              co2: latest.co2 || 0,
              temp: latest.temp || 0,
              humidity: latest.humidity || 0
            })
          }
        }
      } catch (err) {
        console.error('Failed to fetch history:', err)
      }
    }

    fetchHistory()

    // 2. Connect to Backend SocketIO
    const socketUrl = 'http://localhost:5000'
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true
    })

    setClient(newSocket)

    newSocket.on('connect', () => {
      setConnectionStatus('Connected')
      console.log('Connected to Backend SocketIO')
    })

    newSocket.on('sensor_update', (data) => {
      // Data expected: { co2, temp, humidity, timestamp }
      setSensorData(prev => ({ ...prev, ...data }))

      const timestamp = data.timestamp || new Date().toLocaleTimeString([], { hour12: false })
      setSensorHistory(prev => {
        const newData = [...prev, { ...data, time: timestamp }]
        // Keep last 40 data points (increased from 20 to show more history)
        if (newData.length > 40) return newData.slice(newData.length - 40)
        return newData
      })
    })

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err)
      setConnectionStatus('Error')
    })

    newSocket.on('disconnect', () => {
      setConnectionStatus('Disconnected')
    })

    return () => {
      if (newSocket) {
        newSocket.disconnect()
      }
    }
  }, [])

  // ── Fetch AI risk prediction + fire toasts (auto-refresh every 30s) ──
  useEffect(() => {
    const fetchRisk = async () => {
      try {
        const userId = user?.id || 1
        const res = await fetch(`http://localhost:5000/api/ai/predict?crop_type=lettuce&crop_stage=vegetative&user_id=${userId}`)
        if (res.ok) {
          const data = await res.json()
          setAiRisk(data)
          // Fire toasts for any alerts, re-fires after 1 min cooldown
          const incoming = data.alerts ?? []
          const now = Date.now()
          Object.keys(lastAlertTimeRef.current).forEach(m => {
            if (!incoming.find(a => a.metric === m)) delete lastAlertTimeRef.current[m]
          })
          const newToasts = incoming
            .filter(a => { const last = lastAlertTimeRef.current[a.metric]; return !last || (now - last) >= ALERT_REFIRE_MS })
            .map(a => ({ ...a, id: `${a.metric}-${now}` }))
          if (newToasts.length > 0) {
            newToasts.forEach(t => { lastAlertTimeRef.current[t.metric] = now })
            setToasts(prev => [...newToasts, ...prev])
          }
        }
      } catch (e) {
        console.error('AI risk fetch failed:', e)
      } finally {
        setAiLoading(false)
      }
    }
    fetchRisk()
    const id = setInterval(fetchRisk, 30_000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Fetch last 4 alert logs for System Logs panel ───────────────────
  useEffect(() => {
    const fetchRecentAlerts = async () => {
      try {
        const userId = user?.id || 1
        const res = await fetch(`http://localhost:5000/api/alerts?limit=4&offset=0&user_id=${userId}`)
        if (res.ok) {
          const data = await res.json()
          setRecentAlerts(data.alerts ?? [])
        }
      } catch (e) { /* silent — System Logs still shows fallback */ }
    }
    fetchRecentAlerts()
    const id = setInterval(fetchRecentAlerts, 30_000)
    return () => clearInterval(id)
  }, [])

  const metrics = [
    {
      label: 'Avg Temperature',
      value: sensorData.temp,
      unit: '°C',
      delta: 'Live',
      trend: getTrend(sensorData.temp, 'temp')
    },
    {
      label: 'Avg Humidity',
      value: sensorData.humidity,
      unit: '%',
      delta: 'Live',
      trend: getTrend(sensorData.humidity, 'humidity')
    },
    {
      label: 'Avg CO2 Level',
      value: sensorData.co2,
      unit: 'ppm',
      delta: 'Live',
      trend: getTrend(sensorData.co2, 'co2')
    },
  ]

  return (
    <div className="dash-grid">
      <AlertToastContainer toasts={toasts} onDismiss={dismissToast} />
      {/* Header Area */}
      <div className="grid-header">
        <div>
          <p className="eyebrow" style={{ color: connectionStatus === 'Connected' ? '#10b981' : '#ef4444' }}>
            SocketIO: {connectionStatus} | Backend: Active
          </p>
          <h2>Facility Overview</h2>
        </div>
        <div className="status-chip">
          <span className={`status-dot ${connectionStatus === 'Connected' ? '' : 'offline'}`}></span>
          Live Monitoring
        </div>
      </div>

      {/* KPI Instrumentation */}
      <div className="kpi-row">
        {metrics.map((metric) => (
          <div className="kpi-box" key={metric.label}>
            <div>
              <p className="kpi-label">{metric.label}</p>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span className="kpi-value">{metric.value}</span>
                <span className="kpi-unit">{metric.unit}</span>
              </div>
            </div>
            <span className={`kpi-delta ${metric.trend === 'pos' ? 'pos' : metric.trend === 'neg' ? 'neg' : ''}`}>
              {metric.delta}
            </span>
          </div>
        ))}
      </div>

      {/* Professional Data Visualization Grid */}
      <section className="section-main" style={{ background: 'transparent', border: 'none', padding: 0 }}>
        <header className="panel-header" style={{ marginBottom: '16px', borderRadius: 'var(--radius-sm)' }}>
          <span className="panel-title">Environmental Monitoring Matrix</span>
        </header>

        <div className="charts-grid">

          {/* Temperature Chart Card */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h4 className="chart-card-title">Temperature Profile</h4>
              <div className="status-badge active" style={{ fontSize: '9px' }}>Thermal Dynamic</div>
            </div>
            <div className="chart-container">
              <div className="chart-label-y">Unit: Celsius (°C)</div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensorHistory} margin={{ top: 5, right: 30, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Timeline', position: 'insideBottomRight', offset: -15, fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10 }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--c-surface-2)', borderColor: 'var(--c-border)', borderRadius: '8px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="temp"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 2 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Humidity Chart Card */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h4 className="chart-card-title">Humidity Levels</h4>
              <div className="status-badge active" style={{ fontSize: '9px', borderColor: '#3b82f6', color: '#3b82f6' }}>Stable</div>
            </div>
            <div className="chart-container">
              <div className="chart-label-y">Unit: Percentage (%)</div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensorHistory} margin={{ top: 5, right: 30, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Timeline', position: 'insideBottomRight', offset: -15, fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--c-surface-2)', borderColor: 'var(--c-border)', borderRadius: '8px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 2 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CO2 Chart Card */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h4 className="chart-card-title">Carbon Dioxide Concentration</h4>
              <div className="status-badge active" style={{ fontSize: '9px', borderColor: '#10b981', color: '#10b981' }}>Optimal</div>
            </div>
            <div className="chart-container">
              <div className="chart-label-y">Unit: Parts Per Million (ppm)</div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensorHistory} margin={{ top: 5, right: 30, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Timeline', position: 'insideBottomRight', offset: -15, fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10 }}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--c-surface-2)', borderColor: 'var(--c-border)', borderRadius: '8px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="co2"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 2 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </section>

      {/* Side Panel: AI & Alerts */}
      <aside className="section-side">
        {/* AI Insight — live from /api/ai/predict */}
        <div className="side-panel ai-box">
          {aiLoading ? (
            <div className="ai-status" style={{ opacity: 0.5 }}>AI Risk Analysis: Loading…</div>
          ) : aiRisk ? (
            <>
              <div className="ai-status" style={{
                color:
                  aiRisk.risk_level?.toLowerCase() === 'high' ? '#ef4444' :
                    aiRisk.risk_level?.toLowerCase() === 'moderate' ? '#f59e0b' : '#10b981',
              }}>
                AI Risk Analysis: {aiRisk.risk_level?.toUpperCase()}
              </div>

              {/* Analysis text */}
              <p style={{ marginTop: '8px', fontSize: '12px', lineHeight: 1.5, color: '#1a1a1a', fontWeight: 500 }}>
                {aiRisk.analysis}
              </p>

              {/* Confidence bar */}
              <div style={{ margin: '8px 0 4px', height: '5px', background: 'var(--c-border-subtle)' }}>
                <div style={{
                  height: '100%',
                  width: `${aiRisk.confidence_score ?? 0}%`,
                  background:
                    aiRisk.risk_level?.toLowerCase() === 'high' ? '#ef4444' :
                      aiRisk.risk_level?.toLowerCase() === 'moderate' ? '#f59e0b' : '#10b981',
                  transition: 'width 0.8s ease',
                }} />
              </div>

              {/* Confidence label */}
              <p style={{ fontSize: '11px', color: 'var(--c-text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '10px' }}>
                Confidence: <span style={{ fontWeight: 700, color: 'var(--c-text-primary)' }}>{aiRisk.confidence_score}%</span>
                {' '}· {aiRisk.source === 'ml-model' ? 'ML Model' : 'Rule-based'}
              </p>
            </>
          ) : (
            <>
              <div className="ai-status">AI Risk Analysis: —</div>
              <p className="ai-desc">Waiting for sensor data…</p>
            </>
          )}

          <div style={{ marginTop: '4px' }}>
            <a href="/dashboard/ai-risk" style={{ textDecoration: 'none' }}>
              <button className="action-btn" style={{ borderColor: '#6366f1', color: '#4338ca' }}>View Report</button>
            </a>
          </div>
        </div>

        {/* System Logs — last 4 crop alerts */}
        <div className="side-panel">
          <header className="panel-header">
            <span className="panel-title">System Logs</span>
            <a href="/dashboard/alerts" style={{ fontSize: '10px', color: 'var(--c-text-tertiary)', fontFamily: 'var(--font-mono)', textDecoration: 'none' }}>View all →</a>
          </header>
          <ul className="alert-list">
            {/* Always show System Online first */}
            <li className="alert-item">
              <div className="alert-icon">ℹ</div>
              <div className="alert-content">
                <p>System Online</p>
                <span className="alert-time">Now</span>
              </div>
            </li>
            {recentAlerts.map(a => {
              const timeAgo = (() => {
                const ts = a.created_at ? new Date(a.created_at.replace(' ', 'T')) : null
                if (!ts || isNaN(ts)) return ''
                const diff = Math.floor((Date.now() - ts.getTime()) / 1000)
                if (diff < 60) return `${diff}s ago`
                if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
                return `${Math.floor(diff / 3600)}h ago`
              })()
              return (
                <li key={a.id} className="alert-item">
                  <div className={`alert-icon ${a.severity}`} style={{ fontSize: '11px', fontWeight: 700 }}>
                    {a.severity === 'critical' ? '!!' : '!'}
                  </div>
                  <div className="alert-content">
                    <p style={{ fontWeight: 600 }}>{a.message}</p>
                    <span className="alert-time">{timeAgo} · {a.crop_type}</span>
                  </div>
                </li>
              )
            })}
            {recentAlerts.length === 0 && (
              <li className="alert-item">
                <div className="alert-icon">✓</div>
                <div className="alert-content">
                  <p>No alerts recorded yet</p>
                  <span className="alert-time">All readings in range</span>
                </div>
              </li>
            )}
          </ul>
        </div>
      </aside>

    </div>
  )
}

export default DashboardHome
