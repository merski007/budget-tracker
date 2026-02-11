#!/bin/bash

# Azure Resource Provisioning Script (Bash version)
# This script creates all required Azure resources for the Budget Tracker app

# Variables - UPDATE THESE BEFORE RUNNING
RESOURCE_GROUP="budget-tracker-rg"
LOCATION="eastus"
STATIC_WEB_APP_NAME="budget-tracker-web"
COSMOS_ACCOUNT_NAME="budget-tracker-cosmos"
KEYVAULT_NAME="budget-tracker-kv"
APP_INSIGHTS_NAME="budget-tracker-insights"
B2C_TENANT_NAME="budgettracker"  # Must be globally unique

echo "Creating Azure resources for Budget Tracker..."

# Login to Azure (if not already logged in)
echo -e "\nStep 1: Logging in to Azure..."
az login

# Create Resource Group
echo -e "\nStep 2: Creating Resource Group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Create Azure Static Web App
echo -e "\nStep 3: Creating Azure Static Web App..."
az staticwebapp create \
  --name $STATIC_WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --source https://github.com/YOUR_USERNAME/budget-tracker \
  --branch main \
  --app-location "/frontend" \
  --api-location "/api" \
  --output-location "dist" \
  --login-with-github

echo -e "\nStatic Web App created. Save the deployment token for GitHub Actions."

# Create Cosmos DB Account
echo -e "\nStep 4: Creating Cosmos DB Account..."
az cosmosdb create \
  --name $COSMOS_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP \
  --locations regionName=$LOCATION failoverPriority=0 isZoneRedundant=False \
  --default-consistency-level Eventual \
  --enable-free-tier true

# Create Cosmos DB Database
echo -e "\nStep 5: Creating Cosmos DB Database..."
az cosmosdb sql database create \
  --account-name $COSMOS_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP \
  --name BudgetTrackerDB

# Create Cosmos DB Containers
echo -e "\nStep 6: Creating Cosmos DB Containers..."

# Budgets container
az cosmosdb sql container create \
  --account-name $COSMOS_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP \
  --database-name BudgetTrackerDB \
  --name Budgets \
  --partition-key-path "/userId" \
  --throughput 400

# Expenses container
az cosmosdb sql container create \
  --account-name $COSMOS_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP \
  --database-name BudgetTrackerDB \
  --name Expenses \
  --partition-key-path "/userId" \
  --throughput 400

# Create Key Vault
echo -e "\nStep 7: Creating Key Vault..."
az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --enable-rbac-authorization false

# Get Cosmos DB connection details
echo -e "\nStep 8: Storing secrets in Key Vault..."
COSMOS_ENDPOINT=$(az cosmosdb show \
  --name $COSMOS_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP \
  --query documentEndpoint -o tsv)

COSMOS_KEY=$(az cosmosdb keys list \
  --name $COSMOS_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP \
  --query primaryMasterKey -o tsv)

# Store in Key Vault
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "CosmosDbEndpoint" \
  --value "$COSMOS_ENDPOINT"

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "CosmosDbKey" \
  --value "$COSMOS_KEY"

# Create Application Insights
echo -e "\nStep 9: Creating Application Insights..."
az monitor app-insights component create \
  --app $APP_INSIGHTS_NAME \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web

# Output summary
echo -e "\n========================================"
echo "Azure Resources Created Successfully!"
echo -e "========================================\n"

echo "Resource Group: $RESOURCE_GROUP"
echo "Static Web App: $STATIC_WEB_APP_NAME"
echo "Cosmos DB: $COSMOS_ACCOUNT_NAME"
echo "Key Vault: $KEYVAULT_NAME"
echo "App Insights: $APP_INSIGHTS_NAME"

echo -e "\nNext Steps:"
echo "1. Create Azure AD B2C tenant manually in the portal"
echo "2. Configure app settings in the Static Web App"
echo "3. Set up GitHub repository secrets"
echo "4. Update environment variables"
echo -e "\nSee docs/AZURE_SETUP.md for detailed instructions.\n"
