import React, { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { useAuth } from '../../context/AuthContext'
import './Dashboard.css'

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1']

const HistoricAnalysis = () => {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      try {
        const userId = user.id
        const [sumRes, trendRes] = await Promise.all([
          fetch(`http://localhost:5000/api/analytics/summary?user_id=${userId}`),
          fetch(`http://localhost:5000/api/analytics/trends?user_id=${userId}`)
        ])
        if (sumRes.ok && trendRes.ok) {
          setSummary(await sumRes.json())
          setTrends(await trendRes.json())
        }
      } catch (e) {
        console.error('Analytics fetch failed', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const id = setInterval(fetchData, 60000)
    return () => clearInterval(id)
  }, [user?.id])

  if (loading) return <div className="dash-page"><p>Loading analytics...</p></div>

  return (
    <div className="dash-page" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <p style={{ fontSize: '11px', color: 'var(--c-text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px', fontFamily: 'var(--font-mono)' }}>Historic Overview</p>
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Greenhouse Performance (24h)</h2>
      </div>

      {/* KPI Cards */}
      <div className="kpi-row">
        <div className="kpi-box">
          <div>
            <p className="kpi-label">Total Alerts (24h)</p>
            <p className="kpi-value">{summary?.total_alerts_24h ?? 0}</p>
          </div>
          <div className={`kpi-delta ${summary?.total_alerts_24h > 10 ? 'neg' : 'pos'}`}>
            {summary?.total_alerts_24h > 10 ? 'Attention' : 'Optimal'}
          </div>
        </div>
        <div className="kpi-box" style={{ borderLeftColor: '#10b981' }}>
          <div>
            <p className="kpi-label">Health Score</p>
            <p className="kpi-value">{summary?.health_score ?? 0}<span className="kpi-unit">%</span></p>
          </div>
          <div className="kpi-delta pos">Stability</div>
        </div>
        <div className="kpi-box" style={{ borderLeftColor: '#6366f1' }}>
          <div>
            <p className="kpi-label">Primary Risk</p>
            <p className="kpi-value" style={{ fontSize: '18px', textTransform: 'uppercase' }}>
              {summary?.primary_risk ?? 'None'}
            </p>
          </div>
          <div className="kpi-delta">Attention</div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Sensor Trends Map */}
        <div className="chart-card" style={{ gridColumn: 'span 2' }}>
          <div className="chart-card-header">
            <h3 className="chart-card-title">24h Environmental Trends</h3>
          </div>
          <div className="chart-container" style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="temp" stroke="#ef4444" fillOpacity={1} fill="url(#colorTemp)" strokeWidth={2} name="Temperature (°C)" />
                <Area type="monotone" dataKey="humidity" stroke="#6366f1" fillOpacity={1} fill="url(#colorHum)" strokeWidth={2} name="Humidity (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Distribution */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Alert Distribution</h3>
          </div>
          <div className="chart-container" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary?.distribution?.length ? summary.distribution : [{ metric: 'All Clear', count: 1 }]}
                  cx="50%" cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="metric"
                >
                  {(summary?.distribution ?? [{}]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CO2 Stability */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">CO₂ Levels (24h)</h3>
          </div>
          <div className="chart-container" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="stepAfter" dataKey="co2" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} name="CO2 (ppm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HistoricAnalysis
