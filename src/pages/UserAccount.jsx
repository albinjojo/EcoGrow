import { useEffect, useState } from 'react'
import './dashboard/Dashboard.css'
import { getAccountProfile, updateAccountProfile } from '../services/api'

const initialState = { email: '', full_name: '', phone_number: '', country: '', state_region: '' }

const UserAccount = () => {
  const [form, setForm] = useState(initialState)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAccountProfile()
        const p = res.profile || {}
        setForm({
          email: res.email || '',
          full_name: p.full_name || '',
          phone_number: p.phone_number || '',
          country: p.country || '',
          state_region: p.state_region || '',
        })
      } catch (err) {
        setStatus({ type: 'error', message: err.message || 'Unable to load account details.' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (status) setStatus(null)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    setSaving(true)
    try {
      await updateAccountProfile(form)
      setStatus({ type: 'success', message: 'Account details saved successfully.' })
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Unable to save right now.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="section-main" style={{ padding: '24px' }}>
          <p style={{ color: 'var(--c-text-tertiary)', fontFamily: 'var(--font-mono)' }}>LOADING PROFILE DATA...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-content">
      <div className="grid-header">
        <div>
          <p className="eyebrow" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--c-text-tertiary)', fontWeight: '700', letterSpacing: '0.5px' }}>Settings</p>
          <h2 style={{ fontSize: '24px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>User Profile</h2>
        </div>
      </div>

      <div className="section-main">
        <div className="form-header" style={{ margin: '0', padding: '16px 24px', background: 'var(--c-surface-muted)', borderBottom: '1px solid var(--c-border-subtle)' }}>
          <h2 style={{ fontSize: '14px' }}>Personal Information</h2>
          <p>Manage your account details and contact information.</p>
        </div>

        <form className="account-form" onSubmit={onSubmit} style={{ padding: '24px' }}>
          <div className="form-grid">
            <div className="form-group">
              <label>Email Address</label>
              <input
                className="form-input"
                name="email"
                value={form.email}
                disabled
                placeholder="email@example.com"
              />
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input
                className="form-input"
                name="full_name"
                value={form.full_name}
                onChange={onChange}
                placeholder="ex. Jojo Albin"
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                className="form-input"
                name="phone_number"
                value={form.phone_number}
                onChange={onChange}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="form-group">
              <label>Country</label>
              <input
                className="form-input"
                name="country"
                value={form.country}
                onChange={onChange}
                placeholder="Country"
              />
            </div>

            <div className="form-group">
              <label>State / Region</label>
              <input
                className="form-input"
                name="state_region"
                value={form.state_region}
                onChange={onChange}
                placeholder="State or Region"
              />
            </div>
          </div>

          {status && (
            <div style={{
              marginTop: '24px',
              padding: '12px 16px',
              border: '1px solid',
              borderColor: status.type === 'success' ? 'var(--c-status-safe)' : 'var(--c-status-danger)',
              background: status.type === 'success' ? 'var(--c-status-safe-bg)' : 'var(--c-status-danger-bg)',
              color: status.type === 'success' ? 'var(--c-status-safe)' : 'var(--c-status-danger)',
              fontSize: '13px',
              fontWeight: '600',
              borderRadius: 'var(--radius-sm)'
            }}>
              {status.type === 'success' ? '✓ ' : '⚠ '} {status.message}
            </div>
          )}

          <div className="form-actions">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserAccount
