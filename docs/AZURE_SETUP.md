# Azure Deployment Guide

Complete guide for deploying the Budget Tracker application to Azure.

## Prerequisites

- Azure subscription ([Create free account](https://azure.microsoft.com/free/))
- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli) installed
- [Node.js](https://nodejs.org/) 18+ installed
- [Git](https://git-scm.com/) installed
- GitHub account

---

## Step 1: Create Azure AD B2C Tenant

Azure AD B2C handles user authentication and authorization.

### 1.1 Create B2C Tenant

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Azure AD B2C" and click "Create"
3. Select "Create a new Azure AD B2C Tenant"
4. Fill in:
   - **Organization name**: Budget Tracker
   - **Initial domain name**: budgettracker (must be unique)
   - **Country/Region**: Your country
5. Click "Review + create" then "Create"
6. Switch to the new B2C tenant (top-right menu)

### 1.2 Register Application

1. In the B2C tenant, go to "App registrations" > "New registration"
2. Fill in:
   - **Name**: Budget Tracker App
   - **Supported account types**: Accounts in any identity provider or organizational directory
   - **Redirect URI**: 
     - Type: Single-page application (SPA)
     - URL: `http://localhost:3000` (add production URL later)
3. Click "Register"
4. **Save the Application (client) ID** - you'll need this

### 1.3 Create User Flow

1. In the B2C tenant, go to "User flows" > "New user flow"
2. Select "Sign up and sign in" > Recommended
3. Fill in:
   - **Name**: signupsignin
   - **Identity providers**: Select "Email signup"
   - **User attributes and claims**: 
     - Collect: Email Address, Display Name, Given Name, Surname
     - Return: Email Addresses, Display Name, User's Object ID
4. Click "Create"

### 1.4 Configure API Permissions

1. In "App registrations", select your app
2. Go to "Expose an API" > "Add a scope"
3. Accept the default Application ID URI
4. Add scope:
   - **Scope name**: user_impersonation
   - **Admin consent display name**: Access Budget Tracker API
   - **Admin consent description**: Allow the application to access Budget Tracker API on behalf of the signed-in user
5. Click "Add scope"
6. **Save the full scope URL** - you'll need this

---

## Step 2: Provision Azure Resources

### Option A: Using PowerShell Script (Windows)

```powershell
cd infrastructure
.\provision-azure-resources.ps1
```

### Option B: Using Bash Script (Linux/Mac)

```bash
cd infrastructure
chmod +x provision-azure-resources.sh
./provision-azure-resources.sh
```

### Option C: Manual Setup via Azure Portal

1. **Create Resource Group**
   - Name: `budget-tracker-rg`
   - Region: East US

2. **Create Static Web App**
   - Name: `budget-tracker-web`
   - Plan: Free
   - Deployment: GitHub
   - Repository: Your fork
   - Branch: main
   - Build preset: React
   - App location: `/frontend`
   - API location: `/api`
   - Output location: `dist`

3. **Create Cosmos DB**
   - API: Core (SQL)
   - Account name: `budget-tracker-cosmos`
   - Location: East US
   - Capacity mode: Serverless (or Provisioned with Free Tier)
   - Create database: `BudgetTrackerDB`
   - Create containers:
     - `Budgets` (partition key: `/userId`)
     - `Expenses` (partition key: `/userId`)

4. **Create Key Vault**
   - Name: `budget-tracker-kv`
   - Region: East US
   - Pricing tier: Standard

5. **Create Application Insights**
   - Name: `budget-tracker-insights`
   - Resource mode: Classic

---

## Step 3: Configure Secrets

### 3.1 Store Secrets in Key Vault

1. Get Cosmos DB connection details:
   ```bash
   az cosmosdb show --name budget-tracker-cosmos --resource-group budget-tracker-rg --query documentEndpoint
   az cosmosdb keys list --name budget-tracker-cosmos --resource-group budget-tracker-rg --query primaryMasterKey
   ```

2. Add secrets to Key Vault:
   ```bash
   az keyvault secret set --vault-name budget-tracker-kv --name "CosmosDbEndpoint" --value "<endpoint>"
   az keyvault secret set --vault-name budget-tracker-kv --name "CosmosDbKey" --value "<key>"
   ```

### 3.2 Configure Static Web App Settings

1. Go to Static Web App > Configuration
2. Add Application Settings:
   - `COSMOS_DB_ENDPOINT`: `@Microsoft.KeyVault(SecretUri=https://budget-tracker-kv.vault.azure.net/secrets/CosmosDbEndpoint/)`
   - `COSMOS_DB_KEY`: `@Microsoft.KeyVault(SecretUri=https://budget-tracker-kv.vault.azure.net/secrets/CosmosDbKey/)`
   - `COSMOS_DB_DATABASE`: `BudgetTrackerDB`
   - `AZURE_AD_B2C_CLIENT_ID`: `<your-client-id>`
   - `AZURE_AD_B2C_TENANT_NAME`: `budgettracker`
   - `AZURE_AD_B2C_POLICY`: `B2C_1_signupsignin`

3. Enable Managed Identity:
   - Go to Static Web App > Identity
   - Enable System-assigned identity
   - Copy the Object ID

4. Grant Key Vault Access:
   - Go to Key Vault > Access policies
   - Add access policy
   - Secret permissions: Get, List
   - Principal: Paste the Object ID from step 3
   - Save

---

## Step 4: Configure GitHub

### 4.1 Get Deployment Token

1. Go to Static Web App > Overview
2. Click "Manage deployment token"
3. Copy the token

### 4.2 Add GitHub Secrets

1. Go to your GitHub repository
2. Settings > Secrets and variables > Actions
3. Add the following secrets:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`: (token from step 4.1)
   - `VITE_AZURE_AD_CLIENT_ID`: (from B2C app registration)
   - `VITE_AZURE_AD_AUTHORITY`: `https://budgettracker.b2clogin.com/budgettracker.onmicrosoft.com/B2C_1_signupsignin`
   - `VITE_AZURE_AD_KNOWN_AUTHORITY`: `budgettracker.b2clogin.com`
   - `VITE_REDIRECT_URI`: (your Static Web App URL)
   - `VITE_API_SCOPE`: (from B2C API exposure)

---

## Step 5: Deploy Application

### Automatic Deployment

The GitHub Actions workflow automatically deploys on push to `main`:

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

Monitor deployment:
1. Go to GitHub repository > Actions
2. Click on the latest workflow run
3. Check the logs

### Manual Local Testing

1. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **API**:
   ```bash
   cd api
   npm install
   npm start
   ```

3. Open browser to `http://localhost:3000`

---

## Step 6: Update B2C Redirect URIs

1. Go to Azure AD B2C > App registrations > Your app
2. Under "Authentication" > Redirect URIs
3. Add your production URL: `https://<your-app>.azurestaticapps.net`
4. Save

---

## Step 7: Verify Deployment

1. Navigate to your Static Web App URL
2. Click "Sign In"
3. Create a test account
4. Verify dashboard loads
5. Check Application Insights for telemetry

---

## Troubleshooting

### Authentication Issues

- Verify B2C tenant configuration
- Check redirect URIs match exactly
- Ensure client ID is correct
- Check browser console for errors

### API Errors

- Verify Cosmos DB connection in Key Vault
- Check Managed Identity has Key Vault access
- Review Function logs in Application Insights

### Build Failures

- Check GitHub Actions logs
- Verify node_modules are not committed
- Ensure all secrets are configured

---

## Cost Estimates

With Azure Free Tier:
- **Static Web Apps**: Free (with limits)
- **Cosmos DB**: Free tier (25 GB storage, 1000 RU/s)
- **Key Vault**: ~$0.03/10,000 operations
- **Application Insights**: First 5 GB/month free

**Estimated monthly cost**: $0-5 for personal use

---

## Security Checklist

✅ Secrets stored in Key Vault, not in code
✅ `.env` and `local.settings.json` in `.gitignore`
✅ Managed Identity used for Azure services
✅ GitHub Secrets used for CI/CD
✅ CORS configured properly
✅ HTTPS enforced
✅ Authentication required for all API endpoints

---

## Next Steps

- Set up custom domain
- Configure custom B2C branding
- Enable monitoring and alerts
- Set up backup for Cosmos DB
- Implement proper error handling
- Add comprehensive logging

---

## Useful Commands

```bash
# View Static Web App details
az staticwebapp show --name budget-tracker-web --resource-group budget-tracker-rg

# View deployment logs
az staticwebapp show --name budget-tracker-web --query "defaultHostname"

# List Key Vault secrets
az keyvault secret list --vault-name budget-tracker-kv

# View Cosmos DB connection string
az cosmosdb keys list --name budget-tracker-cosmos --resource-group budget-tracker-rg

# Delete all resources (be careful!)
az group delete --name budget-tracker-rg --yes
```
