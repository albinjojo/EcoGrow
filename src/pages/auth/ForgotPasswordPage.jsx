import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../services/api'
import { validateUserInput } from '../../utils/validation'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    const validation = validateUserInput({ email })
    if (Object.keys(validation).length) {
      setErrors(validation)
      return
    }
    setSubmitting(true)
    try {
      const result = await requestPasswordReset(email)
      setStatus({ type: 'success', message: result?.message || 'Reset link will be emailed if the account exists.' })
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Unable to process request right now.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="form-heading">
        {/* Header managed by AuthLayout */}
      </div>

      <div className="form-field">
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="farmer@ecogrow.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setErrors({})
          }}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email ? <p className="input-error">{errors.email}</p> : null}
      </div>

      {status ? (
        <p className={`status-text ${status.type === 'success' ? 'status-success' : 'status-error'}`}>
          {status.message}
        </p>
      ) : null}

      <button className="primary-btn" type="submit" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send Reset Link'}
      </button>

      <p className="footnote">
        Remembered your password? <Link to="/auth/login">Back to login</Link>
      </p>

      <div className="email-placeholder">
        {/*API invocation here. */}
      </div>
    </form>
  )
}

export default ForgotPasswordPage
