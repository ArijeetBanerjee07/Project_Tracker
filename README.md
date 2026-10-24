# Project Tracker (PWA)

A minimal, fast, multi-user project and payment milestone tracker designed for desktop and mobile. Built with **React 19 + TypeScript + Vite + PostgreSQL (Neon)**.

🔗 **Live Production Deployment**: [https://project-tracker-seven-phi.vercel.app/](https://project-tracker-seven-phi.vercel.app/)

---

## 🔐 Access Credentials

To access the workspace on any device:
* **Username**: `Ariya0703`
* **Password**: `aripriya`

---

## ✨ Features

- **🌐 Live Cloud Database (Neon PostgreSQL)**:
  - Real-time synchronization across devices so **Arijeet** and **Priya** both see immediate live updates for projects, deadlines, and milestone payments.
  - Automatic background polling and window-focus sync keep both partners synchronized anywhere.
- **👥 Three Dedicated Workspaces**:
  - **Arijeet**: Individual client assignments and financial summary for Arijeet.
  - **Shared (Middle Tab)**: Joint projects with automated proportional revenue division (e.g. 50/50 split), isolated cards, and combined milestone summaries.
  - **Priya**: Individual client assignments and financial summary for Priya.
- **💰 Milestone Payment Tracking**:
  - Supports advance & balance payments (default 50% / 50% or custom split percentages).
  - Checkbox toggles with receipt date tracking for both advance and final balance payments.
- **🔢 Strict Integer Paise Accounting**:
  - All financial calculations are stored strictly as integer paise with odd-paise rounding guarantees (`advance + balance === total`).
  - Standard Indian numbering format display (`₹1,50,000`).
- **📅 Custom Calendar Picker**:
  - Bespoke, dark/light theme-aware calendar dropdown with month navigation and quick-date shortcuts (Today, Tomorrow, 1 Week, 1 Month) instead of native browser popups.
- **🎨 Custom Design System**:
  - Handcrafted CSS design tokens, custom select dropdowns, and smooth micro-animations.
  - **Light & Dark Mode**: Easily toggled via the navbar sun/moon icon or the settings modal. Conforms to system preference by default.
- **📱 PWA & Mobile-First Layout**:
  - Fully responsive on iPhone, Android, tablets, and desktops.
  - Can be added directly to mobile Home Screen for a native app feel.
- **📦 Data Portability**:
  - One-click export and import of all projects and settings in JSON format for backups and migrations.

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ArijeetBanerjee07/Project_Tracker.git
cd Project_Tracker
npm install
```

### 2. Configure Environment (`.env`)
Create or edit `.env` in the root folder:
```env
DATABASE_URL=postgresql://neondb_owner:npg_VD4zrc6EQMfO@ep-shy-feather-b4v4razc-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PORT=3001
```

### 3. Run Development Server
```bash
# Run both backend API & Vite frontend concurrently:
npm run dev:all
```
* **Frontend UI**: [http://127.0.0.1:5173](http://127.0.0.1:5173)
* **Backend API**: [http://127.0.0.1:3001](http://127.0.0.1:3001)

Or start each separately:
```bash
# Terminal 1: Backend Express Server
npm run server

# Terminal 2: Vite Dev Server
npm run dev
```

### 4. Run Unit Tests
```bash
npm test
```
Runs 14 Vitest test cases validating revenue splits, odd-paise rounding arithmetic, shared revenue division, and overdue calculation logic.

---

## 🛠️ Build for Production

```bash
npm run build
```
Generates production assets in `dist/`.

---

## ☁️ Deployment (Vercel)

The application is configured for deployment on Vercel using `vercel.json` and `/api` serverless functions.

1. Import repository on [Vercel](https://vercel.com).
2. In **Project Settings** &rarr; **Environment Variables**, add:
   - `DATABASE_URL`: `postgresql://neondb_owner:npg_VD4zrc6EQMfO@ep-shy-feather-b4v4razc-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
3. Deploy!

Live link: [https://project-tracker-seven-phi.vercel.app/](https://project-tracker-seven-phi.vercel.app/)

---

## 📲 Install as PWA on Mobile

### On iOS (Safari):
1. Open [https://project-tracker-seven-phi.vercel.app/](https://project-tracker-seven-phi.vercel.app/) in Safari.
2. Tap the **Share** button (square with arrow pointing up).
3. Tap **Add to Home Screen**, then tap **Add**.

### On Android (Chrome / Brave):
1. Open [https://project-tracker-seven-phi.vercel.app/](https://project-tracker-seven-phi.vercel.app/) in Chrome.
2. Tap the three-dot menu in the upper-right corner.
3. Tap **Add to Home Screen** or **Install App**.
