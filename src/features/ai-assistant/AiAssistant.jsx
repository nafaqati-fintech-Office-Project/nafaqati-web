import './AiAssistant.css'

const suggestions = [
  'Review my monthly spending pattern',
  'How can I improve my savings rate?',
  'Create a family budget plan',
]

const insightCards = [
  { title: 'Spending Trend', detail: 'Up 8% from last month', tone: 'blue' },
  { title: 'Savings Goal', detail: 'SAR 2,540 / 3,000', tone: 'green' },
  { title: 'Bill Alerts', detail: '3 payments due soon', tone: 'orange' },
]

export default function AiAssistant() {
  return (
    <div className="ai-page">
      <header className="ai-header">
        <div>
          <p className="eyebrow">AI Assistant</p>
          <h1>Nafaqati AI</h1>
        </div>
        <button type="button" className="icon-btn" aria-label="Open conversation settings">⚙</button>
      </header>

      <div className="ai-layout">
        <section className="ai-panel main-panel">
          <div className="assistant-bubble">
            <div className="assistant-avatar">N</div>
            <div>
              <strong>Nafaqati AI</strong>
              <p>How much should I save for my emergency fund this month?</p>
            </div>
          </div>

          <div className="answer-card">
            <div className="answer-header">
              <span className="badge blue">Recommendations</span>
            </div>
            <p>
              Based on your recurring income and expenses, a healthy target is <strong>SAR 2,500</strong> by the end of this month.
              You are currently at <strong>SAR 1,840</strong>, leaving <strong>SAR 660</strong> to reach your goal.
            </p>
          </div>

          <div className="suggestion-row">
            {suggestions.map((item) => (
              <button key={item} type="button" className="suggestion-chip">
                {item}
              </button>
            ))}
          </div>

          <div className="prompt-box">
            <input type="text" value="Ask Nafaqati..." readOnly aria-label="Ask Nafaqati" />
            <button type="button" className="voice-btn">🎙</button>
          </div>
        </section>

        <aside className="ai-panel side-panel">
          <div className="panel-head">
            <h2>Insights</h2>
            <button type="button" className="text-btn">View All</button>
          </div>

          <div className="insight-list">
            {insightCards.map((card) => (
              <div key={card.title} className={`insight-card ${card.tone}`}>
                <strong>{card.title}</strong>
                <span>{card.detail}</span>
              </div>
            ))}
          </div>

          <div className="mini-summary">
            <span>Monthly health</span>
            <strong>82%</strong>
            <div className="mini-progress">
              <span style={{ width: '82%' }} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
