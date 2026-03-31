import { useState, useEffect, useRef } from 'react'
import { useAuth } from './hooks/useAuth'
import MonthNav from './components/MonthNav'
import SummaryBar from './components/SummaryBar'
import IncomePanel from './components/IncomePanel'
import FixedExpensesPanel from './components/FixedExpensesPanel'
import CreditCardsPanel from './components/CreditCardsPanel'
import DerivedCalcsPanel from './components/DerivedCalcsPanel'
import SavingsPanel from './components/SavingsPanel'
import { fetchBudgetMonth, saveBudgetMonth } from './api/budgetApi'
import {
  DEFAULT_FIXED_EXPENSES,
  DEFAULT_CREDIT_CARDS,
  loadMonthData,
  saveMonthData,
  getMonthIncome,
  getEffectiveIncome,
  getThursdaysInMonth,
  getDateStats,
  getDerivedCalcs,
  loadSavingsBalance,
  saveSavingsBalance,
  buildSavingsHistory,
} from './utils/budgetUtils'
import './App.css'

// ─── Default blank month document ────────────────────────────────────────────
function blankMonth(year, month, sourceExpenses) {
  return {
    checkingBalance:   '',
    fixedExpenses:     (sourceExpenses ?? DEFAULT_FIXED_EXPENSES).map(
      e => ({ id: e.id, name: e.name, amount: e.amount }),
    ),
    creditCards:       DEFAULT_CREDIT_CARDS.map(c => ({ ...c })),
    paidExpenseIds:    [],
    paychecksReceived: 0,
    lauraReceived:     false,
  }
}

function App() {
  const { user, loading: authLoading } = useAuth()
  const today = new Date()

  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  const [monthData,     setMonthData]     = useState(null)   // null = not yet loaded
  const [isLoading,     setIsLoading]     = useState(true)
  const [savingsBalance, setSavingsBalance] = useState(() => loadSavingsBalance())

  const saveTimerRef = useRef(null)

  // ── Load month when year/month changes ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    async function load() {
      try {
        let data = await fetchBudgetMonth(year, month)

        if (!data) {
          // New month — seed expense list from the previous month (API first, then localStorage)
          let prevYear = year, prevMonth = month - 1
          if (prevMonth === 0) { prevMonth = 12; prevYear-- }

          const prev = await fetchBudgetMonth(prevYear, prevMonth).catch(() => null)
            ?? loadMonthData(prevYear, prevMonth)

          data = blankMonth(year, month, prev?.fixedExpenses)
        } else {
          // Backfill new fields for documents saved before Phase 3
          data = {
            paidExpenseIds:    [],
            paychecksReceived: 0,
            lauraReceived:     false,
            ...data,
          }
        }

        if (!cancelled) setMonthData(data)
      } catch {
        // Offline / local dev without Cosmos → fall back to localStorage
        if (!cancelled) setMonthData(loadMonthData(year, month))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [year, month])

  // ── Persist on every change ─────────────────────────────────────────────────
  useEffect(() => {
    if (!monthData) return
    saveMonthData(year, month, monthData)          // immediate localStorage cache
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveBudgetMonth(year, month, monthData).catch(console.error)
    }, 600)
  }, [year, month, monthData])

  // ── Savings persist ─────────────────────────────────────────────────────────
  function updateSavingsBalance(val) {
    setSavingsBalance(val)
    saveSavingsBalance(val)
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  // ── Data handlers ────────────────────────────────────────────────────────────
  function updateCheckingBalance(val) {
    setMonthData(d => ({ ...d, checkingBalance: val }))
  }

  // Fixed Expenses — amount
  function updateFixedExpense(id, amount) {
    setMonthData(d => ({
      ...d,
      fixedExpenses: d.fixedExpenses.map(e => e.id === id ? { ...e, amount } : e),
    }))
  }

  // Fixed Expenses — name
  function renameFixedExpense(id, name) {
    setMonthData(d => ({
      ...d,
      fixedExpenses: d.fixedExpenses.map(e => e.id === id ? { ...e, name } : e),
    }))
  }

  // Fixed Expenses — add
  function addFixedExpense(name, amount) {
    const id = `custom-${Date.now().toString(36)}`
    setMonthData(d => ({
      ...d,
      fixedExpenses: [...d.fixedExpenses, { id, name, amount: parseFloat(amount) || 0 }],
    }))
  }

  // Fixed Expenses — delete
  function deleteFixedExpense(id) {
    setMonthData(d => ({
      ...d,
      fixedExpenses:  d.fixedExpenses.filter(e => e.id !== id),
      paidExpenseIds: d.paidExpenseIds.filter(pid => pid !== id),
    }))
  }

  // Fixed Expenses — paid toggle
  function togglePaidExpense(id) {
    setMonthData(d => {
      const isPaid = d.paidExpenseIds.includes(id)
      return {
        ...d,
        paidExpenseIds: isPaid
          ? d.paidExpenseIds.filter(pid => pid !== id)
          : [...d.paidExpenseIds, id],
      }
    })
  }

  // Income — paycheck received count
  function setPaychecksReceived(count) {
    setMonthData(d => ({ ...d, paychecksReceived: count }))
  }

  // Income — Laura toggle
  function toggleLauraReceived() {
    setMonthData(d => ({ ...d, lauraReceived: !d.lauraReceived }))
  }

  // Credit cards
  function updateCreditCard(id, field, value) {
    setMonthData(d => ({
      ...d,
      creditCards: d.creditCards.map(c => c.id === id ? { ...c, [field]: value } : c),
    }))
  }

  // ── Derived calculations ─────────────────────────────────────────────────────
  const income          = getMonthIncome(year, month)
  const thursdayDates   = getThursdaysInMonth(year, month)

  // Effective income: only unreceived paychecks get added on top of checking balance
  const effectiveIncome = monthData
    ? getEffectiveIncome(income, monthData.paychecksReceived, monthData.lauraReceived)
    : { effectivePaychecks: income.paychecks, effectiveLaura: income.laura, total: income.total }

  const checkingBal = parseFloat(monthData?.checkingBalance) || 0
  const totalIn     = checkingBal + effectiveIncome.effectivePaychecks + effectiveIncome.effectiveLaura

  // Fixed expense totals
  const fixedTotal = (monthData?.fixedExpenses ?? []).reduce(
    (sum, e) => sum + (parseFloat(e.amount) || 0), 0,
  )
  const unpaidFixedTotal = (monthData?.fixedExpenses ?? [])
    .filter(e => !(monthData?.paidExpenseIds ?? []).includes(e.id))
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
  const paidFixedTotal   = fixedTotal - unpaidFixedTotal

  const ccTotal  = (monthData?.creditCards ?? []).reduce((sum, c) => {
    const avail     = parseFloat(c.availableCredit)  || 0
    const remaining = parseFloat(c.remainingCredit) || 0
    return sum + (avail > 0 ? avail - remaining : 0)
  }, 0)

  const totalOut   = unpaidFixedTotal + ccTotal     // real-time: only unpaid counts out
  const remaining  = totalIn - totalOut

  const dateStats    = getDateStats(year, month)
  const derivedCalcs = getDerivedCalcs(remaining, dateStats)

  const thisMonthContribution = parseFloat(
    monthData?.fixedExpenses?.find(e => e.id === 'savings')?.amount,
  ) || 0
  const savingsHistory = buildSavingsHistory(year, month, 12, savingsBalance - thisMonthContribution)

  // ── Render ───────────────────────────────────────────────────────────────────
  if (authLoading || isLoading || !monthData) {
    return (
      <div className="auth-loading">
        <span>{authLoading ? 'Loading...' : 'Loading budget…'}</span>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Budget Tracker</h1>
        {user && (
          <div className="header-user">
            <span className="header-email">{user.userDetails}</span>
            <a className="signout-btn" href="/.auth/logout?post_logout_redirect_uri=/">Sign Out</a>
          </div>
        )}
      </header>

      <div className="app-body">
        <MonthNav year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />

        <SummaryBar
          totalIn={totalIn}
          totalOut={totalOut}
          remaining={remaining}
          fixedTotal={fixedTotal}
          paidFixedTotal={paidFixedTotal}
          income={income}
          paychecksReceived={monthData.paychecksReceived}
          lauraReceived={monthData.lauraReceived}
          isCurrentMonth={dateStats.isCurrentMonth}
        />

        <div className="panels">
          <IncomePanel
            income={income}
            thursdayDates={thursdayDates}
            checkingBalance={monthData.checkingBalance}
            onCheckingBalanceChange={updateCheckingBalance}
            paychecksReceived={monthData.paychecksReceived}
            onPaychecksReceivedChange={setPaychecksReceived}
            lauraReceived={monthData.lauraReceived}
            onLauraReceivedChange={toggleLauraReceived}
            totalIn={totalIn}
          />
          <FixedExpensesPanel
            expenses={monthData.fixedExpenses}
            paidExpenseIds={monthData.paidExpenseIds}
            onAmountChange={updateFixedExpense}
            onRename={renameFixedExpense}
            onAdd={addFixedExpense}
            onDelete={deleteFixedExpense}
            onTogglePaid={togglePaidExpense}
            total={fixedTotal}
            unpaidTotal={unpaidFixedTotal}
          />
        </div>

        <CreditCardsPanel
          cards={monthData.creditCards}
          onCardChange={updateCreditCard}
          total={ccTotal}
        />

        <DerivedCalcsPanel calcs={derivedCalcs} isCurrentMonth={dateStats.isCurrentMonth} />

        <SavingsPanel
          savingsBalance={savingsBalance}
          onBalanceChange={updateSavingsBalance}
          thisMonthContribution={thisMonthContribution}
          history={savingsHistory}
        />
      </div>
    </div>
  )
}

export default App

