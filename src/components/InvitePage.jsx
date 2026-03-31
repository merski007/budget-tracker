import { useState, useEffect } from 'react'
import { fetchInvite, acceptInvite } from '../api/invitesApi'

const ROLE_LABELS = { owner: 'Owner', editor: 'Editor', viewer: 'Viewer' }

/**
 * Invite acceptance page.
 * Shown when the URL has ?invite={code}.
 * Props:
 *   code          — invite code extracted from the URL
 *   onAccepted    — ({ budgetId, budgetName, role }) => void  — navigate to the new budget
 *   onDismiss     — () => void  — go back to the budget list
 */
function InvitePage({ code, onAccepted, onDismiss }) {
  const [invite,  setInvite]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [busy,    setBusy]    = useState(false)
  const [done,    setDone]    = useState(false)

  useEffect(() => {
    if (!code) { setLoading(false); return }
    fetchInvite(code)
      .then(data => {
        if (!data) setError('This invite link is invalid.')
        else setInvite(data)
      })
      .catch(e => {
        setError(e.status === 410
          ? 'This invite has already been used or has expired.'
          : e.message,
        )
      })
      .finally(() => setLoading(false))
  }, [code])

  async function handleAccept() {
    setBusy(true)
    setError(null)
    try {
      const result = await acceptInvite(code)
      setDone(true)
      setTimeout(() => onAccepted(result), 1500)
    } catch (e) {
      setError(e.status === 403
        ? 'This invite was sent to a different email address.'
        : e.message,
      )
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <p className="invite-loading">Checking invite…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="invite-page">
      <div className="invite-card">
        <h2 className="invite-title">Budget Invitation</h2>

        {done ? (
          <div className="invite-success">
            <span className="invite-success-icon">✓</span>
            <p>Joined! Redirecting…</p>
          </div>
        ) : error ? (
          <>
            <p className="invite-error">{error}</p>
            <button className="btn-ghost" onClick={onDismiss}>Back to My Budgets</button>
          </>
        ) : invite ? (
          <>
            <p className="invite-detail">
              <strong>{invite.invitedByEmail}</strong> has invited you to join:
            </p>
            <p className="invite-budget-name">{invite.budgetName}</p>
            <p className="invite-role">
              Your role: <span className={`invite-role-badge role-${invite.role}`}>
                {ROLE_LABELS[invite.role] || invite.role}
              </span>
            </p>
            <p className="invite-expiry">
              Expires {new Date(invite.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <div className="invite-actions">
              <button className="btn-primary" onClick={handleAccept} disabled={busy}>
                {busy ? 'Accepting…' : 'Accept Invitation'}
              </button>
              <button className="btn-ghost" onClick={onDismiss}>Decline</button>
            </div>
          </>
        ) : (
          <>
            <p className="invite-error">Invite not found.</p>
            <button className="btn-ghost" onClick={onDismiss}>Back to My Budgets</button>
          </>
        )}
      </div>
    </div>
  )
}

export default InvitePage
