export default function FilterChip({ active, icon: Icon, tone, onClick, children }) {
  return (
    <button type="button" className={`chip ${active ? 'is-active' : ''}`} aria-pressed={active} onClick={onClick}>
      {Icon && (
        <span className={`chip-icon ${tone ? `tone-${tone}` : ''}`}>
          <Icon size={14} aria-hidden="true" />
        </span>
      )}
      {children}
    </button>
  )
}
