import { MONTH_NAMES } from '../utils/budgetUtils'

function MonthNav({ year, month, onPrev, onNext, onReset }) {
  function handleReset() {
    if (window.confirm(
      `Reset ${MONTH_NAMES[month - 1]} ${year}?\n\n` +
      '• All income checkboxes will be cleared\n' +
      '• All paid-expense checkboxes will be cleared\n' +
      '• Fixed expenses will be restored to the master template\n' +
      '• Credit card balances will be reset to zero\n\n' +
      'Checking balance and credit card limits are kept.',
    )) {
      onReset()
    }
  }

  return (
    <nav className="month-nav">
      <button className="month-btn" onClick={onPrev} aria-label="Previous month">◄</button>
      <span className="month-label">{MONTH_NAMES[month - 1]} {year}</span>
      <button className="month-btn" onClick={onNext} aria-label="Next month">►</button>
      <button className="month-reset-btn" onClick={handleReset} title="Reset this month">
        ↺ Reset Month
      </button>
    </nav>
  )
}

export default MonthNav

