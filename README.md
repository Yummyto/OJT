# 🏫 SchoolVault — School Inventory & Borrowing System

A full-stack web application for managing school equipment inventory, borrowing, and booking.

## ⚡ Quick Start

### 1. Set Up Supabase (Free Database)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project — note your **project URL** and **API keys**
3. Go to **SQL Editor** → **New Query** → paste the contents of `database/schema.sql` → click **Run**
   - If `borrow_requests` already existed before the ticket fields were added, run `database/ticket_migration.sql` in a new SQL Editor query as well.
4. Go to **Storage** → **New Bucket** → name it `item-images` → set it to **Public**
5. Go to **Settings** → **API** → copy your:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`  
   - **service_role secret** key → `SUPABASE_SERVICE_KEY`

### 2. Configure Environment

Edit `server/.env` with your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=change-this-to-a-random-string
```

### 3. Install & Run

On Windows, if your user profile path contains `#`, run the project from a path that does not contain that character. Vite may resolve drive aliases back to the original path, so copy the project once to `C:\OJT`:

```powershell
robocopy "C:\Users\PC#3\Desktop\PROJECT HAIL MARY\OJT" "C:\OJT" /E /XD node_modules dist .git
```

Then use these commands:

```powershell
# Terminal 1 — Backend
cd C:\OJT\server
npm install
npm run dev

# Terminal 2 — Frontend
cd C:\OJT\client
npm install
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

### 4. Create Admin Account

1. Open http://localhost:5173/admin/login
2. Click **"First time? Set up admin account"**
3. Enter your name, email, and password
4. You're in!

---

## Features

| Feature | Description |
|---------|-------------|
| **Inventory CRUD** | Add items with images, categories, custom fields |
| **Category Builder** | Create categories with configurable custom fields |
| **Image Upload** | Upload photos to Supabase Storage |
| **Borrow Requests** | Students request → Admin approves → Tracks status |
| **Dashboard** | Stats, recent activity, low stock alerts |
| **Student Portal** | Browse items, submit requests by Student ID |
| **My Tickets** | Look up ticket status by Student ID or ticket number |

---

## Tech Stack

- **Frontend**: React 18 + Vite + React Router
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Auth**: JWT (admin) + Student ID (students)

## Free Deployment

| Service | For | URL |
|---------|-----|-----|
| **Supabase** | Database + Storage | supabase.com |
| **Render** | Backend API | render.com |
| **Vercel** | Frontend | vercel.com |

### Deploy Backend to Render
1. Push code to GitHub
2. Go to render.com → New Web Service → connect repo
3. Root directory: `server`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variables from `.env`

### Deploy Frontend to Vercel
1. Go to vercel.com → Import Project
2. Root directory: `client`
3. Framework preset: Vite
4. Add env variable: `VITE_API_URL` = your Render backend URL + `/api`


cd "C:\Users\PC#3\Desktop\PROJECT HAIL MARY\OJT\server"
npm.cmd install
npm.cmd run dev

cd "C:\Users\PC#3\Desktop\PROJECT HAIL MARY\OJT\client"
npm.cmd install
npm.cmd run dev