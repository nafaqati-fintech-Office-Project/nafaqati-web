import { ArrowDown, ArrowUp, Hourglass } from 'lucide-react'
import DashCard, { Sk } from './DashCard.jsx'
import { APP_TEXT } from '../../../constants/appText.js'
import { formatPercent } from '../../../utils/format.js'

// Reusable stat card. `trend` is the percent change vs the previous month (null/undefined = hidden, e.g. when the
// previous month is zero); `trendTone` is its color. `soon` renders the honest "Coming soon" state instead.
export default function StatCard({ icon: Icon, tone, label, value, trend, trendTone, soon, state, onClick, actionLabel, trendLabel }) {
  const clickable = Boolean(onClick) && !soon
  const Body = clickable ? 'button' : 'div'
  const bodyProps = clickable ? { type: 'button', onClick, 'aria-label': actionLabel ?? label, title: actionLabel } : {}
  return (
    <DashCard
      className={`stat${clickable ? ' stat-clickable' : ''}`}
      state={state ?? { loading: false, error: null }}
      skeleton={
        <div className="stat-body">
          <Sk w={44} h={44} r={22} />
          <div className="stat-text">
            <Sk w="60%" h={12} />
            <Sk w="80%" h={22} />
            <Sk w="70%" h={12} />
          </div>
        </div>
      }
    >
      <Body className="stat-body" {...bodyProps}>
        <span className={`icon-circle ${soon ? 'tone-muted' : `tone-${tone}`}`}>
          {soon ? <Hourglass size={22} aria-hidden="true" /> : <Icon size={24} aria-hidden="true" />}
        </span>
        <div className="stat-text">
          <span className="stat-label">{label}</span>
          {soon ? (
            <span className="stat-soon">{APP_TEXT.common.comingSoon}</span>
          ) : (
            <>
              <span className="stat-value num">{value}</span>
              {trend != null && (
                <span className={`stat-trend text-${trendTone}`}>
                  {trend >= 0 ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />}
                  <span className="num">{formatPercent(trend)}</span> {trendLabel ?? APP_TEXT.common.perMonth}
                </span>
              )}
            </>
          )}
        </div>
      </Body>
    </DashCard>
  )
}
