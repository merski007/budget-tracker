# Budget Tracker .NET API

ASP.NET Core 10 Web API for Budget Tracker application.

## Features

- ✅ RESTful API with CRUD operations
- ✅ Azure AD B2C authentication
- ✅ Cosmos DB integration
- ✅ Swagger/OpenAPI documentation
- ✅ CORS configuration for frontend
- ✅ Dependency injection
- ✅ Structured logging

## Prerequisites

- .NET 10 SDK or later
- Azure Cosmos DB account (or Cosmos DB Emulator for local development)
- Azure AD B2C tenant (for authentication)

## Getting Started

### 1. Configure Settings

Copy `appsettings.json` and update with your values:

```json
{
  "AzureAdB2C": {
    "Instance": "https://your-tenant.b2clogin.com",
    "ClientId": "your-client-id",
    "Domain": "your-tenant.onmicrosoft.com",
    "SignUpSignInPolicyId": "B2C_1_signupsignin"
  },
  "CosmosDb": {
    "Endpoint": "https://your-cosmos.documents.azure.com:443/",
    "Key": "your-cosmos-key",
    "DatabaseName": "BudgetTrackerDB"
  },
  "FrontendUrl": "http://localhost:3000"
}
```

### 2. Run Locally

```powershell
dotnet run
```

The API will start on:

- HTTP: http://localhost:5000
- HTTPS: https://localhost:5001

### 3. Access Swagger

Navigate to: http://localhost:5000/swagger

## API Endpoints

### Health

- `GET /api/health` - Health check (no auth required)

### Budgets

- `GET /api/budgets` - Get all budgets for authenticated user
- `GET /api/budgets/{id}` - Get specific budget
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/{id}` - Update budget
- `DELETE /api/budgets/{id}` - Delete budget

### Expenses

- `GET /api/expenses` - Get all expenses for authenticated user
- `GET /api/expenses/{id}` - Get specific expense
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense

## Project Structure

```
BudgetTracker.Api/
├── Controllers/         # API endpoints
│   ├── BudgetsController.cs
│   ├── ExpensesController.cs
│   └── HealthController.cs
├── Models/             # Data models
│   ├── Budget.cs
│   └── Expense.cs
├── Services/           # Business logic
│   ├── ICosmosDbService.cs
│   └── CosmosDbService.cs
├── Program.cs          # App configuration
└── appsettings.json    # Configuration
```

## Development

### Build

```powershell
dotnet build
```

### Run Tests

```powershell
dotnet test
```

### Watch Mode (auto-reload)

```powershell
dotnet watch run
```

## Deployment to Azure

### Option 1: Azure App Service

```bash
# Create App Service
az webapp create \
  --name budget-tracker-api \
  --resource-group budget-tracker-rg \
  --plan budget-tracker-plan \
  --runtime "DOTNET|10"

# Deploy
dotnet publish -c Release
az webapp deploy \
  --resource-group budget-tracker-rg \
  --name budget-tracker-api \
  --src-path ./bin/Release/net10.0/publish.zip
```

### Option 2: Azure Container Instances

```bash
# Build Docker image
docker build -t budget-tracker-api .

# Push to Azure Container Registry
docker tag budget-tracker-api <your-registry>.azurecr.io/budget-tracker-api
docker push <your-registry>.azurecr.io/budget-tracker-api
```

## Environment Variables (Azure)

Configure in Azure App Service > Configuration:

- `AzureAdB2C__Instance`
- `AzureAdB2C__ClientId`
- `AzureAdB2C__Domain`
- `AzureAdB2C__SignUpSignInPolicyId`
- `CosmosDb__Endpoint`
- `CosmosDb__Key`
- `CosmosDb__DatabaseName`
- `FrontendUrl`

## Local Development Without Auth

To test without Azure AD B2C, comment out `[Authorize]` in controllers.

## Troubleshooting

### CORS errors

- Verify `FrontendUrl` in appsettings.json matches your frontend URL
- Check browser console for specific CORS error

### Cosmos DB connection errors

- Verify endpoint and key are correct
- For local development, use Cosmos DB Emulator

### Authentication errors

- Verify Azure AD B2C configuration
- Check token is being sent in Authorization header
- Verify client ID and policy names

## Next Steps

- Add unit tests
- Implement caching
- Add rate limiting
- Set up Application Insights
- Create Docker containerization
