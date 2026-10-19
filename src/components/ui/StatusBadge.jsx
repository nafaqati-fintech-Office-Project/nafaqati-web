import { APP_TEXT } from '../../constants/appText.js'
import './StatusBadge.css'

export default function StatusBadge({ status }) {
  if (!status) return null
  return <span className={`status-badge status-${status.toLowerCase()}`}>{APP_TEXT.transactions.status[status] ?? status}</span>
}
