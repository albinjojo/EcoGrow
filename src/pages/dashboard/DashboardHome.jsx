import { useState, useEffect } from 'react'
import mqtt from 'mqtt'
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

  // Calculate trends (simple comparison with previous data point)
  const getTrend = (current, key) => {
    if (sensorHistory.length < 2) return 'neutral'
    const prev = sensorHistory[sensorHistory.length - 2][key]
    if (current > prev) return 'pos'
    if (current < prev) return 'neg'
    return 'neutral'
  }

  useEffect(() => {
    const mqttOption = {
      clientId: 'emqx_react_' + Math.random().toString(16).substring(2, 8),
      username: 'ecogrow',
      password: 'albin2004',
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      rejectUnauthorized: true, // TLS
    }

    // Connect to EMQX Cloud via WebSocket (Secure)
    const mqttClient = mqtt.connect('wss://e66b0f01.ala.asia-southeast1.emqxsl.com:8084/mqtt', mqttOption)

    setClient(mqttClient)

    mqttClient.on('connect', () => {
      setConnectionStatus('Connected')
      console.log('Connected to EMQX Cloud')

      // Subscribe to topics
      mqttClient.subscribe(['ecogrow/sensors', 'ecogrow/status'], (err) => {
        if (err) {
          console.error('Subscription error:', err)
        } else {
          console.log('Subscribed to topics')
        }
      })
    })

    mqttClient.on('message', (topic, message) => {
      const payload = message.toString()

      if (topic === 'ecogrow/sensors') {
        try {
          const data = JSON.parse(payload)
          // {"co2":0,"temp":27.8,"humidity":74.3}
          const timestamp = new Date().toLocaleTimeString([], { hour12: false })

          setSensorData(data)
          setSensorHistory(prev => {
            const newData = [...prev, { ...data, time: timestamp }]
            // Keep last 20 data points
            if (newData.length > 20) return newData.slice(newData.length - 20)
            return newData
          })

        } catch (e) {
          console.error('Error parsing JSON:', e)
        }
      } else if (topic === 'ecogrow/status') {
        setSystemStatus(payload) // "ESP32 ONLINE"
      }
    })

    mqttClient.on('reconnect', () => {
      setConnectionStatus('Reconnecting')
    })

    mqttClient.on('error', (err) => {
      console.error('Connection error:', err)
      setConnectionStatus('Error')
      mqttClient.end()
    })

    return () => {
      if (mqttClient) {
        mqttClient.end()
      }
    }
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
            MQTT: {connectionStatus} | Device: {systemStatus}
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

      {/* Real-time Charts Section */}
      <section className="section-main" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <header className="panel-header">
          <span className="panel-title">Real-time Environmental Data</span>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', height: '300px' }}>

          {/* Temperature Chart */}
          <div style={{ background: 'var(--c-surface-1)', padding: '16px', borderRadius: '12px', border: '1px solid var(--c-border)' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--c-text-secondary)' }}>Temperature (°C)</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
                <XAxis dataKey="time" hide={true} />
                <YAxis domain={['auto', 'auto']} style={{ fontSize: '12px' }} width={30} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--c-surface-2)', borderColor: 'var(--c-border)', color: 'var(--c-text-primary)' }}
                  itemStyle={{ color: 'var(--c-text-primary)' }}
                />
                <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} animationDuration={300} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Humidity Chart */}
          <div style={{ background: 'var(--c-surface-1)', padding: '16px', borderRadius: '12px', border: '1px solid var(--c-border)' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--c-text-secondary)' }}>Humidity (%)</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
                <XAxis dataKey="time" hide={true} />
                <YAxis domain={[0, 100]} style={{ fontSize: '12px' }} width={30} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--c-surface-2)', borderColor: 'var(--c-border)', color: 'var(--c-text-primary)' }}
                  itemStyle={{ color: 'var(--c-text-primary)' }}
                />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} animationDuration={300} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* CO2 Chart */}
          <div style={{ background: 'var(--c-surface-1)', padding: '16px', borderRadius: '12px', border: '1px solid var(--c-border)' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--c-text-secondary)' }}>CO2 (ppm)</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
                <XAxis dataKey="time" hide={true} />
                <YAxis domain={['auto', 'auto']} style={{ fontSize: '12px' }} width={40} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--c-surface-2)', borderColor: 'var(--c-border)', color: 'var(--c-text-primary)' }}
                  itemStyle={{ color: 'var(--c-text-primary)' }}
                />
                <Line type="monotone" dataKey="co2" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} animationDuration={300} />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>
      </section>

      {/* Side Panel: AI & Alerts */}
      <aside className="section-side">
        {/* AI Insight */}
        <div className="side-panel ai-box">
          <div className="ai-status">AI Risk Analysis: LOW</div>
          <p className="ai-desc">
            Predictive model indicates stable growth conditions for next 24h. No anomalies detected in Zone A.
          </p>
          <div style={{ marginTop: '12px' }}>
            <button className="action-btn" style={{ borderColor: '#6366f1', color: '#4338ca' }}>View Report</button>
          </div>
        </div>

        {/* System Alerts */}
        <div className="side-panel">
          <header className="panel-header">
            <span className="panel-title">System Logs</span>
          </header>
          <ul className="alert-list">
            <li className="alert-item">
              <div className="alert-icon">ℹ</div>
              <div className="alert-content">
                <p>System Online</p>
                <span className="alert-time">Now</span>
              </div>
            </li>
          </ul>
        </div>
      </aside>

    </div>
  )
}

export default DashboardHome
