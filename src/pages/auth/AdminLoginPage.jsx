import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { handleLogin } from '../../services/api'
import { validateUserInput } from '../../utils/validation'
import { useAuth } from '../../context/AuthContext'

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

const AdminLoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', role: 'ADMIN' })
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
    const validation = validateUserInput({ email: form.email, password: form.password })
    if (Object.keys(validation).length) {
      setErrors(validation)
      return
    }

    setSubmitting(true)
    try {
      const result = await handleLogin(form)
      setStatus({ type: 'success', message: result?.message || 'Admin login successful.' })

      // Store user info in context with ADMIN role
      login({
        id: result.id,
        email: form.email,
        role: 'ADMIN',
        ...result,
      })

      // Redirect to admin panel
      navigate('/admin', { replace: true })
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.message || 'Unable to login as admin right now.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="form-heading">
        {/* Header managed by AuthLayout */}
      </div>

      <InputField
        label="Email Address"
        name="email"
        type="email"
        placeholder="admin@ecogrow.com"
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
        {submitting ? 'Signing in…' : 'Sign In as Admin'}
      </button>

      <div className="divider" role="separator" aria-hidden />

      <p className="footnote">
        <Link to="/auth/login">Back to user login</Link>
      </p>
    </form>
  )
}

export default AdminLoginPage
