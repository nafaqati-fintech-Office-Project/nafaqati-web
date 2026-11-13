import { useRef, useState } from 'react'
import { Camera, LoaderCircle, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useUser } from '../../hooks/useUser.js'
import Avatar from '../../components/ui/Avatar.jsx'
import AvatarCropModal from './AvatarCropModal.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { Alert, Field } from '../../components/AuthShell/AuthShell.jsx'
import { APP_TEXT } from '../../constants/appText.js'
import { getErrorInfo } from '../../lib/errors.js'
import { deleteAvatar, updateMe, uploadAvatar } from '../../services/userApi.js'
import { fullName, getProfileInitials, toDateKey } from '../../utils/format.js'
import './Profile.css'

const t = APP_TEXT.profile
const PHONE_RE = /^\+[1-9][0-9]{6,14}$/
// Optional fields: emptying one of these means "clear it" (sent in clearFields)
const OPTIONAL = ['lastName', 'phone', 'dateOfBirth']
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif']
const AVATAR_MAX_BYTES = 5 * 1024 * 1024

// A provisional first name is only the username placeholder: show the field empty so the user enters a real one
const toForm = (profile) => ({
  firstName: profile.nameProvisional ? '' : (profile.firstName ?? ''),
  lastName: profile.lastName ?? '',
  phone: profile.phone ?? '',
  dateOfBirth: profile.dateOfBirth ?? '',
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

// The round picture; with a photo it is a button that shows the picture in a larger view
function ProfilePicture({ profile, initials }) {
  const [open, setOpen] = useState(false)
  if (!profile.avatarUrl) return <Avatar src={null} initials={initials} size={72} />
  return (
    <>
      <button type="button" className="profile-photo-btn" onClick={() => setOpen(true)} aria-label={t.photo.view} title={t.photo.view}>
        <Avatar src={profile.avatarUrl} initials={initials} size={72} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t.photo.viewTitle} size="sm">
        <div className="profile-photo-large">
          <Avatar src={profile.avatarUrl} initials={initials} size={280} />
        </div>
      </Modal>
    </>
  )
}

// "Change photo": Browse (or drop a file) opens the crop window; the cropped square is uploaded and the server resizes it.
function PhotoControls({ profile, onChanged }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [cropFile, setCropFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const hasPhoto = Boolean(profile.avatarUrl)

  const run = async (action) => {
    setBusy(true)
    setMessage('')
    try {
      await action()
    } catch (err) {
      setMessage(getErrorInfo(err, 'profile').message)
    } finally {
      setBusy(false)
      setCropFile(null) // on an error the crop window closes so the message below is visible
    }
  }

  // A chosen (or dropped) file first goes to the crop window; only the cropped picture is uploaded
  const choose = (file) => {
    if (!file) return
    if (!AVATAR_TYPES.includes(file.type)) return setMessage(t.photo.type)
    if (file.size > AVATAR_MAX_BYTES) return setMessage(t.photo.size)
    setMessage('')
    setCropFile(file)
  }

  const onPick = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // lets the same file be picked again
    choose(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (!busy) choose(e.dataTransfer.files?.[0])
  }

  const onCropped = (file) =>
    run(async () => {
      const { avatarUrl } = await uploadAvatar(file)
      onChanged({ ...profile, avatarUrl })
    })

  const onRemove = () =>
    run(async () => {
      await deleteAvatar()
      onChanged({ ...profile, avatarUrl: null })
    })

  return (
    <div
      className={`profile-photo${dragging ? ' is-dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <AvatarCropModal file={cropFile} busy={busy} onCancel={() => setCropFile(null)} onConfirm={onCropped} />
      <div className="profile-photo-actions">
        <input ref={input} type="file" accept={AVATAR_TYPES.join(',')} onChange={onPick} hidden />
        <button type="button" className="btn btn-outline" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
          {hasPhoto ? t.photo.change : t.photo.upload}
        </button>
        {hasPhoto && (
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onRemove}>
            <Trash2 size={16} aria-hidden="true" />
            {t.photo.remove}
          </button>
        )}
      </div>
      <p className={message ? 'profile-photo-error' : 'profile-photo-hint'} role={message ? 'alert' : undefined}>
        {message || t.photo.hint}
      </p>
    </div>
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
              <ProfilePicture profile={profile} initials={getProfileInitials(profile, user)} />
              <div>
                <h2>{profile.nameProvisional ? t.noNameYet : fullName(profile)}</h2>
                <p>{user?.email}</p>
                <PhotoControls profile={profile} onChanged={updateProfile} />
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
