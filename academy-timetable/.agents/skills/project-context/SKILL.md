---
name: project-context
description: >
  Loads the complete context, architecture, and conventions for the
  Guru Aanklan Academy Timetable project whenever any task is related
  to this codebase. Triggers on phrases like timetable, slot, teacher,
  batch, branch, master grid, archive, export, conflict, or any mention
  of a file path inside this repo.
---

# Guru Aanklan Academy Timetable — Agent Context Skill

When this skill triggers, read the reference documents listed below
**before writing any code or making any edits**.  They are your source
of truth for this project.

## 1. Mandatory Pre-Task Reading

| Document | Purpose |
|---|---|
| [PROJECT_INFO.txt](references/PROJECT_INFO.txt) | Complete architecture, all features, every API route, security model |
| [CONVENTIONS.md](references/CONVENTIONS.md) | Coding conventions, naming rules, patterns to follow |
| [STRUCTURE.md](references/STRUCTURE.md) | Directory map and what every file does |

## 2. Key Facts to Remember

- **Monorepo layout**: `client/` (React/Vite/Tailwind) + `server/` (Node ESM/Express/MongoDB)
- **Deployed frontend**: `https://time-table-guru.netlify.app`
- **Deployed API**: `https://time-table-maker.onrender.com`
- **GitHub repo**: `https://github.com/sandeep1404-praj/Time-Table-Maker`
- **Local API port**: `4000`  |  **Local client port**: `5173`
- **Database**: MongoDB Atlas, database name `TimeTable`
- All `/api/*` routes **require a Bearer JWT token** — no public data endpoints
- The client's `VITE_API_URL` env var points to the Render deployment; changes
  only take effect after a `git push` triggers a Render redeploy
- The 23 master-table columns are **fixed** in `server/utils/batchOrder.js` —
  never change their order

## 3. Before Making Any Change

1. Check `PROJECT_INFO.txt` — find the section that covers the feature you are editing
2. Check `CONVENTIONS.md` — ensure your code follows established patterns
3. Identify **all four places** that a batch-order or batch-query change must touch:
   - `server/routes/batches.js`
   - `server/services/pdfService.js`
   - `server/services/docxService.js`
   - `server/utils/batchOrder.js`
4. After editing server code — remind the user to **push to GitHub** (Render auto-deploys)
5. After editing client code — remind the user to **push to GitHub** (Netlify auto-deploys)
6. The client on `localhost:5173` fetches from the **live Render API** by default
   (Axios falls back to production when local server is offline).
   To test against local backend, set `VITE_API_URL=http://localhost:4000` in `client/.env`

## 4. Security Constraints — Never Violate

- Never log or expose `passwordHash`, `token`, `secret`, `key`, or `credentials`
- Never remove `authenticate` middleware from `/api/*` routes
- Never remove `requireRole("admin")` from `/api/admin/*` routes
- Never allow self-signup — `POST /api/auth/signup` must always return 403
- Never send stack traces to the client; use the `globalErrorHandler`
- Always use `asyncHandler` wrapper for async route handlers
- Always sanitize IDs used in filenames with the `safeId()` helper in `export.js`
- Body size limit is `50kb` — do not raise it

## 5. Common Task Patterns

### Adding a new API route
1. Create handler in the correct router file under `server/routes/`
2. Wrap async logic with `asyncHandler`
3. Validate inputs with `express-validator` body/param validators
4. Sanitize and bound-check all string inputs (trim + slice)
5. Register the router in `server/server.js` if it is a new router file

### Adding a new frontend page
1. Create file in `client/src/pages/`
2. Add a route entry to the `routes` array in `client/src/App.jsx`
3. Add a case to the `switch` in `App.jsx` -> `ActivePage`
4. Create a React Query hook in `client/src/hooks/` that fetches its data
5. Use `api` from `client/src/api/client.js` for all HTTP calls (JWT auto-attached)

### Adding a new teacher field
- Update `server/models/Teacher.js`
- Update the POST handler in `server/routes/teachers.js`
- Update the PATCH handler in `server/routes/teachers.js`
- Update the relevant frontend form in `client/src/pages/TeacherManagementPage.jsx`

### Adding a new slot field
- Update `server/models/TimeSlot.js`
- Update POST and PUT validators in `server/routes/slots.js`
- Update `SlotModal.jsx` in `client/src/components/`
- Update export templates if the field should appear in PDFs/DOCX

### Debugging "columns in wrong order"
- The column order comes from `GET /api/batches`
- That route uses `sortBatchesByOrder` from `server/utils/batchOrder.js`
- If the order is still wrong in the browser, the Render server may not have
  the latest code -- push to GitHub and wait for Render to redeploy

### Deploying changes
```
git add <files>
git commit -m "fix: <description>"
git push origin main
# Wait ~3-5 minutes for Render to redeploy (backend)
# Netlify deploys client within ~1-2 minutes
```
