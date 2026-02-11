# Azure Resource Provisioning Script
# This script creates all required Azure resources for the Budget Tracker app

# Variables - UPDATE THESE BEFORE RUNNING
$RESOURCE_GROUP="budget-tracker-rg"
$LOCATION="eastus"
$STATIC_WEB_APP_NAME="budget-tracker-web"
$COSMOS_ACCOUNT_NAME="budget-tracker-cosmos"
$KEYVAULT_NAME="budget-tracker-kv"
$APP_INSIGHTS_NAME="budget-tracker-insights"
$B2C_TENANT_NAME="budgettracker"  # Must be globally unique

Write-Host "Creating Azure resources for Budget Tracker..." -ForegroundColor Green

# Login to Azure (if not already logged in)
Write-Host "`nStep 1: Logging in to Azure..." -ForegroundColor Yellow
az login

# Create Resource Group
Write-Host "`nStep 2: Creating Resource Group..." -ForegroundColor Yellow
az group create `
  --name $RESOURCE_GROUP `
  --location $LOCATION

# Create Azure Static Web App (includes hosting + Functions)
Write-Host "`nStep 3: Creating Azure Static Web App..." -ForegroundColor Yellow
az staticwebapp create `
  --name $STATIC_WEB_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION `
  --source https://github.com/YOUR_USERNAME/budget-tracker `
  --branch main `
  --app-location "/frontend" `
  --api-location "/api" `
  --output-location "dist" `
  --login-with-github

Write-Host "`nStatic Web App created. Save the deployment token for GitHub Actions." -ForegroundColor Cyan

# Create Cosmos DB Account
Write-Host "`nStep 4: Creating Cosmos DB Account..." -ForegroundColor Yellow
az cosmosdb create `
  --name $COSMOS_ACCOUNT_NAME `
  --resource-group $RESOURCE_GROUP `
  --locations regionName=$LOCATION failoverPriority=0 isZoneRedundant=False `
  --default-consistency-level Eventual `
  --enable-free-tier true

# Create Cosmos DB Database
Write-Host "`nStep 5: Creating Cosmos DB Database..." -ForegroundColor Yellow
az cosmosdb sql database create `
  --account-name $COSMOS_ACCOUNT_NAME `
  --resource-group $RESOURCE_GROUP `
  --name BudgetTrackerDB

# Create Cosmos DB Containers
Write-Host "`nStep 6: Creating Cosmos DB Containers..." -ForegroundColor Yellow

# Budgets container
az cosmosdb sql container create `
  --account-name $COSMOS_ACCOUNT_NAME `
  --resource-group $RESOURCE_GROUP `
  --database-name BudgetTrackerDB `
  --name Budgets `
  --partition-key-path "/userId" `
  --throughput 400

# Expenses container
az cosmosdb sql container create `
  --account-name $COSMOS_ACCOUNT_NAME `
  --resource-group $RESOURCE_GROUP `
  --database-name BudgetTrackerDB `
  --name Expenses `
  --partition-key-path "/userId" `
  --throughput 400

# Create Key Vault
Write-Host "`nStep 7: Creating Key Vault..." -ForegroundColor Yellow
az keyvault create `
  --name $KEYVAULT_NAME `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION `
  --enable-rbac-authorization false

# Get Cosmos DB connection details
Write-Host "`nStep 8: Storing secrets in Key Vault..." -ForegroundColor Yellow
$COSMOS_ENDPOINT = az cosmosdb show `
  --name $COSMOS_ACCOUNT_NAME `
  --resource-group $RESOURCE_GROUP `
  --query documentEndpoint -o tsv

$COSMOS_KEY = az cosmosdb keys list `
  --name $COSMOS_ACCOUNT_NAME `
  --resource-group $RESOURCE_GROUP `
  --query primaryMasterKey -o tsv

# Store in Key Vault
az keyvault secret set `
  --vault-name $KEYVAULT_NAME `
  --name "CosmosDbEndpoint" `
  --value $COSMOS_ENDPOINT

az keyvault secret set `
  --vault-name $KEYVAULT_NAME `
  --name "CosmosDbKey" `
  --value $COSMOS_KEY

# Create Application Insights
Write-Host "`nStep 9: Creating Application Insights..." -ForegroundColor Yellow
az monitor app-insights component create `
  --app $APP_INSIGHTS_NAME `
  --location $LOCATION `
  --resource-group $RESOURCE_GROUP `
  --application-type web

# Output summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Azure Resources Created Successfully!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Resource Group: $RESOURCE_GROUP" -ForegroundColor Cyan
Write-Host "Static Web App: $STATIC_WEB_APP_NAME" -ForegroundColor Cyan
Write-Host "Cosmos DB: $COSMOS_ACCOUNT_NAME" -ForegroundColor Cyan
Write-Host "Key Vault: $KEYVAULT_NAME" -ForegroundColor Cyan
Write-Host "App Insights: $APP_INSIGHTS_NAME" -ForegroundColor Cyan

Write-Host "`n Next Steps:" -ForegroundColor Yellow
Write-Host "1. Create Azure AD B2C tenant manually in the portal" -ForegroundColor White
Write-Host "2. Configure app settings in the Static Web App" -ForegroundColor White
Write-Host "3. Set up GitHub repository secrets" -ForegroundColor White
Write-Host "4. Update environment variables" -ForegroundColor White
Write-Host "`nSee docs/AZURE_SETUP.md for detailed instructions.`n" -ForegroundColor White
