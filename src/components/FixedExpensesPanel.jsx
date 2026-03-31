import { formatCurrency } from '../utils/budgetUtils'

/**
 * Dashboard view of fixed expenses.
 * - Amounts are editable per-month (may differ from the master template).
 * - Each row has a paid/unpaid checkbox.
 * - Names are read-only here; edit them in Settings.
 */
function FixedExpensesPanel({
  expenses,
  paidExpenseIds,
  onAmountChange,
  onTogglePaid,
  total,
  unpaidTotal,
}) {
  const paidCount  = paidExpenseIds.length
  const totalCount = expenses.length

  return (
    <section className="panel expenses-panel">
      <div className="panel-title-row">
        <h2 className="panel-title">Fixed Expenses</h2>
        {paidCount > 0 && (
          <span className="progress-badge">{paidCount} / {totalCount} paid</span>
        )}
      </div>

      <div className="panel-rows scrollable">
        {expenses.map(expense => {
          const isPaid = paidExpenseIds.includes(expense.id)
          return (
            <div
              className={`panel-row expense-row${isPaid ? ' expense-paid' : ''}`}
              key={expense.id}
            >
              <input
                type="checkbox"
                className="expense-checkbox"
                checked={isPaid}
                onChange={() => onTogglePaid(expense.id)}
                title={isPaid ? 'Mark unpaid' : 'Mark as paid'}
              />
              <label
                className="row-label expense-name"
                htmlFor={`exp-${expense.id}`}
              >
                {expense.name}
              </label>
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
          )
        })}
      </div>

      <div className="panel-total">
        <span>Total Fixed</span>
        <span>{formatCurrency(total)}</span>
      </div>

      {paidCount > 0 && unpaidTotal < total && (
        <div className="panel-total secondary-total">
          <span>Still Owed</span>
          <span className="still-owed-value">{formatCurrency(unpaidTotal)}</span>
        </div>
      )}
    </section>
  )
}

export default FixedExpensesPanel


