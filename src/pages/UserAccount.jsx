import { useEffect, useState } from 'react'
import './dashboard/Dashboard.css'
import { getAccountProfile, updateAccountProfile } from '../services/api'

const initialState = { email: '', full_name: '', phone_number: '', country: '', state_region: '' }

const UserAccount = () => {
  const [form, setForm] = useState(initialState)
  const [status, setStatus] = useState(null)

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
      }
    }
    load()
  }, [])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setStatus(null)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    try {
      await updateAccountProfile(form)
      setStatus({ type: 'success', message: 'Account details saved.' })
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Unable to save right now.' })
    }
  }

  return (
    <div className="dash-page">
      <div className="page-header">
        <p className="eyebrow">Profile</p>
        <h2>User Account</h2>
      </div>

      <form className="account-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="form-field">
            <span>Email</span>
            <input name="email" value={form.email} disabled placeholder="Your email address" style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }} />
          </label>
          <label className="form-field">
            <span>Full Name</span>
            <input name="full_name" value={form.full_name} onChange={onChange} placeholder="Your full name" />
          </label>
          <label className="form-field">
            <span>Phone Number</span>
            <input name="phone_number" value={form.phone_number} onChange={onChange} placeholder="Contact number" />
          </label>
          <label className="form-field">
            <span>Country</span>
            <input
              name="country"
              value={form.country}
              onChange={onChange}
              placeholder="Country"
            />
          </label>
          <label className="form-field">
            <span>State / Region</span>
            <input
              name="state_region"
              value={form.state_region}
              onChange={onChange}
              placeholder="State or Region"
            />
          </label>
        </div>

        {status ? (
          <p className={`account-status ${status.type === 'success' ? 'status-success' : 'status-error'}`}>
            {status.message}
          </p>
        ) : null}

        <div className="account-actions">
          <button className="primary-action" type="submit">
            Save details
          </button>
        </div>
      </form>
    </div>
  )
}

export default UserAccount
