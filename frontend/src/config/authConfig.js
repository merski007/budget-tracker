import { PublicClientApplication } from '@azure/msal-browser';

// Development mode - bypass authentication for local testing
export const DEV_MODE = import.meta.env.VITE_DEV_MODE !== 'false';

// MSAL configuration - values will be set via environment variables
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID || 'dev-mode-client-id',
    authority: import.meta.env.VITE_AZURE_AD_AUTHORITY || 'https://login.microsoftonline.com/common',
    knownAuthorities: [],
    redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Add scopes for API access
export const loginRequest = {
  scopes: ['openid', 'profile', 'offline_access'],
};

// API scope for backend calls
export const apiRequest = {
  scopes: [import.meta.env.VITE_API_SCOPE || 'https://your-tenant.onmicrosoft.com/api/user_impersonation'],
};

// Create the MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);
