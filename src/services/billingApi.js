import api from '../lib/api.js'

// Plans and Premium (billing-service), through the gateway. The server decides what the signed-in user may do; the page only
// shows what these calls return.

export const getMe = () => api.get('/api/billing/me').then((res) => res.data)

// [{ id: 'free' | 'premium', entitlements: { key: true | false | number | 'unlimited' }, prices: [{ interval, currency, amount }] }]
export const getPlans = () => api.get('/api/billing/plans').then((res) => res.data)

// Starts a purchase. Premium begins only when the payment provider confirms it; re-read getMe() afterwards.
export const startCheckout = (interval, currency) =>
  api
    .post(
      '/api/billing/checkout',
      { interval, currency },
      { headers: { 'Idempotency-Key': `${Date.now()}-${Math.random().toString(36).slice(2, 12)}` } },
    )
    .then((res) => res.data)

// Development servers only: the mock payment provider confirms the payment (403 elsewhere).
export const completeMockPayment = (paymentId) =>
  api.post(`/api/billing/mock/payments/${encodeURIComponent(paymentId)}/succeed`).then((res) => res.data)

export const cancelSubscription = () => api.post('/api/billing/cancel').then((res) => res.data)
export const resumeSubscription = () => api.post('/api/billing/resume').then((res) => res.data)
