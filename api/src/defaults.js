/**
 * Default fixed expense template — shared between the API (budgets.js)
 * and the front-end (budgetUtils.js).  Keep the two in sync manually.
 */
const DEFAULT_FIXED_EXPENSES = [
  { id: 'we-energy',      name: 'We Energy',         amount: 185  },
  { id: 'edvest',         name: 'EdVest',             amount: 75   },
  { id: 'great-midwest',  name: 'Great Midwest Bank', amount: 1527 },
  { id: 'elite',          name: 'Elite',              amount: 236  },
  { id: 'insurance',      name: 'Insurance',          amount: 350  },
  { id: 'uncle-payment',  name: 'Uncle Payment',      amount: 1000 },
  { id: 'savings',        name: 'Savings',            amount: 2000 },
  { id: 'water',          name: 'Water',              amount: 70   },
  { id: 'netflix',        name: 'Netflix',            amount: 27   },
  { id: 'internet',       name: 'Internet',           amount: 85   },
  { id: 'burn',           name: 'Burn',               amount: 30   },
  { id: 'cellphone',      name: 'Cellphone',          amount: 55   },
  { id: 'gas',            name: 'Gas',                amount: 200  },
  { id: 'dr-beaus',       name: 'Dr Beaus',           amount: 112  },
  { id: 'truck-payment',  name: 'Truck Payment',      amount: 690  },
  { id: 'rv',             name: 'RV',                 amount: 200  },
  { id: 'mister-carwash', name: 'Mister Carwash',     amount: 35   },
]

module.exports = { DEFAULT_FIXED_EXPENSES }
