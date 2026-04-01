import { useState } from 'react'
import { formatCurrency } from '../utils/budgetUtils'

/**
 * Dashboard view of fixed expenses.
 * - Paycheck-row style: locked value display by default.
 * - Edit button unlocks inline amount editing per row.
 * - Delete button removes that row from this month only.
 * - Reset button restores this panel from the master template.
 * - Paid checkbox toggles the row's "paid" state.
 */
function FixedExpensesPanel({
  expenses,
  paidExpenseIds,
  onAmountChange,
  onTogglePaid,
  onDeleteExpense,
  onReset,
  total,
  unpaidTotal,
}) {
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  const paidCount  = paidExpenseIds.length
  const totalCount = expenses.length

  function startEdit(expense) { setEditingId(expense.id); setEditValue(String(expense.amount ?? '')) }
  function commitEdit(id) { onAmountChange(id, editValue); setEditingId(null) }
  function cancelEdit() { setEditingId(null) }

  return (
    <section className="panel expenses-panel">
      <div className="panel-title-row">
        <h2 className="panel-title">Fixed Expenses</h2>
        <div className="panel-title-actions">
          {paidCount > 0 && (
            <span className="progress-badge">{paidCount} / {totalCount} paid</span>
          )}
          <button className="panel-reset-btn" onClick={onReset} title="Reset this panel from template">↺ Reset</button>
        </div>
      </div>

      <div className="panel-rows scrollable">
        {expenses.map(expense => {
          const isPaid    = paidExpenseIds.includes(expense.id)
          const isEditing = editingId === expense.id
          return (
            <div
              key={expense.id}
              className={`panel-row paycheck-row${isPaid ? ' paycheck-received' : ''}`}
            >
              <input
                type="checkbox"
                className="paycheck-checkbox"
                checked={isPaid}
                onChange={() => onTogglePaid(expense.id)}
                title={isPaid ? 'Mark unpaid' : 'Mark as paid'}
              />
              <label className="row-label paycheck-label-text">{expense.name}</label>
              {isEditing ? (
                <>
                  <input
                    type="number"
                    className="amount-input amount-input-inline"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(expense.id); if (e.key === 'Escape') cancelEdit() }}
                    autoFocus min="0" step="0.01"
                  />
                  <div className="row-actions">
                    <button className="action-btn edit-btn" onClick={() => commitEdit(expense.id)} title="Save">✔</button>
                    <button className="action-btn delete-btn" onClick={cancelEdit} title="Cancel">✕</button>
                  </div>
                </>
              ) : (
                <>
                  <span className={`row-value row-value-expense${isPaid ? ' value-pending' : ''}`}>
                    {formatCurrency(parseFloat(expense.amount) || 0)}
                  </span>
                  <div className="row-actions">
                    <button className="action-btn edit-btn" onClick={() => startEdit(expense)} title="Edit amount">✎</button>
                    <button className="action-btn delete-btn" onClick={() => onDeleteExpense(expense.id)} title="Remove from this month">✕</button>
                  </div>
                </>
              )}
            </div>
          )
        })}

        {expenses.length === 0 && (
          <div className="panel-row panel-empty-hint">
            <span>Add fixed expenses in ⚙ Settings</span>
          </div>
        )}
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



