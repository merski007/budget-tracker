import { useState, useEffect, useRef } from 'react'
import { useAuth } from './hooks/useAuth'
import MonthNav from './components/MonthNav'
import SummaryBar from './components/SummaryBar'
import IncomePanel from './components/IncomePanel'
import FixedExpensesPanel from './components/FixedExpensesPanel'
import CreditCardsPanel from './components/CreditCardsPanel'
import DerivedCalcsPanel from './components/DerivedCalcsPanel'
import SavingsPanel from './components/SavingsPanel'
import BurnDownChart from './components/BurnDownChart'
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
  buildBurnDownSeries,
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

  // ── Optimistic-concurrency bookkeeping (kept in refs so updating them never
  //    re-triggers the autosave effects) ───────────────────────────────────────
  const monthDataRef          = useRef(null)   // mirror of monthData for async saves
  const monthEtagRef          = useRef(null)   // last-synced month _etag
  const monthKeyRef           = useRef(null)   // budgetId-year-month the loaded data belongs to
  const monthConflictRef      = useRef(false)  // true while a month conflict is unresolved
  const monthSaveInFlightRef  = useRef(false)
  const monthSavePendingRef   = useRef(false)
  const monthSkipNextSaveRef  = useRef(false)  // skip the autosave that immediately follows a load
  const settingsEtagRef       = useRef(null)   // last-synced settings _etag
  const settingsSaveInFlightRef = useRef(false)
  const settingsSavePendingRef  = useRef(false)
  const settingsPayloadRef      = useRef(null)
  const settingsLoadedRef       = useRef(false) // true once initial settings fetch resolves
  const settingsSkipNextSaveRef = useRef(false) // skip the autosave that immediately follows a load

  const [monthConflict,  setMonthConflict]  = useState(null)  // remote doc when month edits collide
  const [settingsNotice, setSettingsNotice] = useState(false) // settings were reloaded after a collision

  // Keep the mirror ref in sync every render.
  monthDataRef.current = monthData

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

    // Reset concurrency bookkeeping for the newly-selected budget.
    settingsEtagRef.current = null
    settingsSaveInFlightRef.current = false
    settingsSavePendingRef.current = false
    settingsLoadedRef.current = false
    settingsSkipNextSaveRef.current = false
    setSettingsNotice(false)

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
        settingsEtagRef.current = data._etag ?? null
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
        // Savings balance is shared via the settings doc. If the server already has
        // a value, it is the source of truth. If it does not, allow the next settings
        // save to fire so any locally-stored value is migrated up to the server.
        if (data.savingsBalance !== undefined && data.savingsBalance !== null) {
          setSavingsBalance(data.savingsBalance)
          saveSavingsBalance(budget.budgetId, data.savingsBalance)
          // Applying loaded data shouldn't echo a redundant save back to the server.
          settingsSkipNextSaveRef.current = true
        } else {
          // One-time migration of the local savings balance — let the save proceed.
          settingsSkipNextSaveRef.current = false
        }
      })
      .catch(() => {})
      .finally(() => { settingsLoadedRef.current = true })

    setPage('dashboard')
  }

  // ── 3. Load month data when year/month/budget changes ───────────────────────
  useEffect(() => {
    if (!activeBudget || page !== 'dashboard') return
    let cancelled = false
    const { budgetId } = activeBudget
    const key = `${budgetId}-${year}-${month}`

    // Reset month state + concurrency bookkeeping for the month being loaded.
    setMonthData(null)
    setIsMonthLoading(true)
    monthKeyRef.current      = null
    monthEtagRef.current     = null
    monthConflictRef.current = false
    monthSaveInFlightRef.current = false
    monthSavePendingRef.current  = false
    clearTimeout(saveTimerRef.current)
    setMonthConflict(null)

    async function load() {
      try {
        let etag = null
        let data = await fetchBudgetMonth(budgetId, year, month)
        if (!data) {
          // No server doc yet — try local cache, else build blank from templates
          data = loadMonthData(budgetId, year, month)
               ?? blankMonth({ masterExpenses, masterIncome, masterCreditCards })
        } else {
          // Capture the server version, then backfill fields missing from older docs.
          etag = data._etag ?? null
          const { _etag, ...rest } = data
          data = { paidExpenseIds: [], income: [], creditCards: [], ...rest }
        }
        if (!cancelled) {
          monthEtagRef.current = etag
          monthKeyRef.current  = key
          monthSkipNextSaveRef.current = true   // loading isn't an edit — don't echo-save
          setMonthData(data)
        }
      } catch {
        const cached = loadMonthData(budgetId, year, month)
        if (!cancelled) {
          monthEtagRef.current = null
          monthKeyRef.current  = key
          monthSkipNextSaveRef.current = true
          setMonthData(cached ?? blankMonth({ masterExpenses, masterIncome, masterCreditCards }))
        }
      } finally {
        if (!cancelled) setIsMonthLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [year, month, activeBudget, page])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Serialized month save with optimistic concurrency ───────────────────────
  async function runMonthSave(budgetId, year, month) {
    const key = `${budgetId}-${year}-${month}`
    if (monthConflictRef.current) return
    if (monthKeyRef.current !== key) return            // data no longer belongs to this month
    if (monthSaveInFlightRef.current) {                // serialize: never overlap saves
      monthSavePendingRef.current = true
      return
    }
    const snapshot = monthDataRef.current
    if (!snapshot) return

    monthSaveInFlightRef.current = true
    try {
      const result = await saveBudgetMonth(budgetId, year, month, snapshot, monthEtagRef.current)
      if (result.conflict) {
        if (monthKeyRef.current !== key) return        // user moved on; ignore stale result
        if (result.current) {
          monthConflictRef.current = true
          setMonthConflict(result.current)
          monthSavePendingRef.current = false
        } else {
          // The month doc was deleted server-side: drop the stale etag and recreate it.
          monthEtagRef.current = null
          monthSavePendingRef.current = true
        }
        return
      }
      if (monthKeyRef.current !== key) return           // user moved on; don't clobber new etag
      monthEtagRef.current = result.doc._etag ?? null
    } catch (err) {
      console.error(err)
    } finally {
      monthSaveInFlightRef.current = false
      if (monthSavePendingRef.current && !monthConflictRef.current && monthKeyRef.current === key) {
        monthSavePendingRef.current = false
        runMonthSave(budgetId, year, month)
      }
    }
  }

  // ── 4. Persist month data (localStorage immediately, server debounced) ───────
  useEffect(() => {
    if (!monthData || !activeBudget) return
    const { budgetId } = activeBudget
    if (monthKeyRef.current !== `${budgetId}-${year}-${month}`) return  // not this month's data
    saveMonthData(budgetId, year, month, monthData)
    if (monthSkipNextSaveRef.current) {                // first render after a load: cache only
      monthSkipNextSaveRef.current = false
      return
    }
    if (monthConflictRef.current) return               // hold autosave until conflict resolved
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      runMonthSave(budgetId, year, month)
    }, 600)
    return () => clearTimeout(saveTimerRef.current)
  }, [year, month, monthData, activeBudget])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Month conflict resolution ───────────────────────────────────────────────
  function reloadMonthFromServer() {
    if (!monthConflict || !activeBudget) { setMonthConflict(null); monthConflictRef.current = false; return }
    const { _etag, ...rest } = monthConflict
    monthEtagRef.current     = _etag ?? null
    monthKeyRef.current      = `${activeBudget.budgetId}-${year}-${month}`
    monthConflictRef.current = false
    setMonthConflict(null)
    monthSkipNextSaveRef.current = true   // adopting the server copy isn't an edit
    setMonthData({ paidExpenseIds: [], income: [], creditCards: [], ...rest })
  }

  function overwriteMonthOnServer() {
    if (!activeBudget) return
    // Adopt the server's current version so our local data wins the next write.
    monthEtagRef.current     = monthConflict?._etag ?? null
    monthConflictRef.current = false
    setMonthConflict(null)
    runMonthSave(activeBudget.budgetId, year, month)
  }

  // ── 5. Persist all master templates ────────────────────────────────────────
  useEffect(() => {
    if (!activeBudget) return
    const { budgetId } = activeBudget
    saveMasterExpenses(budgetId, masterExpenses)
    saveMasterIncome(budgetId, masterIncome)
    saveMasterCreditCards(budgetId, masterCreditCards)
    settingsPayloadRef.current = { masterExpenses, masterIncome, masterCreditCards, savingsBalance }
    if (!settingsLoadedRef.current) return             // don't sync before the initial load
    if (settingsSkipNextSaveRef.current) {             // first run after a load: cache only
      settingsSkipNextSaveRef.current = false
      return
    }
    clearTimeout(settingsSaveTimerRef.current)
    settingsSaveTimerRef.current = setTimeout(() => {
      runSettingsSave(budgetId)
    }, 600)
    return () => clearTimeout(settingsSaveTimerRef.current)
  }, [masterExpenses, masterIncome, masterCreditCards, savingsBalance, activeBudget])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Serialized settings save with optimistic concurrency ────────────────────
  async function runSettingsSave(budgetId) {
    if (!activeBudget || activeBudget.budgetId !== budgetId) return
    if (settingsSaveInFlightRef.current) {             // serialize: never overlap saves
      settingsSavePendingRef.current = true
      return
    }
    const payload = settingsPayloadRef.current
    if (!payload) return

    settingsSaveInFlightRef.current = true
    try {
      const result = await saveSettings(budgetId, payload, settingsEtagRef.current)
      if (result.conflict) {
        // Someone else changed the shared settings. Reload the server's version and
        // tell the user, rather than silently overwriting their change.
        if (result.current && activeBudget && activeBudget.budgetId === budgetId) {
          const c = result.current
          settingsEtagRef.current = c._etag ?? null
          if (c.masterExpenses    !== undefined) { setMasterExpenses(c.masterExpenses);       saveMasterExpenses(budgetId, c.masterExpenses) }
          if (c.masterIncome      !== undefined) { setMasterIncome(c.masterIncome);           saveMasterIncome(budgetId, c.masterIncome) }
          if (c.masterCreditCards !== undefined) { setMasterCreditCards(c.masterCreditCards); saveMasterCreditCards(budgetId, c.masterCreditCards) }
          if (c.savingsBalance    !== undefined && c.savingsBalance !== null) {
            setSavingsBalance(c.savingsBalance); saveSavingsBalance(budgetId, c.savingsBalance)
          }
          setSettingsNotice(true)
        }
        settingsSavePendingRef.current = false
        return
      }
        if (activeBudget && activeBudget.budgetId === budgetId) {
          settingsEtagRef.current = result.doc._etag ?? null
        }
    } catch (err) {
      console.error(err)
    } finally {
      settingsSaveInFlightRef.current = false
      if (settingsSavePendingRef.current && activeBudget && activeBudget.budgetId === budgetId) {
        settingsSavePendingRef.current = false
        runSettingsSave(budgetId)
      }
    }
  }

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
  function deleteExpenseItem(id) {
    setMonthData(d => ({
      ...d,
      fixedExpenses: d.fixedExpenses.filter(e => e.id !== id),
      paidExpenseIds: d.paidExpenseIds.filter(p => p !== id),
    }))
  }
  function resetExpensesPanel() {
    setMonthData(d => ({
      ...d,
      fixedExpenses: masterExpenses.map(e => ({ id: e.id, name: e.name, amount: e.amount })),
      paidExpenseIds: [],
    }))
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
  function deleteIncomeItem(id) {
    setMonthData(d => ({ ...d, income: (d.income ?? []).filter(i => i.id !== id) }))
  }
  function resetIncomePanel() {
    setMonthData(d => ({
      ...d,
      income: masterIncome.map(i => ({ id: i.id, name: i.name, amount: i.amount, received: false })),
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
  const burnDownSeries = buildBurnDownSeries(remaining, dateStats)

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

      {settingsNotice && (
        <div className="conflict-toast" role="status">
          <span>Settings were updated by someone else and reloaded. Re-apply your change if needed.</span>
          <button className="conflict-toast-dismiss" onClick={() => setSettingsNotice(false)}>Dismiss</button>
        </div>
      )}

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

          {monthConflict && (
            <div className="conflict-banner" role="alert">
              <div className="conflict-banner-text">
                <strong>This month was changed by someone else.</strong>
                <span>Your unsaved edits weren't saved. Reload their version, or overwrite it with yours.</span>
              </div>
              <div className="conflict-banner-actions">
                <button className="conflict-btn reload" onClick={reloadMonthFromServer}>Reload theirs</button>
                <button className="conflict-btn overwrite" onClick={overwriteMonthOnServer}>Overwrite with mine</button>
              </div>
            </div>
          )}

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
              onDeleteItem={deleteIncomeItem}
              onReset={resetIncomePanel}
              totalIn={totalIn}
            />
            <FixedExpensesPanel
              expenses={monthData.fixedExpenses}
              paidExpenseIds={monthData.paidExpenseIds}
              onAmountChange={updateFixedExpense}
              onTogglePaid={togglePaidExpense}
              onDeleteExpense={deleteExpenseItem}
              onReset={resetExpensesPanel}
              total={fixedTotal}
              unpaidTotal={unpaidFixedTotal}
            />
          </div>

          <CreditCardsPanel cards={monthData.creditCards} onCardChange={updateCreditCard} total={ccTotal} />
          <DerivedCalcsPanel calcs={derivedCalcs} isCurrentMonth={dateStats.isCurrentMonth} />
          <BurnDownChart series={burnDownSeries} />
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

