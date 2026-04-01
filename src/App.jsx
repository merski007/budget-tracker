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
import BudgetListPage from './components/BudgetListPage'
import InvitePage from './components/InvitePage'
import { fetchBudgetMonth, saveBudgetMonth } from './api/budgetApi'
import { fetchSettings, saveSettings } from './api/settingsApi'
import { fetchBudgets } from './api/budgetsApi'
import {
  blankMonth,
  loadMonthData,
  saveMonthData,
  loadMasterExpenses,
  saveMasterExpenses,
  loadMasterIncome,
  saveMasterIncome,
  loadMasterCreditCards,
  saveMasterCreditCards,
  loadSavingsBalance,
  saveSavingsBalance,
  getDateStats,
  getDerivedCalcs,
  buildSavingsHistory,
} from './utils/budgetUtils'
import './App.css'


function getInviteCode() {
  const params = new URLSearchParams(window.location.search)
  return params.get('invite') || null
}

function clearInviteParam() {
  const url = new URL(window.location.href)
  url.searchParams.delete('invite')
  window.history.replaceState({}, '', url.toString())
}

function App() {
  const { user, loading: authLoading } = useAuth()
  const today = new Date()

  // â”€â”€ Top-level routing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // page: 'loading' | 'invite' | 'budgetList' | 'dashboard' | 'settings'
  const [page,          setPage]          = useState('loading')
  const [inviteCode,    setInviteCode]    = useState(null)
  const [allBudgets,    setAllBudgets]    = useState([])
  const [activeBudget,  setActiveBudget]  = useState(null)   // { budgetId, name, role }
  const [showSwitcher,  setShowSwitcher]  = useState(false)

  // â”€â”€ Dashboard state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  const [monthData,       setMonthData]       = useState(null)
  const [isMonthLoading,  setIsMonthLoading]  = useState(false)
  const [masterExpenses,  setMasterExpenses]  = useState([])
  const [masterIncome,    setMasterIncome]    = useState([])
  const [masterCreditCards, setMasterCreditCards] = useState([])
  const [savingsBalance,  setSavingsBalance]  = useState(0)

  const saveTimerRef         = useRef(null)
  const settingsSaveTimerRef = useRef(null)

  // â”€â”€ 1. On auth complete: check for invite or load budget list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (authLoading) return

    const code = getInviteCode()
    if (code) {
      setInviteCode(code)
      clearInviteParam()
      setPage('invite')
      return
    }

    loadBudgetList()
  }, [authLoading])   // eslint-disable-line react-hooks/exhaustive-deps

  async function loadBudgetList() {
    setPage('loading')
    try {
      const budgets = await fetchBudgets()
      setAllBudgets(budgets)
      if (budgets.length === 1) {
        // Auto-select if there is only one
        selectBudget(budgets[0], budgets)
      } else {
        setPage('budgetList')
      }
    } catch {
      setPage('budgetList')
    }
  }

  // â”€â”€ 2. Select a budget and load its settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function selectBudget(budget, budgetList) {
    setActiveBudget(budget)
    setAllBudgets(budgetList ?? allBudgets)
    setShowSwitcher(false)

    // Load per-budget templates from localStorage cache
    setMasterExpenses(loadMasterExpenses(budget.budgetId))
    setMasterIncome(loadMasterIncome(budget.budgetId))
    setMasterCreditCards(loadMasterCreditCards(budget.budgetId))

    const cachedSavings = loadSavingsBalance(budget.budgetId)
    setSavingsBalance(cachedSavings)

    // Async refresh all three templates from API
    fetchSettings(budget.budgetId)
      .then(data => {
        if (!data) return
        if (data.masterExpenses !== undefined) {
          setMasterExpenses(data.masterExpenses)
          saveMasterExpenses(budget.budgetId, data.masterExpenses)
        }
        if (data.masterIncome !== undefined) {
          setMasterIncome(data.masterIncome)
          saveMasterIncome(budget.budgetId, data.masterIncome)
        }
        if (data.masterCreditCards !== undefined) {
          setMasterCreditCards(data.masterCreditCards)
          saveMasterCreditCards(budget.budgetId, data.masterCreditCards)
        }
      })
      .catch(() => {})

    setPage('dashboard')
  }

  // â”€â”€ 3. Load month data when year/month/budget changes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!activeBudget || page !== 'dashboard') return
    let cancelled = false
    setMonthData(null)
    setIsMonthLoading(true)

    async function load() {
      const { budgetId } = activeBudget
      try {
        let data = await fetchBudgetMonth(budgetId, year, month)
        if (!data) {
          // No server doc yet — try local cache, else build blank from templates
          data = loadMonthData(budgetId, year, month)
               ?? blankMonth({ masterExpenses, masterIncome, masterCreditCards })
        } else {
          // Backfill any fields missing from older docs
          data = { paidExpenseIds: [], income: [], creditCards: [], ...data }
        }
        if (!cancelled) setMonthData(data)
      } catch {
        const cached = loadMonthData(budgetId, year, month)
        if (!cancelled) setMonthData(cached ?? blankMonth({ masterExpenses, masterIncome, masterCreditCards }))
      } finally {
        if (!cancelled) setIsMonthLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [year, month, activeBudget, page])   // eslint-disable-line react-hooks/exhaustive-deps

  // â”€â”€ 4. Persist month data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!monthData || !activeBudget) return
    const { budgetId } = activeBudget
    saveMonthData(budgetId, year, month, monthData)
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveBudgetMonth(budgetId, year, month, monthData).catch(console.error)
    }, 600)
  }, [year, month, monthData, activeBudget])

  // ── 5. Persist all master templates ────────────────────────────────────────
  useEffect(() => {
    if (!activeBudget) return
    const { budgetId } = activeBudget
    saveMasterExpenses(budgetId, masterExpenses)
    saveMasterIncome(budgetId, masterIncome)
    saveMasterCreditCards(budgetId, masterCreditCards)
    clearTimeout(settingsSaveTimerRef.current)
    settingsSaveTimerRef.current = setTimeout(() => {
      saveSettings(budgetId, { masterExpenses, masterIncome, masterCreditCards }).catch(console.error)
    }, 600)
  }, [masterExpenses, masterIncome, masterCreditCards, activeBudget])  // eslint-disable-line react-hooks/exhaustive-deps

  // â”€â”€ Savings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function updateSavingsBalance(val) {
    setSavingsBalance(val)
    if (activeBudget) saveSavingsBalance(activeBudget.budgetId, val)
  }

  // â”€â”€ Month navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  // â”€â”€ Reset â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function handleReset() {
    setMonthData(blankMonth({ masterExpenses, masterIncome, masterCreditCards }))
  }

  // â”€â”€ Data handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function updateCheckingBalance(val)      { setMonthData(d => ({ ...d, checkingBalance: val })) }
  function updateFixedExpense(id, amount)  {
    setMonthData(d => ({ ...d, fixedExpenses: d.fixedExpenses.map(e => e.id === id ? { ...e, amount } : e) }))
  }
  function togglePaidExpense(id) {
    setMonthData(d => {
      const isPaid = d.paidExpenseIds.includes(id)
      return { ...d, paidExpenseIds: isPaid ? d.paidExpenseIds.filter(p => p !== id) : [...d.paidExpenseIds, id] }
    })
  }
  function updateIncomeItem(id, amount) {
    setMonthData(d => ({ ...d, income: (d.income ?? []).map(i => i.id === id ? { ...i, amount } : i) }))
  }
  function toggleIncomeReceived(id) {
    setMonthData(d => ({
      ...d,
      income: (d.income ?? []).map(i => i.id === id ? { ...i, received: !i.received } : i),
    }))
  }
  function updateCreditCard(id, field, value) {
    setMonthData(d => ({ ...d, creditCards: d.creditCards.map(c => c.id === id ? { ...c, [field]: value } : c) }))
  }

  // ── Derived calculations ────────────────────────────────────────────────────
  const checkingBal = parseFloat(monthData?.checkingBalance) || 0

  // totalIn = checking balance + all *received* income sources
  const receivedIncomeTotal = (monthData?.income ?? [])
    .filter(i => i.received)
    .reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const totalIn = checkingBal + receivedIncomeTotal

  const incomeReceivedCount = (monthData?.income ?? []).filter(i => i.received).length
  const incomeTotalCount    = (monthData?.income ?? []).length

  const fixedTotal = (monthData?.fixedExpenses ?? []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const unpaidFixedTotal = (monthData?.fixedExpenses ?? [])
    .filter(e => !(monthData?.paidExpenseIds ?? []).includes(e.id))
    .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const paidFixedTotal = fixedTotal - unpaidFixedTotal

  const ccTotal = (monthData?.creditCards ?? []).reduce((s, c) => {
    const avail = parseFloat(c.availableCredit) || 0
    const rem   = parseFloat(c.remainingCredit) || 0
    return s + (avail > 0 ? avail - rem : 0)
  }, 0)

  const totalOut   = unpaidFixedTotal + ccTotal
  const remaining  = totalIn - totalOut
  const dateStats  = activeBudget ? getDateStats(year, month) : { isCurrentMonth: false, daysInMonth: 30, daysRemainingInMonth: 30, daysRemainingInWeek: 7 }
  const derivedCalcs = getDerivedCalcs(remaining, dateStats)

  const thisMonthContribution = parseFloat(monthData?.fixedExpenses?.find(e => e.id === 'savings')?.amount) || 0
  const savingsHistory = activeBudget
    ? buildSavingsHistory(activeBudget.budgetId, year, month, 12, savingsBalance - thisMonthContribution)
    : []

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (authLoading || page === 'loading') {
    return (
      <div className="auth-loading">
        <span>Loading…</span>
      </div>
    )
  }

  // Invite acceptance screen
  if (page === 'invite') {
    return (
      <div className="app">
        <header className="app-header"><h1>Budget Tracker</h1></header>
        <div className="app-body">
          <InvitePage
            code={inviteCode}
            onAccepted={result => {
              // Reload all budgets then switch to the newly joined one
              fetchBudgets().then(budgets => {
                setAllBudgets(budgets)
                const joined = budgets.find(b => b.budgetId === result.budgetId)
                if (joined) selectBudget(joined, budgets)
                else setPage('budgetList')
              }).catch(() => setPage('budgetList'))
            }}
            onDismiss={() => {
              setInviteCode(null)
              loadBudgetList()
            }}
          />
        </div>
      </div>
    )
  }

  // Budget list / selection screen
  if (page === 'budgetList') {
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
          <BudgetListPage
            budgets={allBudgets}
            onSelect={b => selectBudget(b, allBudgets)}
            onBudgetsChange={setAllBudgets}
          />
        </div>
      </div>
    )
  }

  // Dashboard / Settings
  const isDashboardReady = page === 'dashboard' && !isMonthLoading && monthData

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Budget Tracker</h1>
          {activeBudget && (
            <div className="budget-switcher">
              <button
                className="budget-switcher-btn"
                onClick={() => setShowSwitcher(s => !s)}
              >
                {activeBudget.name}
                <span className="switcher-caret">{showSwitcher ? '▲' : '▼'}</span>
              </button>
              {showSwitcher && (
                <div className="budget-switcher-menu">
                  {allBudgets.map(b => (
                    <button
                      key={b.budgetId}
                      className={`switcher-item${b.budgetId === activeBudget.budgetId ? ' active' : ''}`}
                      onClick={() => selectBudget(b)}
                    >
                      {b.name}
                    </button>
                  ))}
                  <div className="switcher-divider" />
                  <button className="switcher-item switcher-manage" onClick={() => { setShowSwitcher(false); setPage('budgetList') }}>
                    Manage Budgets…
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="app-tabs">
          <button className={`app-tab${page === 'dashboard' ? ' active' : ''}`} onClick={() => setPage('dashboard')}>
            Dashboard
          </button>
          <button className={`app-tab${page === 'settings' ? ' active' : ''}`} onClick={() => setPage('settings')}>
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
            budget={activeBudget}
            masterExpenses={masterExpenses}
            masterIncome={masterIncome}
            masterCreditCards={masterCreditCards}
            onExpensesChange={setMasterExpenses}
            onIncomeChange={setMasterIncome}
            onCreditCardsChange={setMasterCreditCards}
            onBudgetRenamed={name => {
              setActiveBudget(b => ({ ...b, name }))
              setAllBudgets(list => list.map(b => b.budgetId === activeBudget.budgetId ? { ...b, name } : b))
            }}
          />
        </div>
      ) : isDashboardReady ? (
        <div className="app-body">
          <MonthNav year={year} month={month} onPrev={prevMonth} onNext={nextMonth} onReset={handleReset} />

          <SummaryBar
            totalIn={totalIn}
            totalOut={totalOut}
            remaining={remaining}
            fixedTotal={fixedTotal}
            paidFixedTotal={paidFixedTotal}
            incomeReceivedCount={incomeReceivedCount}
            incomeTotalCount={incomeTotalCount}
            isCurrentMonth={dateStats.isCurrentMonth}
          />

          <div className="panels">
            <IncomePanel
              income={monthData.income ?? []}
              checkingBalance={monthData.checkingBalance}
              onCheckingBalanceChange={updateCheckingBalance}
              onAmountChange={updateIncomeItem}
              onToggleReceived={toggleIncomeReceived}
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

          <CreditCardsPanel cards={monthData.creditCards} onCardChange={updateCreditCard} total={ccTotal} />
          <DerivedCalcsPanel calcs={derivedCalcs} isCurrentMonth={dateStats.isCurrentMonth} />
          <SavingsPanel
            savingsBalance={savingsBalance}
            onBalanceChange={updateSavingsBalance}
            thisMonthContribution={thisMonthContribution}
            history={savingsHistory}
          />
        </div>
      ) : (
        <div className="auth-loading"><span>Loading budget…</span></div>
      )}
    </div>
  )
}

export default App

