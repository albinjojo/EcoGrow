import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { handleSignup, startGoogleOAuth } from '../../services/api'
import { validateUserInput } from '../../utils/validation'

const InputField = ({ label, name, type = 'text', placeholder, value, onChange, error }) => {
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
      />
      {error ? <p className="input-error">{error}</p> : null}
    </div>
  )
}

const SignupPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', role: 'USER' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const onInput = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    const validation = validateUserInput(form)
    if (Object.keys(validation).length) {
      setErrors(validation)
      return
    }

    setSubmitting(true)
    try {
      const result = await handleSignup(form)
      setStatus({ type: 'success', message: result?.message || 'Signup successful.' })
      navigate('/welcome')
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Unable to signup right now.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="form-heading">
        <h1>Create Account</h1>
        <p className="sub-text">Sign up with your work email to access EcoGrow.</p>
      </div>

      <InputField
        label="Email Address"
        name="email"
        type="email"
        placeholder="farmer@ecogrow.com"
        value={form.email}
        onChange={onInput}
        error={errors.email}
      />

      <InputField
        label="Password"
        name="password"
        type="password"
        placeholder="Enter your password"
        value={form.password}
        onChange={onInput}
        error={errors.password}
      />

      <InputField
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        placeholder="Re-enter your password"
        value={form.confirmPassword}
        onChange={onInput}
        error={errors.confirmPassword}
      />

      {status ? (
        <p className={`status-text ${status.type === 'success' ? 'status-success' : 'status-error'}`}>
          {status.message}
        </p>
      ) : null}

      <button className="primary-btn" type="submit" disabled={submitting}>
        {submitting ? 'Creating account…' : 'Sign Up'}
      </button>

      <div className="divider" role="separator" aria-hidden />

      <button className="ghost-btn" type="button" onClick={startGoogleOAuth}>
        Continue with Google
      </button>

      <p className="footnote">
        Already have an account? <Link to="/auth/login">Log in</Link>
      </p>
    </form>
  )
}

export default SignupPage
