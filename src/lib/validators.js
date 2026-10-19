const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RE = /^[a-zA-Z0-9._-]{3,50}$/

const MIN_PASSWORD_CHARS = 8
const MAX_PASSWORD_BYTES = 72

export const isEmail = (value) => EMAIL_RE.test(value.trim())

export const isValidUsername = (value) => USERNAME_RE.test(value.trim())

// Returns an error message, or '' when the password is acceptable
export function passwordError(password) {
  if (!password) return 'Password is required'
  if ([...password].length < MIN_PASSWORD_CHARS) return `Password must be at least ${MIN_PASSWORD_CHARS} characters`
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) {
    return `Password is too long (max ${MAX_PASSWORD_BYTES} bytes; non-English characters count for more)`
  }
  return ''
}
