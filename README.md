# Body Metrics Tracker (Free Personal App)

Single-user local web app for tracking:
- Weight
- Body fat percentage
- Food intake
- Exercise and calories burned
- Sleep quality
- Daily/recent log feed with edit and delete controls
- Goal trajectory and rule-based coaching insights

This implementation is **100% free**:
- No OpenAI API
- No paid APIs
- Manual logging only
- Optional free USDA API key + OpenFoodFacts fallback for nutrition lookup

It can run both:
- Locally on your machine
- On Vercel (public internet URL)

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- SQLite (`better-sqlite3`) + Drizzle ORM
- Recharts for dashboard visuals
- Vitest + Playwright test scaffolding

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Optionally set `USDA_API_KEY` in `.env.local` for richer nutrition search.

4. Start dev server:

```bash
npm run dev
```

For iPhone access over same Wi-Fi:

```bash
npm run dev:lan
```

Then open `http://<YOUR_LAPTOP_IP>:3000`.

## Deploy to Vercel

1. Initialize git and commit:

```bash
git init -b main
git add .
git commit -m "Initial commit"
```

2. Create a GitHub repo and push:

```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

3. In Vercel:
- Import the GitHub repo
- Keep framework preset as Next.js
- Add env vars:
  - `USDA_API_KEY` (optional)
  - `DB_FILE_PATH` (optional; defaults to `/tmp/body-tracker.db` on Vercel runtime)

4. Deploy and open the generated Vercel URL.

## Scripts

- `npm run dev` - local dev
- `npm run dev:lan` - LAN host for iPhone access
- `npm run build` - production build
- `npm run start` - production server on LAN host
- `npm run test` - unit/integration tests
- `npm run test:e2e` - Playwright tests
- `npm run typecheck` - TypeScript checks

## API Endpoints

- `POST /api/logs/food`
- `POST /api/logs/exercise`
- `POST /api/logs/sleep`
- `POST /api/logs/body`
- `GET /api/nutrition/search?query=...`
- `GET /api/dashboard?range=7d|30d|90d`
- `POST /api/reports/generate?period=daily|weekly`
- `GET /api/reports`
- `POST /api/export`
- `POST /api/import`
- `GET/POST /api/goals`
- `GET/POST /api/profile`

## Notes

- Data is stored in `./data/app.db` by default (local).
- On Vercel runtime, default DB path is `/tmp/body-tracker.db` (temporary filesystem).
- Export files are written to `./exports`.
- PWA shell is enabled with a basic service worker.
