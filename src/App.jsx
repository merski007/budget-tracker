import { useState, useEffect } from 'react'
import MonthNav from './components/MonthNav'
import SummaryBar from './components/SummaryBar'
import IncomePanel from './components/IncomePanel'
import FixedExpensesPanel from './components/FixedExpensesPanel'
import CreditCardsPanel from './components/CreditCardsPanel'
import { loadMonthData, saveMonthData, getMonthIncome } from './utils/budgetUtils'
import './App.css'

function App() {
  const today = new Date()
  const [year, setYear]       = useState(today.getFullYear())
  const [month, setMonth]     = useState(today.getMonth() + 1) // 1-indexed
  const [monthData, setMonthData] = useState(() =>
    loadMonthData(today.getFullYear(), today.getMonth() + 1)
  )

  // Load saved data when month/year changes
  useEffect(() => {
    setMonthData(loadMonthData(year, month))
  }, [year, month])

  // Persist data on every change
  useEffect(() => {
    saveMonthData(year, month, monthData)
  }, [year, month, monthData])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  function updateCheckingBalance(val) {
    setMonthData(d => ({ ...d, checkingBalance: val }))
  }

  function updateFixedExpense(id, amount) {
    setMonthData(d => ({
      ...d,
      fixedExpenses: d.fixedExpenses.map(e => e.id === id ? { ...e, amount } : e),
    }))
  }

  function updateCreditCard(id, field, value) {
    setMonthData(d => ({
      ...d,
      creditCards: d.creditCards.map(c => c.id === id ? { ...c, [field]: value } : c),
    }))
  }

  // Derived totals
  const income      = getMonthIncome(year, month)
  const totalIn     = (parseFloat(monthData.checkingBalance) || 0) + income.paychecks + income.laura
  const fixedTotal  = monthData.fixedExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
  const ccTotal     = monthData.creditCards.reduce((sum, c) => {
    const avail     = parseFloat(c.availableCredit) || 0
    const remaining = parseFloat(c.remainingCredit) || 0
    return sum + (avail > 0 ? avail - remaining : 0)
  }, 0)
  const totalOut    = fixedTotal + ccTotal
  const remaining   = totalIn - totalOut

  return (
    <div className="app">
      <header className="app-header">
        <h1>Budget Tracker</h1>
      </header>
      <div className="app-body">
        <MonthNav year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
        <SummaryBar totalIn={totalIn} totalOut={totalOut} remaining={remaining} />
        <div className="panels">
          <IncomePanel
            income={income}
            checkingBalance={monthData.checkingBalance}
            onCheckingBalanceChange={updateCheckingBalance}
            totalIn={totalIn}
          />
          <FixedExpensesPanel
            expenses={monthData.fixedExpenses}
            onAmountChange={updateFixedExpense}
            total={fixedTotal}
          />
        </div>
        <CreditCardsPanel
          cards={monthData.creditCards}
          onCardChange={updateCreditCard}
          total={ccTotal}
        />
      </div>
    </div>
  )
}

export default App
