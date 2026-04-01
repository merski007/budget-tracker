import { formatCurrency } from '../utils/budgetUtils'

function SummaryBar({
  totalIn,
  totalOut,
  remaining,
  fixedTotal,
  paidFixedTotal,
  incomeReceivedCount,
  incomeTotalCount,
  isCurrentMonth,
}) {
  const hasTracking = isCurrentMonth && incomeReceivedCount > 0

  return (
    <div className="summary-bar">
      <div className="summary-item in">
        <span className="summary-label">Total In</span>
        <span className="summary-value">{formatCurrency(totalIn)}</span>
        {hasTracking && (
          <span className="summary-detail">
            {incomeReceivedCount} of {incomeTotalCount} sources received
          </span>
        )}
      </div>

      <div className="summary-item out">
        <span className="summary-label">Total Out</span>
        <span className="summary-value">{formatCurrency(totalOut)}</span>
        {hasTracking && paidFixedTotal > 0 && (
          <span className="summary-detail">
            {formatCurrency(paidFixedTotal)} paid · {formatCurrency(fixedTotal - paidFixedTotal)} owed
          </span>
        )}
      </div>

      <div className="summary-item remaining" data-negative={remaining < 0}>
        <span className="summary-label">Remaining</span>
        <span className="summary-value">{formatCurrency(remaining)}</span>
        {hasTracking && (
          <span className="summary-detail summary-detail-live">
            live view
          </span>
        )}
      </div>
    </div>
  )
}

export default SummaryBar
