import { formatCurrency } from '../utils/budgetUtils'

function SavingsPanel({ savingsBalance, onBalanceChange, thisMonthContribution, history }) {
  const projected = savingsBalance + thisMonthContribution

  return (
    <section className="panel savings-panel">
      <h2 className="panel-title">Savings</h2>

      <div className="savings-top">
        <div className="savings-stat">
          <span className="savings-stat-label">Current Balance</span>
          <div className="savings-balance-row">
            <span className="savings-prefix">$</span>
            <input
              type="number"
              className="savings-balance-input"
              value={savingsBalance}
              min="0"
              step="0.01"
              onChange={e => onBalanceChange(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        <div className="savings-stat">
          <span className="savings-stat-label">This Month's Contribution</span>
          <span className="savings-big-value">{formatCurrency(thisMonthContribution)}</span>
          <span className="savings-hint">from Fixed Expenses → Savings</span>
        </div>
        <div className="savings-stat highlight">
          <span className="savings-stat-label">Projected Balance</span>
          <span className="savings-big-value projected">{formatCurrency(projected)}</span>
          <span className="savings-hint">after this month</span>
        </div>
      </div>

      <div className="savings-history">
        <div className="savings-history-header">
          <span>Month</span>
          <span>Contribution</span>
          <span>Running Balance</span>
        </div>
        {history.map(row => (
          <div className="savings-history-row" key={`${row.year}-${row.month}`}>
            <span>{row.label}</span>
            <span className="amt-contrib">{formatCurrency(row.contribution)}</span>
            <span className="amt-balance">{formatCurrency(row.runningBalance)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default SavingsPanel
