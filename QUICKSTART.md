# Quick Start Guide - .NET API Version

## ✅ What You Have Now

A complete budget tracking application with:

- React frontend (Vite + TypeScript support)
- **ASP.NET Core 10 Web API** backend (no Azure Functions Core Tools needed!)
- Azure AD B2C authentication ready
- Cosmos DB integration
- Full CRUD operations for budgets and expenses

---

## 🚀 Running the Application

### Step 1: Run the API

```powershell
cd C:\WIP\_git\budget-tracker\BudgetTracker.Api
dotnet run
```

The API will start on:

- **HTTP**: http://localhost:5000
- **Swagger UI**: http://localhost:5000/swagger

### Step 2: Run the Frontend

In a **new terminal**:

```powershell
cd C:\WIP\_git\budget-tracker\frontend
npm run dev
```

Frontend will start on:

- **App**: http://localhost:3000

### Step 3: Test the API

Open http://localhost:5000/swagger in your browser to see all available endpoints:

- `GET /api/health` - Test the API is running
- `GET /api/budgets` - Get budgets (requires auth)
- `POST /api/budgets` - Create budget (requires auth)
- `GET /api/expenses` - Get expenses (requires auth)

---

## 🎯 Development Without Authentication

For local testing without setting up Azure AD B2C:

### Temporary: Disable Auth Requirement

**In `BudgetTracker.Api/Controllers/BudgetsController.cs` and `ExpensesController.cs`:**

Comment out the `[Authorize]` attribute:

```csharp
[ApiController]
[Route("api/[controller]")]
// [Authorize]  // <-- Comment this out for local testing
public class BudgetsController : ControllerBase
```

Now you can test the API without authentication!

---

## 🔧 Configuration

### API Configuration

**Edit `BudgetTracker.Api/appsettings.Development.json`:**

For local Cosmos DB Emulator (recommended):

```json
{
  "CosmosDb": {
    "Endpoint": "https://localhost:8081",
    "Key": "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==",
    "DatabaseName": "BudgetTrackerDB"
  }
}
```

Or for Azure Cosmos DB:

```json
{
  "CosmosDb": {
    "Endpoint": "https://your-account.documents.azure.com:443/",
    "Key": "your-primary-key",
    "DatabaseName": "BudgetTrackerDB"
  }
}
```

### Frontend Configuration

**Edit `frontend/.env`:**

```
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🧪 Testing the API

### Using Swagger

1. Go to http://localhost:5000/swagger
2. Expand any endpoint (e.g., `POST /api/budgets`)
3. Click "Try it out"
4. Enter sample data:
   ```json
   {
     "name": "Monthly Budget",
     "amount": 3000,
     "category": "Personal"
   }
   ```
5. Click "Execute"

### Using PowerShell/cURL

```powershell
# Health check
Invoke-RestMethod -Uri http://localhost:5000/api/health

# Create a budget (with auth disabled)
$budget = @{
    name = "Test Budget"
    amount = 1000
    category = "Personal"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/api/budgets `
    -Method Post `
    -Body $budget `
    -ContentType "application/json"
```

---

## 📦 What Changed from Node.js

| Feature       | Old (Node.js Functions)              | New (.NET API)        |
| ------------- | ------------------------------------ | --------------------- |
| Runtime       | Node.js + Azure Functions Core Tools | .NET 10               |
| Local Port    | 7071                                 | 5000                  |
| Start Command | `npm start`                          | `dotnet run`          |
| Installation  | npm packages (had issues)            | Just .NET SDK ✅      |
| Swagger       | Not included                         | Built-in ✅           |
| Hot Reload    | Manual restart                       | `dotnet watch run` ✅ |

---

## 💡 Next Steps

1. **Test the API** - Use Swagger to try all endpoints
2. **Connect Frontend** - Update frontend to call http://localhost:5000/api
3. **Add Azure AD B2C** - When ready for auth
4. **Deploy to Azure** - Use Azure App Service instead of Static Web Apps

---

## 🐛 Troubleshooting

### "Address already in use" error

Another app is using port 5000:

```powershell
# Find what's using the port
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <pid> /F

# Or change the port in launchSettings.json
```

### "Cosmos DB connection failed"

- Install [Cosmos DB Emulator](https://learn.microsoft.com/azure/cosmos-db/local-emulator)
- Or temporarily comment out Cosmos DB in `Program.cs` and use in-memory storage

### Build errors

```powershell
# Clean and rebuild
dotnet clean
dotnet build
```

---

## ✅ Benefits of .NET API

- ✅ **No npm installation issues**
- ✅ **Better performance** than Node.js
- ✅ **Excellent tooling** in VS Code/Visual Studio
- ✅ **Built-in Swagger** - test APIs easily
- ✅ **Type safety** with C#
- ✅ **Easy debugging** with breakpoints
- ✅ **Production-ready** - used by enterprises

---

**Ready to go! Run `dotnet run` in the BudgetTracker.Api folder to start!** 🚀
