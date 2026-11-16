import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Info, Mic, SendHorizontal, Square, Trash2 } from 'lucide-react'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { useToast } from '../../hooks/useToast.js'
import { useAssistant } from './useAssistant.js'
import { useSpeechInput } from './useSpeechInput.js'
import './AiAssistant.css'

const MAX_QUESTION = 500

// Where each reply button goes. add_to_goal opens the goal list: contributions are added from the goal's card.
const ROUTES = {
  edit_budget: '/budgets',
  view_budget: '/budgets',
  view_goals: '/goals',
  add_to_goal: '/goals',
  view_subscriptions: '/subscriptions',
  view_reports: '/reports',
  view_transactions: '/transactions',
}

function actionLabel(action, text) {
  if (action.id !== 'add_to_goal') return text.actions[action.id]
  return action.goalName ? text.actions.add_to_goal.replace('{goal}', action.goalName) : text.actions.add_to_goal_plain
}

export default function AiAssistant() {
  const { messages, consent, typing, send, clear, accept, data, text, lang, format, firstName } = useAssistant()
  const navigate = useNavigate()
  const [draft, setDraft] = useState('')
  const [confirming, setConfirming] = useState(false)
  const endRef = useRef(null)
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const toast = useToast()
  // Spoken words fill the box (still editable); nothing is sent until the user presses Send.
  const voice = useSpeechInput(lang, setDraft, (problem) =>
    toast.error(problem === 'denied' ? text.micDenied : problem === 'unavailable' ? text.micUnavailable : text.micError),
  )

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' })
  }, [messages.length, typing])

  const submit = (value) => {
    if (!value.trim() || typing) return
    if (voice.listening) voice.stop()
    setDraft('')
    send(value)
  }

  const month = data?.months[0]
  const showChips = !typing && (messages.length === 0 || messages[messages.length - 1]?.role === 'assistant')

  return (
    <div className="ai-page" dir={dir} lang={lang}>
      <header className="ai-header">
        <div className="ai-title">
          <span className="ai-badge" aria-hidden="true">
            <Bot size={22} />
          </span>
          <div>
            <h1>{text.title}</h1>
            <p className="ai-subtitle">{text.subtitle}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button type="button" className="icon-btn" aria-label={text.clear} title={text.clear} onClick={() => setConfirming(true)}>
            <Trash2 size={18} />
          </button>
        )}
      </header>

      {!consent ? (
        <section className="ai-panel ai-consent">
          <Info size={22} className="ai-consent-icon" aria-hidden="true" />
          <h2>{text.consentTitle}</h2>
          <p>{text.consentBody}</p>
          <button type="button" className="btn btn-primary" onClick={accept}>
            {text.consentAccept}
          </button>
        </section>
      ) : (
        <div className="ai-layout">
          <section className="ai-panel main-panel" aria-label={text.title}>
            <div className="ai-messages" aria-live="polite">
              <div className="ai-msg theirs">
                <div className="ai-bubble hello">{firstName ? text.hello.replace('{name}', firstName) : text.helloNoName}</div>
              </div>
              {messages.map((m) => (
                <div key={m.id} className={`ai-msg ${m.role === 'user' ? 'mine' : 'theirs'}`}>
                  <div className="ai-bubble">{m.text}</div>
                  {m.role === 'assistant' && m.source === 'offline' && (
                    <span className="ai-note">
                      <Info size={12} aria-hidden="true" /> {text.offline}
                    </span>
                  )}
                  {m.role === 'assistant' && m.actions?.length > 0 && (
                    <div className="ai-actions">
                      {m.actions.map((a) => (
                        <button key={a.id} type="button" className="ai-action" onClick={() => navigate(ROUTES[a.id] ?? '/dashboard')}>
                          {actionLabel(a, text)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {typing && (
                <div className="ai-msg theirs">
                  <div className="ai-bubble ai-typing" role="status" aria-label={text.typing}>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {showChips && (
              <div className="suggestion-row">
                {text.suggestions.map((item) => (
                  <button key={item} type="button" className="suggestion-chip" onClick={() => submit(item)}>
                    {item}
                  </button>
                ))}
              </div>
            )}

            <form
              className="prompt-box"
              onSubmit={(e) => {
                e.preventDefault()
                submit(draft)
              }}>
              <input
                type="text"
                value={draft}
                maxLength={MAX_QUESTION}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={voice.listening ? text.listening : text.placeholder}
                aria-label={text.placeholder}
              />
              {voice.supported && (
                <button
                  type="button"
                  className={`mic-btn${voice.listening ? ' is-on' : ''}`}
                  disabled={typing}
                  aria-pressed={voice.listening}
                  aria-label={voice.listening ? text.micStop : text.mic}
                  title={voice.listening ? text.micStop : text.mic}
                  onClick={() => (voice.listening ? voice.stop() : voice.start())}>
                  {voice.listening ? <Square size={16} /> : <Mic size={18} />}
                </button>
              )}
              <button type="submit" className="send-btn" disabled={!draft.trim() || typing} aria-label={text.send} title={text.send}>
                <SendHorizontal size={18} className={dir === 'rtl' ? 'flip' : undefined} />
              </button>
            </form>
          </section>

          <aside className="ai-panel side-panel">
            <div className="panel-head">
              <h2>{text.insightsTitle}</h2>
            </div>
            {month ? (
              <div className="insight-list">
                <div className="insight-card blue">
                  <strong>{text.spent}</strong>
                  <span>{format(month.spent, month.currency)}</span>
                </div>
                <div className="insight-card green">
                  <strong>{text.income}</strong>
                  <span>{format(month.income, month.currency)}</span>
                </div>
                <div className="insight-card orange">
                  <strong>{text.net}</strong>
                  <span>{format(month.net, month.currency)}</span>
                </div>
                <div className="insight-card">
                  <strong>{text.goals}</strong>
                  <span>{data.goals.length}</span>
                </div>
                <div className="mini-summary">
                  <span>{text.budgetUsed}</span>
                  <strong>{data.budget ? `${data.budget.percent}%` : text.noBudget}</strong>
                  {data.budget && (
                    <div className="mini-progress">
                      <span style={{ width: `${Math.min(data.budget.percent, 100)}%` }} />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="ai-side-loading" aria-hidden="true" />
            )}
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title={text.clearConfirm}
        body={text.clearBody}
        confirmLabel={text.clear}
        cancelLabel={text.cancel}
        onConfirm={() => {
          clear()
          setConfirming(false)
        }}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}
