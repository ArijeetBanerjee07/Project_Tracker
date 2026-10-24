# Project Tracker (PWA)

A lightweight, minimal, fast, and local-first project and payment tracker designed for phone and desktop.

Built with **Vite + React + TypeScript + Dexie (IndexedDB)**. No UI libraries, no Tailwind, zero tracking or third-party dependencies.

---

## Features

- **Three Dedicated Views**:
  - **Arijeet**: Individual projects and assignments for Arijeet with tailored financial summaries and milestone trackers.
  - **Shared (Middle Tab)**: Joint assignments split proportionally between Arijeet & Priya, with isolated revenue division cards.
  - **Priya**: Individual projects and assignments for Priya with tailored financial summaries and milestone trackers.
- **PostgreSQL & Multi-User Live Sync**:
  - Express + PostgreSQL backend synchronizes all assignments, shared projects, and milestone payment updates in real-time between Arijeet and Priya across their devices.
  - Fast automatic background polling and window-focus sync so Priya and Arijeet always see each other's updates immediately.
- **Milestone Payment Tracking**: Tracks 50% advance and 50% balance (or custom advance percentages), marking advance received and balance received with timestamps.
- **Integer Paise Storage**: All financial calculations are stored strictly as integer paise with odd-paise rounding guarantees (`advance + balance === total`). Formatted using Indian digit grouping (`₹1,00,000`).
- **PWA Ready**: Add to your phone's Home Screen with clean mobile-responsive layout.
- **JSON Data Portability**: Single-click export and import of all records for migration or backup.
- **Clean Architecture**: State & storage abstracted behind `IProjectRepository`, with unified `ApiProjectRepository` and `DexieProjectRepository` options.
- **Light & Dark Theme**: Toggle anytime via top navbar icon or Settings dialog. Conforms to system preference by default.

---

## How to Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure PostgreSQL (in `.env`)
You can use a local PostgreSQL instance:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/project_tracker
```
Or a free hosted PostgreSQL database (e.g. Supabase, Neon, Render, Railway) so Arijeet and Priya can sync anywhere across different phones and computers:
```env
DATABASE_URL=postgresql://postgres.xxxx:your_password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

### 3. Run Frontend & Backend Together
```bash
npm run dev:all
```
* **Frontend**: `http://localhost:5173`
* **API Backend**: `http://localhost:3001` (proxied automatically via `/api`)

Or run them individually:
```bash
# In terminal 1 (backend):
npm run server

# In terminal 2 (frontend):
npm run dev
```

### 4. Run Unit Tests
```bash
npm test
```
Runs Vitest tests covering 50/50 splits, odd amounts rounding, shared revenue division, and overdue logic.

---

## How to Build for Production

```bash
npm run build
```
The compiled, production-ready static assets will be in the `dist/` directory.

To preview the production build locally:
```bash
npm run preview
```

---

## How to Install on a Phone (PWA)

1. **Host or Expose the App**:
   - Host the `dist/` build on any static hosting (such as Cloudflare Pages, Vercel, Netlify, or your local LAN using `npm run dev -- --host`).
2. **On iPhone (Safari)**:
   - Open the app URL in Safari.
   - Tap the **Share** button (box with an arrow pointing up) at the bottom.
   - Scroll down and tap **"Add to Home Screen"**.
   - Tap **Add**. The app will now launch full-screen like a native app and operate offline.
3. **On Android (Chrome / Brave)**:
   - Open the app URL in Chrome.
   - Tap the three dots menu in the top right.
   - Tap **"Add to Home Screen"** or **"Install app"**.
   - Tap **Install**.

---

## How to Export & Import Data (Backup / Migration)

### Export Data
1. Click or tap the **Settings** gear icon in the top right corner.
2. Under **Local Storage & Data Portability**, click **"↓ Export JSON Backup"**.
3. A file named `project_tracker_backup_YYYY-MM-DD.json` will be saved to your device.

### Import Data
1. Click the **Settings** gear icon.
2. Click **"↑ Import JSON Backup"** and select your `.json` backup file.
3. A confirmation dialog will appear warning that importing will replace local records.
4. Click **"Yes, Overwrite & Import"**. The app will immediately load the restored projects and settings.
