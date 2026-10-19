import { ChevronLeft, ChevronRight } from 'lucide-react'
import Dropdown from './Dropdown.jsx'
import { APP_TEXT } from '../../constants/appText.js'

// 1, 2, …, 5, 6, 7, …, 12  (pages are 1-based here)
function pageList(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ['gap-' + p, p] : [p]))
}

export default function Pagination({ page, size, totalItems, totalPages, sizes, onPage, onSize }) {
  const t = APP_TEXT.transactions.pagination
  const from = totalItems === 0 ? 0 : (page - 1) * size + 1
  const to = Math.min(page * size, totalItems)

  return (
    <nav className="pagination" aria-label={t.label}>
      <p className="pagination-info">{t.showing(from, to, totalItems)}</p>
      <div className="pagination-controls">
        <button type="button" className="page-btn" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label={t.prev}>
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        {pageList(page, totalPages).map((p) =>
          typeof p === 'string' ? (
            <span key={p} className="page-gap" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`page-btn ${p === page ? 'is-active' : ''}`}
              aria-current={p === page ? 'page' : undefined}
              aria-label={t.page(p)}
              onClick={() => onPage(p)}
            >
              {p}
            </button>
          ),
        )}
        <button type="button" className="page-btn" onClick={() => onPage(page + 1)} disabled={page >= totalPages} aria-label={t.next}>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
        <Dropdown
          className="rows-select"
          label={t.rows}
          placement="top"
          value={size}
          options={sizes.map((s) => ({ value: s, label: `${s} / page` }))}
          onChange={onSize}
        />
      </div>
    </nav>
  )
}
