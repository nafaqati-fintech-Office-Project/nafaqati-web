import { useEffect, useRef, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Download, LoaderCircle, Search, SlidersHorizontal } from 'lucide-react'
import FilterChip from '../../components/ui/FilterChip.jsx'
import Dropdown from '../../components/ui/Dropdown.jsx'
import Drawer from '../../components/ui/Drawer.jsx'
import { APP_TEXT } from '../../constants/appText.js'
import { categoryColor } from '../../config/categoryVisuals.js'
import { RANGES, STATUSES, TYPES } from '../../hooks/useTransactionFilters.js'

const t = APP_TEXT.transactions
const SEARCH_DEBOUNCE_MS = 300
const CHIP_ICONS = { expense: [ArrowUpRight, 'red'], income: [ArrowDownLeft, 'green'] }

export default function TransactionFilters({
  filters,
  setFilters,
  clearFilters,
  hasActiveFilters,
  categories,
  isMobile,
  exporting,
  onExport,
}) {
  const [draft, setDraft] = useState(filters.q)
  const [syncedQ, setSyncedQ] = useState(filters.q)
  const [sheetOpen, setSheetOpen] = useState(false)
  const setFiltersRef = useRef(setFilters)

  // Back/forward or "Clear filters" changed ?q= from outside: adopt it
  if (filters.q !== syncedQ) {
    setSyncedQ(filters.q)
    setDraft(filters.q)
  }

  useEffect(() => {
    setFiltersRef.current = setFilters
  })

  useEffect(() => {
    if (draft === syncedQ) return undefined
    const timer = setTimeout(() => setFiltersRef.current({ q: draft.trim() }, { replace: true }), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [draft, syncedQ])

  const categoryOptions = [
    { value: '', label: t.filters.categories },
    ...categories.map((c) => ({ value: c.id, label: c.name, color: categoryColor(c.id) })),
  ]
  const statusOptions = [
    { value: '', label: t.statusFilter.all },
    ...STATUSES.map((s) => ({ value: s, label: t.status[s] })),
  ]
  const rangeOptions = RANGES.map((r) => ({ value: r, label: t.filters.ranges[r] }))
  const dropdownFilterCount = [filters.category, filters.status, filters.range !== 'all'].filter(Boolean).length

  const dropdowns = (
    <>
      <Dropdown label={t.filters.categoryLabel} value={filters.category} options={categoryOptions} onChange={(category) => setFilters({ category })} />
      <Dropdown label={t.statusFilter.label} value={filters.status} options={statusOptions} onChange={(status) => setFilters({ status })} />
      <Dropdown
        label={t.filters.timeLabel}
        value={filters.range}
        options={rangeOptions}
        onChange={(range) => setFilters({ range, from: '', to: '' })}
      />
      {filters.range === 'custom' && (
        <div className="date-range">
          <label>
            <span>{t.filters.from}</span>
            <input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => setFilters({ from: e.target.value })} />
          </label>
          <label>
            <span>{t.filters.to}</span>
            <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilters({ to: e.target.value })} />
          </label>
        </div>
      )}
    </>
  )

  const clearButton = hasActiveFilters && (
    <button type="button" className="link-btn" onClick={clearFilters}>
      {t.filters.clear}
    </button>
  )

  return (
    <div className="tx-filters">
      <label className="tx-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchLabel}
        />
      </label>

      <div className="tx-chips-row">
        <div className="tx-chips" role="group" aria-label={t.typeFilterLabel}>
          <FilterChip active={!filters.type} onClick={() => setFilters({ type: '' })}>
            {t.types.all}
          </FilterChip>
          {TYPES.map((type) => (
            <FilterChip
              key={type}
              active={filters.type === type}
              icon={CHIP_ICONS[type][0]}
              tone={CHIP_ICONS[type][1]}
              onClick={() => setFilters({ type })}
            >
              {t.types[type]}
            </FilterChip>
          ))}
        </div>
        <div className="tx-chips-actions">
          {isMobile && (
            <button type="button" className="btn btn-outline" onClick={() => setSheetOpen(true)}>
              <SlidersHorizontal size={16} aria-hidden="true" />
              {t.filters.title}
              {dropdownFilterCount > 0 && <span className="count-badge">{dropdownFilterCount}</span>}
            </button>
          )}
          <button type="button" className="btn btn-outline" onClick={onExport} disabled={exporting}>
            {exporting ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
            {t.export}
          </button>
        </div>
      </div>

      {isMobile ? (
        <>
          {clearButton}
          <Drawer open={sheetOpen} onClose={() => setSheetOpen(false)} title={t.filters.title} closeLabel={t.details.close} placement="bottom"
            footer={
              <>
                {clearButton}
                <button type="button" className="btn btn-primary" onClick={() => setSheetOpen(false)}>
                  {t.filters.done}
                </button>
              </>
            }
          >
            <div className="sheet-filters">{dropdowns}</div>
          </Drawer>
        </>
      ) : (
        <div className="tx-dropdowns">
          {dropdowns}
          {clearButton}
        </div>
      )}
    </div>
  )
}
