# Wyatt Family — alanwyatt.com

A full-stack family genealogy and photo archive site built with **Vue 3** (frontend) and **ASP.NET Core 8** (backend).

---

## Project Structure

```
wyatt-family/
├── frontend/        # Vue 3 + Vite SPA
└── backend/         # ASP.NET Core 8 Web API
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| .NET SDK | 8.0+ |
| SQL Server | 2019+ or Azure SQL |
| Azure Storage Account | (or Azurite for local dev) |

---

## Quick Start

### 1. Clone & configure

```bash
git clone https://github.com/YOUR_USERNAME/wyatt-family.git
cd wyatt-family
```

### 2. Backend setup

```bash
cd backend/WyattFamily.Api

# Copy and edit settings
cp appsettings.Development.example.json appsettings.Development.json
# Fill in: connection string, JWT secret, Azure Blob, email settings

# Restore packages
dotnet restore

# Apply migrations and seed the DB
dotnet ef database update

# Run the API (http://localhost:5000)
dotnet run
```

### 3. Frontend setup

```bash
cd frontend

# Copy and edit env
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:5000

# Install and run
npm install
npm run dev
# Runs at http://localhost:5173
```

---

## Default Admin Account

After running `dotnet ef database update`, a seed admin account is created:

- **Email:** `admin@alanwyatt.com`
- **Password:** `Admin@Wyatt2026!`

> Change this immediately in production.

---

## Key Features

- Public site with per-item private flag
- Photo & video albums with slideshow viewer
- Family tree (GEDCOM import)
- Scanned document archive
- Rich-text stories
- Member self-registration with admin approval
- Member content submission queue
- Comments on artifacts
- Donation flow (Stripe-ready)
- Black & gold theme with Wyatt crest and Old English display font

---

## Deployment

### Frontend — Azure Static Web Apps

```bash
cd frontend
npm run build
# Deploy dist/ to Azure Static Web Apps
```

### Backend — Azure App Service

```bash
cd backend/WyattFamily.Api
dotnet publish -c Release -o ./publish
# Deploy ./publish to Azure App Service (Linux, .NET 8)
```

### Environment Variables (Production)

Set these in Azure App Service → Configuration:

```
ConnectionStrings__DefaultConnection=<azure-sql-connection-string>
Jwt__Secret=<32-char-secret>
Jwt__Issuer=https://alanwyatt.com
Jwt__Audience=https://alanwyatt.com
Azure__BlobStorage__ConnectionString=<storage-connection-string>
Azure__BlobStorage__PublicContainer=media-public
Azure__BlobStorage__PrivateContainer=media-private
Email__SmtpHost=<smtp-host>
Email__SmtpPort=587
Email__FromAddress=noreply@alanwyatt.com
Email__Username=<smtp-user>
Email__Password=<smtp-password>
Stripe__SecretKey=<stripe-secret>
Stripe__WebhookSecret=<stripe-webhook-secret>
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3, Vite, Pinia, Vue Router |
| UI Theme | Custom CSS, UnifrakturMaguntia (Google Fonts) |
| Backend | ASP.NET Core 8 Web API |
| Auth | ASP.NET Core Identity + JWT |
| ORM | Entity Framework Core 8 |
| Database | SQL Server / Azure SQL |
| Storage | Azure Blob Storage |
| Email | SMTP (configurable — SendGrid, Azure Comms) |
| Payments | Stripe |
| CI/CD | GitHub Actions (workflows included) |

---

## GitHub Actions

Two workflows are included in `.github/workflows/`:

- `frontend.yml` — builds and deploys Vue SPA to Azure Static Web Apps on push to `main`
- `backend.yml` — builds, tests, and deploys API to Azure App Service on push to `main`

Fill in the secrets in your GitHub repository settings:
- `AZURE_STATIC_WEB_APPS_API_TOKEN`
- `AZURE_WEBAPP_PUBLISH_PROFILE`
