export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ─── Empty defaults — new budgets start blank ─────────────────────────────────
// Users configure templates from the Settings tab.
export const DEFAULT_FIXED_EXPENSES   = []
export const DEFAULT_MASTER_INCOME    = []
export const DEFAULT_MASTER_CREDIT_CARDS = []

// Legacy alias (kept for any code that still imports DEFAULT_CREDIT_CARDS)
export const DEFAULT_CREDIT_CARDS = DEFAULT_MASTER_CREDIT_CARDS

// ─── Month storage key ────────────────────────────────────────────────────────
export function getStorageKey(budgetId, year, month) {
  return `budget-${budgetId}-${year}-${String(month).padStart(2, '0')}`
}

// ─── Month data — load / save ─────────────────────────────────────────────────

/**
 * Build a blank month document from the three master templates.
 * All "received" / "paid" flags are reset; credit card balances are cleared.
 */
export function blankMonth({ masterExpenses = [], masterIncome = [], masterCreditCards = [] } = {}) {
  return {
    checkingBalance: '',
    fixedExpenses:   masterExpenses.map(e => ({ id: e.id, name: e.name, amount: e.amount })),
    income:          masterIncome.map(i => ({ id: i.id, name: i.name, amount: i.amount, received: false })),
    creditCards:     masterCreditCards.map(c => ({ id: c.id, name: c.name, availableCredit: '', remainingCredit: '' })),
    paidExpenseIds:  [],
  }
}

export function loadMonthData(budgetId, year, month) {
  const key = getStorageKey(budgetId, year, month)
  const stored = localStorage.getItem(key)
  if (stored) {
    const parsed = JSON.parse(stored)
    // Backfill any fields missing from older stored docs
    return {
      paidExpenseIds: [],
      income:         [],
      creditCards:    [],
      ...parsed,
    }
  }
  // No cached data — caller should use blankMonth() with the master templates
  return null
}

export function saveMonthData(budgetId, year, month, data) {
  localStorage.setItem(getStorageKey(budgetId, year, month), JSON.stringify(data))
}

// ─── Master templates — load / save ──────────────────────────────────────────

export function loadMasterExpenses(budgetId) {
  const stored = localStorage.getItem(`budget-${budgetId}-master-expenses`)
  return stored ? JSON.parse(stored) : [...DEFAULT_FIXED_EXPENSES]
}
export function saveMasterExpenses(budgetId, expenses) {
  localStorage.setItem(`budget-${budgetId}-master-expenses`, JSON.stringify(expenses))
}

export function loadMasterIncome(budgetId) {
  const stored = localStorage.getItem(`budget-${budgetId}-master-income`)
  return stored ? JSON.parse(stored) : [...DEFAULT_MASTER_INCOME]
}
export function saveMasterIncome(budgetId, income) {
  localStorage.setItem(`budget-${budgetId}-master-income`, JSON.stringify(income))
}

export function loadMasterCreditCards(budgetId) {
  const stored = localStorage.getItem(`budget-${budgetId}-master-credit-cards`)
  return stored ? JSON.parse(stored) : [...DEFAULT_MASTER_CREDIT_CARDS]
}
export function saveMasterCreditCards(budgetId, cards) {
  localStorage.setItem(`budget-${budgetId}-master-credit-cards`, JSON.stringify(cards))
}

// ─── Savings ─────────────────────────────────────────────────────────────────

export function loadSavingsBalance(budgetId) {
  const v = localStorage.getItem(`budget-${budgetId}-savings-balance`)
  return v !== null ? parseFloat(v) : 0
}

export function saveSavingsBalance(budgetId, amount) {
  localStorage.setItem(`budget-${budgetId}-savings-balance`, String(amount))
}

/**
 * Build a month-over-month savings history for the last `numMonths` months
 * (ending at the given year/month), using stored monthly data.
 * Each entry shows the planned contribution and a running balance calculated
 * forward from `startingBalance` at the oldest loaded month.
 *
 * @param {number} year
 * @param {number} month  - 1-indexed, the "current" (newest) month to include
 * @param {number} numMonths
 * @param {number} startingBalance  - balance BEFORE the oldest month in the range
 */
export function buildSavingsHistory(budgetId, year, month, numMonths, startingBalance) {
  // Build an ordered list of {year, month} going back numMonths
  const months = []
  let y = year, m = month
  for (let i = 0; i < numMonths; i++) {
    months.unshift({ year: y, month: m })
    m--
    if (m === 0) { m = 12; y-- }
  }

  let running = startingBalance
  return months.map(({ year: y, month: m }) => {
    const data = loadMonthData(budgetId, y, m) ?? {}
    const savingsLine = (data.fixedExpenses ?? []).find(e => e.id === 'savings')
    const contribution = savingsLine ? parseFloat(savingsLine.amount) || 0 : 0
    running += contribution
    return {
      year: y,
      month: m,
      label: `${MONTH_NAMES[m - 1]} ${y}`,
      contribution,
      runningBalance: running,
    }
  })
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

/**
 * Build a day-by-day burn-down of the money remaining for the current month.
 *
 * Starting from `remaining` today, the series spends exactly the daily allowance
 * each day, reaching $0 at the end of the month. It is a pure function of the
 * remaining figure and the date stats, so it can be unit-tested in isolation.
 *
 * Returns [] for any month that is not the current month (where "days remaining"
 * is not meaningful).
 *
 * @param {number} remaining - net money remaining for the month
 * @param {ReturnType<typeof getDateStats>} dateStats
 * @returns {Array<{ day: number, remaining: number, isToday: boolean, isMonthEnd: boolean }>}
 */
export function buildBurnDownSeries(remaining, dateStats) {
  const { isCurrentMonth, daysInMonth, daysRemainingInMonth } = dateStats
  if (!isCurrentMonth || daysRemainingInMonth <= 0) return []

  const todayDate      = daysInMonth - daysRemainingInMonth + 1   // 1-indexed day of month
  const dailyAllowance = remaining / daysRemainingInMonth

  const points = []
  for (let i = 0; i <= daysRemainingInMonth; i++) {
    points.push({
      day:        todayDate + i,                           // last point = daysInMonth + 1 (month end)
      remaining:  Math.max(0, remaining - dailyAllowance * i),
      isToday:    i === 0,
      isMonthEnd: i === daysRemainingInMonth,
    })
  }
  return points
}

/**
 * Returns derived time-based stats relative to today.
 * Only meaningful when viewing the current month.
 * @param {number} year
 * @param {number} month - 1-indexed
 * @returns {{
 *   isCurrentMonth: boolean,
 *   daysInMonth: number,
 *   daysRemainingInMonth: number,   // today through last day, inclusive
 *   daysRemainingInWeek: number,    // today through Saturday, inclusive (Sun–Sat week)
 * }}
 */
export function getDateStats(year, month) {
  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month

  const daysInMonth = new Date(year, month, 0).getDate()

  if (!isCurrentMonth) {
    return { isCurrentMonth, daysInMonth, daysRemainingInMonth: daysInMonth, daysRemainingInWeek: 7 }
  }

  const todayDate = today.getDate()
  const daysRemainingInMonth = daysInMonth - todayDate + 1          // inclusive of today

  const dayOfWeek = today.getDay()                                  // 0=Sun … 6=Sat
  const daysRemainingInWeek = 7 - dayOfWeek                        // today through Sat inclusive

  return { isCurrentMonth, daysInMonth, daysRemainingInMonth, daysRemainingInWeek }
}

/**
 * Compute the derived budget amounts shown in Phase 2.
 * @param {number} remaining  - net remaining for the month
 * @param {ReturnType<typeof getDateStats>} dateStats
 */
export function getDerivedCalcs(remaining, dateStats) {
  const { daysRemainingInMonth, daysRemainingInWeek } = dateStats

  const dailyAllowance       = daysRemainingInMonth > 0 ? remaining / daysRemainingInMonth : 0
  const weeklyThisWeek       = dailyAllowance * daysRemainingInWeek   // $ available for the rest of this week
  const weeklyStandardRate   = dailyAllowance * 7                     // $ per full 7-day week at this rate

  return {
    dailyAllowance,
    weeklyThisWeek,
    weeklyStandardRate,
    daysRemainingInMonth,
    daysRemainingInWeek,
  }
}
