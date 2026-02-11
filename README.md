"# Budget Tracker

A personal budget tracking web application built with React and Azure Functions, designed for secure deployment on Azure with user authentication and private data sharing capabilities.

## ✨ Features

- 🔐 **Secure Authentication** - Azure AD B2C integration
- 💰 **Budget Management** - Create and track multiple budgets
- 📊 **Expense Tracking** - Log and categorize expenses
- 📈 **Visual Reports** - Charts and analytics
- 🤝 **Budget Sharing** - Share budgets with other users (view/edit permissions)
- ☁️ **Cloud Deployment** - Fully hosted on Azure
- 🔒 **Secure by Design** - Secrets stored in Azure Key Vault, not in code

## 🏗️ Architecture

### Tech Stack

**Frontend:**

- React 18 with Vite
- React Router for navigation
- Azure MSAL for authentication
- Recharts for data visualization
- Axios for API calls

**Backend:**

- ASP.NET Core 10 Web API
- Azure Cosmos DB (NoSQL database)
- Azure AD B2C (authentication)
- Azure Key Vault (secrets management)
- Swagger/OpenAPI documentation

**Infrastructure:**

- Azure App Service (API hosting)
- Azure Static Web Apps (frontend hosting)
- Application Insights (monitoring)
- GitHub Actions (CI/CD)

### Project Structure

```
budget-tracker/
├── frontend/          # React application
├── BudgetTracker.Api/ # .NET Web API
├── infrastructure/    # Azure provisioning scripts
├── docs/             # Documentation
└── .github/          # GitHub Actions workflows
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Azure subscription
- Azure CLI
- Git

### Local Development

1. **Clone the repository:**

   ```bash
   git clone https://github.com/YOUR_USERNAME/budget-tracker.git
   cd budget-tracker
   ```

2. **Install dependencies:**

   ```bash
   # Frontend
   cd frontend
   npm install

   # API
   cd ../BudgetTracker.Api
   dotnet restore
   ```

3. **Configure environment:**

   ```bash
   # Frontend
   cd frontend
   cp .env.example .env
   # Edit .env with your values

   # API
   cd ../BudgetTracker.Api
   # Edit appsettings.Development.json with your values
   ```

4. **Run locally:**

   ```bash
   # Terminal 1 - Frontend
   cd frontend
   npm run dev

   # Terminal 2 - API
   cd api
   npmBudgetTracker.Api
   dotnet run
   ```

5. **Access the app:**
   - Frontend: http://localhost:3000
   - API: http://localhost:5000
   - Swagger: http://localhost:5000/swagger

## 📚 Documentation

- **[Azure Setup Guide](docs/AZURE_SETUP.md)** - Complete deployment instructions
- **[Local Development](docs/LOCAL_DEVELOPMENT.md)** - Development environment setup
- **[Environment Setup](docs/ENVIRONMENT_SETUP.md)** - Configuration guide

## 🔐 Security

This application follows security best practices:

✅ All secrets stored in Azure Key Vault or GitHub Secrets
✅ `.env` and `local.settings.json` excluded from version control
✅ Managed Identity for Azure service authentication
✅ HTTPS enforced in production
✅ User authentication required for all data access
✅ Row-level security via user IDs in database

**Never commit:**

- `.env` files
- `local.settings.json`
- API keys, secrets, or credentials
- Database connection strings

## 🌐 Deployment

### Automated Deployment

Push to main branch triggers automatic deployment via GitHub Actions:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

### Manual Deployment

1. **Provision Azure resources:**

   ```powershell
   # Windows
   cd infrastructure
   .\provision-azure-resources.ps1

   # Linux/Mac
   cd infrastructure
   chmod +x provision-azure-resources.sh
   ./provision-azure-resources.sh
   ```

2. **Configure GitHub Secrets** (see [Azure Setup Guide](docs/AZURE_SETUP.md))

3. **Push to GitHub** - Deployment happens automatically

## 💰 Cost Estimate

Using Azure Free Tier:

- Static Web Apps: **Free**
- Cosmos DB: **Free tier** (25 GB, 1000 RU/s)
- Key Vault: **~$0.03/10K operations**
- Application Insights: **First 5 GB/month free**

**Estimated monthly cost for personal use: $0-5**

## 🛠️ Development Roadmap

### Phase 1: Setup ✅ (Completed)

- [x] Project structure
- [x] React frontend with authentication
- [x] Azure Functions API
- [x] Security configuration
- [x] Deployment scripts
- [x] Documentation

### Phase 2: Core Features (In Progress)

- [ ] Budget CRUD operations
- [ ] Expense tracking
- [ ] Income tracking
- [ ] Category management
- [ ] Database schema implementation

### Phase 3: UI/UX

- [ ] Dashboard with charts
- [ ] Responsive design
- [ ] Mobile optimization
- [ ] Dark mode

### Phase 4: Advanced Features

- [ ] Budget sharing system
- [ ] Recurring transactions
- [ ] Export to CSV/PDF
- [ ] Email notifications
- [ ] Receipt image uploads

### Phase 5: Polish

- [ ] Unit tests
- [ ] E2E tests
- [ ] Performance optimization
- [ ] Accessibility improvements

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- [Azure Documentation](https://docs.microsoft.com/azure/)
- [React Documentation](https://react.dev/)
- [Azure Functions](https://docs.microsoft.com/azure/azure-functions/)
- [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/)

## 💬 Support

For issues or questions:

- Check the [documentation](docs/)
- Review [troubleshooting guides](docs/LOCAL_DEVELOPMENT.md#troubleshooting)
- Open an issue on GitHub

---

**Built with ❤️ using React and Azure**"
