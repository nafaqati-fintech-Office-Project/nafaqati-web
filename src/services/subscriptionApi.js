import api from '../lib/api.js'
import { withBackoff } from './backoff.js'
import * as mock from './subscriptionMock.js'

// subscription-service through the gateway (/api/subscriptions/**). The user is identified by the gateway from the JWT:
// nothing identifying is ever sent from here. See subscription-service/API.md.
const BASE = '/api/subscriptions'
// The gateway cuts a response at about 30 s (the first list of a user runs the history catch-up synchronously)
export const REQUEST_TIMEOUT_MS = 30000

export const SUBSCRIPTIONS_MOCK = import.meta.env.VITE_SUBSCRIPTIONS_MOCK === 'true'

const call = (config) => withBackoff(() => api.request({ baseURL: undefined, timeout: REQUEST_TIMEOUT_MS, ...config }).then((res) => res.data))

// status = repeatable filter: status=A&status=B. Without it the API hides DISMISSED.
const real = {
  list: (statuses) =>
    call({ method: 'get', url: BASE, params: statuses?.length ? { status: statuses } : undefined, paramsSerializer: { indexes: null } }),
  summary: () => call({ method: 'get', url: `${BASE}/summary` }),
  get: (id) => call({ method: 'get', url: `${BASE}/${id}` }),
  create: (body) => call({ method: 'post', url: BASE, data: body }),
  update: (id, body) => call({ method: 'patch', url: `${BASE}/${id}`, data: body }),
  confirm: (id) => call({ method: 'post', url: `${BASE}/${id}/confirm` }),
  dismiss: (id) => call({ method: 'post', url: `${BASE}/${id}/dismiss` }),
  end: (id, endDate) => call({ method: 'post', url: `${BASE}/${id}/end`, data: endDate ? { endDate } : undefined }),
}

const impl = SUBSCRIPTIONS_MOCK ? mock : real

export const listSubscriptions = (statuses) => impl.list(statuses)
export const getSummary = () => impl.summary()
export const getSubscription = (id) => impl.get(id)
export const createSubscription = (body) => impl.create(body)
export const updateSubscription = (id, body) => impl.update(id, body)
export const confirmSubscription = (id) => impl.confirm(id)
export const dismissSubscription = (id) => impl.dismiss(id)
export const endSubscription = (id, endDate) => impl.end(id, endDate)
