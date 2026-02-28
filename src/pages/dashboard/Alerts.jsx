import { useState, useEffect } from 'react'
import './Dashboard.css'

const SEVERITY_COLOR = {
  critical: { border: '#ef4444', bg: '#fff1f2', badge: '#fee2e2', text: '#991b1b', icon: '🚨' },
  warning: { border: '#f59e0b', bg: '#fffbeb', badge: '#fef3c7', text: '#92400e', icon: '⚠️' },
}

const METRIC_ICON = { temp: '🌡️', humidity: '💧', co2: '🌿' }

const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s

function timeAgo(isoStr) {
  if (!isoStr) return '—'
  const diffMs = Date.now() - new Date(isoStr + 'Z').getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return new Date(isoStr + 'Z').toLocaleDateString()
}

const PAGE_SIZE = 20

const Alerts = () => {
  const [alerts, setAlerts] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')   // all | critical | warning

  const fetchAlerts = async (off = offset, sev = filter, isInitial = false) => {
    if (isInitial) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const sevParam = sev !== 'all' ? `&severity=${sev}` : ''
      const res = await fetch(`http://localhost:5000/api/alerts?limit=${PAGE_SIZE}&offset=${off}${sevParam}`)
      if (!res.ok) throw new Error('Failed to fetch alerts')
      const data = await res.json()
      setAlerts(data.alerts ?? [])
      setTotal(data.total ?? 0)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial load + 30s auto-refresh
  useEffect(() => {
    fetchAlerts(0, filter, true)
    const id = setInterval(() => fetchAlerts(offset, filter), 30_000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePage = (newOffset) => {
    setOffset(newOffset)
    fetchAlerts(newOffset, filter)
  }

  const handleFilter = (f) => {
    setFilter(f)
    setOffset(0)
    fetchAlerts(0, f)
  }

  const visible = alerts   // already filtered by backend
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <div className="dash-page" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        borderBottom: '1px solid var(--c-border-strong)', paddingBottom: '10px',
      }}>
        <div>
          <p style={{ fontSize: '11px', color: 'var(--c-text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px', fontFamily: 'var(--font-mono)' }}>
            Notifications
          </p>
          <h2 style={{ fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.5px', color: 'var(--c-text-primary)' }}>
            Crop Alerts
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {refreshing && (
            <span style={{ fontSize: '11px', color: 'var(--c-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              Refreshing…
            </span>
          )}
          <span style={{ fontSize: '11px', color: 'var(--c-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            {total} total · auto-refreshes every 30s
          </span>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {['all', 'critical', 'warning'].map(f => (
          <button
            key={f}
            onClick={() => handleFilter(f)}
            style={{
              padding: '5px 14px', fontSize: '11px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.6px',
              fontFamily: 'var(--font-mono)', cursor: 'pointer', border: '1px solid',
              borderColor: filter === f
                ? (f === 'critical' ? '#ef4444' : f === 'warning' ? '#f59e0b' : 'var(--c-text-primary)')
                : 'var(--c-border-strong)',
              background: filter === f
                ? (f === 'critical' ? '#fee2e2' : f === 'warning' ? '#fef3c7' : 'var(--c-text-primary)')
                : 'transparent',
              color: filter === f
                ? (f === 'critical' ? '#991b1b' : f === 'warning' ? '#92400e' : 'var(--c-surface)')
                : 'var(--c-text-secondary)',
            }}
          >
            {f === 'all' ? `All (${total})` : cap(f)}
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{
          background: 'var(--c-surface)', border: '1px solid var(--c-border-strong)',
          padding: '28px', textAlign: 'center', fontSize: '13px',
          color: 'var(--c-text-secondary)', fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase', letterSpacing: '1px',
        }}>
          Loading alert history…
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: 'var(--c-surface)', border: '1px solid var(--c-status-danger)',
          borderLeft: '4px solid var(--c-status-danger)', padding: '16px',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--c-status-danger)', fontWeight: 600 }}>
            Error: {error}
          </p>
          <button onClick={() => fetchAlerts(offset, true)} className="action-btn" style={{ marginTop: '10px' }}>
            Retry
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && visible.length === 0 && (
        <div style={{
          background: 'var(--c-surface)', border: '1px solid var(--c-border-strong)',
          padding: '48px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '24px', marginBottom: '8px' }}>✅</p>
          <p style={{ fontSize: '13px', color: 'var(--c-text-secondary)', fontFamily: 'var(--font-mono)' }}>
            No {filter === 'all' ? '' : filter} alerts recorded yet.
          </p>
          <p style={{ fontSize: '12px', color: 'var(--c-text-tertiary)', marginTop: '4px' }}>
            Alerts are saved automatically when sensor readings go out of range.
          </p>
        </div>
      )}

      {/* ── Alert table ── */}
      {!loading && !error && visible.length > 0 && (
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border-strong)' }}>
          <div className="panel-header">
            <span className="panel-title">Alert History</span>
            <span style={{ fontSize: '11px', color: 'var(--c-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '90px 80px 90px 120px 1fr 160px',
            padding: '8px 16px',
            background: 'var(--c-surface-muted)',
            borderBottom: '1px solid var(--c-border-subtle)',
          }}>
            {['Time', 'Severity', 'Metric', 'Crop', 'Message + Suggestion', 'Reading vs Ideal'].map(h => (
              <span key={h} style={{
                fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.8px', color: 'var(--c-text-tertiary)', fontFamily: 'var(--font-mono)',
              }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {visible.map((a, idx) => {
            const sty = SEVERITY_COLOR[a.severity] || SEVERITY_COLOR.warning
            const isLast = idx === visible.length - 1
            return (
              <div
                key={a.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 80px 90px 120px 1fr 160px',
                  padding: '12px 16px',
                  borderBottom: isLast ? 'none' : '1px solid var(--c-border-subtle)',
                  borderLeft: `3px solid ${sty.border}`,
                  background: idx % 2 === 0 ? 'transparent' : 'var(--c-surface-muted)',
                  alignItems: 'flex-start',
                  gap: '0',
                }}
              >
                {/* Time */}
                <span style={{ fontSize: '11px', color: 'var(--c-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {timeAgo(a.created_at)}
                </span>

                {/* Severity badge */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.5px', fontFamily: 'var(--font-mono)',
                  padding: '2px 7px', alignSelf: 'flex-start',
                  background: sty.badge, color: sty.text,
                  border: `1px solid ${sty.border}`,
                }}>
                  {sty.icon} {a.severity}
                </span>

                {/* Metric */}
                <span style={{ fontSize: '12px', color: 'var(--c-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {METRIC_ICON[a.metric] ?? '📊'} {a.metric?.toUpperCase()}
                </span>

                {/* Crop + stage */}
                <span style={{ fontSize: '12px', color: 'var(--c-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {cap(a.crop_type)}<br />
                  <span style={{ fontSize: '10px', color: 'var(--c-text-tertiary)' }}>{cap(a.crop_stage)}</span>
                </span>

                {/* Message + Suggestion */}
                <div style={{ paddingRight: '12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--c-text-primary)', marginBottom: '3px' }}>
                    {a.message}
                  </p>
                  {a.suggestion && (
                    <p style={{ fontSize: '11px', color: 'var(--c-text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                      💡 {a.suggestion}
                    </p>
                  )}
                </div>

                {/* Reading vs Ideal */}
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: sty.border }}>
                    {typeof a.value === 'number' ? a.value.toFixed(1) : a.value}
                  </p>
                  <p style={{ fontSize: '10px', color: 'var(--c-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    ideal: {a.ideal_min}–{a.ideal_max}
                  </p>
                  {/* Mini deviation bar */}
                  <div style={{ marginTop: '4px', height: '4px', background: 'var(--c-border-subtle)', width: '80px', position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: `${Math.max(0, Math.min(100, ((a.ideal_min - 0) / (a.ideal_max * 1.5)) * 100))}%`,
                      width: `${Math.max(4, Math.min(100, ((a.ideal_max - a.ideal_min) / (a.ideal_max * 1.5)) * 100))}%`,
                      height: '100%', background: 'var(--c-status-safe)', opacity: 0.5,
                    }} />
                  </div>
                </div>
              </div>
            )
          })}

          {/* ── Pagination ── */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderTop: '1px solid var(--c-border-subtle)',
          }}>
            <button
              className="btn-ghost"
              disabled={offset === 0}
              onClick={() => handlePage(Math.max(0, offset - PAGE_SIZE))}
            >
              ← Previous
            </button>
            <span style={{ fontSize: '11px', color: 'var(--c-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </span>
            <button
              className="btn-ghost"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => handlePage(offset + PAGE_SIZE)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Alerts
