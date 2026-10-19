import { Hourglass } from 'lucide-react'
import { APP_TEXT } from '../../../constants/appText.js'

// Honest placeholder for widgets whose backend does not exist yet: no numbers, no made-up values.
export default function ComingSoonCard({ title, description, className = '' }) {
  return (
    <section className={`dc soon-card ${className}`} aria-label={title}>
      <header className="dc-head">
        <h2>{title}</h2>
      </header>
      <div className="dc-state">
        <Hourglass size={26} aria-hidden="true" />
        <strong>{APP_TEXT.common.comingSoon}</strong>
        <p>{description}</p>
      </div>
    </section>
  )
}
