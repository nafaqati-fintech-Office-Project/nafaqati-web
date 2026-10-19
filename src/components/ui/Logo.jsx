import { useId } from 'react'

// Placeholder brand mark: swap the SVG body for the real logo file when available.
export function Logo({ size = 72, className = '' }) {
  const id = useId()
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 72 72" role="img" aria-label="Nafaqati logo">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1e6bff" />
          <stop offset="1" stopColor="#7b3ff2" />
        </linearGradient>
      </defs>
      <rect width="72" height="72" rx="20" fill={`url(#${id})`} />
      <path d="M22 52V20h6l16 21V20h6v32h-6L28 31v21z" fill="#fff" />
    </svg>
  )
}

// Placeholder white "X" mark for the Intellivex Technologies credit.
export function IntellivexMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round">
      <path d="M6 6l24 24M30 6L6 30" />
    </svg>
  )
}
