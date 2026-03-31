export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const DEFAULT_FIXED_EXPENSES = [
  { id: 'we-energy',      name: 'We Energy',           amount: 185  },
  { id: 'edvest',         name: 'EdVest',               amount: 75   },
  { id: 'great-midwest',  name: 'Great Midwest Bank',   amount: 1527 },
  { id: 'elite',          name: 'Elite',                amount: 236  },
  { id: 'insurance',      name: 'Insurance',            amount: 350  },
  { id: 'uncle-payment',  name: 'Uncle Payment',        amount: 1000 },
  { id: 'savings',        name: 'Savings',              amount: 2000 },
  { id: 'water',          name: 'Water',                amount: 70   },
  { id: 'netflix',        name: 'Netflix',              amount: 27   },
  { id: 'internet',       name: 'Internet',             amount: 85   },
  { id: 'burn',           name: 'Burn',                 amount: 30   },
  { id: 'cellphone',      name: 'Cellphone',            amount: 55   },
  { id: 'gas',            name: 'Gas',                  amount: 200  },
  { id: 'dr-beaus',       name: 'Dr Beaus',             amount: 112  },
  { id: 'truck-payment',  name: 'Truck Payment',        amount: 690  },
  { id: 'rv',             name: 'RV',                   amount: 200  },
  { id: 'mister-carwash', name: 'Mister Carwash',       amount: 35   },
]

export const DEFAULT_CREDIT_CARDS = [
  { id: 'costco', name: 'Costco Card', availableCredit: '', remainingCredit: '' },
  { id: 'chase',  name: 'Chase',       availableCredit: '', remainingCredit: '' },
]

/**
 * Count how many Thursdays are in a given month.
 * @param {number} year
 * @param {number} month - 1-indexed
 */
export function countThursdays(year, month) {
  let count = 0
  const daysInMonth = new Date(year, month, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(year, month - 1, d).getDay() === 4) count++
  }
  return count
}

/**
 * Calculate income for a month based on Thursday count.
 * 4 Thursdays → 4 paychecks × $1,300 + Laura $2,000
 * 5 Thursdays → 5 paychecks × $1,300 + Laura $2,500
 */
export function getMonthIncome(year, month) {
  const thursdays = countThursdays(year, month)
  const paychecks = thursdays * 1300
  const laura = thursdays >= 5 ? 2500 : 2000
  return { thursdays, paychecks, laura, total: paychecks + laura }
}

export function getStorageKey(year, month) {
  return `budget-${year}-${String(month).padStart(2, '0')}`
}

export function loadMonthData(year, month) {
  const key = getStorageKey(year, month)
  const stored = localStorage.getItem(key)
  if (stored) return JSON.parse(stored)
  return {
    checkingBalance: '',
    fixedExpenses: DEFAULT_FIXED_EXPENSES.map(e => ({ ...e })),
    creditCards: DEFAULT_CREDIT_CARDS.map(c => ({ ...c })),
  }
}

export function saveMonthData(year, month, data) {
  localStorage.setItem(getStorageKey(year, month), JSON.stringify(data))
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
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
