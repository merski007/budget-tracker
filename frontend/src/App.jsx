import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance } from './config/authConfig'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import './App.css'

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="budgets" element={<div>Budgets Page - Coming Soon</div>} />
            <Route path="expenses" element={<div>Expenses Page - Coming Soon</div>} />
            <Route path="reports" element={<div>Reports Page - Coming Soon</div>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </MsalProvider>
  )
}

export default App
