import './ProtectedRoute.css'

export default function AuthLoader() {
  return (
    <div className="protected-route-loading" role="status" aria-live="polite">
      <span className="protected-route-spinner" aria-hidden="true" />
      Loading...
    </div>
  )
}
