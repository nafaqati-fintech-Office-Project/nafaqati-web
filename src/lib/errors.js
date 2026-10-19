const MESSAGES = {
  network: 'Unable to reach the server. Check your connection.',
  loginFailed: 'Invalid email/username or password.',
  expired: 'Your session has expired. Please sign in again.',
  tooMany: 'Too many attempts. Please wait a moment and try again.',
  slowDown: "You're making requests too quickly. Please slow down and try again in a moment.",
  unavailable: 'Something went wrong. Please try again later.',
  serviceUnavailable: 'Service unavailable. Please try again in a moment.',
  notAvailableYet: "This feature isn't available yet.",
  phoneTaken: 'That phone number is already used by another account.',
  fields: 'Please correct the highlighted fields.',
  generic: 'Something went wrong. Please try again.',
}

// Contexts: 'login' keeps the wording from the login spec; 'profile' / 'preferences' are the
// user-service screens, where 409 means a phone clash or a pending deletion.
const isUserService = (context) =>
  context === 'profile' || context === 'preferences' || context === 'transactions' || context === 'reports' || context === 'budgets' || context === 'notifications'

function messageFor(status, data, context, hasFieldErrors) {
  if (status === 0) return MESSAGES.network
  if (status === 401) return context === 'login' ? MESSAGES.loginFailed : MESSAGES.expired
  // transaction-service answers with RFC 9457 problem details: a readable `detail`, and field errors as
  // `errors: [{ field, message }]` (normalised into fieldErrors below)
  if (context === 'transactions' && typeof data?.detail === 'string' && [400, 409].includes(status) && !hasFieldErrors) {
    return data.detail
  }
  // budget-service business rules (window, 60-budget cap, ...) are 400s with a readable message and no field errors
  if (context === 'budgets' && status === 400 && !hasFieldErrors && typeof data?.message === 'string') {
    if (/at most \d+ budgets/i.test(data.message)) return "You've reached the limit of 60 budgets. Archive old ones to add more."
    if (data.message !== 'Validation failed') return data.message
  }
  if (status === 409) {
    if (context === 'profile') return /pending deletion/i.test(data?.message ?? '') ? data.message : MESSAGES.phoneTaken
    if (context === 'budgets') {
      if (/archived/i.test(data?.message ?? '')) return "This budget is archived and can't be changed."
      if (/modified concurrently/i.test(data?.message ?? '')) return 'The budget changed in the meantime. Please try again.'
      return 'You already have a budget for this month'
    }
    return data?.message || MESSAGES.generic
  }
  if (status === 429) return isUserService(context) ? MESSAGES.slowDown : MESSAGES.tooMany
  if (status === 501) return MESSAGES.notAvailableYet
  // The gateway answers 502/503/504 with only { status, error }: no message to show
  if (status === 502 || status === 503 || status === 504) {
    return isUserService(context) ? MESSAGES.serviceUnavailable : MESSAGES.unavailable
  }
  if (status === 400 && hasFieldErrors) return MESSAGES.fields
  return MESSAGES.generic
}

// auth/user services send fieldErrors as { field: message }; transaction-service as errors: [{ field, message }]
function extractFieldErrors(body) {
  if (!body) return {}
  if (body.fieldErrors && typeof body.fieldErrors === 'object') return body.fieldErrors
  if (Array.isArray(body.errors)) {
    return Object.fromEntries(
      body.errors.filter((e) => e && typeof e.field === 'string').map((e) => [e.field, String(e.message)]),
    )
  }
  if (Array.isArray(body.details)) {
    return Object.fromEntries(
      body.details
        .map((detail) => String(detail).split(':'))
        .filter(([field, message]) => field && message)
        .map(([field, ...message]) => [field.trim(), message.join(':').trim()]),
    )
  }
  return {}
}

// Safe for axios errors with empty, non-JSON or differently shaped bodies
export function getErrorInfo(err, context) {
  const status = err?.response?.status ?? 0
  const data = err?.response?.data
  const body = data && typeof data === 'object' ? data : null
  const fieldErrors = extractFieldErrors(body)
  const message = messageFor(status, body, context, Object.keys(fieldErrors).length > 0)
  return { status, message, fieldErrors }
}
