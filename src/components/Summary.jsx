function Summary({ entries }) {
  const income = entries
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0)

  const expenses = entries
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0)

  const balance = income - expenses

  return (
    <section className="summary">
      <div className="summary-card income">
        <span className="label">Income</span>
        <span className="value">+${income.toFixed(2)}</span>
      </div>
      <div className="summary-card balance" data-negative={balance < 0}>
        <span className="label">Balance</span>
        <span className="value">{balance < 0 ? '-' : ''}${Math.abs(balance).toFixed(2)}</span>
      </div>
      <div className="summary-card expense">
        <span className="label">Expenses</span>
        <span className="value">-${expenses.toFixed(2)}</span>
      </div>
    </section>
  )
}

export default Summary
