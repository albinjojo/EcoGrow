import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { handleLogin, startGoogleOAuth } from '../../services/api'
import { validateUserInput } from '../../utils/validation'

const InputField = ({
  label,
  type = 'text',
  name,
  placeholder,
  value,
  onChange,
  error,
  icon,
}) => {
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <div className={`input-shell ${error ? 'has-error' : ''}`}>
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        <span className="input-icon" aria-hidden>
          {icon}
        </span>
      </div>
      {error ? (
        <p className="input-error" id={`${name}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

const StatusText = ({ status }) => {
  if (!status?.message) return null
  const tone = status.type === 'success' ? 'status-success' : 'status-error'
  return <p className={`status-text ${tone}`}>{status.message}</p>
}

const LoginPage = () => {
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', role: 'USER' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const adminMode = useMemo(
    () => search.get('role')?.toUpperCase() === 'ADMIN',
    [search],
  )

  useEffect(() => {
    setForm((prev) => ({ ...prev, role: adminMode ? 'ADMIN' : 'USER' }))
  }, [adminMode])

  const onInput = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    const validation = validateUserInput({ email: form.email, password: form.password })
    if (Object.keys(validation).length) {
      setErrors(validation)
      return
    }

    setSubmitting(true)
    try {
      const result = await handleLogin(form)
      setStatus({ type: 'success', message: result?.message || 'Login successful.' })
      navigate('/dashboard')
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Unable to login right now.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="form-heading">
        <h1>Login.</h1>
      </div>

      <InputField
        label="Email Address"
        name="email"
        type="email"
        placeholder="farmer@ecogrow.com"
        value={form.email}
        onChange={onInput}
        error={errors.email}
        icon={
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1 3.22222L8.25 7.83333L15.5 3.22222M2.8 1H14.2C15.1941 1 16 1.79218 16 2.76471V11.2353C16 12.2078 15.1941 13 14.2 13H2.8C1.80589 13 1 12.2078 1 11.2353V2.76471C1 1.79218 1.80589 1 2.8 1Z"
              stroke="#9BBF3C"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
      />

      <div className="field-with-link">
        <InputField
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={onInput}
          error={errors.password}
          icon={
            <svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="7" width="12" height="8" rx="1.6" stroke="#9BBF3C" strokeWidth="1.2" />
              <path
                d="M6 7V5C6 2.79086 7.79086 1 10 1C12.2091 1 14 2.79086 14 5V7"
                stroke="#9BBF3C"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          }
        />
        <Link className="inline-link" to="/auth/forgot">
          Forgot Password?
        </Link>
      </div>

      <StatusText status={status} />

      <button className="primary-btn" type="submit" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign In'}
      </button>

      <div className="divider" role="separator" aria-hidden />

      <button className="ghost-btn" type="button" onClick={startGoogleOAuth}>
        <span className="google-icon" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 11.2308C21 10.3692 20.9154 9.53846 20.7569 8.73077H11.23V13.1308H16.7538C16.5154 14.4154 15.7615 15.5 14.6769 16.2385V19.0231H17.8615C19.7692 17.2692 21 14.5077 21 11.2308Z" fill="#4285F4" />
            <path d="M11.23 21.6923C13.9692 21.6923 16.2615 20.7923 17.8615 19.0231L14.6769 16.2385C13.8077 16.8231 12.6385 17.1923 11.23 17.1923C8.58462 17.1923 6.35385 15.4231 5.56154 12.9923H2.28462V15.8538C3.89231 19.3154 7.29231 21.6923 11.23 21.6923Z" fill="#34A853" />
            <path d="M5.56154 12.9923C5.36154 12.4077 5.24615 11.7846 5.24615 11.1538C5.24615 10.5231 5.36154 9.9 5.56154 9.31538V6.45385H2.28462C1.61538 7.86154 1.23077 9.46154 1.23077 11.1538C1.23077 12.8462 1.61538 14.4462 2.28462 15.8538L5.56154 12.9923Z" fill="#FBBC05" />
            <path d="M11.23 5.11538C12.7692 5.11538 14.1308 5.64615 15.1769 6.64615L18.9385 2.88462C16.2538 0.384615 13.9615 -2.38419e-07 11.23 -2.38419e-07C7.29231 -2.38419e-07 3.89231 2.37692 2.28462 5.84615L5.56154 8.70769C6.35385 6.27692 8.58462 5.11538 11.23 5.11538Z" fill="#EA4335" />
          </svg>
        </span>
        Login with Google
      </button>

      <p className="footnote">
        Don’t have an account? <Link to="/auth/signup">Sign Up</Link>
      </p>
    </form>
  )
}

export default LoginPage
