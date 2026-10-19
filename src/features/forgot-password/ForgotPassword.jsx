import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { forgotPassword } from '../../lib/authApi.js'
import { getErrorInfo } from '../../lib/errors.js'
import { isEmail } from '../../lib/validators.js'
import AuthShell, { Alert, Field } from '../../components/AuthShell/AuthShell.jsx'
import './ForgotPassword.css'

const SENT_MESSAGE = 'If an account exists for that email, a reset link has been sent.'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setFormError('')
    if (!isEmail(email)) {
      setError('Enter a valid email address')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      const info = getErrorInfo(err)
      setError(info.fieldErrors.email || '')
      setFormError(info.message)
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Forgot Password" subtitle="Enter your email and we will send you a reset link">
      {sent ? (
        <Alert kind="success">{SENT_MESSAGE}</Alert>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Alert kind="error">{formError}</Alert>

          <Field
            id="forgot-email"
            label="Email"
            icon={Mail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            autoFocus
            error={error}
          />

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}

      <p className="auth-footer forgot-footer">
        <Link to="/login" className="auth-link">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}
