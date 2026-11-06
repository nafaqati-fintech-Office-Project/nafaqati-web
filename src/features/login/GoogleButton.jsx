import { useEffect, useRef } from 'react'

// "Continue with Google": Google's own button gives back an ID token, which the auth service checks
// against the same Web client id the phone app uses (GOOGLE_CLIENT_IDS there).
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

let scriptPromise
function loadGoogleScript() {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve(window.google)
    script.onerror = () => {
      scriptPromise = undefined
      reject(new Error('Google script failed to load'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

export default function GoogleButton({ onToken, onError }) {
  const box = useRef(null)
  // Google keeps the first callback it was given, so always call the latest one.
  const latest = useRef({ onToken, onError })
  useEffect(() => {
    latest.current = { onToken, onError }
  })

  useEffect(() => {
    if (!CLIENT_ID) return undefined
    let active = true
    loadGoogleScript()
      .then((google) => {
        if (!active || !box.current) return
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => latest.current.onToken(response.credential),
        })
        google.accounts.id.renderButton(box.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          width: Math.min(400, Math.max(200, box.current.clientWidth)),
        })
      })
      .catch(() => active && latest.current.onError())
    return () => {
      active = false
    }
  }, [])

  if (!CLIENT_ID) {
    return (
      <button type="button" className="login-social-btn" onClick={() => onError('notConfigured')}>
        Google
      </button>
    )
  }
  return <div ref={box} className="login-google" />
}
