import { formatCurrency } from '../utils/budgetUtils'

function SummaryBar({ totalIn, totalOut, remaining }) {
  return (
    <div className="summary-bar">
      <div className="summary-item in">
        <span className="summary-label">Total In</span>
        <span className="summary-value">{formatCurrency(totalIn)}</span>
      </div>
      <div className="summary-item out">
        <span className="summary-label">Total Out</span>
        <span className="summary-value">{formatCurrency(totalOut)}</span>
      </div>
      <div className="summary-item remaining" data-negative={remaining < 0}>
        <span className="summary-label">Remaining</span>
        <span className="summary-value">{formatCurrency(remaining)}</span>
      </div>
    </div>
  )
}

export default SummaryBar
