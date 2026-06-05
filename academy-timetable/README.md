# Academy Timetable

Full-stack timetable management for a coaching academy.

## Tech
- Frontend: React 18, Vite, Tailwind, AG Grid Community, Zustand, TanStack Query, Axios, date-fns
- Backend: Node.js, Express, MongoDB, Mongoose, Puppeteer, Archiver, Zod, Winston, cors, dotenv

## Setup

### Backend
1) Create a `.env` in `server/` using `.env.example` values.
2) Install deps:
   ```bash
   cd server
   npm install
   ```
3) Seed sample data:
   ```bash
   node seed.js
   ```
4) Run server:
   ```bash
   node server.js
   ```

### Frontend
1) Install deps:
   ```bash
   cd client
   npm install
   ```
2) Run dev server:
   ```bash
   npm run dev
   ```

## Notes
- PDF export uses Puppeteer and may require extra system dependencies on some machines.
- Adjust `VITE_API_URL` in `client/.env` if your server runs on a different port.
