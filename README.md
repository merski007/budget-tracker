# Budget Tracker

A simple budget tracker built with React + Vite (frontend) and Azure Functions + Cosmos DB (backend), deployed via Azure Static Web Apps.

---

## Architecture

```
budget-tracker/
├── src/                    # React + Vite frontend
│   ├── components/
│   │   ├── EntryForm.jsx   # Add new income/expense entries
│   │   ├── EntryList.jsx   # Display all entries
│   │   └── Summary.jsx     # Balance summary cards
│   ├── App.jsx
│   └── main.jsx
├── api/                    # Azure Functions (Node.js v4)
│   ├── src/
│   │   ├── functions/
│   │   │   └── entries.js  # GET /api/entries, POST /api/entries, DELETE /api/entries/{id}
│   │   └── cosmos.js       # Cosmos DB client helper
│   ├── host.json
│   └── local.settings.json # Local dev secrets (gitignored)
├── staticwebapp.config.json
└── vite.config.js
```

**Data flow**: React SPA → `/api/*` → Azure Functions → Cosmos DB  
Offline fallback: `localStorage` is used when the API is unreachable.

---

## Local Development

### Prerequisites
- Node.js 18+
- [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local)

### 1. Install dependencies

```bash
npm install          # frontend
cd api && npm install # API
```

### 2. Configure local Cosmos DB settings

Edit `api/local.settings.json` and fill in your `COSMOS_ENDPOINT` and `COSMOS_KEY`.  
(The app falls back to `localStorage` automatically if the API is unreachable.)

### 3. Run locally

In one terminal:
```bash
cd api && func start
```

In another terminal:
```bash
npm run dev
```

Open http://localhost:5173

---

## Deploy to Azure

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create budget-tracker --public --source=. --push
# or use the GitHub website to create a repo and follow the push instructions
```

### Step 2 — Create Azure Cosmos DB

1. Go to the [Azure Portal](https://portal.azure.com)
2. Create a **Cosmos DB** account (choose **NoSQL API**, enable **Free Tier**)
3. Note the **URI** and **Primary Key** from the Keys blade

### Step 3 — Create Azure Static Web Apps

1. In the Azure Portal (or VS Code Azure extension), create a new **Static Web App**
2. Connect it to your GitHub repo
3. Set the build details:
   - **App location**: `/`
   - **API location**: `api`
   - **Output location**: `dist`
4. Azure will commit a GitHub Actions workflow to your repo automatically

### Step 4 — Add Cosmos DB secrets to SWA

In the Static Web App resource → **Configuration** → **Application settings**, add:

| Name | Value |
|------|-------|
| `COSMOS_ENDPOINT` | `https://YOUR-ACCOUNT.documents.azure.com:443/` |
| `COSMOS_KEY` | `your-primary-key` |
| `COSMOS_DATABASE` | `budget-tracker` |
| `COSMOS_CONTAINER` | `entries` |

### Step 5 — Deploy

Push any commit to `main` — the GitHub Actions workflow deploys automatically.

---

## Future Improvements
- [ ] Authentication (Azure Static Web Apps built-in auth)
- [ ] Date filtering and charts
- [ ] Categories management
- [ ] Monthly budget limits
- [ ] Export to CSV
