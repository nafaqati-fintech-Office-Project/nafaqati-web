import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AtSign, Mail, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getErrorInfo } from '../../lib/errors.js'
import { isEmail, isValidUsername, passwordError } from '../../lib/validators.js'
import AuthShell, { Alert, Field } from '../../components/AuthShell/AuthShell.jsx'
import PasswordInput from '../../components/PasswordInput/PasswordInput.jsx'
import './Register.css'

const EMPTY = { firstName: '', lastName: '', username: '', email: '', password: '', confirm: '' }

function validate(values) {
  const errors = {}
  if (!values.firstName.trim()) errors.firstName = 'First name is required'
  else if (values.firstName.trim().length > 100) errors.firstName = 'First name is too long'
  if (values.lastName.trim().length > 100) errors.lastName = 'Last name is too long'
  if (!isValidUsername(values.username)) {
    errors.username = 'Use 3-50 characters: letters, digits, . _ or -'
  }
  if (!isEmail(values.email)) errors.email = 'Enter a valid email address'
  const pwError = passwordError(values.password)
  if (pwError) errors.password = pwError
  if (values.confirm !== values.password) errors.confirm = 'Passwords do not match'
  return errors
}

function conflictField(message = '') {
  if (/username/i.test(message)) return 'username'
  if (/email/i.test(message)) return 'email'
  return 'form'
}

export default function Register() {
  const { isAuthenticated, register, login } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  const bind = (name) => ({
    value: values[name],
    onChange: (e) => setValues((prev) => ({ ...prev, [name]: e.target.value })),
    error: errors[name],
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const next = validate(values)
    setErrors(next)
    if (Object.keys(next).length) return
    setSubmitting(true)

    const username = values.username.trim()
    const lastName = values.lastName.trim()
    try {
      await register({
        username,
        email: values.email.trim(),
        firstName: values.firstName.trim(),
        ...(lastName && { lastName }),
        password: values.password,
      })
    } catch (err) {
      const info = getErrorInfo(err)
      const target = info.status === 409 ? conflictField(info.message) : 'form'
      setErrors({ ...info.fieldErrors, [target]: info.message })
      setSubmitting(false)
      return
    }

    try {
      await login(username, values.password, false)
      navigate('/', { replace: true })
    } catch {
      navigate('/login', { replace: true, state: { message: 'Account created. Please sign in.' } })
    }
  }

  return (
    <AuthShell title="Create Account" subtitle="Start managing your money with Nafaqati">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Alert kind="error">{errors.form}</Alert>

        <div className="register-name-row">
          <Field
            id="register-first-name"
            label="First name"
            icon={User}
            autoComplete="given-name"
            autoFocus
            {...bind('firstName')}
          />
          <Field
            id="register-last-name"
            label="Last name (optional)"
            autoComplete="family-name"
            {...bind('lastName')}
          />
        </div>

        <Field
          id="register-username"
          label="Username"
          icon={AtSign}
          autoComplete="username"
          hint="3-50 characters: letters, digits, . _ -"
          {...bind('username')}
        />

        <Field
          id="register-email"
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          {...bind('email')}
        />

        <PasswordInput
          id="register-password"
          autoComplete="new-password"
          hint="At least 8 characters"
          {...bind('password')}
        />

        <PasswordInput
          id="register-confirm"
          label="Confirm password"
          autoComplete="new-password"
          {...bind('confirm')}
        />

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="auth-footer">
        Already have an account?{' '}
        <Link to="/login" className="auth-link">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
