import { useState, useEffect } from 'react'
import { formatCurrency } from '../utils/budgetUtils'
import { fetchBudgetMembers, removeMember, renameBudget } from '../api/budgetsApi'
import { createInvite, revokeInvite } from '../api/invitesApi'

const ROLE_LABELS = { owner: 'Owner', editor: 'Editor', viewer: 'Viewer' }

/**
 * Settings page — four sections:
 *   1. Income Template        (configurable, like Fixed Expenses)
 *   2. Fixed Expenses Template
 *   3. Credit Cards Template  (names only; limits entered on dashboard)
 *   4. Budget Info & Sharing
 *
 * Props:
 *   budget            — { budgetId, name, role }
 *   masterExpenses    — array of { id, name, amount }
 *   masterIncome      — array of { id, name, amount }
 *   masterCreditCards — array of { id, name }
 *   onExpensesChange    — (newExpenses) => void
 *   onIncomeChange      — (newIncome) => void
 *   onCreditCardsChange — (newCards) => void
 *   onBudgetRenamed   — (newName) => void
 */
function SettingsPage({
  budget,
  masterExpenses,
  masterIncome,
  masterCreditCards,
  onExpensesChange,
  onIncomeChange,
  onCreditCardsChange,
  onBudgetRenamed,
}) {
  const isOwner = budget.role === 'owner'
  const canEdit = budget.role === 'owner' || budget.role === 'editor'

  // ── Budget rename ──────────────────────────────────────────────────────────
  const [budgetName,  setBudgetName]  = useState(budget.name)
  const [editingName, setEditingName] = useState(false)

  async function commitRename() {
    const name = budgetName.trim()
    if (!name || name === budget.name) { setEditingName(false); return }
    try {
      await renameBudget(budget.budgetId, name)
      onBudgetRenamed(name)
    } catch {
      setBudgetName(budget.name)
    }
    setEditingName(false)
  }

  // ── Members / Sharing ──────────────────────────────────────────────────────
  const [members,        setMembers]        = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [inviteEmail,    setInviteEmail]    = useState('')
  const [inviteRole,     setInviteRole]     = useState('viewer')
  const [inviteBusy,     setInviteBusy]     = useState(false)
  const [inviteLink,     setInviteLink]     = useState(null)
  const [shareError,     setShareError]     = useState(null)

  useEffect(() => {
    fetchBudgetMembers(budget.budgetId)
      .then(data => {
        setMembers(data.members ?? [])
        setPendingInvites(data.pendingInvites ?? [])
      })
      .catch(() => {})
      .finally(() => setMembersLoading(false))
  }, [budget.budgetId])

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setInviteBusy(true); setShareError(null); setInviteLink(null)
    try {
      const { code } = await createInvite(budget.budgetId, inviteEmail.trim(), inviteRole)
      setInviteLink(`${window.location.origin}/?invite=${code}`)
      setInviteEmail('')
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
    } catch (e) { setShareError(e.message) }
  }

  async function handleRevokeInvite(code) {
    try {
      await revokeInvite(budget.budgetId, code)
      setPendingInvites(p => p.filter(i => i.code !== code))
    } catch (e) { setShareError(e.message) }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="settings-page">

      {/* ── Budget Info ── */}
      <div className="settings-header">
        {editingName && isOwner ? (
          <div className="budget-rename-row">
            <input
              className="budget-name-input"
              value={budgetName}
              onChange={e => setBudgetName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') { setBudgetName(budget.name); setEditingName(false) }
              }}
              autoFocus
            />
            <button className="btn-primary" onClick={commitRename}>Save</button>
            <button className="btn-ghost" onClick={() => { setBudgetName(budget.name); setEditingName(false) }}>Cancel</button>
          </div>
        ) : (
          <div className="budget-name-display">
            <h2 className="settings-title">{budgetName}</h2>
            {isOwner && (
              <button className="action-btn edit-btn" onClick={() => setEditingName(true)} title="Rename budget">✎</button>
            )}
          </div>
        )}
        <p className="settings-hint">
          Changes to templates apply to all <strong>new months</strong> and when you use
          &ldquo;Reset Month&rdquo; on the dashboard.
        </p>
      </div>

      {/* ── Income Template ── */}
      <AmountList
        title="Income Sources"
        items={masterIncome}
        canEdit={canEdit}
        onChange={onIncomeChange}
        addPlaceholder="New income source…"
        emptyHint="No income sources configured yet."
      />

      {/* ── Fixed Expenses Template ── */}
      <AmountList
        title="Fixed Expenses"
        items={masterExpenses}
        canEdit={canEdit}
        onChange={onExpensesChange}
        addPlaceholder="New expense name…"
        emptyHint="No fixed expenses configured yet."
      />

      {/* ── Credit Cards Template ── */}
      <NameOnlyList
        title="Credit Cards"
        items={masterCreditCards}
        canEdit={canEdit}
        onChange={onCreditCardsChange}
        addPlaceholder="New card name…"
        emptyHint="No credit cards configured yet."
      />

      {/* ── Sharing / Members ── */}
      <section className="panel settings-panel sharing-panel">
        <div className="settings-panel-header sharing-header">
          <span style={{ gridColumn: '1 / -1' }}>Members &amp; Sharing</span>
        </div>

        {shareError && <div className="share-error">{shareError}</div>}

        <div className="members-list">
          {membersLoading ? (
            <p className="members-loading">Loading members…</p>
          ) : members.map(m => (
            <div className="member-row" key={m.userId}>
              <span className="member-email">{m.email}</span>
              <span className={`invite-role-badge role-${m.role}`}>{ROLE_LABELS[m.role] || m.role}</span>
              {isOwner && m.role !== 'owner' && (
                <button className="action-btn delete-btn" onClick={() => handleRemoveMember(m.userId)} title="Remove member">✕</button>
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
                  <button className="action-btn delete-btn" onClick={() => handleRevokeInvite(inv.code)} title="Revoke invite">✕</button>
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
            <select className="invite-role-select" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <button className="btn-primary" onClick={handleInvite} disabled={inviteBusy || !inviteEmail.trim()}>
              {inviteBusy ? 'Sending…' : 'Invite'}
            </button>
          </div>
        )}

        {inviteLink && (
          <div className="invite-link-box">
            <p className="invite-link-label">Share this link (expires in 7 days):</p>
            <div className="invite-link-row">
              <input readOnly className="invite-link-input" value={inviteLink} onClick={e => e.target.select()} />
              <button className="btn-ghost" onClick={() => navigator.clipboard.writeText(inviteLink).catch(() => {})}>Copy</button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

// ── AmountList — reusable section for items with name + amount ─────────────────
function AmountList({ title, items, canEdit, onChange, addPlaceholder, emptyHint }) {
  const [editingId, setEditingId] = useState(null)
  const [editName,  setEditName]  = useState('')
  const [editAmt,   setEditAmt]   = useState('')
  const [addName,   setAddName]   = useState('')
  const [addAmount, setAddAmount] = useState('')

  const total = items.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)

  function startEdit(item) {
    setEditingId(item.id)
    setEditName(item.name)
    setEditAmt(String(item.amount ?? ''))
  }

  function commitEdit(id) {
    if (editName.trim()) {
      onChange(items.map(e => e.id === id
        ? { ...e, name: editName.trim(), amount: parseFloat(editAmt) || 0 }
        : e
      ))
    }
    setEditingId(null)
  }

  function deleteItem(id) { onChange(items.filter(e => e.id !== id)) }

  function handleAdd() {
    if (!addName.trim()) return
    const id = `custom-${Date.now().toString(36)}`
    onChange([...items, { id, name: addName.trim(), amount: parseFloat(addAmount) || 0 }])
    setAddName('')
    setAddAmount('')
  }

  return (
    <section className="panel settings-panel">
      <div className="settings-panel-header">
        <span>{title}</span>
        <span>Monthly Amount</span>
        <span></span>
      </div>

      <div className="settings-rows">
        {items.length === 0 && !canEdit && (
          <div className="settings-row settings-empty">{emptyHint}</div>
        )}

        {items.map(item => {
          const isEditing = editingId === item.id
          return (
            <div className="settings-row" key={item.id}>
              {isEditing ? (
                <>
                  <input
                    className="settings-name-input"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(item.id); if (e.key === 'Escape') setEditingId(null) }}
                    autoFocus
                  />
                  <input
                    type="number"
                    className="amount-input"
                    value={editAmt}
                    onChange={e => setEditAmt(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(item.id); if (e.key === 'Escape') setEditingId(null) }}
                    min="0" step="0.01"
                  />
                  <div className="expense-actions">
                    <button className="action-btn edit-btn" onClick={() => commitEdit(item.id)} title="Save">✔</button>
                    <button className="action-btn delete-btn" onClick={() => setEditingId(null)} title="Cancel">✕</button>
                  </div>
                </>
              ) : (
                <>
                  <span className="settings-name">{item.name}</span>
                  <span className="settings-amount">{formatCurrency(parseFloat(item.amount) || 0)}</span>
                  {canEdit && (
                    <div className="expense-actions">
                      <button className="action-btn edit-btn" onClick={() => startEdit(item)} title="Edit">✎</button>
                      <button className="action-btn delete-btn" onClick={() => deleteItem(item.id)} title="Delete">✕</button>
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
              placeholder={addPlaceholder}
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
              min="0" step="0.01"
            />
            <button className="add-expense-btn" onClick={handleAdd} disabled={!addName.trim()}>Add</button>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="panel-total">
          <span>Monthly Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      )}
    </section>
  )
}

// ── NameOnlyList — for items with name only (credit cards) ─────────────────────
function NameOnlyList({ title, items, canEdit, onChange, addPlaceholder, emptyHint }) {
  const [editingId, setEditingId] = useState(null)
  const [editName,  setEditName]  = useState('')
  const [addName,   setAddName]   = useState('')

  function startEdit(item) { setEditingId(item.id); setEditName(item.name) }

  function commitEdit(id) {
    if (editName.trim()) {
      onChange(items.map(item => item.id === id ? { ...item, name: editName.trim() } : item))
    }
    setEditingId(null)
  }

  function deleteItem(id) { onChange(items.filter(item => item.id !== id)) }

  function handleAdd() {
    if (!addName.trim()) return
    const id = `card-${Date.now().toString(36)}`
    onChange([...items, { id, name: addName.trim() }])
    setAddName('')
  }

  return (
    <section className="panel settings-panel settings-panel-names">
      <div className="settings-panel-header settings-panel-header-names">
        <span>{title}</span>
        <span></span>
      </div>

      <div className="settings-rows">
        {items.length === 0 && !canEdit && (
          <div className="settings-row settings-empty">{emptyHint}</div>
        )}

        {items.map(item => {
          const isEditing = editingId === item.id
          return (
            <div className="settings-row" key={item.id}>
              {isEditing ? (
                <>
                  <input
                    className="settings-name-input settings-name-input-full"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(item.id); if (e.key === 'Escape') setEditingId(null) }}
                    autoFocus
                  />
                  <div className="expense-actions">
                    <button className="action-btn edit-btn" onClick={() => commitEdit(item.id)} title="Save">✔</button>
                    <button className="action-btn delete-btn" onClick={() => setEditingId(null)} title="Cancel">✕</button>
                  </div>
                </>
              ) : (
                <>
                  <span className="settings-name settings-name-full">{item.name}</span>
                  {canEdit && (
                    <div className="expense-actions">
                      <button className="action-btn edit-btn" onClick={() => startEdit(item)} title="Edit">✎</button>
                      <button className="action-btn delete-btn" onClick={() => deleteItem(item.id)} title="Delete">✕</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}

        {canEdit && (
          <div className="settings-row settings-add-row settings-add-row-names">
            <input
              type="text"
              className="settings-name-input settings-name-input-full"
              placeholder={addPlaceholder}
              value={addName}
              onChange={e => setAddName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button className="add-expense-btn" onClick={handleAdd} disabled={!addName.trim()}>Add</button>
          </div>
        )}
      </div>
    </section>
  )
}

export default SettingsPage
