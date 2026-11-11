import { useMemo, useState } from 'react'
import DataTable from '../../components/ui/DataTable.jsx'
import MerchantAvatar from '../../components/ui/MerchantAvatar.jsx'
import CategoryBadge from '../../components/ui/CategoryBadge.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import AmountText from '../../components/ui/AmountText.jsx'
import RowMenu from './RowMenu.jsx'
import { APP_TEXT } from '../../constants/appText.js'
import { useFormat } from '../../hooks/useFormat.js'

const t = APP_TEXT.transactions

export default function TransactionTable({
  items,
  loading,
  pageSize,
  isMobile,
  sort,
  onSort,
  categories,
  onView,
  onEdit,
  onDelete,
  onChangeCategory,
}) {
  const fmt = useFormat()
  const columns = useMemo(
    () => [
      {
        key: 'date',
        header: t.columns.date,
        sortKey: 'transactionDate',
        className: 'col-date',
        skeletonWidth: '80%',
        render: (row) => <span className="num">{fmt.date(row.occurredAt)}</span>,
      },
      {
        key: 'merchant',
        header: t.columns.merchant,
        skeletonWidth: '60%',
        render: (row) => (
          <div className="merchant-cell">
            <MerchantAvatar name={row.merchant.name} />
            <div className="merchant-text">
              <strong>{row.merchant.name}</strong>
              {row.cardLast4 && <small className="tx-card-digits num">•••• {row.cardLast4}</small>}
            </div>
          </div>
        ),
      },
      {
        key: 'category',
        header: t.columns.category,
        skeletonWidth: '70%',
        render: (row) => <CategoryBadge code={row.categoryId} />,
      },
      {
        key: 'status',
        header: t.details.status,
        skeletonWidth: '60%',
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'amount',
        header: t.columns.amount,
        sortKey: 'amount',
        align: 'right',
        skeletonWidth: '70%',
        render: (row) => <AmountText type={row.type} amount={row.amount} currency={row.currency} />,
      },
      {
        key: 'actions',
        header: t.columns.actions,
        align: 'center',
        skeletonWidth: '24px',
        render: (row) => (
          <RowMenu
            txn={row}
            categories={categories}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onChangeCategory={onChangeCategory}
          />
        ),
      },
    ],
    [fmt, categories, onView, onEdit, onDelete, onChangeCategory],
  )

  if (isMobile) {
    return <TransactionCards items={items} loading={loading} onView={onView} />
  }

  return (
    <DataTable
      label={t.table.label}
      columns={columns}
      rows={items}
      getRowId={(row) => row.id}
      sort={sort}
      onSort={onSort}
      loading={loading}
      skeletonRows={pageSize}
      onRowClick={onView}
      sortLabel={t.table.sortBy}
    />
  )
}

// <768px: cards grouped by date
function TransactionCards({ items, loading, onView }) {
  const fmt = useFormat()
  const [now] = useState(() => new Date())
  const groups = useMemo(() => {
    const byDay = new Map()
    items.forEach((item) => {
      const key = fmt.dateKey(item.occurredAt)
      if (!byDay.has(key)) byDay.set(key, { heading: fmt.dayHeading(item.occurredAt, now, t), items: [] })
      byDay.get(key).items.push(item)
    })
    return [...byDay.entries()]
  }, [items, fmt, now])

  if (loading) {
    return (
      <div className="tx-cards" aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="sk" style={{ height: 64, borderRadius: 14 }} />
        ))}
      </div>
    )
  }

  return (
    <div className="tx-cards">
      {groups.map(([key, group]) => (
        <section key={key} aria-label={group.heading}>
          <h3 className="tx-group">{group.heading}</h3>
          <ul>
            {group.items.map((item) => (
              <li key={item.id}>
                <button type="button" className="tx-card-item" onClick={() => onView(item)}>
                  <MerchantAvatar name={item.merchant.name} />
                  <span className="tx-card-text">
                    <strong>{item.merchant.name}</strong>
                    <CategoryBadge code={item.categoryId} />
                    <StatusBadge status={item.status} />
                  </span>
                  <AmountText type={item.type} amount={item.amount} currency={item.currency} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
