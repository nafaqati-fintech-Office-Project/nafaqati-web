import { Link } from 'react-router-dom'
import { Crown } from 'lucide-react'
import { APP_TEXT } from '../../constants/appText.js'

// Shown where a Free user reaches a Premium feature: what it is, and a link to the Plans page.
export default function UpgradePrompt({ title, body, compact = false }) {
  const t = APP_TEXT.plans
  return (
    <div className={`upgrade-prompt ${compact ? 'is-compact' : ''}`} role="note">
      <Crown size={compact ? 18 : 28} aria-hidden="true" />
      <div>
        <strong>{title ?? t.premiumFeature}</strong>
        {body && <p>{body}</p>}
      </div>
      <Link to="/plans" className="btn btn-primary">
        {t.seePlans}
      </Link>
    </div>
  )
}
