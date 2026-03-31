function EntryList({ entries, onDelete }) {
  if (entries.length === 0) {
    return <p className="empty-state">No entries yet. Add one above!</p>
  }

  return (
    <section className="entry-list">
      <h2>Entries</h2>
      <ul>
        {entries.map(entry => (
          <li key={entry.id} className={`entry-item ${entry.type}`}>
            <div className="entry-info">
              <span className="entry-description">{entry.description}</span>
              <span className="entry-meta">{entry.category} &middot; {new Date(entry.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="entry-right">
              <span className="entry-amount">
                {entry.type === 'income' ? '+' : '-'}${entry.amount.toFixed(2)}
              </span>
              <button className="delete-btn" onClick={() => onDelete(entry.id)} title="Delete">✕</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default EntryList
