import './NotificationSkeleton.css'

export default function NotificationSkeleton({ rows = 5, label }) {
  return (
    <ul className="notif-skeleton" aria-busy="true" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i}>
          <span className="sk notif-sk-icon" />
          <span className="notif-sk-lines">
            <span className="sk" style={{ inlineSize: '45%', blockSize: 14 }} />
            <span className="sk" style={{ inlineSize: '80%', blockSize: 12 }} />
          </span>
        </li>
      ))}
    </ul>
  )
}
