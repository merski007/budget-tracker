import { useState, useEffect } from 'react'
import { formatCurrency } from '../utils/budgetUtils'
import { fetchBudgetMembers, removeMember, renameBudget } from '../api/budgetsApi'
import { createInvite, revokeInvite } from '../api/invitesApi'

const ROLE_LABELS = { owner: 'Owner', editor: 'Editor', viewer: 'Viewer' }

/**
 * Settings page â€” two sections:
 *   1. Fixed Expenses Template (master list)
 *   2. Budget Info & Sharing (name, members, invites)
 *
 * Props:
 *   budget         â€” { budgetId, name, role }
 *   masterExpenses â€” array of { id, name, amount }
 *   onChange       â€” (newExpenses) => void
 *   onBudgetRenamed â€” (newName) => void
 */
function SettingsPage({ budget, masterExpenses, onChange, onBudgetRenamed }) {
  const [editingId, setEditingId] = useState(null)
  const [editName,  setEditName]  = useState('')
  const [editAmt,   setEditAmt]   = useState('')
  const [addName,   setAddName]   = useState('')
  const [addAmount, setAddAmount] = useState('')

  const [budgetName,    setBudgetName]    = useState(budget.name)
  const [editingName,   setEditingName]   = useState(false)
  const [members,       setMembers]       = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [membersLoading, setMembersLoading] = useState(true)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole,  setInviteRole]  = useState('viewer')
  const [inviteBusy,  setInviteBusy]  = useState(false)
  const [inviteLink,  setInviteLink]  = useState(null)
  const [shareError,  setShareError]  = useState(null)

  const isOwner  = budget.role === 'owner'
  const canEdit  = budget.role === 'owner' || budget.role === 'editor'
  const total    = masterExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)

  // Load members on mount
  useEffect(() => {
    fetchBudgetMembers(budget.budgetId)
      .then(data => {
        setMembers(data.members ?? [])
        setPendingInvites(data.pendingInvites ?? [])
      })
      .catch(() => {})
      .finally(() => setMembersLoading(false))
  }, [budget.budgetId])

  // â”€â”€ Expense helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Budget rename â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function commitRename() {
    const name = budgetName.trim()
    if (!name || name === budget.name) { setEditingName(false); return }
    try {
      await renameBudget(budget.budgetId, name)
      onBudgetRenamed(name)
    } catch (e) {
      setBudgetName(budget.name)
    }
    setEditingName(false)
  }

  // â”€â”€ Invite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setInviteBusy(true)
    setShareError(null)
    setInviteLink(null)
    try {
      const { code } = await createInvite(budget.budgetId, inviteEmail.trim(), inviteRole)
      const url = `${window.location.origin}/?invite=${code}`
      setInviteLink(url)
      setInviteEmail('')
      // Refresh pending invites
      fetchBudgetMembers(budget.budgetId)
        .then(data => setPendingInvites(data.pendingInvites ?? []))
        .catch(() => {})
    } catch (e) {
      setShareError(e.message)
    } finally {
      setInviteBusy(false)
    }
  }

  async function handleRemoveMember(memberId) {
    if (!window.confirm('Remove this member?')) return
    try {
      await removeMember(budget.budgetId, memberId)
      setMembers(m => m.filter(x => x.userId !== memberId))
    } catch (e) {
      setShareError(e.message)
    }
  }

  async function handleRevokeInvite(code) {
    try {
      await revokeInvite(budget.budgetId, code)
      setPendingInvites(p => p.filter(i => i.code !== code))
    } catch (e) {
      setShareError(e.message)
    }
  }

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="settings-page">

      {/* â”€â”€ Budget Info â”€â”€ */}
      <div className="settings-header">
        {editingName && isOwner ? (
          <div className="budget-rename-row">
            <input
              className="budget-name-input"
              value={budgetName}
              onChange={e => setBudgetName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setBudgetName(budget.name); setEditingName(false) } }}
              autoFocus
            />
            <button className="btn-primary" onClick={commitRename}>Save</button>
            <button className="btn-ghost" onClick={() => { setBudgetName(budget.name); setEditingName(false) }}>Cancel</button>
          </div>
        ) : (
          <div className="budget-name-display">
            <h2 className="settings-title">{budgetName}</h2>
            {isOwner && (
              <button className="action-btn edit-btn" onClick={() => setEditingName(true)} title="Rename budget">âœŽ</button>
            )}
          </div>
        )}
        <p className="settings-hint">
          Changes to the expense template apply to all <strong>new months</strong> and when you
          use the &ldquo;Reset Month&rdquo; button on the dashboard.
        </p>
      </div>

      {/* â”€â”€ Fixed Expenses Template â”€â”€ */}
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
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(expense.id); if (e.key === 'Escape') setEditingId(null) }}
                      autoFocus
                    />
                    <input
                      type="number"
                      className="amount-input"
                      value={editAmt}
                      onChange={e => setEditAmt(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(expense.id); if (e.key === 'Escape') setEditingId(null) }}
                      min="0"
                      step="0.01"
                    />
                    <div className="expense-actions">
                      <button className="action-btn edit-btn" onClick={() => commitEdit(expense.id)} title="Save">âœ“</button>
                      <button className="action-btn delete-btn" onClick={() => setEditingId(null)} title="Cancel">âœ•</button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="settings-name">{expense.name}</span>
                    <span className="settings-amount">{formatCurrency(parseFloat(expense.amount) || 0)}</span>
                    {canEdit && (
                      <div className="expense-actions">
                        <button className="action-btn edit-btn" onClick={() => startEdit(expense)} title="Edit">âœŽ</button>
                        <button className="action-btn delete-btn" onClick={() => deleteExpense(expense.id)} title="Delete">âœ•</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}

          {canEdit && (
            <div className="settings-row settings-add-row">
              <input
                type="text"
                className="settings-name-input"
                placeholder="New expense nameâ€¦"
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
              <button className="add-expense-btn" onClick={handleAdd} disabled={!addName.trim()}>Add</button>
            </div>
          )}
        </div>

        <div className="panel-total">
          <span>Monthly Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </section>

      {/* â”€â”€ Sharing / Members â”€â”€ */}
      <section className="panel settings-panel sharing-panel">
        <div className="settings-panel-header sharing-header">
          <span style={{ gridColumn: '1 / -1' }}>Members &amp; Sharing</span>
        </div>

        {shareError && <div className="share-error">{shareError}</div>}

        <div className="members-list">
          {membersLoading ? (
            <p className="members-loading">Loading membersâ€¦</p>
          ) : members.map(m => (
            <div className="member-row" key={m.userId}>
              <span className="member-email">{m.email}</span>
              <span className={`invite-role-badge role-${m.role}`}>{ROLE_LABELS[m.role] || m.role}</span>
              {isOwner && m.role !== 'owner' && (
                <button className="action-btn delete-btn" onClick={() => handleRemoveMember(m.userId)} title="Remove member">âœ•</button>
              )}
            </div>
          ))}
        </div>

        {pendingInvites.length > 0 && (
          <div className="pending-invites">
            <p className="pending-label">Pending Invites</p>
            {pendingInvites.map(inv => (
              <div className="member-row pending" key={inv.code}>
                <span className="member-email">{inv.invitedEmail}</span>
                <span className={`invite-role-badge role-${inv.role}`}>{ROLE_LABELS[inv.role] || inv.role}</span>
                <span className="pending-expiry">exp. {new Date(inv.expiresAt).toLocaleDateString()}</span>
                {isOwner && (
                  <button className="action-btn delete-btn" onClick={() => handleRevokeInvite(inv.code)} title="Revoke invite">âœ•</button>
                )}
              </div>
            ))}
          </div>
        )}

        {(isOwner || budget.role === 'editor') && (
          <div className="invite-form">
            <input
              type="email"
              className="invite-email-input"
              placeholder="Invitee email address"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
            />
            <select
              className="invite-role-select"
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <button
              className="btn-primary"
              onClick={handleInvite}
              disabled={inviteBusy || !inviteEmail.trim()}
            >
              {inviteBusy ? 'Sendingâ€¦' : 'Invite'}
            </button>
          </div>
        )}

        {inviteLink && (
          <div className="invite-link-box">
            <p className="invite-link-label">Share this link (expires in 7 days):</p>
            <div className="invite-link-row">
              <input readOnly className="invite-link-input" value={inviteLink} onClick={e => e.target.select()} />
              <button
                className="btn-ghost"
                onClick={() => navigator.clipboard.writeText(inviteLink).catch(() => {})}
              >Copy</button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default SettingsPage
