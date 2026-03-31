import { useState, useEffect, useRef } from 'react'
import { useAuth } from './hooks/useAuth'
import MonthNav from './components/MonthNav'
import SummaryBar from './components/SummaryBar'
import IncomePanel from './components/IncomePanel'
import FixedExpensesPanel from './components/FixedExpensesPanel'
import CreditCardsPanel from './components/CreditCardsPanel'
import DerivedCalcsPanel from './components/DerivedCalcsPanel'
import SavingsPanel from './components/SavingsPanel'
import SettingsPage from './components/SettingsPage'
import { fetchBudgetMonth, saveBudgetMonth } from './api/budgetApi'
import { fetchSettings, saveSettings } from './api/settingsApi'
import {
  DEFAULT_FIXED_EXPENSES,
  DEFAULT_CREDIT_CARDS,
  loadMonthData,
  saveMonthData,
  loadMasterExpenses,
  saveMasterExpenses,
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
function blankMonth(sourceExpenses) {
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

  const [page, setPage] = useState('dashboard')   // 'dashboard' | 'settings'

  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  const [monthData,      setMonthData]      = useState(null)
  const [isLoading,      setIsLoading]      = useState(true)
  const [masterExpenses, setMasterExpenses] = useState(() => loadMasterExpenses())
  const [savingsBalance, setSavingsBalance] = useState(() => loadSavingsBalance())

  const saveTimerRef         = useRef(null)
  const settingsSaveTimerRef = useRef(null)

  // ── Load master expenses from API on mount ──────────────────────────────────
  useEffect(() => {
    fetchSettings()
      .then(data => {
        if (data?.masterExpenses?.length) {
          setMasterExpenses(data.masterExpenses)
          saveMasterExpenses(data.masterExpenses)
        }
      })
      .catch(() => {/* offline — localStorage already loaded */})
  }, [])

  // ── Load month when year/month changes ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setMonthData(null)   // clear stale data so the save effect doesn't write it to the new month
    setIsLoading(true)

    async function load() {
      try {
        let data = await fetchBudgetMonth(year, month)

        if (!data) {
          // New month — seed from master expenses
          data = blankMonth(masterExpenses)
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
  }, [year, month])   // eslint-disable-line react-hooks/exhaustive-deps
  // masterExpenses intentionally omitted — seeding only happens for new months

  // ── Persist month data on every change ─────────────────────────────────────
  useEffect(() => {
    if (!monthData) return
    saveMonthData(year, month, monthData)
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveBudgetMonth(year, month, monthData).catch(console.error)
    }, 600)
  }, [year, month, monthData])

  // ── Persist master expenses on every change ─────────────────────────────────
  useEffect(() => {
    saveMasterExpenses(masterExpenses)
    clearTimeout(settingsSaveTimerRef.current)
    settingsSaveTimerRef.current = setTimeout(() => {
      saveSettings({ masterExpenses }).catch(console.error)
    }, 600)
  }, [masterExpenses])

  // ── Savings ─────────────────────────────────────────────────────────────────
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

  // ── Reset current month ──────────────────────────────────────────────────────
  function handleReset() {
    setMonthData(d => ({
      ...d,
      // Restore expense list from master (keeps any month-specific amounts if id matches)
      fixedExpenses: masterExpenses.map(e => {
        const existing = d.fixedExpenses.find(x => x.id === e.id)
        return { id: e.id, name: e.name, amount: existing?.amount ?? e.amount }
      }),
      // Clear all tracking state
      paidExpenseIds:    [],
      paychecksReceived: 0,
      lauraReceived:     false,
      // Reset credit cards: remainingCredit = availableCredit → owed = $0
      creditCards: d.creditCards.map(c => ({
        ...c,
        remainingCredit: c.availableCredit,
      })),
    }))
  }

  // ── Data handlers ────────────────────────────────────────────────────────────
  function updateCheckingBalance(val) {
    setMonthData(d => ({ ...d, checkingBalance: val }))
  }

  function updateFixedExpense(id, amount) {
    setMonthData(d => ({
      ...d,
      fixedExpenses: d.fixedExpenses.map(e => e.id === id ? { ...e, amount } : e),
    }))
  }

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

  function setPaychecksReceived(count) {
    setMonthData(d => ({ ...d, paychecksReceived: count }))
  }

  function toggleLauraReceived() {
    setMonthData(d => ({ ...d, lauraReceived: !d.lauraReceived }))
  }

  function updateCreditCard(id, field, value) {
    setMonthData(d => ({
      ...d,
      creditCards: d.creditCards.map(c => c.id === id ? { ...c, [field]: value } : c),
    }))
  }

  // ── Derived calculations ─────────────────────────────────────────────────────
  const income        = getMonthIncome(year, month)
  const thursdayDates = getThursdaysInMonth(year, month)

  const effectiveIncome = monthData
    ? getEffectiveIncome(income, monthData.paychecksReceived, monthData.lauraReceived)
    : { effectivePaychecks: income.paychecks, effectiveLaura: income.laura, total: income.total }

  const checkingBal = parseFloat(monthData?.checkingBalance) || 0
  const totalIn     = checkingBal + effectiveIncome.effectivePaychecks + effectiveIncome.effectiveLaura

  const fixedTotal = (monthData?.fixedExpenses ?? []).reduce(
    (sum, e) => sum + (parseFloat(e.amount) || 0), 0,
  )
  const unpaidFixedTotal = (monthData?.fixedExpenses ?? [])
    .filter(e => !(monthData?.paidExpenseIds ?? []).includes(e.id))
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
  const paidFixedTotal = fixedTotal - unpaidFixedTotal

  const ccTotal = (monthData?.creditCards ?? []).reduce((sum, c) => {
    const avail     = parseFloat(c.availableCredit)  || 0
    const remaining = parseFloat(c.remainingCredit) || 0
    return sum + (avail > 0 ? avail - remaining : 0)
  }, 0)

  const totalOut   = unpaidFixedTotal + ccTotal
  const remaining  = totalIn - totalOut

  const dateStats    = getDateStats(year, month)
  const derivedCalcs = getDerivedCalcs(remaining, dateStats)

  const thisMonthContribution = parseFloat(
    monthData?.fixedExpenses?.find(e => e.id === 'savings')?.amount,
  ) || 0
  const savingsHistory = buildSavingsHistory(year, month, 12, savingsBalance - thisMonthContribution)

  // ── Render ───────────────────────────────────────────────────────────────────
  if (authLoading || (page === 'dashboard' && (isLoading || !monthData))) {
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
        <div className="app-tabs">
          <button
            className={`app-tab${page === 'dashboard' ? ' active' : ''}`}
            onClick={() => setPage('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`app-tab${page === 'settings' ? ' active' : ''}`}
            onClick={() => setPage('settings')}
          >
            ⚙ Settings
          </button>
        </div>
        {user && (
          <div className="header-user">
            <span className="header-email">{user.userDetails}</span>
            <a className="signout-btn" href="/.auth/logout?post_logout_redirect_uri=/">Sign Out</a>
          </div>
        )}
      </header>

      {page === 'settings' ? (
        <div className="app-body">
          <SettingsPage
            masterExpenses={masterExpenses}
            onChange={setMasterExpenses}
          />
        </div>
      ) : (
        <div className="app-body">
          <MonthNav
            year={year}
            month={month}
            onPrev={prevMonth}
            onNext={nextMonth}
            onReset={handleReset}
          />

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
      )}
    </div>
  )
}

export default App


