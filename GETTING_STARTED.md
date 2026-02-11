# Getting Started with Budget Tracker

Welcome! This guide will help you get your Budget Tracker app up and running.

## 🎯 What We've Built

Phase 1 setup is complete! You now have:

✅ Complete project structure
✅ React frontend with authentication
✅ Azure Functions API backend
✅ Security configurations (.gitignore)
✅ Environment templates
✅ Azure provisioning scripts
✅ GitHub Actions CI/CD workflow
✅ Comprehensive documentation

## 🚦 Next Steps

### Step 1: Install Dependencies

**Frontend:**
```powershell
cd frontend
npm install
```

**API:**
```powershell
cd api
npm install
```

### Step 2: Choose Your Path

You have two options for development:

#### Option A: Local Development Only (Recommended for Testing)

**Pros:** No Azure account needed initially, faster iteration
**Cons:** Limited authentication testing

1. Create mock environment files:
   ```powershell
   cd frontend
   copy .env.example .env
   ```

2. Update `.env` with placeholder values (keep defaults for now)

3. Run the app locally:
   ```powershell
   # Terminal 1
   cd frontend
   npm run dev

   # Terminal 2
   cd api
   npm start
   ```

4. Access at http://localhost:3000

#### Option B: Full Azure Setup (Production-Ready)

**Pros:** Complete authentication, production environment
**Cons:** Requires Azure account (free tier available)

Follow the complete guide: [docs/AZURE_SETUP.md](docs/AZURE_SETUP.md)

### Step 3: Initialize Git (If Not Already Done)

```powershell
git init
git add .
git commit -m "Initial commit - Phase 1 complete"
```

### Step 4: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new **public** repository named `budget-tracker`
3. **DO NOT** initialize with README (we already have one)
4. Push your code:
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/budget-tracker.git
   git branch -M main
   git push -u origin main
   ```

## 📋 Pre-Deployment Checklist

Before deploying to Azure, verify:

- [ ] `.env` is in `.gitignore` (already done)
- [ ] `local.settings.json` is in `.gitignore` (already done)
- [ ] No secrets committed to Git
- [ ] GitHub repository is created
- [ ] Azure subscription is active (if deploying)

## 🎓 Learning Resources

### Understanding the Stack

**React + Vite:**
- [React Tutorial](https://react.dev/learn)
- [Vite Guide](https://vitejs.dev/guide/)

**Azure Functions:**
- [Azure Functions Quickstart](https://docs.microsoft.com/azure/azure-functions/functions-get-started)
- [Local Development](https://docs.microsoft.com/azure/azure-functions/functions-develop-local)

**Azure AD B2C:**
- [What is Azure AD B2C?](https://docs.microsoft.com/azure/active-directory-b2c/overview)
- [MSAL.js Tutorial](https://docs.microsoft.com/azure/active-directory/develop/tutorial-v2-javascript-spa)

**Cosmos DB:**
- [Cosmos DB Introduction](https://docs.microsoft.com/azure/cosmos-db/introduction)
- [SQL API Tutorial](https://docs.microsoft.com/azure/cosmos-db/sql-query-getting-started)

## 🔍 Project Tour

### Frontend Structure

```
frontend/src/
├── components/
│   └── Layout.jsx          # Navigation and layout wrapper
├── pages/
│   ├── Dashboard.jsx       # Main dashboard
│   └── Login.jsx           # Login page
├── config/
│   └── authConfig.js       # Azure AD B2C configuration
├── App.jsx                 # Route definitions
└── main.jsx               # Application entry point
```

### API Structure

```
api/
├── Budgets/
│   ├── function.json       # HTTP trigger config
│   └── index.js           # Budget endpoints logic
├── Expenses/
│   ├── function.json
│   └── index.js           # Expense endpoints logic
├── HealthCheck/
│   ├── function.json
│   └── index.js           # Health check endpoint
└── shared/
    ├── cosmosClient.js    # Database connection
    └── auth.js            # Authentication middleware
```

## 🛠️ Development Tips

### VS Code Extensions (Recommended)

Install these for the best experience:
- Azure Functions
- Azure Static Web Apps
- ESLint
- Prettier
- Azure Account
- GitHub Pull Requests

### Useful Commands

```powershell
# Frontend
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build

# API
npm start               # Start Functions locally

# View project structure
tree /F /A             # Windows
ls -R                  # Linux/Mac
```

### Hot Tips

1. **Save Often**: The dev servers auto-reload on file changes
2. **Check Console**: Browser DevTools (F12) shows errors
3. **Use Logs**: `console.log()` is your friend during development
4. **Read Errors**: Error messages usually tell you exactly what's wrong
5. **Commit Frequently**: Small, focused commits are easier to manage

## 🐛 Common Issues

### "Port 3000 is already in use"

Something else is using port 3000. Either:
- Close the other app
- Change the port in `vite.config.js` (change `port: 3000` to `port: 3001`)

### "Module not found"

You haven't installed dependencies:
```powershell
cd frontend
npm install
```

### "Cannot find Azure Functions Core Tools"

Install Azure Functions Core Tools:
```powershell
npm install -g azure-functions-core-tools@4
```

## 🎯 What's Next?

After getting the app running locally, you can:

1. **Explore the code** - Start with `frontend/src/App.jsx`
2. **Test the API** - Visit http://localhost:7071/api/health
3. **Make changes** - Try updating the dashboard
4. **Deploy to Azure** - Follow [docs/AZURE_SETUP.md](docs/AZURE_SETUP.md)
5. **Start Phase 2** - Build out the budget features!

## 💡 Ideas for Customization

Before diving into Phase 2, consider:

- What budget features are most important to you?
- Do you want shared budgets or only personal?
- What kind of reports do you need?
- Mobile-first or desktop-first design?
- Dark mode or light mode?

## 📞 Need Help?

- Documentation: Check [docs/](docs/) folder
- Issues: Common problems in [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md#troubleshooting)
- Learning: See resources above

---

**Ready to start? Run the install commands and fire up the dev servers!** 🚀
