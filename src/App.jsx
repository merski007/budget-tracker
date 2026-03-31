import { useState, useEffect } from 'react'
import EntryForm from './components/EntryForm'
import EntryList from './components/EntryList'
import Summary from './components/Summary'
import './App.css'

const API_BASE = '/api'

function App() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchEntries()
  }, [])

  async function fetchEntries() {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/entries`)
      if (!res.ok) throw new Error('Failed to load entries')
      const data = await res.json()
      setEntries(data)
    } catch (err) {
      console.warn('API unavailable, using localStorage fallback:', err.message)
      const stored = JSON.parse(localStorage.getItem('budget-entries') || '[]')
      setEntries(stored)
    } finally {
      setLoading(false)
    }
  }

  async function addEntry(entry) {
    const newEntry = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    try {
      const res = await fetch(`${API_BASE}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      })
      if (!res.ok) throw new Error('Failed to save entry')
      const saved = await res.json()
      setEntries(prev => [saved, ...prev])
    } catch {
      // Fallback: save to localStorage
      const updated = [newEntry, ...entries]
      localStorage.setItem('budget-entries', JSON.stringify(updated))
      setEntries(updated)
    }
  }

  async function deleteEntry(id) {
    try {
      await fetch(`${API_BASE}/entries/${id}`, { method: 'DELETE' })
    } catch {
      // Fallback: remove from localStorage
    }
    const updated = entries.filter(e => e.id !== id)
    localStorage.setItem('budget-entries', JSON.stringify(updated))
    setEntries(updated)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Budget Tracker</h1>
      </header>
      <main className="app-main">
        <Summary entries={entries} />
        <EntryForm onAdd={addEntry} />
        {loading ? (
          <p className="status">Loading entries...</p>
        ) : error ? (
          <p className="status error">{error}</p>
        ) : (
          <EntryList entries={entries} onDelete={deleteEntry} />
        )}
      </main>
    </div>
  )
}

export default App
