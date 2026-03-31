import { useState } from 'react'

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Other']

function EntryForm({ onAdd }) {
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'Other',
    type: 'expense',
  })

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.description.trim() || !form.amount) return
    onAdd({ ...form, amount: parseFloat(form.amount) })
    setForm({ description: '', amount: '', category: 'Other', type: 'expense' })
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <h2>Add Entry</h2>
      <div className="form-row">
        <select name="type" value={form.type} onChange={handleChange}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <select name="category" value={form.category} onChange={handleChange}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="form-row">
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          min="0.01"
          step="0.01"
          value={form.amount}
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit">Add</button>
    </form>
  )
}

export default EntryForm
