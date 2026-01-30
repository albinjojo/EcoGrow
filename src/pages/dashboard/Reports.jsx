import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import './Dashboard.css'

const Reports = () => {
  const [reportsData, setReportsData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/sensors/reports')
        if (response.ok) {
          const data = await response.json()
          setReportsData(data)
        }
      } catch (err) {
        console.error('Failed to fetch reports:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  // Reverse data for the table to show newest first
  const tableData = [...reportsData].reverse()

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = tableData.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(tableData.length / itemsPerPage)

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1)
  }

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1)
  }

  return (
    <div className="dash-page">
      <div className="page-header">
        <p className="eyebrow">Analytics & History</p>
        <h2>Environmental Reports</h2>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr', gap: '24px' }}>

        {/* Timeline Chart */}
        <div className="chart-card" style={{ minHeight: '400px' }}>
          <div className="chart-card-header">
            <h4 className="chart-card-title">Sensor Timeline (Last 1000 Readings)</h4>
            <div className="status-badge active">Historical Analysis</div>
          </div>
          <div className="chart-container" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportsData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--c-border)" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 10 }}
                  hide={true} // Hide many timestamps to avoid clutter
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--c-surface-2)', borderColor: 'var(--c-border)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="temp" name="Temp (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="co2" name="CO2 (ppm)" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Table */}
        <div className="section-main" style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <header className="panel-header" style={{ marginBottom: '0' }}>
            <span className="panel-title">Detailed Sensor Logs</span>
          </header>

          <div className="placeholder-card" style={{ padding: '0', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>Loading sensor data...</div>
            ) : reportsData.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>No sensor data found in database.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead style={{ background: 'var(--c-surface-2)', borderBottom: '1px solid var(--c-border)' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Timestamp</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Temp (°C)</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Humidity (%)</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>CO2 (ppm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--c-border)' }}>
                        <td style={{ padding: '12px 16px' }}>{row.timestamp}</td>
                        <td style={{ padding: '12px 16px' }}>{row.temp}</td>
                        <td style={{ padding: '12px 16px' }}>{row.humidity}</td>
                        <td style={{ padding: '12px 16px' }}>{row.co2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--c-border)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--c-text-secondary)' }}>
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, tableData.length)} of {tableData.length} entries
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className="btn-ghost"
                      style={{ fontSize: '12px', padding: '6px 12px', opacity: currentPage === 1 ? 0.5 : 1 }}
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: '12px', padding: '6px 12px', background: 'var(--c-surface-2)', borderRadius: '4px' }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className="btn-ghost"
                      style={{ fontSize: '12px', padding: '6px 12px', opacity: currentPage === totalPages ? 0.5 : 1 }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
