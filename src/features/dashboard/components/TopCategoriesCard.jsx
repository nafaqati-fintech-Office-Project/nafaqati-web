import { Cell, Pie, PieChart } from 'recharts'
import DashCard, { Sk } from './DashCard.jsx'
import { useFormat } from '../../../hooks/useFormat.js'
import { APP_TEXT } from '../../../constants/appText.js'
import { categoryColor } from '../../../config/categoryVisuals.js'
import { useCategories } from '../../../hooks/useCategories.js'

const SIZE = 190
const pct = (value) => Number(value.toFixed(1))

export default function TopCategoriesCard({ data, state, onViewAll, onViewDetails, onAdd, onSelectCategory }) {
  const { money } = useFormat()
  const { nameOf } = useCategories()
  const t = APP_TEXT.dashboard.categories
  const items = data?.items ?? []
  const summary = t.summary(items.map((i) => `${nameOf(i.key)} ${pct(i.percent)}% ${money(i.amount)}`).join(', '))

  return (
    <DashCard
      title={t.title}
      className="cats"
      state={state}
      action={
        <button type="button" className="link-btn" onClick={onViewAll}>
          {APP_TEXT.common.viewAll}
        </button>
      }
      empty={data && items.length === 0 ? { title: t.emptyTitle, body: t.emptyBody, cta: { label: t.emptyCta, onClick: onAdd } } : null}
      skeleton={
        <>
          <div className="donut-wrap">
            <Sk w={SIZE} h={SIZE} r={SIZE / 2} />
          </div>
          {[0, 1, 2, 3, 4].map((i) => (
            <Sk key={i} h={14} className="sk-row" />
          ))}
        </>
      }
    >
      {data && (
        <>
          <div className="donut-wrap" role="img" aria-label={summary}>
            <PieChart width={SIZE} height={SIZE}>
              <Pie
                data={items}
                dataKey="amount"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={2}
                cornerRadius={4}
                stroke="none"
                startAngle={90}
                endAngle={-270}
                onClick={onSelectCategory ? (slice) => onSelectCategory(slice?.payload?.key ?? slice?.key) : undefined}
              >
                {items.map((item) => (
                  <Cell key={item.key} fill={categoryColor(item.key)} className={onSelectCategory ? 'donut-slice-link' : undefined} />
                ))}
              </Pie>
            </PieChart>
            <div className="donut-center">
              <strong className="num">{money(data.total)}</strong>
              <span>{t.total}</span>
            </div>
          </div>
          <button type="button" className="soft-btn" onClick={onViewDetails}>
            {t.viewDetails}
          </button>
          <ul className="cat-list">
            {items.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className="cat-row-btn"
                  onClick={() => onSelectCategory?.(item.key)}
                  disabled={!onSelectCategory}
                  aria-label={t.viewCategory(nameOf(item.key))}
                  title={t.viewCategory(nameOf(item.key))}
                >
                  <span className="legend-dot" style={{ background: categoryColor(item.key) }} />
                  <span className="cat-name">{nameOf(item.key)}</span>
                  <span className="cat-percent num">{pct(item.percent)}%</span>
                  <span className="cat-amount num">{money(item.amount)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </DashCard>
  )
}
