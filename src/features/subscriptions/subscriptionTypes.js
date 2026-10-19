// Shapes of subscription-service (see subscription-service/API.md). JSDoc only: the app is plain JavaScript.

/** @typedef {'DETECTED'|'CONFIRMED'|'DISMISSED'|'ENDED'} SubscriptionStatus */
/** @typedef {'DETECTED'|'MANUAL'} SubscriptionSource */
/** @typedef {'WEEKLY'|'MONTHLY'|'QUARTERLY'|'YEARLY'} BillingCycle */
/** @typedef {'DONE'|'FAILED'|'IN_PROGRESS'|'NOT_STARTED'} SyncStatus */

/**
 * @typedef {Object} Subscription
 * @property {string} id
 * @property {string} merchantKey
 * @property {string} displayName
 * @property {number} amount            latest charge, 2 decimals
 * @property {string} currency          PKR, SAR, ...
 * @property {BillingCycle} cycle
 * @property {SubscriptionStatus} status
 * @property {SubscriptionSource} source
 * @property {number} confidence        0.00 - 1.00 (1.00 for MANUAL)
 * @property {string} firstChargeDate   yyyy-MM-dd
 * @property {string} lastChargeDate    yyyy-MM-dd
 * @property {string} nextExpectedDate  yyyy-MM-dd
 * @property {number} occurrenceCount
 * @property {number} [previousAmount]  only after a price change
 * @property {string} [priceChangedAt]  only after a price change
 * @property {number} monthlyCost
 * @property {number} yearlyCost
 * @property {boolean} overdue
 * (the API returns no end date: ENDED is shown by status only)
 */

/** @typedef {{ syncStatus: SyncStatus, items: Subscription[] }} SubscriptionList */

/**
 * @typedef {Object} Summary
 * @property {{ currency: string, monthlyTotal: number, yearlyTotal: number, activeCount: number }[]} currencies  CONFIRMED only, per currency
 * @property {Record<SubscriptionStatus, number>} countsByStatus
 * @property {number} needsReview       number of DETECTED
 * @property {{ id: string, displayName: string, amount: number, currency: string, nextExpectedDate: string }[]} upcoming  next 30 days
 * @property {SyncStatus} syncStatus
 */

/** @typedef {{ displayName: string, amount: number, currency: string, cycle: BillingCycle, startDate: string }} CreateSubscription */
/** @typedef {{ displayName?: string, amount?: number, cycle?: BillingCycle }} UpdateSubscription */

export {}
