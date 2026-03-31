import { formatCurrency } from '../utils/budgetUtils'

function IncomePanel({
  income,
  thursdayDates,
  checkingBalance,
  onCheckingBalanceChange,
  paychecksReceived,
  onPaychecksReceivedChange,
  lauraReceived,
  onLauraReceivedChange,
  totalIn,
}) {
  const totalSources  = income.thursdays + 1  // paychecks + Laura
  const receivedCount = paychecksReceived + (lauraReceived ? 1 : 0)

  return (
    <section className="panel income-panel">
      <div className="panel-title-row">
        <h2 className="panel-title">Income</h2>
        {receivedCount > 0 && (
          <span className="progress-badge">
            {receivedCount} / {totalSources} received
          </span>
        )}
      </div>

      <div className="panel-rows">
        {/* Checking Balance */}
        <div className="panel-row">
          <label className="row-label" htmlFor="checking-balance">Checking Balance</label>
          <input
            id="checking-balance"
            type="number"
            className="amount-input"
            value={checkingBalance}
            onChange={e => onCheckingBalanceChange(e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>

        {/* Individual paycheck rows — one per Thursday */}
        {thursdayDates.map((date, i) => {
          const isReceived = i < paychecksReceived
          const dateLabel  = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

          return (
            <div
              key={i}
              className={`panel-row paycheck-row${isReceived ? ' paycheck-received' : ''}`}
            >
              <label className="row-label paycheck-label">
                <input
                  type="checkbox"
                  className="paycheck-checkbox"
                  checked={isReceived}
                  onChange={() => {
                    // Clicking a checked box with index i → set count to i (uncheck from i up)
                    // Clicking an unchecked box with index i → set count to i+1 (check up to i)
                    onPaychecksReceivedChange(isReceived ? i : i + 1)
                  }}
                />
                <span>
                  Paycheck
                  <span className="row-sub">Thu {dateLabel}</span>
                </span>
              </label>
              <span className={`row-value${isReceived ? '' : ' value-pending'}`}>
                {formatCurrency(1300)}
              </span>
            </div>
          )
        })}

        {/* Laura */}
        <div className={`panel-row paycheck-row${lauraReceived ? ' paycheck-received' : ''}`}>
          <label className="row-label paycheck-label">
            <input
              type="checkbox"
              className="paycheck-checkbox"
              checked={lauraReceived}
              onChange={onLauraReceivedChange}
            />
            <span>
              Laura
              {income.thursdays >= 5 && (
                <span className="row-sub badge">5-Thu month</span>
              )}
            </span>
          </label>
          <span className={`row-value${lauraReceived ? '' : ' value-pending'}`}>
            {formatCurrency(income.laura)}
          </span>
        </div>
      </div>

      <div className="panel-total">
        <span>Total In</span>
        <span>{formatCurrency(totalIn)}</span>
      </div>
    </section>
  )
}

export default IncomePanel

