# Budget Tracker

A multi-user, month-based shared budget tracker built with React + Vite (frontend)
and Azure Functions + Cosmos DB (backend), deployed via Azure Static Web Apps with
Google sign-in.

Each **budget** is shared by one or more people (owner / editor / viewer). For every
calendar month you track your checking balance, expected income, fixed expenses,
credit-card payments and a shared savings balance — and the app derives how much you
have left to spend per day and per week.

---

## Features

- **Google sign-in** via Azure Static Web Apps built-in authentication.
- **Multiple budgets per user**, each with role-based access:
  - `owner` — full control, can invite/remove members and delete the budget
  - `editor` — can edit monthly data and settings
  - `viewer` — read-only
- **Invites & members** — owners generate invite codes; invitees accept to join a
  shared budget.
- **Month-by-month tracking** — navigate between months; each month stores its own
  checking balance, income, fixed expenses and credit-card data.
- **Reusable templates** — configure master income / expenses / credit cards once in
  **Settings**; apply them to any month.
- **Derived allowances** — automatically computes remaining balance and daily / weekly
  spending allowance for the rest of the month.
- **Shared savings balance** — stored on the server (in the budget's settings doc) so
  every member sees the same value.
- **Burn-down chart** — visualises remaining balance over the current month.
- **Optimistic concurrency** — monthly data and settings carry an `_etag`; concurrent
  edits by different members are detected and surfaced as a conflict (rather than one
  edit silently overwriting another).

---

## Architecture

```
budget-tracker/
├── src/                         # React + Vite frontend (SPA)
│   ├── components/
│   │   ├── BudgetListPage.jsx    # Pick / create a budget
│   │   ├── MonthNav.jsx          # Month switcher
│   │   ├── IncomePanel.jsx       # Checking balance + income sources
│   │   ├── FixedExpensesPanel.jsx
│   │   ├── CreditCardsPanel.jsx
│   │   ├── SavingsPanel.jsx
│   │   ├── DerivedCalcsPanel.jsx # Daily / weekly allowance
│   │   ├── BurnDownChart.jsx     # Remaining-balance burn-down (current month)
│   │   ├── SettingsPage.jsx      # Master templates, members, invites, savings
│   │   └── InvitePage.jsx        # Accept an invite code
│   ├── api/                      # Frontend API client wrappers (fetch)
│   ├── utils/budgetUtils.js      # Pure budget math (allowances, burn-down series)
│   ├── App.jsx                   # App shell, routing, load/save orchestration
│   └── main.jsx
├── api/                          # Azure Functions (Node.js v4 programming model)
│   └── src/
│       ├── functions/
│       │   ├── budgets.js        # Budgets CRUD + members
│       │   ├── budget.js         # Per-month GET/PUT
│       │   ├── settings.js       # Per-budget settings (templates + savings)
│       │   └── invites.js        # Create / accept / revoke invites
│       ├── auth.js               # Identity + role checks, user-index helpers
│       ├── concurrency.js        # Optimistic (etag) write helper
│       ├── cosmos.js             # Cosmos DB client + container helpers
│       └── defaults.js           # Default (blank) templates for new budgets
├── staticwebapp.config.json      # Auth (Google) + route protection
└── vite.config.js
```

**Data flow**: React SPA → `/api/*` (protected, `authenticated` only) → Azure
Functions → Cosmos DB. `localStorage` is used as an offline cache for templates and
the savings balance.

### Cosmos DB containers

| Container     | Partition key | Contents |
|---------------|---------------|----------|
| `budget-data` | `/budgetId`   | All documents for a budget, co-located: metadata (`meta-{budgetId}`), monthly data (`{budgetId}-{year}-{MM}`), settings (`settings-{budgetId}`) and invites. |
| `user-index`  | `/userId`     | One doc per user (`user-{userId}`) listing the budgets they belong to and their role. |

> A legacy `budget-months` container (partitioned by `/userId`) may still exist from
> older single-user deployments; it is read once to migrate data into `budget-data`
> on first access and is otherwise unused.

A monthly document looks roughly like:

```json
{
  "id": "{budgetId}-2024-06",
  "budgetId": "...",
  "year": 2024,
  "month": 6,
  "checkingBalance": 1500,
  "income":   [{ "id": "...", "name": "Paycheck", "amount": 2000, "received": true }],
  "fixedExpenses": [{ "id": "...", "name": "Rent", "amount": 1200 }],
  "paidExpenseIds": ["..."],
  "creditCards": [{ "id": "...", "name": "Visa", "balance": 300, "payment": 100 }]
}
```

The shared **savings balance** and the master templates live in the settings document
(`settings-{budgetId}`), not in each month.

---

## API routes

All routes are prefixed with `/api` and require an authenticated caller. Role
requirements are enforced per route.

| Method | Route | Purpose |
|--------|-------|---------|
| GET    | `/budgets` | List the caller's budgets |
| POST   | `/budgets` | Create a budget (caller becomes owner) |
| PATCH  | `/budgets/{budgetId}` | Rename a budget |
| DELETE | `/budgets/{budgetId}` | Delete a budget (owner only) |
| GET    | `/budgets/{budgetId}/members` | List members |
| DELETE | `/budgets/{budgetId}/members/{memberId}` | Remove a member (owner only) |
| GET    | `/budgets/{budgetId}/months/{year}/{month}` | Get a month's data |
| PUT    | `/budgets/{budgetId}/months/{year}/{month}` | Save a month's data (etag-checked) |
| GET    | `/budgets/{budgetId}/settings` | Get templates + savings balance |
| PUT    | `/budgets/{budgetId}/settings` | Save templates + savings (etag-checked) |
| POST   | `/budgets/{budgetId}/invites` | Create an invite code (owner only) |
| GET    | `/invites/{code}` | Look up an invite |
| POST   | `/invites/{code}/accept` | Accept an invite and join the budget |
| DELETE | `/budgets/{budgetId}/invites/{code}` | Revoke an invite (owner only) |

The month and settings `PUT` endpoints implement optimistic concurrency: send the
`_etag` you last read, and the server returns `409 { conflict: true, current: ... }`
if someone else changed the document in the meantime.

---

## Local Development

### Prerequisites
- Node.js 18+
- [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local)
- An Azure Cosmos DB account (NoSQL API) — local or in the cloud

### 1. Install dependencies

```bash
npm install            # frontend
cd api && npm install  # API
```

### 2. Configure local Cosmos DB settings

Edit `api/local.settings.json` and set `COSMOS_ENDPOINT` and `COSMOS_KEY` (and
optionally `COSMOS_DATABASE`, default `budget-tracker`). The `budget-data` and
`user-index` containers are created automatically on first use.

> Note: running `func start` locally bypasses the SWA auth proxy, so the API falls
> back to an `anonymous` identity. To exercise multi-user behaviour end-to-end, deploy
> to Static Web Apps where Google sign-in injects the real identity headers.

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

### Build

```bash
npm run build
```

---

## Deploy to Azure

### Step 1 — Push to GitHub

```bash
git add .
git commit -m "Initial commit"
gh repo create budget-tracker --public --source=. --push
```

### Step 2 — Create Azure Cosmos DB

1. Go to the [Azure Portal](https://portal.azure.com).
2. Create a **Cosmos DB** account (choose **NoSQL API**, enable **Free Tier**).
3. Note the **URI** and **Primary Key** from the Keys blade.

### Step 3 — Create a Google OAuth client

1. In the [Google Cloud console](https://console.cloud.google.com), create an OAuth
   2.0 Client ID (Web application).
2. Add your Static Web App's `/.auth/login/google/callback` URL as an authorized
   redirect URI.
3. Note the **Client ID** and **Client Secret**.

### Step 4 — Create Azure Static Web Apps

1. In the Azure Portal (or VS Code Azure extension), create a new **Static Web App**.
2. Connect it to your GitHub repo.
3. Set the build details:
   - **App location**: `/`
   - **API location**: `api`
   - **Output location**: `dist`
4. Azure commits a GitHub Actions workflow to your repo automatically.

### Step 5 — Add application settings to SWA

In the Static Web App resource → **Configuration** → **Application settings**, add:

| Name | Value |
|------|-------|
| `COSMOS_ENDPOINT` | `https://YOUR-ACCOUNT.documents.azure.com:443/` |
| `COSMOS_KEY` | `your-primary-key` |
| `COSMOS_DATABASE` | `budget-tracker` |
| `GOOGLE_PROVIDER_AUTHENTICATION_ID` | your Google OAuth Client ID |
| `GOOGLE_PROVIDER_AUTHENTICATION_SECRET` | your Google OAuth Client Secret |

### Step 6 — Deploy

Push any commit to `main` — the GitHub Actions workflow builds and deploys
automatically.

---

## Future Improvements
- [ ] Automated tests (unit tests for `budgetUtils`, integration tests for the API)
- [ ] CSV / spreadsheet export
- [ ] Spending categories and category-level budgets
- [ ] Trend charts across multiple months
- [ ] Email notifications for invites
