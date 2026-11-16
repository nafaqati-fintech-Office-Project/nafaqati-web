import { useCallback, useEffect, useRef, useState } from 'react'
import { ASSISTANT_TEXT } from '../../constants/appText.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCategories } from '../../hooks/useCategories.js'
import { usePreferences } from '../../hooks/usePreferences.js'
import { useUser } from '../../hooks/useUser.js'
import { resolveTimeZone } from '../../utils/timeZone.js'
import { askAssistant } from './assistantApi.js'
import { loadAssistantData } from './assistantData.js'
import { answerQuestion } from './assistantFacts.js'
import { toContext } from './assistantShape.js'

// Data older than this is loaded again before answering, so a new payment shows up in the answers.
const FRESH_MS = 5 * 60 * 1000
const HISTORY_SENT = 6
const MAX_SAVED = 60
const MAX_ACTIONS = 3

// The conversation and the one-time privacy notice are kept in this browser, per account.
const read = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
const write = (key, value) => {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode or full storage: the chat simply starts empty next time.
  }
}

let nextId = 0
const newId = () => `${Date.now()}-${(nextId += 1)}`

// The engine's buttons first (they carry the goal), then any other screen the model suggested.
function mergeActions(own, suggested) {
  const goal = own.find((a) => a.id === 'add_to_goal')
  const extra = suggested.map((id) => (id === 'add_to_goal' ? (goal ?? { id: 'view_goals' }) : { id }))
  const seen = new Set()
  return [...own, ...extra].filter((a) => !seen.has(a.id) && seen.add(a.id)).slice(0, MAX_ACTIONS)
}

export function useAssistant() {
  const { user } = useAuth()
  const { prefs } = usePreferences()
  const { profile } = useUser()
  const { nameOf } = useCategories()
  const lang = prefs?.language === 'ar' ? 'ar' : 'en'
  const text = ASSISTANT_TEXT[lang]
  const timeZone = resolveTimeZone(prefs?.timezone)
  const preferredCurrency = prefs?.currency
  const userId = user?.id ?? 'anonymous'
  const historyKey = `nafaqati.assistant.history.${userId}`
  const consentKey = `nafaqati.assistant.consent.${userId}`

  const [messages, setMessages] = useState(() => read(historyKey, []))
  const [consent, setConsentState] = useState(() => read(consentKey, false) === true)
  const [typing, setTyping] = useState(false)
  const [data, setData] = useState(null)
  const cache = useRef(null)
  const pending = useRef(null)
  const current = useRef(messages)

  const ensureData = useCallback(async () => {
    if (cache.current && Date.now() - cache.current.at < FRESH_MS) return cache.current.value
    pending.current ??= loadAssistantData({ timeZone, currency: preferredCurrency })
      .then((value) => {
        cache.current = { value, at: Date.now() }
        setData(value)
        return value
      })
      .finally(() => {
        pending.current = null
      })
    return pending.current
  }, [timeZone, preferredCurrency])

  useEffect(() => {
    if (consent) ensureData().catch(() => undefined)
  }, [consent, ensureData])

  const append = useCallback(
    (message) => {
      current.current = [...current.current, message]
      setMessages(current.current)
      write(historyKey, current.current.slice(-MAX_SAVED))
    },
    [historyKey],
  )

  const format = useCallback(
    (amount, currency) =>
      new Intl.NumberFormat(text.locale, { style: 'currency', currency, maximumFractionDigits: 2, numberingSystem: 'latn' }).format(amount),
    [text.locale],
  )
  const monthLabel = useCallback(
    (month) => {
      const [y, m] = month.split('-').map(Number)
      return new Date(y, m - 1, 1).toLocaleDateString(text.locale, { month: 'long', year: 'numeric' })
    },
    [text.locale],
  )

  const send = useCallback(
    async (raw) => {
      const question = raw.trim()
      if (!question || typing) return
      const history = current.current.slice(-HISTORY_SENT).map((m) => ({ role: m.role, text: m.text.slice(0, 1000) }))
      append({ id: newId(), role: 'user', text: question, at: Date.now() })
      setTyping(true)
      try {
        let value
        try {
          value = await ensureData()
        } catch {
          append({ id: newId(), role: 'assistant', text: text.loadError, source: 'offline', at: Date.now() })
          return
        }
        const answer = answerQuestion(question, value, { text, nameOf, format, monthLabel })
        const firstName = profile?.firstName ?? null
        const reply = await askAssistant({ question, language: lang, history, context: toContext(value, { firstName, language: lang }), facts: answer.facts })
        append({
          id: newId(),
          role: 'assistant',
          text: reply?.reply ?? answer.fallback,
          actions: mergeActions(answer.actions, reply?.actions ?? []),
          source: reply ? 'model' : 'offline',
          at: Date.now(),
        })
      } finally {
        setTyping(false)
      }
    },
    [append, ensureData, format, lang, monthLabel, nameOf, profile, text, typing],
  )

  const clear = useCallback(() => {
    current.current = []
    setMessages([])
    write(historyKey, null)
  }, [historyKey])

  const accept = useCallback(() => {
    setConsentState(true)
    write(consentKey, true)
  }, [consentKey])

  return { messages, consent, typing, send, clear, accept, data, text, lang, format, firstName: profile?.firstName ?? null }
}
