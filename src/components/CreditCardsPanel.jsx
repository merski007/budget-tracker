import { formatCurrency } from '../utils/budgetUtils'

function CreditCardsPanel({ cards, onCardChange, total }) {
  return (
    <section className="panel cc-panel">
      <h2 className="panel-title">Credit Cards</h2>
      <div className="cc-grid">
        <div className="cc-header">
          <span></span>
          <span>Available Credit</span>
          <span>Remaining Credit</span>
          <span>Amount Owed</span>
        </div>
        {cards.map(card => {
          const avail     = parseFloat(card.availableCredit)  || 0
          const remaining = parseFloat(card.remainingCredit) || 0
          const owed      = avail > 0 ? avail - remaining : 0
          return (
            <div className="cc-row" key={card.id}>
              <span className="cc-name">{card.name}</span>
              <input
                type="number"
                className="amount-input"
                placeholder="e.g. 5000"
                value={card.availableCredit}
                onChange={e => onCardChange(card.id, 'availableCredit', e.target.value)}
                min="0"
                step="0.01"
              />
              <input
                type="number"
                className="amount-input"
                placeholder="e.g. 3500"
                value={card.remainingCredit}
                onChange={e => onCardChange(card.id, 'remainingCredit', e.target.value)}
                min="0"
                step="0.01"
              />
              <span className={`cc-owed ${owed > 0 ? 'has-balance' : ''}`}>
                {avail > 0 ? formatCurrency(owed) : '—'}
              </span>
            </div>
          )
        })}
      </div>
      <div className="panel-total">
        <span>Total CC Owed</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </section>
  )
}

export default CreditCardsPanel
