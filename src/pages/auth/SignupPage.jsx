import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { handleSignup, startGoogleOAuth } from '../../services/api'
import { validateUserInput } from '../../utils/validation'

const InputField = ({ label, name, type = 'text', placeholder, value, onChange, error }) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <div className={`input-shell ${error ? 'has-error' : ''}`}>
        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
        />
        {isPassword && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            )}
          </button>
        )}
      </div>
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
      navigate('/dashboard')
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
