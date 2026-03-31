import { useState } from 'react'
import { createBudget, deleteBudget } from '../api/budgetsApi'

const ROLE_LABELS = { owner: 'Owner', editor: 'Editor', viewer: 'Viewer' }

/**
 * Budget selection screen shown before the dashboard loads.
 * Props:
 *   budgets       — [{ budgetId, name, role }]
 *   onSelect      — (budget) => void
 *   onBudgetsChange — (newList) => void  — called after create/delete
 */
function BudgetListPage({ budgets, onSelect, onBudgetsChange }) {
  const [creating,   setCreating]   = useState(false)
  const [newName,    setNewName]    = useState('')
  const [busy,       setBusy]       = useState(false)
  const [error,      setError]      = useState(null)

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    setBusy(true)
    setError(null)
    try {
      const budget = await createBudget(name)
      onBudgetsChange([...budgets, budget])
      setCreating(false)
      setNewName('')
      onSelect(budget)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(budget) {
    if (!window.confirm(`Delete "${budget.name}"?\n\nThis will permanently remove all monthly data for this budget.`)) return
    setBusy(true)
    setError(null)
    try {
      await deleteBudget(budget.budgetId)
      onBudgetsChange(budgets.filter(b => b.budgetId !== budget.budgetId))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="budget-list-page">
      <h2 className="budget-list-title">Your Budgets</h2>

      {error && <div className="budget-list-error">{error}</div>}

      <div className="budget-cards">
        {budgets.map(budget => (
          <div className="budget-card" key={budget.budgetId}>
            <div className="budget-card-body" onClick={() => onSelect(budget)}>
              <span className="budget-card-name">{budget.name}</span>
              <span className={`budget-card-role role-${budget.role}`}>
                {ROLE_LABELS[budget.role] || budget.role}
              </span>
            </div>
            {budget.role === 'owner' && (
              <button
                className="budget-card-delete"
                onClick={e => { e.stopPropagation(); handleDelete(budget) }}
                disabled={busy}
                title="Delete budget"
              >✕</button>
            )}
          </div>
        ))}

        {/* Create new card */}
        {creating ? (
          <div className="budget-card budget-card-new">
            <input
              className="budget-name-input"
              placeholder="Budget name…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
              autoFocus
            />
            <div className="budget-card-new-actions">
              <button className="btn-primary" onClick={handleCreate} disabled={busy || !newName.trim()}>
                {busy ? 'Creating…' : 'Create'}
              </button>
              <button className="btn-ghost" onClick={() => { setCreating(false); setNewName('') }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button className="budget-card budget-card-add" onClick={() => setCreating(true)}>
            <span className="budget-card-add-icon">＋</span>
            <span>Create Budget</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default BudgetListPage
