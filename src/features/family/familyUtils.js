// Pure helpers of the Family Portal (no React): permissions, formatting, chart scaling, error keys.

export const ROLES = ['OWNER', 'ADMIN', 'MEMBER']
const isOwner = (role) => role === 'OWNER'
const isAdmin = (role) => role === 'ADMIN'

// What the UI offers for the caller's role. The backend stays the final authority (family-service README, role matrix).
export function permissionsFor(role) {
  const manager = isOwner(role) || isAdmin(role)
  return {
    update: manager, // OWNER, ADMIN
    remove: manager,
    delete: isOwner(role),
    invite: manager,
    inviteAdmin: isOwner(role), // an ADMIN invites MEMBERs only
    manageBudgets: manager,
    changeRole: isOwner(role),
    transfer: isOwner(role),
    leave: Boolean(role) && !isOwner(role), // the owner must transfer ownership first
  }
}

// OWNER removes ADMIN/MEMBER, ADMIN removes MEMBER; nobody removes themselves here (that is "leave")
export function canRemoveMember(myRole, member, myUserId) {
  if (!member || member.userId === myUserId || member.role === 'OWNER') return false
  if (isOwner(myRole)) return true
  return isAdmin(myRole) && member.role === 'MEMBER'
}

// OWNER can invite ADMIN or MEMBER, ADMIN only MEMBER
export const invitableRoles = (myRole) => (isOwner(myRole) ? ['MEMBER', 'ADMIN'] : isAdmin(myRole) ? ['MEMBER'] : [])

// The API returns no names for members: show "You" for the caller, otherwise a short anonymous tag
export const memberTag = (userId) => (userId ? `…${String(userId).slice(-4)}` : '')

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (value) => UUID_RE.test(String(value ?? '').trim())

export function money(amount, currency) {
  const number = Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return currency ? `${currency} ${number}` : number
}

// "2026-05" -> "May" (short, in the app language)
export function monthShort(month, lang = 'en') {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(lang === 'ar' ? 'ar' : 'en-GB', { month: 'short', timeZone: 'UTC' })
}
export function monthLong(month, lang = 'en') {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(lang === 'ar' ? 'ar' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}
// "2026-10" and the 11 months before it, newest first
export function recentMonths(current, count = 12) {
  const [y, m] = current.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => new Date(Date.UTC(y, m - 1 - i, 1)).toISOString().slice(0, 7))
}

// Bars of the monthly chart: heights are real totals relative to the largest one (never a made-up scale)
export function chartBars(months = []) {
  const max = Math.max(0, ...months.map((m) => Number(m.total)))
  return months.map((m) => ({ ...m, height: max > 0 && Number(m.total) > 0 ? Math.max(4, Math.round((Number(m.total) / max) * 100)) : 0 }))
}
export const hasSpending = (months = []) => months.some((m) => Number(m.total) > 0)

// A metric the backend marks NOT_AVAILABLE is never shown as a number
export const available = (metric) => Boolean(metric) && metric.state !== 'NOT_AVAILABLE' && metric.value != null

// Error -> key of a friendly message in FAMILY_TEXT.errors; the server's own text is never shown
export function errorKey(error, action) {
  const status = error?.response?.status ?? 0
  if (status === 0) return error?.code === 'ECONNABORTED' ? 'slow' : 'network'
  if (status === 401) return 'session'
  if (status === 403) return 'forbidden'
  if (status === 404) return action === 'invite' ? 'userOrFamilyNotFound' : 'notFound'
  if (status === 409) return action === 'share' ? 'alreadyShared' : action === 'invite' ? 'alreadyInvited' : 'conflict'
  if (status === 429) return 'rateLimited'
  if (status === 400) return action === 'invite' ? 'inviteInvalid' : 'invalid'
  if (status === 502 || status === 503 || status === 504) return 'unavailable'
  return 'generic'
}

export const firstOf = (list, predicate) => (list ?? []).find(predicate) ?? null
