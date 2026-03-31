import { formatCurrency } from '../utils/budgetUtils'

function FixedExpensesPanel({ expenses, onAmountChange, total }) {
  return (
    <section className="panel expenses-panel">
      <h2 className="panel-title">Fixed Expenses</h2>
      <div className="panel-rows scrollable">
        {expenses.map(expense => (
          <div className="panel-row" key={expense.id}>
            <label className="row-label" htmlFor={`exp-${expense.id}`}>{expense.name}</label>
            <input
              id={`exp-${expense.id}`}
              type="number"
              className="amount-input"
              value={expense.amount}
              onChange={e => onAmountChange(expense.id, e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
        ))}
      </div>
      <div className="panel-total">
        <span>Total Fixed</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </section>
  )
}

export default FixedExpensesPanel
