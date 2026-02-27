import { useState, useEffect, useRef, useCallback } from 'react'
import './Dashboard.css'

/* ══════════════════════════════════════════════════════════════
   Toast Alert System
══════════════════════════════════════════════════════════════ */
const TOAST_DURATION = 8000  // ms before auto-dismiss

const SEVERITY_STYLES = {
  warning: {
    border: '#f59e0b',
    bg: '#fffbeb',
    icon: '⚠️',
    badge: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  },
  critical: {
    border: '#ef4444',
    bg: '#fff1f2',
    icon: '🚨',
    badge: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  },
}

const METRIC_ICONS = { temp: '🌡️', humidity: '💧', co2: '🌿' }

const AlertToast = ({ toast, onDismiss }) => {
  const [progress, setProgress] = useState(100)
  const [exiting, setExiting] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    const start = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100)
      setProgress(pct)
      if (pct <= 0) {
        clearInterval(intervalRef.current)
        handleDismiss()
      }
    }, 80)
    return () => clearInterval(intervalRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDismiss = () => {
    setExiting(true)
    setTimeout(() => onDismiss(toast.id), 320)
  }

  const sty = SEVERITY_STYLES[toast.severity] || SEVERITY_STYLES.warning
  const metricIcon = METRIC_ICONS[toast.metric] || '📊'

  return (
    <div
      style={{
        background: sty.bg,
        border: `1px solid ${sty.border}`,
        borderLeft: `4px solid ${sty.border}`,
        borderRadius: '0',
        padding: '12px 36px 0 14px',
        width: '320px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
        position: 'relative',
        overflow: 'hidden',
        transform: exiting ? 'translateX(360px)' : 'translateX(0)',
        opacity: exiting ? 0 : 1,
        transition: 'transform 0.32s cubic-bezier(0.4,0,1,1), opacity 0.28s ease',
        animation: 'toast-slide-in 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Close button */}
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute', top: '8px', right: '10px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '14px', color: '#6b7280', lineHeight: 1, padding: '2px 4px',
        }}
        aria-label="Dismiss alert"
      >✕</button>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '16px', lineHeight: 1, marginTop: '1px', flexShrink: 0 }}>{sty.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.6px', fontFamily: 'var(--font-mono)',
              padding: '2px 7px',
              background: sty.badge.bg, color: sty.badge.color,
              border: `1px solid ${sty.badge.border}`,
            }}>
              {toast.severity}
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#6b7280' }}>
              {metricIcon} {toast.label.toUpperCase()}
            </span>
          </div>
          <p style={{
            fontSize: '13px', fontWeight: 600, color: '#111827',
            marginTop: '4px', lineHeight: 1.4,
          }}>
            {toast.message}
          </p>
        </div>
      </div>

      {/* Gemini suggestion */}
      {toast.suggestion && (
        <p style={{
          fontSize: '11.5px', color: '#4b5563', fontStyle: 'italic',
          lineHeight: 1.5, marginBottom: '10px',
          borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: '6px',
        }}>
          💡 {toast.suggestion}
        </p>
      )}

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '3px', background: 'rgba(0,0,0,0.07)',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: sty.border,
          transition: 'width 0.08s linear',
        }} />
      </div>
    </div>
  )
}

const AlertToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null
  return (
    <div style={{
      position: 'fixed', top: '16px', right: '16px',
      zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: '10px',
      pointerEvents: 'none',
    }}>
      {toasts.slice(0, 5).map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <AlertToast toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}

const CROP_TYPES = ['tomato', 'capsicum', 'cucumber', 'lettuce', 'strawberry']
const CROP_STAGES = ['vegetative', 'flowering', 'fruiting']

/* ── Crop accent colours ─────────────────────────────────────── */
const CROP_COLORS = {
  tomato: { primary: '#e53e3e', secondary: '#fc8181', soil: '#8B6355', leaf: '#38a169' },
  capsicum: { primary: '#d97706', secondary: '#fbbf24', soil: '#7a5c44', leaf: '#2f855a' },
  cucumber: { primary: '#2f855a', secondary: '#68d391', soil: '#6b7c5d', leaf: '#276749' },
  lettuce: { primary: '#3182ce', secondary: '#90cdf4', soil: '#5d7060', leaf: '#48bb78' },
  strawberry: { primary: '#e53e3e', secondary: '#feb2b2', soil: '#8B6355', leaf: '#276749' },
}

/* ── Stage metadata ─────────────────────────────────────────── */
const STAGE_META = {
  vegetative: { label: 'Vegetative', icon: '🌱', desc: 'Leaf & stem growth' },
  flowering: { label: 'Flowering', icon: '🌸', desc: 'Bud formation' },
  fruiting: { label: 'Fruiting', icon: '🍅', desc: 'Fruit development' },
}

/* ── Animated plant SVG per stage (compact 80x100) ──────────── */
const PlantSVG = ({ stage, colors }) => {
  const { primary, secondary, soil, leaf } = colors

  if (stage === 'vegetative') {
    return (
      <svg viewBox="0 0 80 100" width="150" height="180" className="gs-plant-svg gs-anim-float">
        <ellipse cx="40" cy="92" rx="30" ry="7" fill={soil} opacity="0.65" />
        <path d="M40 90 Q38 72 40 55 Q42 40 40 26" stroke={leaf} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <path d="M40 70 Q24 62 20 46 Q34 48 40 62" fill={leaf} opacity="0.9" />
        <path d="M40 52 Q26 44 22 30 Q36 33 40 47" fill={leaf} opacity="0.75" />
        <path d="M40 70 Q56 62 60 46 Q46 48 40 62" fill={leaf} opacity="0.9" />
        <path d="M40 52 Q54 44 58 30 Q44 33 40 47" fill={leaf} opacity="0.75" />
        <circle cx="40" cy="22" r="5" fill={leaf} />
        <circle cx="40" cy="22" r="2.5" fill="#c6f6d5" />
      </svg>
    )
  }

  if (stage === 'flowering') {
    return (
      <svg viewBox="0 0 80 100" width="150" height="180" className="gs-plant-svg gs-anim-sway">
        <ellipse cx="40" cy="92" rx="30" ry="7" fill={soil} opacity="0.65" />
        <path d="M40 90 Q38 72 40 55 Q42 38 40 22" stroke={leaf} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <path d="M40 68 Q24 58 18 44 Q34 48 40 60" fill={leaf} opacity="0.85" />
        <path d="M40 68 Q56 58 62 44 Q46 48 40 60" fill={leaf} opacity="0.85" />
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <ellipse key={i}
            cx={40 + 9 * Math.cos((angle * Math.PI) / 180)}
            cy={20 + 9 * Math.sin((angle * Math.PI) / 180)}
            rx="5" ry="3"
            fill={secondary}
            className="gs-anim-bloom"
            style={{ animationDelay: `${i * 0.12}s`, transform: `rotate(${angle}deg)`, transformOrigin: '40px 20px' }}
          />
        ))}
        <circle cx="40" cy="20" r="6" fill={primary} />
        <circle cx="40" cy="20" r="3" fill="#fffde7" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 80 100" width="150" height="180" className="gs-plant-svg gs-anim-sway">
      <ellipse cx="40" cy="92" rx="30" ry="7" fill={soil} opacity="0.65" />
      <path d="M40 90 Q38 72 40 55 Q42 36 40 22" stroke={leaf} strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path d="M40 64 Q22 54 16 40 Q32 44 40 56" fill={leaf} opacity="0.85" />
      <path d="M40 64 Q58 54 64 40 Q48 44 40 56" fill={leaf} opacity="0.85" />
      <circle cx="28" cy="48" r="9" fill={primary} className="gs-anim-float" style={{ animationDelay: '0.2s' }} />
      <circle cx="28" cy="48" r="9" fill="white" opacity="0.15" />
      <circle cx="52" cy="50" r="7.5" fill={primary} className="gs-anim-float" style={{ animationDelay: '0.5s' }} />
      <circle cx="52" cy="50" r="7.5" fill="white" opacity="0.15" />
      <circle cx="40" cy="34" r="7" fill={primary} className="gs-anim-float" style={{ animationDelay: '0.8s' }} />
      <path d="M28 39 Q30 33 28 30" stroke={leaf} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M52 42 Q54 36 52 33" stroke={leaf} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M40 27 Q42 21 40 18" stroke={leaf} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/* ── Keyframe injector (runs once) ──────────────────────────── */
const KEYFRAMES_ID = 'gs-keyframes'
function injectKeyframes() {
  if (document.getElementById(KEYFRAMES_ID)) return
  const style = document.createElement('style')
  style.id = KEYFRAMES_ID
  style.textContent = `
    @keyframes gs-float {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-5px); }
    }
    @keyframes gs-sway {
      0%, 100% { transform: rotate(-2deg); }
      50%       { transform: rotate(2deg); }
    }
    @keyframes gs-bloom {
      0%, 100% { opacity: 0.7; transform: scale(1); }
      50%       { opacity: 1;   transform: scale(1.15); }
    }
    @keyframes gs-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes toast-slide-in {
      from { transform: translateX(380px); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    .gs-plant-svg     { transition: all 0.35s ease; }
    .gs-anim-float    { animation: gs-float 3s ease-in-out infinite; }
    .gs-anim-sway     { animation: gs-sway  4s ease-in-out infinite; transform-origin: 40px 90px; }
    .gs-anim-bloom    { animation: gs-bloom 2s ease-in-out infinite; }
  `
  document.head.appendChild(style)
}

/* ── Compact inline visualizer (no own panel — lives inside config box) ── */
const CompactVisualizer = ({ cropType, cropStage, colors }) => {
  const stageIndex = CROP_STAGES.indexOf(cropStage)
  const prevStage = useRef(cropStage)
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    if (prevStage.current !== cropStage) {
      setAnimKey(k => k + 1)
      prevStage.current = cropStage
    }
  }, [cropStage])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '16px',
      background: 'linear-gradient(135deg, #f0faf0 0%, #e8f5e9 100%)',
      border: `1.5px solid ${colors.leaf}40`,
      padding: '10px 16px',
      flex: 1, height: '100%', boxSizing: 'border-box',
    }}>
      {/* Mini plant */}
      <div key={animKey} style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 14px, ${colors.leaf}12 14px, ${colors.leaf}12 15px),
                            repeating-linear-gradient(90deg, transparent, transparent 14px, ${colors.leaf}12 14px, ${colors.leaf}12 15px)`,
          borderRadius: '2px',
        }} />
        <PlantSVG stage={cropStage} colors={colors} />
      </div>

      {/* Stage info + timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.2px', color: 'var(--c-text-primary)', marginBottom: '3px' }}>
            {STAGE_META[cropStage]?.icon} {STAGE_META[cropStage]?.label}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--c-text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {STAGE_META[cropStage]?.desc}
          </p>
        </div>

        {/* Mini timeline */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{
            position: 'absolute', top: '50%', left: '8px', right: '8px',
            height: '2px', background: 'var(--c-border-subtle)', transform: 'translateY(-50%)', zIndex: 0,
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: '8px',
            width: stageIndex === 0 ? '0%' : stageIndex === 1 ? '50%' : '100%',
            height: '2px', background: colors.primary, transform: 'translateY(-50%)',
            zIndex: 0, transition: 'width 0.6s ease',
          }} />
          {CROP_STAGES.map((s, i) => {
            const active = i === stageIndex
            const passed = i < stageIndex
            return (
              <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: active ? '14px' : '10px', height: active ? '14px' : '10px',
                  borderRadius: '50%',
                  background: active ? colors.primary : passed ? colors.secondary : 'var(--c-surface)',
                  border: `2px solid ${active ? colors.primary : passed ? colors.secondary : 'var(--c-border-strong)'}`,
                  transition: 'all 0.4s ease',
                  boxShadow: active ? `0 0 0 3px ${colors.primary}30` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {(active || passed) && (
                    <span style={{ fontSize: '7px', color: 'white', fontWeight: 700 }}>✓</span>
                  )}
                </div>
                <span style={{
                  fontSize: '8px', fontFamily: 'var(--font-mono)',
                  color: active ? colors.primary : 'var(--c-text-tertiary)',
                  textTransform: 'uppercase', marginTop: '3px', letterSpacing: '0.3px',
                  fontWeight: active ? 700 : 400,
                  transition: 'color 0.4s ease',
                }}>
                  {s.slice(0, 4)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


/* ════════════════════════════════════════════════════════════════
   Main page component
════════════════════════════════════════════════════════════════ */
const AIRiskPrediction = () => {
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [predicting, setPredicting] = useState(false)   // instant per-crop feedback
  const [error, setError] = useState(null)
  const [cropType, setCropType] = useState('lettuce')
  const [cropStage, setCropStage] = useState('vegetative')

  // ── Toast state ─────────────────────────────────────────────
  const [toasts, setToasts] = useState([])
  // Map of metric → timestamp when alert was last shown. Re-fires after ALERT_REFIRE_MS.
  const ALERT_REFIRE_MS = 60_000  // 1 minute
  const lastAlertTimeRef = useRef({})  // { [metric]: timestamp }

  useEffect(() => { injectKeyframes() }, [])

  // Always-current ref — interval never uses stale closure values
  const cropRef = useRef({ type: cropType, stage: cropStage })
  const abortRef = useRef(null)   // cancel in-flight fetch on rapid changes

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const fetchPrediction = async (type = cropRef.current.type, stage = cropRef.current.stage, isInitial = false) => {
    // Cancel any previous in-flight request
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    if (isInitial) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const url = `http://localhost:5000/api/ai/predict?crop_type=${type}&crop_stage=${stage}`
      const res = await fetch(url, { signal: ctrl.signal })
      if (!res.ok) throw new Error('Failed to fetch prediction')
      const data = await res.json()
      setPrediction(data)

      // ── Handle alerts → toasts (re-fires every 1 min if condition persists) ──
      const incoming = data.alerts ?? []
      const now = Date.now()

      // Clear timestamps for metrics that went back in range
      Object.keys(lastAlertTimeRef.current).forEach(m => {
        if (!incoming.find(a => a.metric === m)) delete lastAlertTimeRef.current[m]
      })

      // Fire toast if: never shown before, OR last shown > 1 min ago
      const newToasts = incoming
        .filter(a => {
          const last = lastAlertTimeRef.current[a.metric]
          return !last || (now - last) >= ALERT_REFIRE_MS
        })
        .map(a => ({ ...a, id: `${a.metric}-${now}` }))

      if (newToasts.length > 0) {
        newToasts.forEach(t => { lastAlertTimeRef.current[t.metric] = now })
        setToasts(prev => [...newToasts, ...prev])
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setPredicting(false)
    }
  }

  useEffect(() => {
    fetchPrediction(cropRef.current.type, cropRef.current.stage, true)
    const id = setInterval(() => fetchPrediction(), 30000)
    return () => { clearInterval(id); abortRef.current?.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCropChange = (type, stage) => {
    cropRef.current = { type, stage }
    setCropType(type)
    setCropStage(stage)
    setPredicting(true)           // instant UI feedback — risk card dims immediately
    // Reset toast timestamps — new crop has different thresholds
    lastAlertTimeRef.current = {}
    setToasts([])
    fetchPrediction(type, stage)
  }


  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s
  const colors = CROP_COLORS[cropType] || CROP_COLORS.lettuce

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
    <>
      <AlertToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="dash-page" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          borderBottom: '1px solid var(--c-border-strong)', paddingBottom: '10px',
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

        {/* ── Crop Configuration + Growth Visualizer (single row) ─────── */}
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

          {/* Selectors + compact visualizer in one row */}
          <div style={{ display: 'flex', gap: '0', alignItems: 'stretch' }}>

            {/* Dropdowns — compact fixed width */}
            <div style={{ flex: '0 0 260px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
              <div className="form-group">
                <label>Crop Type</label>
                <select
                  value={cropType}
                  onChange={(e) => handleCropChange(e.target.value, cropStage)}
                  className="form-input"
                >
                  {CROP_TYPES.map(t => <option key={t} value={t}>{cap(t)}</option>)}
                </select>
              </div>
              <div className="form-group">
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

            {/* Divider */}
            <div style={{ width: '1px', background: 'var(--c-border-subtle)', margin: '12px 0' }} />

            {/* Visualizer — gets remaining space */}
            <div style={{ flex: 1, padding: '8px 8px 8px 0' }}>
              <CompactVisualizer cropType={cropType} cropStage={cropStage} colors={colors} />
            </div>

          </div>
        </div>

        {/* ── Loading ───────────────────────────────────────────────────── */}
        {loading && (
          <div style={{
            background: 'var(--c-surface)', border: '1px solid var(--c-border-strong)',
            padding: '28px', textAlign: 'center',
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

          {/* ── Live Sensor Readings ───────────────────────────────────── */}
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

          {/* ── Risk Assessment + AI Recommendations ──────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Risk Assessment — HERO */}
            <div style={{
              background: 'var(--c-surface)',
              border: `1px solid ${riskBorderColor(prediction.risk_level)}`,
              borderLeft: `5px solid ${riskBorderColor(prediction.risk_level)}`,
              position: 'relative', overflow: 'hidden',
              transition: 'opacity 0.2s ease',
              opacity: predicting ? 0.55 : 1,
            }}>
              {/* Instant "predicting" overlay — shown as soon as dropdown changes */}
              {predicting && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(2px)',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px', height: '28px', border: '3px solid var(--c-border-subtle)',
                      borderTop: `3px solid ${riskBorderColor(prediction.risk_level)}`,
                      borderRadius: '50%',
                      animation: 'gs-spin 0.7s linear infinite',
                    }} />
                    <span style={{
                      fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                      letterSpacing: '1px', color: 'var(--c-text-secondary)', fontWeight: 600,
                    }}>
                      Analysing {cap(cropType)} · {cap(cropStage)}…
                    </span>
                  </div>
                </div>
              )}

              {/* Faint bg wash */}
              <div style={{
                position: 'absolute', inset: 0,
                background: riskBg(prediction.risk_level),
                opacity: 0.45, pointerEvents: 'none',
              }} />

              <div className="panel-header" style={{ position: 'relative', zIndex: 1 }}>
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

              <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', zIndex: 1 }}>

                {/* Risk level pill + big score */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '7px 20px',
                    background: riskBorderColor(prediction.risk_level),
                    color: 'white',
                    fontWeight: 900, fontSize: '17px', textTransform: 'uppercase', letterSpacing: '1.5px',
                    boxShadow: `0 4px 14px ${riskBorderColor(prediction.risk_level)}50`,
                  }}>
                    {prediction.risk_level?.toLowerCase() === 'high' && '⚠ '}
                    {prediction.risk_level?.toLowerCase() === 'moderate' && '⚡ '}
                    {prediction.risk_level?.toLowerCase() === 'low' && '✓ '}
                    {prediction.risk_level}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <p style={{
                      fontSize: '42px', fontWeight: 900, fontFamily: 'var(--font-mono)',
                      color: riskBorderColor(prediction.risk_level), lineHeight: 1,
                    }}>
                      {prediction.confidence_score}
                      <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--c-text-tertiary)' }}>%</span>
                    </p>
                    <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--c-text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      Risk Score
                    </p>
                  </div>
                </div>

                {/* Score bar */}
                <div>
                  <div style={{ height: '7px', background: 'var(--c-border-subtle)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${prediction.confidence_score}%`,
                      background: `linear-gradient(90deg, ${riskBorderColor(prediction.risk_level)}77, ${riskBorderColor(prediction.risk_level)})`,
                      transition: 'width 0.9s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--c-text-tertiary)' }}>0</span>
                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--c-text-tertiary)' }}>100</span>
                  </div>
                </div>

                {/* Analysis */}
                <p style={{
                  fontSize: '12px', color: 'var(--c-text-secondary)', lineHeight: 1.65,
                  borderTop: '1px solid var(--c-border-subtle)', paddingTop: '12px',
                }}>
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
    </>
  )
}

export default AIRiskPrediction
