import { useState } from 'react'
import { formatCurrency } from '../utils/budgetUtils'

/**
 * Dashboard Income panel.
 * - Paycheck-row style: locked value display by default.
 * - Edit button unlocks inline amount editing per row.
 * - Delete button removes that row from this month only.
 * - Reset button restores this panel from the master template.
 * - Checking Balance always shown at top (locked, editable via Edit).
 */
function IncomePanel({
  income,
  checkingBalance,
  onCheckingBalanceChange,
  onAmountChange,
  onToggleReceived,
  onDeleteItem,
  onReset,
  totalIn,
}) {
  const [editingId,  setEditingId]  = useState(null)
  const [editValue,  setEditValue]  = useState('')
  const [editingBal, setEditingBal] = useState(false)
  const [editBalVal, setEditBalVal] = useState('')

  const receivedCount = income.filter(i => i.received).length
  const totalCount    = income.length

  function startEdit(item) { setEditingId(item.id); setEditValue(String(item.amount ?? '')) }
  function commitEdit(id) { onAmountChange(id, editValue); setEditingId(null) }
  function cancelEdit() { setEditingId(null) }

  function startEditBal() { setEditingBal(true); setEditBalVal(String(checkingBalance)) }
  function commitEditBal() { onCheckingBalanceChange(editBalVal); setEditingBal(false) }
  function cancelEditBal() { setEditingBal(false) }

  return (
    <section className="panel income-panel">
      <div className="panel-title-row">
        <h2 className="panel-title">Income</h2>
        <div className="panel-title-actions">
          {receivedCount > 0 && (
            <span className="progress-badge">{receivedCount} / {totalCount} received</span>
          )}
          <button className="panel-reset-btn" onClick={onReset} title="Reset this panel from template">↺ Reset</button>
        </div>
      </div>

      <div className="panel-rows scrollable">

        {/* ── Checking Balance ── always in bank */}
        <div className="panel-row paycheck-row paycheck-received">
          <span className="paycheck-checkbox-placeholder" />
          <label className="row-label">Checking Balance</label>
          {editingBal ? (
            <>
              <input
                type="number"
                className="amount-input amount-input-inline"
                value={editBalVal}
                onChange={e => setEditBalVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitEditBal(); if (e.key === 'Escape') cancelEditBal() }}
                autoFocus min="0" step="0.01"
              />
              <div className="row-actions">
                <button className="action-btn edit-btn" onClick={commitEditBal} title="Save">✔</button>
                <button className="action-btn delete-btn" onClick={cancelEditBal} title="Cancel">✕</button>
              </div>
            </>
          ) : (
            <>
              <span className="row-value">{formatCurrency(parseFloat(checkingBalance) || 0)}</span>
              <div className="row-actions">
                <button className="action-btn edit-btn" onClick={startEditBal} title="Edit">✎</button>
              </div>
            </>
          )}
        </div>

        {/* ── Income source rows ── */}
        {income.map(item => {
          const isReceived = item.received
          const isEditing  = editingId === item.id
          return (
            <div
              key={item.id}
              className={`panel-row paycheck-row${isReceived ? ' paycheck-received' : ''}`}
            >
              <input
                type="checkbox"
                className="paycheck-checkbox"
                checked={isReceived}
                onChange={() => onToggleReceived(item.id)}
                title={isReceived ? 'Mark as pending' : 'Mark as received'}
              />
              <label className="row-label paycheck-label-text">{item.name}</label>
              {isEditing ? (
                <>
                  <input
                    type="number"
                    className="amount-input amount-input-inline"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(item.id); if (e.key === 'Escape') cancelEdit() }}
                    autoFocus min="0" step="0.01"
                  />
                  <div className="row-actions">
                    <button className="action-btn edit-btn" onClick={() => commitEdit(item.id)} title="Save">✔</button>
                    <button className="action-btn delete-btn" onClick={cancelEdit} title="Cancel">✕</button>
                  </div>
                </>
              ) : (
                <>
                  <span className={`row-value${isReceived ? '' : ' value-pending'}`}>
                    {formatCurrency(parseFloat(item.amount) || 0)}
                  </span>
                  <div className="row-actions">
                    <button className="action-btn edit-btn" onClick={() => startEdit(item)} title="Edit amount">✎</button>
                    <button className="action-btn delete-btn" onClick={() => onDeleteItem(item.id)} title="Remove from this month">✕</button>
                  </div>
                </>
              )}
            </div>
          )
        })}

        {income.length === 0 && (
          <div className="panel-row panel-empty-hint">
            <span>Add income sources in ⚙ Settings</span>
          </div>
        )}
      </div>

      <div className="panel-total">
        <span>Total In</span>
        <span>{formatCurrency(totalIn)}</span>
      </div>
    </section>
  )
}

export default IncomePanel
