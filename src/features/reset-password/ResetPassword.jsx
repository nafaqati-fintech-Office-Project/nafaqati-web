import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../../lib/authApi.js'
import { getErrorInfo } from '../../lib/errors.js'
import { passwordError } from '../../lib/validators.js'
import AuthShell, { Alert } from '../../components/AuthShell/AuthShell.jsx'
import PasswordInput from '../../components/PasswordInput/PasswordInput.jsx'
import './ResetPassword.css'

const INVALID_LINK = 'This reset link is invalid or has expired.'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [token] = useState(() => params.get('token') || '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [linkInvalid, setLinkInvalid] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const next = {}
    const pwError = passwordError(password)
    if (pwError) next.newPassword = pwError
    if (confirm !== password) next.confirm = 'Passwords do not match'
    setErrors(next)
    if (Object.keys(next).length) return
    setSubmitting(true)
    try {
      await resetPassword(token, password)
      navigate('/login', { replace: true, state: { message: 'Password updated. Please sign in.' } })
    } catch (err) {
      const info = getErrorInfo(err)
      const hasFieldErrors = Object.keys(info.fieldErrors).length > 0
      setLinkInvalid(info.status === 400 && !hasFieldErrors)
      setErrors({
        ...info.fieldErrors,
        form: info.status === 400 && !hasFieldErrors ? INVALID_LINK : info.message,
      })
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <AuthShell title="Reset Password">
        <Alert kind="error">This reset link is missing its token.</Alert>
        <p className="auth-footer">
          <Link to="/forgot-password" className="auth-link">
            Request a new reset link
          </Link>
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Reset Password" subtitle="Choose a new password for your account">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Alert kind="error">{errors.form}</Alert>
        {linkInvalid && (
          <Link to="/forgot-password" className="auth-link reset-new-link">
            Request a new reset link
          </Link>
        )}

        <PasswordInput
          id="reset-password"
          label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          hint="At least 8 characters"
          autoFocus
          error={errors.newPassword}
        />

        <PasswordInput
          id="reset-confirm"
          label="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          error={errors.confirm}
        />

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      <p className="auth-footer">
        <Link to="/login" className="auth-link">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}
