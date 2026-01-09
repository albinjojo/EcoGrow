import { useEffect, useState } from 'react'
import './dashboard/Dashboard.css'
import { getAccountProfile, updateAccountProfile } from '../services/api'

const initialState = { name: '', phone: '', organization: '' }

const UserAccount = () => {
  const [form, setForm] = useState(initialState)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAccountProfile()
        setForm({
          name: res?.profile?.name || '',
          phone: res?.profile?.phone || '',
          organization: res?.profile?.organization || '',
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
            <span>Name</span>
            <input name="name" value={form.name} onChange={onChange} placeholder="Your full name" />
          </label>
          <label className="form-field">
            <span>Phone</span>
            <input name="phone" value={form.phone} onChange={onChange} placeholder="Contact number" />
          </label>
          <label className="form-field">
            <span>Organization</span>
            <input
              name="organization"
              value={form.organization}
              onChange={onChange}
              placeholder="Farm / Company"
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
