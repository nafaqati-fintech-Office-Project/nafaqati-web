import { useSubscriptionText } from './useSubscriptionText.js'
import './SubscriptionTabs.css'

// Active / Cancelled pills, as in the design
export default function SubscriptionTabs({ tab, onTab, activeCount, cancelledCount }) {
  const { t } = useSubscriptionText()
  const tabs = [
    ['active', t.tabs.active(activeCount)],
    ['cancelled', t.tabs.cancelled(cancelledCount)],
  ]
  return (
    <div className="subs-tabs" role="tablist" aria-label={t.tabs.label}>
      {tabs.map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="tab"
          id={`subs-tab-${value}`}
          aria-selected={tab === value}
          aria-controls="subs-panel"
          tabIndex={tab === value ? 0 : -1}
          className={tab === value ? 'is-active' : ''}
          onClick={() => onTab(value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') onTab(value === 'active' ? 'cancelled' : 'active')
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
