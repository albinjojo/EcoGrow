import { useState, useEffect } from 'react'
import './Dashboard.css'

const CROP_TYPES = ['tomato', 'capsicum', 'cucumber', 'lettuce', 'strawberry']
const CROP_STAGES = ['vegetative', 'flowering', 'fruiting']

const AIRiskPrediction = () => {
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [cropType, setCropType] = useState('lettuce')
  const [cropStage, setCropStage] = useState('vegetative')

  const fetchPrediction = async (type = cropType, stage = cropStage, isInitial = false) => {
    if (isInitial) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)
    try {
      const url = `http://localhost:5000/api/ai/predict?crop_type=${type}&crop_stage=${stage}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch prediction')
      setPrediction(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPrediction(cropType, cropStage, true)
    const id = setInterval(() => fetchPrediction(), 30000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCropChange = (type, stage) => {
    setCropType(type)
    setCropStage(stage)
    fetchPrediction(type, stage)
  }

  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s

  const riskBorderColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'var(--c-status-safe)'
      case 'moderate': return 'var(--c-status-warn)'
      case 'high': return 'var(--c-status-danger)'
      default: return 'var(--c-border-strong)'
    }
  }
  const riskBg = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'var(--c-status-safe-bg)'
      case 'moderate': return 'var(--c-status-warn-bg)'
      case 'high': return '#fee2e2'
      default: return 'var(--c-surface-muted)'
    }
  }

  return (
    <div className="dash-page" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        borderBottom: '1px solid var(--c-border-strong)', paddingBottom: '12px',
      }}>
        <div>
          <p style={{
            fontSize: '11px', color: 'var(--c-text-tertiary)', textTransform: 'uppercase',
            letterSpacing: '1px', marginBottom: '2px', fontFamily: 'var(--font-mono)'
          }}>
            AI Insights
          </p>
          <h2 style={{
            fontSize: '20px', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '-0.5px', color: 'var(--c-text-primary)'
          }}>
            AI Risk Prediction
          </h2>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--c-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          Live Monitoring
        </span>
      </div>

      {/* ── Crop selector ─────────────────────────────────────────────── */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border-strong)' }}>
        <div className="panel-header">
          <span className="panel-title">Crop Configuration</span>
          <button
            onClick={() => fetchPrediction(cropType, cropStage, false)}
            className="action-btn"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Run Analysis
          </button>
        </div>
        <div style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
            <label>Crop Type</label>
            <select
              value={cropType}
              onChange={(e) => handleCropChange(e.target.value, cropStage)}
              className="form-input"
            >
              {CROP_TYPES.map(t => <option key={t} value={t}>{cap(t)}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
            <label>Growth Stage</label>
            <select
              value={cropStage}
              onChange={(e) => handleCropChange(cropType, e.target.value)}
              className="form-input"
            >
              {CROP_STAGES.map(s => <option key={s} value={s}>{cap(s)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {loading && (
        <div style={{
          background: 'var(--c-surface)', border: '1px solid var(--c-border-strong)',
          padding: '32px', textAlign: 'center',
          fontSize: '13px', color: 'var(--c-text-secondary)', textTransform: 'uppercase',
          letterSpacing: '1px', fontFamily: 'var(--font-mono)',
        }}>
          Analysing {cap(cropType)} · {cap(cropStage)} with AI…
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: 'var(--c-surface)', border: '1px solid var(--c-status-danger)',
          borderLeft: '4px solid var(--c-status-danger)', padding: '16px',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--c-status-danger)', fontWeight: 600 }}>
            Error: {error}
          </p>
          <button onClick={() => fetchPrediction()} className="action-btn" style={{ marginTop: '10px' }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && prediction && (<>

        {/* ── Section 1: Live Sensor Readings ───────────────────────── */}
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border-strong)' }}>
          <div className="panel-header">
            <span className="panel-title">Live Sensor Readings</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {refreshing && (
                <span style={{ fontSize: '11px', color: 'var(--c-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  Refreshing…
                </span>
              )}
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--c-status-safe)', fontWeight: 600 }}>
                {prediction.sensor_snapshot?.timestamp ?? '—'}
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>

            {/* Temperature */}
            <div className="kpi-box" style={{ borderRight: '1px solid var(--c-border-subtle)' }}>
              <div>
                <p className="kpi-label">Avg Temperature</p>
                <p className="kpi-value">
                  {prediction.sensor_snapshot?.temp?.toFixed(1) ?? '—'}
                  <span className="kpi-unit">°C</span>
                </p>
              </div>
              <span className="kpi-delta">Live</span>
            </div>

            {/* Humidity */}
            <div className="kpi-box" style={{ borderRight: '1px solid var(--c-border-subtle)', borderLeft: 'none' }}>
              <div>
                <p className="kpi-label">Avg Humidity</p>
                <p className="kpi-value">
                  {prediction.sensor_snapshot?.humidity?.toFixed(1) ?? '—'}
                  <span className="kpi-unit">%</span>
                </p>
              </div>
              <span className="kpi-delta">Live</span>
            </div>

            {/* CO₂ */}
            <div className="kpi-box" style={{ borderLeft: 'none' }}>
              <div>
                <p className="kpi-label">Avg CO₂ Level</p>
                <p className="kpi-value">
                  {prediction.sensor_snapshot?.co2?.toFixed(0) ?? '—'}
                  <span className="kpi-unit">ppm</span>
                </p>
              </div>
              <span className="kpi-delta">Live</span>
            </div>

          </div>
        </div>

        {/* ── Section 2 & 3: Risk + Recommendations side by side ────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Risk Assessment */}
          <div style={{
            background: 'var(--c-surface)', border: '1px solid var(--c-border-strong)',
            borderLeft: `4px solid ${riskBorderColor(prediction.risk_level)}`,
          }}>
            <div className="panel-header">
              <span className="panel-title">Risk Assessment</span>
              {prediction.source && (
                <span className="status-badge" style={{
                  background: prediction.source === 'ml-model' ? '#e0f2fe' : 'var(--c-surface-muted)',
                  color: prediction.source === 'ml-model' ? '#0369a1' : 'var(--c-text-secondary)',
                  borderColor: prediction.source === 'ml-model' ? '#7dd3fc' : 'var(--c-border-strong)',
                }}>
                  {prediction.source === 'ml-model' ? 'ML Model' : 'Rule-based'}
                </span>
              )}
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  display: 'inline-block', padding: '4px 14px',
                  fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                  background: riskBg(prediction.risk_level),
                  color: riskBorderColor(prediction.risk_level),
                  border: `1px solid ${riskBorderColor(prediction.risk_level)}`,
                }}>
                  {prediction.risk_level}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--c-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  Score: <strong style={{ color: 'var(--c-text-primary)' }}>{prediction.confidence_score}%</strong>
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--c-text-secondary)', lineHeight: 1.6 }}>
                {prediction.analysis}
              </p>
            </div>
          </div>

          {/* AI Recommendations */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border-strong)' }}>
            <div className="panel-header">
              <span className="panel-title">AI Recommendations</span>
              <span style={{
                fontSize: '11px', color: 'var(--c-text-tertiary)',
                fontFamily: 'var(--font-mono)', fontWeight: 600,
              }}>
                {cap(cropType)} · {cap(cropStage)}
              </span>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {prediction.recommendations.map((rec, i) => (
                <li key={i} className="alert-item">
                  <span className="alert-icon info" style={{
                    fontSize: '11px', fontWeight: 700,
                    fontFamily: 'var(--font-mono)', minWidth: '16px', textAlign: 'center'
                  }}>
                    {i + 1}
                  </span>
                  <div className="alert-content">
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--c-text-primary)' }}>
                      {rec}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Refresh */}
        <div>
          <button onClick={() => fetchPrediction(cropType, cropStage, false)} className="btn-ghost" disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh Analysis'}
          </button>
        </div>

      </>)}
    </div>
  )
}

export default AIRiskPrediction
