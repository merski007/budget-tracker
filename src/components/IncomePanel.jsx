import { formatCurrency } from '../utils/budgetUtils'

/**
 * Dashboard view of income sources.
 * - Mirrors the layout / styling of FixedExpensesPanel.
 * - Amounts are editable per-month; names come from the master template.
 * - Each row has a received/pending checkbox.
 * - Checking balance is shown as the first row (always "received").
 */
function IncomePanel({
  income,
  checkingBalance,
  onCheckingBalanceChange,
  onAmountChange,
  onToggleReceived,
  totalIn,
}) {
  const receivedCount = income.filter(i => i.received).length
  const totalCount    = income.length

  return (
    <section className="panel income-panel">
      <div className="panel-title-row">
        <h2 className="panel-title">Income</h2>
        {receivedCount > 0 && (
          <span className="progress-badge">{receivedCount} / {totalCount} received</span>
        )}
      </div>

      <div className="panel-rows scrollable">
        {/* Checking Balance — always "in the bank", no toggle */}
        <div className="panel-row expense-row expense-paid">
          <span className="expense-checkbox-placeholder" />
          <label className="row-label expense-name">Checking Balance</label>
          <input
            type="number"
            className="amount-input"
            value={checkingBalance}
            onChange={e => onCheckingBalanceChange(e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>

        {/* Configured income sources */}
        {income.map(item => {
          const isReceived = item.received
          return (
            <div
              className={`panel-row expense-row${isReceived ? ' expense-paid' : ''}`}
              key={item.id}
            >
              <input
                type="checkbox"
                className="expense-checkbox"
                checked={isReceived}
                onChange={() => onToggleReceived(item.id)}
                title={isReceived ? 'Mark as pending' : 'Mark as received'}
              />
              <label className="row-label expense-name">{item.name}</label>
              <input
                type="number"
                className="amount-input"
                value={item.amount}
                onChange={e => onAmountChange(item.id, e.target.value)}
                min="0"
                step="0.01"
              />
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
