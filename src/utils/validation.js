export const validateUserInput = (fields) => {
  const errors = {}
  if ('email' in fields) {
    const email = (fields.email || '').trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      errors.email = 'Email is required.'
    } else if (!emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address.'
    }
  }

  if ('password' in fields) {
    const pwd = fields.password || ''
    if (!pwd) {
      errors.password = 'Password is required.'
    } else if (pwd.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    }
  }

  if ('confirmPassword' in fields) {
    const confirm = fields.confirmPassword || ''
    if (!confirm) {
      errors.confirmPassword = 'Confirm your password.'
    } else if (confirm !== fields.password) {
      errors.confirmPassword = 'Passwords do not match.'
    }
  }

  return errors
}
