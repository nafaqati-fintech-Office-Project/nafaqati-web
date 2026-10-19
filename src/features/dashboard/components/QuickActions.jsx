import { APP_TEXT } from '../../../constants/appText.js'

// Presentational: actions (id, label, icon, tone, disabled) and the click handler come from the page.
// Disabled actions are features that do not exist yet; they are labelled "Coming soon".
export default function QuickActions({ title, actions, onAction }) {
  return (
    <section className="dc quick" aria-label={title}>
      {actions.map(({ id, label, icon: Icon, tone, disabled }) => (
        <button key={id} type="button" className="quick-btn" disabled={disabled} onClick={() => onAction(id)}>
          <span className={`quick-icon tone-solid-${tone}`}>
            <Icon size={22} aria-hidden="true" />
          </span>
          <span className="quick-label">
            {label}
            {disabled && <small>{APP_TEXT.common.comingSoon}</small>}
          </span>
        </button>
      ))}
    </section>
  )
}
