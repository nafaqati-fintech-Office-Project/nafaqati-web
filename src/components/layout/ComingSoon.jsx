import { useLocation } from 'react-router-dom'
import { Hammer } from 'lucide-react'
import { APP_TEXT } from '../../constants/appText.js'
import { NAV_ITEMS } from '../../config/navigation.js'

export default function ComingSoon() {
  const { pathname } = useLocation()
  const item = NAV_ITEMS.find((i) => i.path === pathname)
  const { comingSoon, nav } = APP_TEXT

  return (
    <section className="coming-soon">
      <Hammer size={32} aria-hidden="true" />
      <h1>{item ? nav[item.key] : comingSoon.title}</h1>
      <p>{comingSoon.title}. {comingSoon.body}</p>
    </section>
  )
}
