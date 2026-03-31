import { formatCurrency } from '../utils/budgetUtils'

function IncomePanel({ income, checkingBalance, onCheckingBalanceChange, totalIn }) {
  return (
    <section className="panel income-panel">
      <h2 className="panel-title">Income</h2>
      <div className="panel-rows">
        <div className="panel-row">
          <label className="row-label" htmlFor="checking-balance">Checking Balance</label>
          <input
            id="checking-balance"
            type="number"
            className="amount-input"
            value={checkingBalance}
            onChange={e => onCheckingBalanceChange(e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>
        <div className="panel-row computed">
          <span className="row-label">
            Paychecks
            <span className="row-sub">{income.thursdays} Thu × $1,300</span>
          </span>
          <span className="row-value">{formatCurrency(income.paychecks)}</span>
        </div>
        <div className="panel-row computed">
          <span className="row-label">
            Laura
            {income.thursdays >= 5 && <span className="row-sub badge">5-Thu month</span>}
          </span>
          <span className="row-value">{formatCurrency(income.laura)}</span>
        </div>
      </div>
      <div className="panel-total">
        <span>Total In</span>
        <span>{formatCurrency(totalIn)}</span>
      </div>
    </section>
  )
}

export default IncomePanel
