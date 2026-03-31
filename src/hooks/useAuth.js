import { useState, useEffect } from 'react'

/**
 * Fetches the current user from the SWA built-in auth endpoint.
 * Returns { user, loading } where user is null when not authenticated.
 *
 * user shape: { userId, userRoles, userDetails, identityProvider, claims }
 * userDetails = email for Google
 */
export function useAuth() {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/.auth/me')
      .then(r => r.json())
      .then(data => {
        const principal = data?.clientPrincipal
        setUser(principal ?? null)
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return { user, loading }
}
