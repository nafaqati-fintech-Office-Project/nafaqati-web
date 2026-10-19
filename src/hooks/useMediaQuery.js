import { useSyncExternalStore } from 'react'

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', notify)
      window.addEventListener('resize', notify)
      return () => {
        list.removeEventListener('change', notify)
        window.removeEventListener('resize', notify)
      }
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
