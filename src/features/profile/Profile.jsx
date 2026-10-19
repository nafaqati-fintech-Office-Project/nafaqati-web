import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useUser } from '../../hooks/useUser.js'
import Avatar from '../../components/ui/Avatar.jsx'
import { Alert, Field } from '../../components/AuthShell/AuthShell.jsx'
import { APP_TEXT } from '../../constants/appText.js'
import { getErrorInfo } from '../../lib/errors.js'
import { updateMe } from '../../services/userApi.js'
import { fullName, getProfileInitials, toDateKey } from '../../utils/format.js'
import './Profile.css'

const t = APP_TEXT.profile
const PHONE_RE = /^\+[1-9][0-9]{6,14}$/
const URL_RE = /^https?:\/\/\S+$/i
// Optional fields: emptying one of these means "clear it" (sent in clearFields)
const OPTIONAL = ['lastName', 'phone', 'avatarUrl', 'dateOfBirth']

// A provisional first name is only the username placeholder: show the field empty so the user enters a real one
const toForm = (profile) => ({
  firstName: profile.nameProvisional ? '' : (profile.firstName ?? ''),
  lastName: profile.lastName ?? '',
  phone: profile.phone ?? '',
  dateOfBirth: profile.dateOfBirth ?? '',
  avatarUrl: profile.avatarUrl ?? '',
})

// Mirrors the server rules in docs/user-service.md section 5.1
function validate(values) {
  const errors = {}
  const first = values.firstName.trim()
  if (!first) errors.firstName = t.errors.firstNameRequired
  else if (first.length > 100) errors.firstName = t.errors.firstNameLong
  if (values.lastName.trim().length > 100) errors.lastName = t.errors.lastNameLong
  const phone = values.phone.trim()
  if (phone && !PHONE_RE.test(phone)) errors.phone = t.errors.phoneInvalid
  const avatar = values.avatarUrl.trim()
  if (avatar && !URL_RE.test(avatar)) errors.avatarUrl = t.errors.avatarInvalid
  else if (avatar.length > 2048) errors.avatarUrl = t.errors.avatarLong
  if (values.dateOfBirth && values.dateOfBirth >= toDateKey(new Date())) errors.dateOfBirth = t.errors.dobFuture
  return errors
}

// Merge semantics: only changed fields; emptied optional fields go in clearFields
function buildChanges(profile, values) {
  const original = toForm(profile)
  const changes = {}
  const clearFields = []
  Object.keys(original).forEach((key) => {
    const next = values[key].trim()
    if (next === original[key]) return
    if (!next && OPTIONAL.includes(key)) clearFields.push(key)
    else changes[key] = next // a blank firstName stays a change so validation can flag it
  })
  if (clearFields.length) changes.clearFields = clearFields
  return changes
}

function ProfileForm({ profile, email, onSaved }) {
  const [values, setValues] = useState(() => toForm(profile))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [today] = useState(() => toDateKey(new Date()))

  const changes = buildChanges(profile, values)
  const dirty = Object.keys(changes).length > 0

  const bind = (name) => ({
    value: values[name],
    error: errors[name],
    onChange: (e) => {
      setValues((v) => ({ ...v, [name]: e.target.value }))
      setDone(false)
    },
  })

  const submit = async (e) => {
    e.preventDefault()
    if (saving || !dirty) return
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    setDone(false)
    try {
      const updated = await updateMe(changes)
      setValues(toForm(updated))
      setErrors({})
      setDone(true)
      onSaved(updated)
    } catch (err) {
      const info = getErrorInfo(err, 'profile')
      const next = { ...info.fieldErrors }
      // A 409 that isn't about a pending deletion means the phone number belongs to someone else
      if (info.status === 409 && 'phone' in changes && !/pending deletion/i.test(info.message)) next.phone = info.message
      else next.form = info.message
      setErrors(next)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="profile-form" onSubmit={submit} noValidate>
      <Alert kind="error">{errors.form}</Alert>
      <Alert kind="success">{done && !dirty ? t.saved : ''}</Alert>

      <div className="profile-grid">
        <Field id="profile-first-name" label={t.firstName} autoComplete="given-name" {...bind('firstName')} />
        <Field id="profile-last-name" label={t.lastName} autoComplete="family-name" {...bind('lastName')} />
        <Field id="profile-phone" label={t.phone} type="tel" autoComplete="tel" placeholder="+966501234567" hint={t.phoneHint} {...bind('phone')} />
        <Field id="profile-dob" label={t.dateOfBirth} type="date" max={today} autoComplete="bday" {...bind('dateOfBirth')} />
        <div className="profile-wide">
          <Field id="profile-avatar" label={t.avatarUrl} type="url" placeholder="https://" hint={t.avatarHint} {...bind('avatarUrl')} />
        </div>
        <div className="profile-wide">
          <Field id="profile-email" label={t.email} type="email" value={email ?? ''} readOnly hint={t.emailHint} />
        </div>
      </div>

      <div className="profile-actions">
        <button type="submit" className="btn btn-primary" disabled={!dirty || saving} title={dirty ? undefined : t.nothingChanged}>
          {saving && <LoaderCircle size={16} className="spin" aria-hidden="true" />}
          {saving ? t.saving : t.save}
        </button>
      </div>
    </form>
  )
}

export default function Profile() {
  const { user } = useAuth()
  const { profile, loading, error, refresh, updateProfile } = useUser()

  return (
    <div className="page-narrow">
      <header className="page-head">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </header>

      <section className="panel" aria-busy={loading}>
        {loading && (
          <div className="profile-skeleton" aria-hidden="true">
            <span className="sk" style={{ width: 72, height: 72, borderRadius: 36 }} />
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="sk" style={{ height: 44, borderRadius: 10 }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="dc-state" role="alert">
            <p>{t.loadFailed}</p>
            <p>{error}</p>
            <button type="button" className="dc-retry" onClick={refresh}>
              {APP_TEXT.common.retry}
            </button>
          </div>
        )}

        {!loading && !error && profile && (
          <>
            <div className="profile-hero">
              <Avatar src={profile.avatarUrl} initials={getProfileInitials(profile, user)} size={72} />
              <div>
                <h2>{profile.nameProvisional ? t.noNameYet : fullName(profile)}</h2>
                <p>{user?.email}</p>
              </div>
            </div>
            {/* key resets the form if a different profile is ever loaded */}
            <ProfileForm key={profile.userId} profile={profile} email={user?.email} onSaved={updateProfile} />
          </>
        )}
      </section>
    </div>
  )
}
