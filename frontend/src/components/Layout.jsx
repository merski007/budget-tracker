import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { useEffect } from 'react'
import { DEV_MODE } from '../config/authConfig'

function Layout() {
  const { instance } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const navigate = useNavigate()
  const isDevMode = DEV_MODE || sessionStorage.getItem('devMode') === 'true'

  useEffect(() => {
    // Skip auth check in dev mode
    if (isDevMode) {
      return
    }
    
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate, isDevMode])

  const handleLogout = () => {
    if (isDevMode) {
      sessionStorage.removeItem('devMode')
      navigate('/login')
      return
    }
    
    instance.logoutRedirect({
      postLogoutRedirectUri: '/login',
    })
  }

  if (!isAuthenticated && !isDevMode) {
    return null
  }

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>Budget Tracker</h1>
        </div>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/budgets">Budgets</Link>
          <Link to="/expenses">Expenses</Link>
          <Link to="/reports">Reports</Link>
        </div>
        <div className="nav-actions">
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
