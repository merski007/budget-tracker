import { formatCurrency } from '../utils/budgetUtils'

function DerivedCalcsPanel({ calcs, isCurrentMonth }) {
  const {
    dailyAllowance,
    weeklyThisWeek,
    weeklyStandardRate,
    daysRemainingInMonth,
    daysRemainingInWeek,
  } = calcs

  return (
    <section className="panel derived-panel">
      <h2 className="panel-title">
        Budget Breakdown
        {!isCurrentMonth && <span className="row-sub" style={{ marginLeft: '0.5rem' }}>projected</span>}
      </h2>
      <div className="derived-grid">
        <div className="derived-row">
          <span className="derived-label">Daily Allowance</span>
          <span className="derived-value">{formatCurrency(dailyAllowance)}</span>
          <span className="derived-meta">per day</span>
        </div>
        <div className="derived-row">
          <span className="derived-label">This Week's Budget</span>
          <span className="derived-value">{formatCurrency(weeklyThisWeek)}</span>
          <span className="derived-meta">{daysRemainingInWeek} day{daysRemainingInWeek !== 1 ? 's' : ''} left in week</span>
        </div>
        <div className="derived-row">
          <span className="derived-label">Weekly Rate</span>
          <span className="derived-value">{formatCurrency(weeklyStandardRate)}</span>
          <span className="derived-meta">per 7-day week</span>
        </div>
        <div className="derived-divider" />
        <div className="derived-row muted">
          <span className="derived-label">Days Remaining in Month</span>
          <span className="derived-count">{daysRemainingInMonth}</span>
          <span className="derived-meta">days</span>
        </div>
        <div className="derived-row muted">
          <span className="derived-label">Days Remaining in Week</span>
          <span className="derived-count">{daysRemainingInWeek}</span>
          <span className="derived-meta">days (incl. today → Sat)</span>
        </div>
      </div>
    </section>
  )
}

export default DerivedCalcsPanel
