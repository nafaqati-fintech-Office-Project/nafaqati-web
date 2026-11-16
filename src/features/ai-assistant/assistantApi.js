import api from '../../lib/api.js'

// The model service through the gateway (it checks the JWT and adds X-User-Id). The server stops trying keys after
// about 25 s; the gateway allows 30 s.
const TIMEOUT_MS = 32000
const ACTIONS = new Set(['edit_budget', 'view_budget', 'view_goals', 'add_to_goal', 'view_subscriptions', 'view_reports', 'view_transactions'])

// { reply, actions } from the model, or null whenever there is none (offline, limit reached, server not updated
// yet): the page then shows the facts engine's own answer.
export async function askAssistant(body) {
  try {
    const { data } = await api.post('/api/ai-service/assistant/chat', body, { timeout: TIMEOUT_MS })
    if (typeof data?.reply !== 'string' || !data.reply.trim()) return null
    const actions = Array.isArray(data.actions) ? data.actions.filter((a) => ACTIONS.has(a)) : []
    return { reply: data.reply.trim(), actions }
  } catch {
    return null
  }
}
