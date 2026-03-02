# Body Metrics Tracker (Free Personal App)

Single-user web app for tracking:
- Weight
- Body fat percentage
- Food intake
- Exercise and calories burned
- Sleep quality
- Daily/recent log feed with edit and delete controls
- Goal trajectory and rule-based coaching insights

## Free and Local-First

This implementation is **100% free**:
- No OpenAI API
- No paid APIs
- Manual logging only
- Optional free USDA API key + OpenFoodFacts fallback for nutrition lookup

Primary storage is **local on the device/browser** using IndexedDB.
- Your logs stay on that device/browser profile.
- Data does not sync automatically between devices.
- Use export/import to back up or move data between devices.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- IndexedDB (browser local storage)
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

1. Push this repo to GitHub.
2. In Vercel:
- Import the GitHub repo
- Keep framework preset as Next.js
- Add env var `USDA_API_KEY` (optional but recommended for better nutrition lookup)
3. Deploy and open the generated Vercel URL.

Important:
- Even on Vercel, logs/goals/profile are stored in each user's browser (IndexedDB), not on the server.
- If you open the app in a different browser/device, it starts with a fresh local dataset until you import data.

## Scripts

- `npm run dev` - local dev
- `npm run dev:lan` - LAN host for iPhone access
- `npm run build` - production build
- `npm run start` - production server on LAN host
- `npm run test` - unit/integration tests
- `npm run test:e2e` - Playwright tests
- `npm run typecheck` - TypeScript checks

## Data and Backups

- Use **Settings -> Export Data (JSON/CSV)** for backups.
- Use **Settings -> Import Data** to restore or migrate to another device.
- Clearing site data in your browser will remove local app data.

## API Usage

- `GET /api/nutrition/search?query=...` is used for nutrition lookup.
- Local logging, reports, goals, and dashboard rendering run from IndexedDB in the browser.
