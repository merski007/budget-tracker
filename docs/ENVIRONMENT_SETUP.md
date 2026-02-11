# Environment Setup Guide

This document explains how to configure environment variables for local development and production deployment.

## ⚠️ IMPORTANT SECURITY NOTES

**NEVER commit the following files to Git:**
- `.env` (frontend)
- `local.settings.json` (API)
- Any file containing actual secrets, keys, or credentials

**ALWAYS use:**
- `.env.example` as a template (frontend)
- `local.settings.json.example` as a template (API)
- Azure Key Vault for production secrets
- GitHub Secrets for CI/CD pipeline

---

## Frontend Environment Variables

### Local Development

1. Copy the example file:
   ```bash
   cd frontend
   copy .env.example .env
   ```

2. Update `.env` with your Azure AD B2C values:
   ```
   VITE_AZURE_AD_CLIENT_ID=<your-client-id>
   VITE_AZURE_AD_AUTHORITY=https://<your-tenant>.b2clogin.com/<your-tenant>.onmicrosoft.com/B2C_1_signupsignin
   VITE_AZURE_AD_KNOWN_AUTHORITY=<your-tenant>.b2clogin.com
   VITE_REDIRECT_URI=http://localhost:3000
   VITE_API_SCOPE=https://<your-tenant>.onmicrosoft.com/api/user_impersonation
   VITE_API_BASE_URL=http://localhost:7071/api
   ```

### Production (Azure Static Web Apps)

Configure in Azure Portal under Configuration > Application Settings:
- `VITE_AZURE_AD_CLIENT_ID`
- `VITE_AZURE_AD_AUTHORITY`
- `VITE_AZURE_AD_KNOWN_AUTHORITY`
- `VITE_REDIRECT_URI` (your production URL)
- `VITE_API_SCOPE`
- `VITE_API_BASE_URL` (your API URL)

---

## API Environment Variables

### Local Development

1. Copy the example file:
   ```bash
   cd api
   copy local.settings.json.example local.settings.json
   ```

2. Update `local.settings.json` with your values:
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "COSMOS_DB_ENDPOINT": "https://<your-cosmos>.documents.azure.com:443/",
       "COSMOS_DB_KEY": "<your-cosmos-key>",
       "COSMOS_DB_DATABASE": "BudgetTrackerDB",
       "KEY_VAULT_URL": "https://<your-keyvault>.vault.azure.net/",
       "AZURE_AD_B2C_TENANT_NAME": "<your-tenant>",
       "AZURE_AD_B2C_CLIENT_ID": "<your-client-id>",
       "AZURE_AD_B2C_POLICY": "B2C_1_signupsignin"
     }
   }
   ```

### Production (Azure Functions)

Use Azure Key Vault references in Application Settings:
```
COSMOS_DB_ENDPOINT=@Microsoft.KeyVault(SecretUri=https://<vault>.vault.azure.net/secrets/CosmosDbEndpoint/)
COSMOS_DB_KEY=@Microsoft.KeyVault(SecretUri=https://<vault>.vault.azure.net/secrets/CosmosDbKey/)
```

---

## Getting Azure AD B2C Values

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Azure AD B2C
3. Under "App registrations", select your app
4. Copy the "Application (client) ID" → `VITE_AZURE_AD_CLIENT_ID`
5. Under "User flows", use your sign-in flow name → part of `VITE_AZURE_AD_AUTHORITY`

---

## GitHub Secrets for CI/CD

Configure these secrets in your GitHub repository:

1. Go to Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN` (from Azure Static Web Apps deployment)
   - `AZURE_CREDENTIALS` (service principal JSON)

---

## Verify Setup

✅ Check that `.env` and `local.settings.json` are in `.gitignore`
✅ Confirm example files are committed to Git
✅ Verify actual secret files are NOT tracked by Git (run `git status`)
