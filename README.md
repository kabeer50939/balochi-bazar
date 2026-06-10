# Bazar Monorepo - Balochi Doch Local Development

Welcome to the Bazar platform repository! This is a unified codebase (monorepo) running completely locally for testing sales, rentals, and customized tailors/embroidery of Balochi dresses in Gwadar.

## Directory Structure

```
d:/Bazar/
├── apps/
│   ├── backend/             # Node.js + Express + Prisma (SQLite API on Port 5000)
│   ├── web/                 # Next.js Customer Web Application (Port 3000)
│   ├── admin/               # React Vite Admin dashboard (Port 5173)
│   └── mobile/              # React Native Expo Mobile App (for Play Store testing)
├── package.json             # Workspaces workspace configuration
└── README.md                # This file
```

## Setup Instructions

### 1. Prerequisite
Ensure you have **Node.js** (v18 or higher) installed on your system.

### 2. Installation
From the root directory (`d:/Bazar`), run the following command to install dependencies for all projects:
```bash
npm install
```

### 3. Running Applications
You can run individual apps or spin them up together:

- **Run Web, Admin, and Backend together:**
  ```bash
  npm run dev
  ```
- **Run Backend only:**
  ```bash
  npm run dev:backend
  ```
- **Run Customer Web App only:**
  ```bash
  npm run dev:web
  ```
- **Run Admin Dashboard only:**
  ```bash
  npm run dev:admin
  ```
- **Run Mobile App only:**
  ```bash
  npm run dev:mobile
  ```

---
*Developed for Balochi Doch local operations in Gwadar city.*
