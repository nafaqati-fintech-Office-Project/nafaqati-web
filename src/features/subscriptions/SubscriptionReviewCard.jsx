import { Lightbulb } from 'lucide-react'
import { useSubscriptionText } from './useSubscriptionText.js'
import './SubscriptionReviewCard.css'

// The design shows "Potential annual saving" here; the API has no such figure, so this card shows what the API does
// know: how many detected subscriptions wait for the user's decision.
export default function SubscriptionReviewCard({ count, onReview }) {
  const { t } = useSubscriptionText()
  const any = count > 0
  return (
    <section className={`subs-review-card ${any ? 'has-items' : ''}`} aria-label={t.review.title}>
      <div className="subs-review-top">
        <span className="subs-review-icon" aria-hidden="true">
          <Lightbulb size={30} />
        </span>
        <div>
          <p className="subs-review-label">{any ? t.review.title : t.review.none}</p>
          <p className="subs-review-count">{any ? t.review.count(count) : t.review.noneBody}</p>
        </div>
      </div>
      {any && (
        <button type="button" className="subs-review-cta" onClick={onReview}>
          {t.review.cta}
        </button>
      )}
    </section>
  )
}
