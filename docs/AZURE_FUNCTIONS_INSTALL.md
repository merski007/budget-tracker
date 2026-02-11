# Azure Functions Core Tools Installation Issues

## Problem

If you're getting SSL certificate errors when installing via npm:

```
Error: unable to get local issuer certificate
```

This is caused by corporate proxy/firewall settings blocking the binary download.

## Solutions

### Option 1: Microsoft Installer (Easiest)

1. Download the Windows installer:
   - Direct link: https://go.microsoft.com/fwlink/?linkid=2174087
   - Or visit: https://github.com/Azure/azure-functions-core-tools/releases

2. Run the `.msi` installer

3. Verify installation:
   ```powershell
   func --version
   ```

### Option 2: Chocolatey

If you have Chocolatey installed:

```powershell
choco install azure-functions-core-tools
```

### Option 3: Manual Download

1. Go to https://github.com/Azure/azure-functions-core-tools/releases
2. Download `Azure.Functions.Cli.win-x64.<version>.zip`
3. Extract to a folder (e.g., `C:\Program Files\Azure Functions Core Tools`)
4. Add the folder to your PATH environment variable
5. Restart terminal and verify: `func --version`

### Option 4: NPM with SSL Workaround (Not Recommended)

```powershell
# Temporarily disable strict SSL
npm config set strict-ssl false

# Install
npm install -g azure-functions-core-tools@4 --unsafe-perm true

# Re-enable strict SSL
npm config set strict-ssl true
```

## Development Without Azure Functions

You can still develop the frontend without the API:

1. **Mock the API** - Create mock data in frontend
2. **Deploy to Azure** - Azure handles the runtime
3. **Use Static Data** - Test UI with hardcoded data

See [DEVELOPMENT_WITHOUT_API.md](./DEVELOPMENT_WITHOUT_API.md) for details.

## Verify Installation

After installing, verify with:

```powershell
func --version
```

You should see something like:

```
4.x.xxxx
```

## Start the API

Once installed:

```powershell
cd api
npm start
```

This will start the Functions runtime on http://localhost:7071
