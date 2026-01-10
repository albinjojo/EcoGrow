import './Dashboard.css'

const metrics = [
  { label: 'Avg Temperature', value: '24.2', unit: '°C', delta: '+0.5%', trend: 'pos' },
  { label: 'Avg Humidity', value: '65', unit: '%', delta: '0.0%', trend: 'neutral' },
  { label: 'Avg CO2 Level', value: '440', unit: 'ppm', delta: '-1.2%', trend: 'neg' },
]

const sensors = [
  { id: 'S01', name: 'Temp Sensor 01', zone: 'Zone A · North', status: 'Active', reading: '24.5 °C', lastUpdate: '2m ago' },
  { id: 'S04', name: 'Humidity Sensor 04', zone: 'Zone A · East', status: 'Active', reading: '68 %', lastUpdate: '5m ago' },
  { id: 'S05', name: 'CO2 Level', zone: 'Zone A · General', status: 'Active', reading: '450 ppm', lastUpdate: '1m ago' },
  { id: 'S02', name: 'Temp Sensor 02', zone: 'Zone B · Center', status: 'Low_Bat', reading: '12 %', lastUpdate: '1h ago' },
  { id: 'S03', name: 'Soil Moisture', zone: 'Zone B · South', status: 'Maintenance', reading: '--', lastUpdate: 'Offline' },
]

const alerts = [
  { id: 1, title: 'Filter Clean Required', time: '2h ago', type: 'warn' },
  { id: 2, title: 'Pressure Stabilization', time: '5h ago', type: 'info' },
]

const DashboardHome = () => {
  return (
    <div className="dash-grid">

      {/* Header Area */}
      <div className="grid-header">
        <div>
          <p className="eyebrow">System Status: Nominal</p>
          <h2>Facility Overview</h2>
        </div>
        <div className="status-chip">
          <span className="status-dot"></span>
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

      {/* Main Sensor Data Table */}
      <section className="section-main">
        <header className="panel-header">
          <span className="panel-title">Sensor Array Data</span>
          <div className="pill-group">
            <button className="action-btn">Export CSV</button>
            <button className="action-btn">Filter</button>
          </div>
        </header>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Sensor Name</th>
              <th>Zone / Location</th>
              <th>Reading</th>
              <th>Status</th>
              <th>Last Update</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sensors.map((sensor) => (
              <tr key={sensor.id}>
                <td style={{ fontFamily: 'monospace', color: 'var(--c-text-tertiary)' }}>{sensor.id}</td>
                <td style={{ fontWeight: 600 }}>{sensor.name}</td>
                <td>{sensor.zone}</td>
                <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{sensor.reading}</td>
                <td>
                  <span className={`status-badge ${sensor.status === 'Active' ? 'active' :
                      sensor.status === 'Low_Bat' ? 'warn' : 'low'
                    }`}>
                    {sensor.status}
                  </span>
                </td>
                <td style={{ color: 'var(--c-text-tertiary)' }}>{sensor.lastUpdate}</td>
                <td>
                  <button className="action-btn">Config</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            {alerts.map(alert => (
              <li className="alert-item" key={alert.id}>
                <div className="alert-icon">⚠</div>
                <div className="alert-content">
                  <p>{alert.title}</p>
                  <span className="alert-time">{alert.time}</span>
                </div>
              </li>
            ))}
            <li className="alert-item" style={{ justifyContent: 'center', color: 'var(--c-text-tertiary)', fontSize: '11px' }}>
              View all 24 logs
            </li>
          </ul>
        </div>
      </aside>

    </div>
  )
}

export default DashboardHome
