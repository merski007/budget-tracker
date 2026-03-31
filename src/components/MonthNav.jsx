import { MONTH_NAMES } from '../utils/budgetUtils'

function MonthNav({ year, month, onPrev, onNext }) {
  return (
    <nav className="month-nav">
      <button className="month-btn" onClick={onPrev} aria-label="Previous month">◄</button>
      <span className="month-label">{MONTH_NAMES[month - 1]} {year}</span>
      <button className="month-btn" onClick={onNext} aria-label="Next month">►</button>
    </nav>
  )
}

export default MonthNav
