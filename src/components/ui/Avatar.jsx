import { useEffect, useState } from 'react'
import { fetchAvatar } from '../../services/userApi.js'

// A picture uploaded to this app is private: its avatarUrl is a path on the API (/api/...), loaded with the user's
// token and shown through an object URL. The result is kept per url, so the top bar, the profile page and the
// dashboard all share one request.
const cache = new Map()
const isOwn = (src) => typeof src === 'string' && src.startsWith('/api/')

function useImageSrc(src) {
  const [loaded, setLoaded] = useState({ src: null, url: null })

  useEffect(() => {
    if (!isOwn(src)) return undefined
    let active = true
    if (!cache.has(src)) cache.set(src, fetchAvatar(src))
    cache
      .get(src)
      .then((url) => active && setLoaded({ src, url }))
      .catch(() => {
        cache.delete(src)
        if (active) setLoaded({ src, url: null })
      })
    return () => {
      active = false
    }
  }, [src])

  if (!isOwn(src)) return src
  return loaded.src === src ? loaded.url : null
}

// Shows the profile image when there is one; falls back to initials if it can't load.
export default function Avatar({ src, initials, size = 38, className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null)
  const imageSrc = useImageSrc(src)
  const showImage = Boolean(imageSrc) && failedSrc !== imageSrc

  return (
    <span className={`avatar ${className}`} style={{ width: size, height: size, fontSize: size * 0.34 }} aria-hidden="true">
      {showImage ? <img src={imageSrc} alt="" referrerPolicy="no-referrer" onError={() => setFailedSrc(imageSrc)} /> : initials}
    </span>
  )
}
