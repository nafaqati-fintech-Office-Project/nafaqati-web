import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

// Generic table with sortable headers, skeleton rows and an empty slot.
// columns: [{ key, header, sortKey?, align?, className?, render(row) }]
// sort: { field, dir } | onSort(field)
export default function DataTable({
  label,
  columns,
  rows,
  getRowId,
  sort,
  onSort,
  loading,
  skeletonRows = 8,
  onRowClick,
  sortLabel,
}) {
  const sortIcon = (column) => {
    if (sort?.field !== column.sortKey) return <ArrowUpDown size={14} aria-hidden="true" />
    return sort.dir === 'asc' ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />
  }

  const ariaSort = (column) => {
    if (!column.sortKey) return undefined
    if (sort?.field !== column.sortKey) return 'none'
    return sort.dir === 'asc' ? 'ascending' : 'descending'
  }

  return (
    <div className="table-wrap">
      <table className="data-table" aria-label={label} aria-busy={loading}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={ariaSort(column)}
                className={`${column.className ?? ''} align-${column.align ?? 'left'}`}
              >
                {column.sortKey ? (
                  <button
                    type="button"
                    className="th-sort"
                    onClick={() => onSort(column.sortKey)}
                    aria-label={sortLabel?.(column.header)}
                  >
                    {column.header}
                    {sortIcon(column)}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }, (_, i) => (
                <tr key={i} className="row-skeleton" aria-hidden="true">
                  {columns.map((column) => (
                    <td key={column.key} className={`${column.className ?? ''} align-${column.align ?? 'left'}`}>
                      <span className="sk" style={{ width: column.skeletonWidth ?? '70%', height: 14, borderRadius: 7 }} />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr
                  key={getRowId(row)}
                  className={onRowClick ? 'is-clickable' : ''}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' && e.target === e.currentTarget) onRowClick(row)
                        }
                      : undefined
                  }
                >
                  {columns.map((column) => (
                    <td key={column.key} className={`${column.className ?? ''} align-${column.align ?? 'left'}`}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
