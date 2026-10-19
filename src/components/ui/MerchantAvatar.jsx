// Colored letter tile; the color is derived from the name so a merchant always looks the same.
const COLORS = ['#6366F1', '#0EA5E9', '#14B8A6', '#F59E0B', '#EC4899', '#8B5CF6']

export default function MerchantAvatar({ name = '', size = 40 }) {
  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return (
    <span
      className="merchant-avatar"
      style={{ width: size, height: size, background: COLORS[hash % COLORS.length], color: '#fff', fontSize: size * 0.45 }}
      aria-hidden="true"
    >
      {(name[0] ?? '?').toUpperCase()}
    </span>
  )
}
