import './Dashboard.css'

import { useState } from 'react'
import './Dashboard.css'

const Sensors = () => {
  // Dummy data for sensors
  const [sensors, setSensors] = useState([
    { id: 1, name: 'Soil Moisture', active: true },
    { id: 2, name: 'Temperature', active: true },
    { id: 3, name: 'Humidity', active: true },
    { id: 4, name: 'Light Intensity', active: false },
    { id: 5, name: 'CO2 Level', active: true },
    { id: 6, name: 'Water pH', active: false },
  ])

  const toggleSensor = (id) => {
    setSensors(sensors.map(s =>
      s.id === id ? { ...s, active: !s.active } : s
    ))
  }

  return (
    <div className="dashboard-content">
      <div className="grid-header">
        <div>
          <p className="eyebrow" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--c-text-tertiary)', fontWeight: '700', letterSpacing: '0.5px' }}>Device Control</p>
          <h2 style={{ fontSize: '24px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>Sensors</h2>
        </div>
      </div>

      <div className="sensor-list">
        {sensors.map((sensor) => (
          <div key={sensor.id} className="sensor-card">
            <div className="sensor-info">
              <span className="sensor-name">{sensor.name}</span>
              <span className="sensor-status" style={{ color: sensor.active ? 'var(--c-status-safe)' : 'var(--c-text-tertiary)' }}>
                {sensor.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={sensor.active}
                onChange={() => toggleSensor(sensor.id)}
              />
              <span className="slider"></span>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Sensors
