# Development Without API

Guide for developing the frontend without running the Azure Functions API locally.

## Why Would You Do This?

- Azure Functions Core Tools installation issues
- Testing UI/UX changes only
- Working on static pages (login, about, etc.)
- No database access needed yet

## Quick Start

### 1. Create Mock API Responses

Create a mock API service in the frontend:

**Create `frontend/src/services/mockApi.js`:**

```javascript
// Mock API for development without backend

const mockBudgets = [
  {
    id: "1",
    name: "Monthly Budget",
    amount: 3000,
    spent: 1250,
    userId: "mock-user",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Vacation Fund",
    amount: 2000,
    spent: 500,
    userId: "mock-user",
    createdAt: new Date().toISOString(),
  },
];

const mockExpenses = [
  {
    id: "1",
    budgetId: "1",
    description: "Groceries",
    amount: 150,
    category: "Food",
    date: new Date().toISOString(),
    userId: "mock-user",
  },
  {
    id: "2",
    budgetId: "1",
    description: "Gas",
    amount: 45,
    category: "Transportation",
    date: new Date().toISOString(),
    userId: "mock-user",
  },
];

export const mockApi = {
  budgets: {
    getAll: async () => {
      await delay(500); // Simulate network delay
      return mockBudgets;
    },
    create: async (budget) => {
      await delay(500);
      const newBudget = {
        ...budget,
        id: Date.now().toString(),
        spent: 0,
        createdAt: new Date().toISOString(),
      };
      mockBudgets.push(newBudget);
      return newBudget;
    },
  },
  expenses: {
    getAll: async () => {
      await delay(500);
      return mockExpenses;
    },
    create: async (expense) => {
      await delay(500);
      const newExpense = {
        ...expense,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      mockExpenses.push(newExpense);
      return newExpense;
    },
  },
  health: async () => {
    return { status: "mock", timestamp: new Date().toISOString() };
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### 2. Disable Authentication (Temporarily)

**Update `frontend/src/App.jsx`:**

```javascript
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// Comment out MSAL
// import { MsalProvider } from '@azure/msal-react'
// import { msalInstance } from './config/authConfig'
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
  return (
    // Disable MSAL for now
    // <MsalProvider instance={msalInstance}>
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="budgets" element={<div>Budgets Page</div>} />
          <Route path="expenses" element={<div>Expenses Page</div>} />
        </Route>
      </Routes>
    </Router>
    // </MsalProvider>
  );
}

export default App;
```

**Update `frontend/src/components/Layout.jsx`:**

```javascript
import { Outlet, Link } from "react-router-dom";
// Comment out auth
// import { useMsal, useIsAuthenticated } from '@azure/msal-react'

function Layout() {
  // Mock auth for now
  const mockUser = { name: "Mock User" };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>Budget Tracker</h1>
        </div>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/budgets">Budgets</Link>
          <Link to="/expenses">Expenses</Link>
        </div>
        <div className="nav-actions">
          <span>Hello, {mockUser.name}</span>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
```

### 3. Use Mock Data in Dashboard

**Update `frontend/src/pages/Dashboard.jsx`:**

```javascript
import { useState, useEffect } from "react";
import { mockApi } from "../services/mockApi";

function Dashboard() {
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [budgetsData, expensesData] = await Promise.all([
        mockApi.budgets.getAll(),
        mockApi.expenses.getAll(),
      ]);
      setBudgets(budgetsData);
      setExpenses(expensesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const remaining = totalBudget - totalSpent;

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container">
      <h2>Dashboard</h2>
      <div className="dashboard-grid">
        <div className="card">
          <h3>Total Budget</h3>
          <p className="metric">${totalBudget.toFixed(2)}</p>
        </div>
        <div className="card">
          <h3>Total Spent</h3>
          <p className="metric">${totalSpent.toFixed(2)}</p>
        </div>
        <div className="card">
          <h3>Remaining</h3>
          <p className="metric">${remaining.toFixed(2)}</p>
        </div>
      </div>
      <div className="recent-activity">
        <h3>Your Budgets</h3>
        {budgets.map((budget) => (
          <div
            key={budget.id}
            style={{ padding: "10px", margin: "5px", border: "1px solid #ccc" }}
          >
            <strong>{budget.name}</strong>: ${budget.spent} / ${budget.amount}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
```

### 4. Run Frontend Only

```powershell
cd frontend
npm run dev
```

Access at: http://localhost:3000

## What You Can Do

✅ Design the UI
✅ Test routing and navigation  
✅ Build components
✅ Work on styling
✅ Create forms
✅ Test user interactions

❌ Real authentication
❌ Database operations
❌ Production deployment testing

## When API Is Ready

1. Install Azure Functions Core Tools (see [AZURE_FUNCTIONS_INSTALL.md](./AZURE_FUNCTIONS_INSTALL.md))
2. Uncomment the auth code
3. Replace `mockApi` with real API calls
4. Start both frontend and API

## Example: Real API Integration

**`frontend/src/services/api.js`:**

```javascript
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:7071/api";

export const api = {
  budgets: {
    getAll: async () => {
      const response = await axios.get(`${API_BASE_URL}/budgets`);
      return response.data;
    },
    create: async (budget) => {
      const response = await axios.post(`${API_BASE_URL}/budgets`, budget);
      return response.data;
    },
  },
};
```

Then swap `mockApi` for `api` when ready.

## Tips

- Keep mock data realistic
- Test edge cases (empty lists, errors)
- Build the UI first, connect later
- Use browser localStorage for persistence

---

**This approach lets you make progress on the frontend while resolving the Azure Functions installation issues!**
