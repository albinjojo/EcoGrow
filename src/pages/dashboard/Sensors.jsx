import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import './Dashboard.css'

const SENSOR_DEFINITIONS = [
  { id: 1, name: 'Temperature', key: 'temp', unit: '°C' },
  { id: 2, name: 'Humidity', key: 'humidity', unit: '%' },
  { id: 3, name: 'CO2 Level', key: 'co2', unit: 'ppm' },
]

const STALE_MS = 15000
const API_URL = 'http://localhost:5000/api/sensors/history'

const Sensors = () => {
  const [sensorData, setSensorData] = useState({})
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  // ── 1. Pre-populate from REST API immediately on mount ──────────────────────
  useEffect(() => {
    fetch(API_URL, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(history => {
        if (history.length > 0) {
          // history is sorted oldest→newest; take the very last entry
          const latest = history[history.length - 1]
          const now = Date.now()
          const seed = {}
          SENSOR_DEFINITIONS.forEach(({ key }) => {
            if (latest[key] !== undefined && latest[key] !== null) {
              seed[key] = { value: latest[key], lastSeen: now }
            }
          })
          setSensorData(seed)
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  // ── 2. Keep live via Socket.IO ───────────────────────────────────────────────
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket'],
      withCredentials: true,
    })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('sensor_update', (data) => {
      setSensorData(prev => {
        const updated = { ...prev }
        SENSOR_DEFINITIONS.forEach(({ key }) => {
          if (data[key] !== undefined && data[key] !== null) {
            updated[key] = { value: data[key], lastSeen: Date.now() }
          }
        })
        return updated
      })
    })

    return () => socket.disconnect()
  }, [])

  // Tick every 5 s to refresh stale badges
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 5000)
    return () => clearInterval(t)
  }, [])

  const getStatus = (key) => {
    const entry = sensorData[key]
    if (!entry) return { label: 'No Data', color: '#6b7280', pulse: false }
    const age = Date.now() - entry.lastSeen
    if (age > STALE_MS) return { label: 'Last Known', color: 'var(--c-status-warn)', pulse: false }
    return { label: 'Live', color: 'var(--c-status-safe)', pulse: true }
  }

  return (
    <div className="dashboard-content">
      <div className="grid-header">
        <div>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--c-text-tertiary)', fontWeight: '700', letterSpacing: '0.5px', margin: 0 }}>
            Device Monitor
          </p>
          <h2 style={{ fontSize: '24px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
            Sensors
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600' }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: connected ? 'var(--c-status-safe)' : '#ef4444',
            display: 'inline-block',
            boxShadow: connected ? '0 0 6px var(--c-status-safe)' : 'none',
            animation: connected ? 'pulse-dot 1.5s infinite' : 'none',
          }} />
          {connected ? 'Live Stream Active' : 'Connecting…'}
        </div>
      </div>

      {loading ? (
        <div style={{ marginTop: '40px', textAlign: 'center', color: 'var(--c-text-tertiary)', fontSize: '14px' }}>
          Loading sensor data…
        </div>
      ) : (
        <div className="sensor-list" style={{ marginTop: '24px' }}>
          {SENSOR_DEFINITIONS.map((sensor) => {
            const status = getStatus(sensor.key)
            const entry = sensorData[sensor.key]
            return (
              <div key={sensor.id} className="sensor-card">
                <div className="sensor-info">
                  <span className="sensor-name">{sensor.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: status.color,
                      display: 'inline-block',
                      boxShadow: status.pulse ? `0 0 6px ${status.color}` : 'none',
                      animation: status.pulse ? 'pulse-dot 1.5s infinite' : 'none',
                    }} />
                    <span style={{ color: status.color, fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>
                      {status.label}
                    </span>
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '26px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                    {entry ? entry.value : '—'}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--c-text-tertiary)', marginLeft: '4px' }}>
                    {sensor.unit}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.5); }
        }
      `}</style>
    </div>
  )
}

export default Sensors
