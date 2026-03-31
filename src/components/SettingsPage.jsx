import { useState } from 'react'
import { formatCurrency } from '../utils/budgetUtils'

/**
 * Settings page — manage the master fixed-expense template.
 * Names and amounts set here become the defaults for every new month
 * and the target when the dashboard Reset button is used.
 *
 * Props:
 *   masterExpenses  — array of { id, name, amount }
 *   onChange        — (newExpenses) => void  (called on every change; App debounces the save)
 */
function SettingsPage({ masterExpenses, onChange }) {
  const [editingId, setEditingId] = useState(null)
  const [editName,  setEditName]  = useState('')
  const [editAmt,   setEditAmt]   = useState('')
  const [addName,   setAddName]   = useState('')
  const [addAmount, setAddAmount] = useState('')

  const total = masterExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)

  // ── Helpers ────────────────────────────────────────────────────────────────
  function startEdit(e) {
    setEditingId(e.id)
    setEditName(e.name)
    setEditAmt(String(e.amount))
  }

  function commitEdit(id) {
    if (editName.trim()) {
      onChange(masterExpenses.map(e =>
        e.id === id
          ? { ...e, name: editName.trim(), amount: parseFloat(editAmt) || e.amount }
          : e,
      ))
    }
    setEditingId(null)
  }

  function deleteExpense(id) {
    onChange(masterExpenses.filter(e => e.id !== id))
  }

  function handleAdd() {
    if (!addName.trim()) return
    const id = `custom-${Date.now().toString(36)}`
    onChange([...masterExpenses, { id, name: addName.trim(), amount: parseFloat(addAmount) || 0 }])
    setAddName('')
    setAddAmount('')
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2 className="settings-title">Fixed Expenses Template</h2>
        <p className="settings-hint">
          Changes here apply to all <strong>new months</strong> and when you use the
          &ldquo;Reset Month&rdquo; button on the dashboard.
        </p>
      </div>

      <section className="panel settings-panel">
        <div className="settings-panel-header">
          <span>Expense Name</span>
          <span>Monthly Amount</span>
          <span></span>
        </div>

        <div className="settings-rows">
          {masterExpenses.map(expense => {
            const isEditing = editingId === expense.id
            return (
              <div className="settings-row" key={expense.id}>
                {isEditing ? (
                  <>
                    <input
                      className="settings-name-input"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  commitEdit(expense.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      autoFocus
                    />
                    <input
                      type="number"
                      className="amount-input"
                      value={editAmt}
                      onChange={e => setEditAmt(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  commitEdit(expense.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      min="0"
                      step="0.01"
                    />
                    <div className="expense-actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => commitEdit(expense.id)}
                        title="Save"
                      >✓</button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => setEditingId(null)}
                        title="Cancel"
                      >✕</button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="settings-name">{expense.name}</span>
                    <span className="settings-amount">{formatCurrency(parseFloat(expense.amount) || 0)}</span>
                    <div className="expense-actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => startEdit(expense)}
                        title="Edit"
                      >✎</button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => deleteExpense(expense.id)}
                        title="Delete"
                      >✕</button>
                    </div>
                  </>
                )}
              </div>
            )
          })}

          {/* Add row */}
          <div className="settings-row settings-add-row">
            <input
              type="text"
              className="settings-name-input"
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
          <span>Monthly Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </section>
    </div>
  )
}

export default SettingsPage
