import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { loginRequest, DEV_MODE } from '../config/authConfig'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Login() {
  const { instance } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const navigate = useNavigate()

  useEffect(() => {
    // In dev mode, auto-login by navigating to dashboard
    if (DEV_MODE) {
      sessionStorage.setItem('devMode', 'true')
      navigate('/')
      return
    }
    
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleLogin = () => {
    if (DEV_MODE) {
      sessionStorage.setItem('devMode', 'true')
      navigate('/')
      return
    }
    
    instance.loginRedirect(loginRequest).catch((error) => {
      console.error('Login failed:', error)
    })
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Budget Tracker</h1>
        <p>Track your personal finances with ease</p>
        <button onClick={handleLogin} className="login-button">
          Sign In
        </button>
      </div>
    </div>
  )
}

export default Login
