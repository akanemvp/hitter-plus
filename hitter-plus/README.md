# Hitter+ — Setup Guide

Live baseball analytics app. Auto-updates daily from Statcast via pybaseball → Supabase.
Switches to 2026 data automatically on March 25, 2026.

---

## Prerequisites
- GitHub account (you have this)
- Vercel account (you have this)
- Supabase account — sign up free at https://supabase.com

---

## Step 1 — Supabase Setup

1. Go to https://supabase.com → New Project
2. Name it `hitter-plus`, pick a region close to you, set a password
3. Wait ~2 minutes for it to provision

### Create the database tables
4. In your project: go to **SQL Editor → New Query**
5. Paste the entire contents of `scraper/supabase_schema.sql`
6. Click **Run**

### Get your API keys
7. Go to **Project Settings → API**
8. Copy:
   - **Project URL** → this is your `SUPABASE_URL`
   - **anon / public key** → this is your `VITE_SUPABASE_ANON_KEY` (for the frontend)
   - **service_role / secret key** → this is your `SUPABASE_SERVICE_KEY` (for the scraper — keep secret!)

---

## Step 2 — GitHub Setup

1. Create a new repo at https://github.com/new
   - Name: `hitter-plus`
   - Private or public — your choice
   - Do NOT initialize with README (we have our own files)

2. Push this project:
```bash
cd hitter-plus
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hitter-plus.git
git push -u origin main
```

### Add GitHub Secrets (for the scraper)
3. In your repo: **Settings → Secrets and variables → Actions → New repository secret**
4. Add two secrets:
   - `SUPABASE_URL` → your Project URL from Step 1
   - `SUPABASE_SERVICE_KEY` → your service_role key from Step 1

---

## Step 3 — Load 2025 Data (one-time)

The scraper needs to load the full 2025 season once. This takes ~20-30 minutes.

1. Go to your GitHub repo → **Actions** tab
2. Click **Daily Statcast Scrape** → **Run workflow** → **Run workflow**
3. Watch the logs — it will fetch the full 2025 season and load it into Supabase

After this runs once, subsequent daily runs will only fetch the previous day's data (2026 season only).

---

## Step 4 — Vercel Deployment

1. Go to https://vercel.com → **New Project**
2. Import your GitHub repo
3. Framework preset: **Vite**
4. **Environment Variables** — add:
   - `VITE_SUPABASE_URL` → your Project URL
   - `VITE_SUPABASE_ANON_KEY` → your anon key
5. Click **Deploy**

Vercel will auto-deploy on every push to `main`.

---

## How it works after setup

| What | When |
|---|---|
| Daily scraper runs | Every day at 8am ET (GitHub Actions) |
| App auto-refreshes | On page load (fetches latest from Supabase) |
| 2026 season activates | March 25, 2026 — app automatically switches |
| PA minimum ramps up | 2026: 30 PA (week 1) → 50 PA (weeks 2-3) → 100 PA (week 4+) |

---

## Local Development

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase credentials in .env.local
npm run dev
```

---

## CSV Upload (fallback)

The app still supports manual CSV upload if Supabase credentials aren't set.
Useful for testing or if you want to analyze a custom dataset.
