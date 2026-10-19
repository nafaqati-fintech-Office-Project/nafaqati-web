import { useState } from 'react'

// Shows the profile image when there is one; falls back to initials if it can't load.
export default function Avatar({ src, initials, size = 38, className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null)
  const showImage = Boolean(src) && failedSrc !== src

  return (
    <span className={`avatar ${className}`} style={{ width: size, height: size, fontSize: size * 0.34 }} aria-hidden="true">
      {showImage ? <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailedSrc(src)} /> : initials}
    </span>
  )
}
