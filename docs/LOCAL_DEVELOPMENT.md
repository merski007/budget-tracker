# Local Development Guide

Guide for setting up and running the Budget Tracker application locally.

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Azure Functions Core Tools** ([Install](https://docs.microsoft.com/azure/azure-functions/functions-run-local))
- **Git** ([Download](https://git-scm.com/))
- **VS Code** (recommended) with extensions:
  - Azure Functions
  - Azure Static Web Apps
  - ESLint

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/budget-tracker.git
cd budget-tracker
```

### 2. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
```

**API:**
```bash
cd ../api
npm install
```

### 3. Configure Environment Variables

**Frontend:**
```bash
cd frontend
copy .env.example .env
```

Edit `.env` and add your Azure AD B2C values (see [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md))

**API:**
```bash
cd ../api
copy local.settings.json.example local.settings.json
```

Edit `local.settings.json` and add your Azure credentials

---

## Running Locally

### Option 1: Run Everything Together

From the root directory:

**Windows (PowerShell):**
```powershell
# Terminal 1 - Frontend
cd frontend; npm run dev

# Terminal 2 - API
cd api; npm start
```

**Linux/Mac (Bash):**
```bash
# Terminal 1 - Frontend
cd frontend && npm run dev

# Terminal 2 - API
cd api && npm start
```

### Option 2: Use VS Code Tasks

1. Open workspace in VS Code
2. Press `Ctrl+Shift+B` (Windows) or `Cmd+Shift+B` (Mac)
3. Select "Run All"

Access the app:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:7071/api

---

## Development Workflow

### Making Changes

1. **Frontend Changes**:
   - Edit files in `frontend/src/`
   - Vite hot-reloads automatically
   - Check browser console for errors

2. **API Changes**:
   - Edit files in `api/*/index.js`
   - Save file to trigger Functions Core Tools reload
   - Test endpoints using Thunder Client or Postman

3. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

### Testing Authentication Locally

**Without Azure AD B2C:**
1. Comment out authentication checks in `api/shared/auth.js`
2. Mock user data for testing

**With Azure AD B2C:**
1. Create a B2C tenant (see [AZURE_SETUP.md](./AZURE_SETUP.md))
2. Configure `.env` with B2C values
3. Add `http://localhost:3000` to B2C redirect URIs
4. Test sign-in flow

---

## Project Structure

```
budget-tracker/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── config/          # Configuration files
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── public/              # Static assets
│   ├── .env.example         # Environment template
│   └── package.json
│
├── api/                     # Azure Functions API
│   ├── Budgets/            # Budget endpoints
│   ├── Expenses/           # Expense endpoints
│   ├── HealthCheck/        # Health check endpoint
│   ├── shared/             # Shared utilities
│   │   ├── cosmosClient.js # Cosmos DB client
│   │   └── auth.js         # Authentication middleware
│   ├── host.json           # Functions host config
│   └── local.settings.json.example
│
├── infrastructure/          # Azure provisioning scripts
├── docs/                   # Documentation
├── .github/                # GitHub Actions workflows
└── README.md
```

---

## Common Tasks

### Add a New API Endpoint

1. Create new folder in `api/`:
   ```bash
   mkdir api/Income
   ```

2. Create `function.json`:
   ```json
   {
     "bindings": [
       {
         "authLevel": "anonymous",
         "type": "httpTrigger",
         "direction": "in",
         "name": "req",
         "methods": ["get", "post"],
         "route": "income"
       },
       {
         "type": "http",
         "direction": "out",
         "name": "res"
       }
     ]
   }
   ```

3. Create `index.js` with handler logic

4. Test: `http://localhost:7071/api/income`

### Add a New Frontend Page

1. Create component in `frontend/src/pages/`:
   ```jsx
   // Income.jsx
   function Income() {
     return <div>Income Page</div>;
   }
   export default Income;
   ```

2. Add route in `App.jsx`:
   ```jsx
   <Route path="/income" element={<Income />} />
   ```

3. Add navigation link in `Layout.jsx`:
   ```jsx
   <Link to="/income">Income</Link>
   ```

### Add a Database Container

1. Update `api/shared/cosmosClient.js`:
   ```javascript
   let incomeContainer;
   
   function initializeCosmosClient() {
     // ... existing code
     incomeContainer = database.container('Income');
   }
   
   module.exports = {
     // ... existing exports
     getIncomeContainer: () => {
       if (!incomeContainer) initializeCosmosClient();
       return incomeContainer;
     }
   };
   ```

2. Create container in Cosmos DB:
   ```bash
   az cosmosdb sql container create \
     --account-name budget-tracker-cosmos \
     --resource-group budget-tracker-rg \
     --database-name BudgetTrackerDB \
     --name Income \
     --partition-key-path "/userId" \
     --throughput 400
   ```

---

## Debugging

### Frontend Debugging

1. **Browser DevTools**:
   - Press `F12` to open DevTools
   - Check Console tab for errors
   - Use Network tab to inspect API calls
   - Use React DevTools extension

2. **VS Code Debugging**:
   - Install "Debugger for Chrome/Edge" extension
   - Press `F5` to start debugging
   - Set breakpoints in source code

### API Debugging

1. **Console Logging**:
   ```javascript
   context.log('Debug message:', data);
   ```

2. **VS Code Debugging**:
   - Press `F5` in VS Code
   - Select "Attach to Node Functions"
   - Set breakpoints in `index.js` files

3. **View Logs**:
   - Logs appear in terminal where `npm start` is running
   - Check for errors and stack traces

---

## Troubleshooting

### Port Already in Use

**Frontend (port 3000):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

**API (port 7071):**
```bash
# Windows
netstat -ano | findstr :7071
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:7071 | xargs kill
```

### CORS Errors

1. Verify `vite.config.js` proxy is configured
2. Check `local.settings.json` has `"CORS": "*"`
3. Clear browser cache and restart

### Module Not Found

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Authentication Not Working

1. Verify `.env` values match Azure AD B2C
2. Check redirect URI is `http://localhost:3000`
3. Clear browser cookies and local storage
4. Check browser console for MSAL errors

---

## Testing

### Manual Testing

1. **Health Check**:
   ```bash
   curl http://localhost:7071/api/health
   ```

2. **Create Budget** (with auth token):
   ```bash
   curl -X POST http://localhost:7071/api/budgets \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"name":"Monthly Budget","amount":1000}'
   ```

### Future: Automated Tests

- Unit tests: Jest
- Integration tests: Supertest
- E2E tests: Playwright

---

## Next Steps

- Read [AZURE_SETUP.md](./AZURE_SETUP.md) for deployment
- Read [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for configuration
- Start building features!

---

## Useful Commands

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# API
npm start            # Start Functions locally
func host start      # Alternative start command

# Both
npm install          # Install dependencies
npm update           # Update dependencies
```
