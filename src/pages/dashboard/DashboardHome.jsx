import './Dashboard.css'

const metrics = [
  { label: 'Avg Temperature', value: '24.2', unit: '°C', delta: '+0.5%' },
  { label: 'Avg Humidity', value: '65', unit: '%', delta: '0%' },
  { label: 'Avg CO2', value: '440', unit: 'ppm', delta: '-1.2%' },
]

const sensors = [
  { name: 'Temp Sensor 01', zone: 'Zone A · North', status: 'Active', reading: '24.5 °C', trend: 'rise' },
  { name: 'Humidity Sensor 04', zone: 'Zone A · East', status: 'Active', reading: '68 %', trend: 'stable' },
  { name: 'CO2 Level', zone: 'Zone A · General', status: 'Active', reading: '450 ppm', trend: 'rise' },
  { name: 'Temp Sensor 02', zone: 'Zone B · Center', status: 'Low', reading: '12 %', trend: 'drop' },
]

const DashboardHome = () => {
  return (
    <div className="dash-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Live environmental metrics · Zone A</p>
          <h2>Real-Time Monitoring</h2>
        </div>
        <div className="status-chip" role="status">
          <span className="status-dot" aria-hidden />
          Live
        </div>
      </div>

      <section className="metric-grid" aria-label="Summary metrics">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <header className="metric-header">
              <p className="metric-label">{metric.label}</p>
              <span className="metric-delta">{metric.delta}</span>
            </header>
            <p className="metric-value">
              {metric.value}
              <span className="metric-unit">{metric.unit}</span>
            </p>
          </article>
        ))}
      </section>

      <section className="section-block">
        <header className="section-header">
          <h3>Active Sensors</h3>
          <div className="pill-group" role="list">
            <span className="pill pill-active">All</span>
            <span className="pill">Temperature</span>
            <span className="pill">Humidity</span>
            <span className="pill">Air</span>
          </div>
        </header>

        <div className="sensor-grid">
          {sensors.map((sensor) => (
            <article className="sensor-card" key={sensor.name}>
              <header className="sensor-header">
                <div>
                  <p className="sensor-name">{sensor.name}</p>
                  <p className="sensor-zone">{sensor.zone}</p>
                </div>
                <span className={`status-badge ${sensor.status === 'Active' ? 'badge-good' : 'badge-warn'}`}>
                  {sensor.status}
                </span>
              </header>
              <div className="sensor-body">
                <p className="sensor-reading">{sensor.reading}</p>
                <div className={`sparkline spark-${sensor.trend}`} aria-hidden />
              </div>
              <footer className="sensor-footer">
                <button className="ghost-action" type="button">
                  Details
                </button>
                <button className="primary-action" type="button">
                  View
                </button>
              </footer>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default DashboardHome
