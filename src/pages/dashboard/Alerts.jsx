import './Dashboard.css'

const Alerts = () => {
  const demoAlerts = [
    { id: 1, type: 'critical', message: 'Critical: Pump #2 failure detected', time: '2 mins ago', icon: '🔴' },
    { id: 2, type: 'warning', message: 'Warning: Soil moisture low in Zone 3', time: '15 mins ago', icon: 'mj-warning' }, // Using a class-like string or just text
    { id: 3, type: 'info', message: 'System Update: Firmware v2.1 installed', time: '1 hour ago', icon: '🔵' },
    { id: 4, type: 'warning', message: 'Connection lost to Sensor Hub B', time: '3 hours ago', icon: '⚠️' },
    { id: 5, type: 'info', message: 'Scheduled irrigation completed for Sector A', time: '5 hours ago', icon: 'ℹ️' },
    { id: 6, type: 'critical', message: 'Security: Unauthorized access attempt', time: 'Yesterday', icon: '🔒' },
    { id: 7, type: 'info', message: 'Daily report generated', time: 'Yesterday', icon: '📄' },
  ];

  return (
    <div className="dash-page">
      <div className="page-header">
        <p className="eyebrow">Notifications page </p>
        <h2>Alerts</h2>
      </div>

      <div className="section-main">
        <div className="panel-header">
          <span className="panel-title">System Notifications</span>
          <button className="action-btn">Clear All</button>
        </div>
        <ul className="alert-list">
          {demoAlerts.map(alert => (
            <li key={alert.id} className="alert-item">
              <span className={`alert-icon ${alert.type}`}>
                {alert.type === 'critical' ? '!!' : alert.type === 'warning' ? '!' : 'i'}
              </span>
              <div className="alert-content">
                <p>{alert.message}</p>
                <span className="alert-time">{alert.time}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Alerts
