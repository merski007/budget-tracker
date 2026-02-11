import { useMsal } from '@azure/msal-react'
import { DEV_MODE } from '../config/authConfig'

function Dashboard() {
  const { accounts } = useMsal()
  const isDevMode = DEV_MODE || sessionStorage.getItem('devMode') === 'true'
  const username = isDevMode ? 'Developer' : (accounts[0]?.name || 'User')

  return (
    <div className="container">
      <h2>Welcome back, {username}!</h2>
      <div className="dashboard-grid">
        <div className="card">
          <h3>Total Budget</h3>
          <p className="metric">$0.00</p>
        </div>
        <div className="card">
          <h3>Total Expenses</h3>
          <p className="metric">$0.00</p>
        </div>
        <div className="card">
          <h3>Remaining</h3>
          <p className="metric">$0.00</p>
        </div>
      </div>
      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <p>No recent activity to display.</p>
      </div>
    </div>
  )
}

export default Dashboard
