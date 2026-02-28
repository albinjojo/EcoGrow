import { useState, useEffect } from 'react'
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
import './Dashboard.css'

const DashboardHome = () => {
  const [client, setClient] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('Disconnected')
  const [systemStatus, setSystemStatus] = useState('Waiting for status...')
  const [sensorData, setSensorData] = useState({
    co2: 0,
    temp: 0,
    humidity: 0
  })
  const [sensorHistory, setSensorHistory] = useState([])

  // ── Live AI risk state ──────────────────────────────────────────
  const [aiRisk, setAiRisk] = useState(null)
  const [aiLoading, setAiLoading] = useState(true)
  const [recentAlerts, setRecentAlerts] = useState([])

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

  // ── Fetch AI risk prediction (auto-refresh every 30s) ────────────────
  useEffect(() => {
    const fetchRisk = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/ai/predict?crop_type=lettuce&crop_stage=vegetative')
        if (res.ok) setAiRisk(await res.json())
      } catch (e) {
        console.error('AI risk fetch failed:', e)
      } finally {
        setAiLoading(false)
      }
    }
    fetchRisk()
    const id = setInterval(fetchRisk, 30_000)
    return () => clearInterval(id)
  }, [])

  // ── Fetch last 4 alert logs for System Logs panel ───────────────────
  useEffect(() => {
    const fetchRecentAlerts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/alerts?limit=4&offset=0')
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
