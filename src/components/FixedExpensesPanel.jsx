import { useState } from 'react'
import { formatCurrency } from '../utils/budgetUtils'

function FixedExpensesPanel({
  expenses,
  paidExpenseIds,
  onAmountChange,
  onRename,
  onAdd,
  onDelete,
  onTogglePaid,
  total,
  unpaidTotal,
}) {
  const [editingId, setEditingId] = useState(null)
  const [editName,  setEditName]  = useState('')
  const [addName,   setAddName]   = useState('')
  const [addAmount, setAddAmount] = useState('')

  const paidCount  = paidExpenseIds.length
  const totalCount = expenses.length

  function startEdit(expense) {
    setEditingId(expense.id)
    setEditName(expense.name)
  }

  function commitEdit(id) {
    if (editName.trim()) onRename(id, editName.trim())
    setEditingId(null)
  }

  function handleAdd() {
    if (!addName.trim()) return
    onAdd(addName.trim(), addAmount)
    setAddName('')
    setAddAmount('')
  }

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
          const isPaid    = paidExpenseIds.includes(expense.id)
          const isEditing = editingId === expense.id

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

              {isEditing ? (
                <input
                  className="expense-edit-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => commitEdit(expense.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter')  commitEdit(expense.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  autoFocus
                />
              ) : (
                <label
                  className="row-label expense-name"
                  htmlFor={`exp-${expense.id}`}
                  title="Click ✎ to rename"
                >
                  {expense.name}
                </label>
              )}

              <input
                id={`exp-${expense.id}`}
                type="number"
                className="amount-input"
                value={expense.amount}
                onChange={e => onAmountChange(expense.id, e.target.value)}
                min="0"
                step="0.01"
              />

              <div className="expense-actions">
                <button
                  className="action-btn edit-btn"
                  onClick={() => isEditing ? commitEdit(expense.id) : startEdit(expense)}
                  title={isEditing ? 'Save name' : 'Rename'}
                >✎</button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => onDelete(expense.id)}
                  title="Delete expense"
                >✕</button>
              </div>
            </div>
          )
        })}

        {/* ── Add new expense row ── */}
        <div className="panel-row add-expense-row">
          <span className="add-expense-icon">＋</span>
          <input
            type="text"
            className="expense-edit-input"
            placeholder="New expense name…"
            value={addName}
            onChange={e => setAddName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <input
            type="number"
            className="amount-input"
            placeholder="0.00"
            value={addAmount}
            onChange={e => setAddAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            min="0"
            step="0.01"
          />
          <button
            className="add-expense-btn"
            onClick={handleAdd}
            disabled={!addName.trim()}
          >
            Add
          </button>
        </div>
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

