import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/api'
import { validateUserInput } from '../utils/validation'

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [token, setToken] = useState('')
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const urlToken = search.get('token') || ''
    setToken(urlToken)
  }, [search])

  const onInput = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    if (!token) {
      setStatus({ type: 'error', message: 'Reset link is missing or invalid.' })
      return
    }

    const validation = validateUserInput({ password: form.password, confirmPassword: form.confirmPassword })
    if (Object.keys(validation).length) {
      setErrors(validation)
      return
    }

    setSubmitting(true)
    try {
      const result = await resetPassword({ token, password: form.password, confirmPassword: form.confirmPassword })
      setStatus({ type: 'success', message: result?.message || 'Password updated. Redirecting to login…' })
      setTimeout(() => navigate('/login', { replace: true }), 1200)
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Unable to reset password right now.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="form-heading">
        <h1>Set a new password</h1>
        <p className="sub-text">Enter a strong password you will remember.</p>
      </div>

      <div className="form-field">
        <label htmlFor="password">New Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Enter new password"
          value={form.password}
          onChange={onInput}
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password ? <p className="input-error">{errors.password}</p> : null}
      </div>

      <div className="form-field">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter new password"
          value={form.confirmPassword}
          onChange={onInput}
          aria-invalid={Boolean(errors.confirmPassword)}
        />
        {errors.confirmPassword ? <p className="input-error">{errors.confirmPassword}</p> : null}
      </div>

      {status ? (
        <p className={`status-text ${status.type === 'success' ? 'status-success' : 'status-error'}`}>
          {status.message}
        </p>
      ) : null}

      <button className="primary-btn" type="submit" disabled={submitting}>
        {submitting ? 'Updating…' : 'Update Password'}
      </button>

      <p className="footnote">
        Remembered your password? <Link to="/login">Back to login</Link>
      </p>
    </form>
  )
}

export default ResetPasswordPage
