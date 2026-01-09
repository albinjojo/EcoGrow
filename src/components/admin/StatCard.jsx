/**
 * StatCard component - Display key metrics in admin dashboard
 */
const StatCard = ({ title, value, subtitle, icon, trend, variant = 'default' }) => {
  return (
    <div className={`stat-card stat-card-${variant}`}>
      <div className="stat-header">
        <h3 className="stat-title">{title}</h3>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-footer">
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
        {trend && <span className={`stat-trend trend-${trend.direction}`}>{trend.text}</span>}
      </div>
    </div>
  )
}

export default StatCard
