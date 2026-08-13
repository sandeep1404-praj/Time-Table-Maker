# Coding Conventions — Academy Timetable

## General Rules

- All server-side modules use **ESM** (`import`/`export`), never CommonJS `require()`
- All async route handlers must be wrapped with `asyncHandler()` from `server/utils/asyncHandler.js`
- Never use `try/catch` directly in route handlers — let `asyncHandler` catch and forward errors
- All errors are forwarded to the `globalErrorHandler` via `next(err)`
- Strings from user input must always be trimmed: `String(value || "").trim()`
- Strings stored in DB should be length-bounded: `.slice(0, MAX_LENGTH)`

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files | camelCase | `batchOrder.js`, `slotStatusService.js` |
| Mongoose models | PascalCase | `Teacher`, `TimeSlot`, `ActivityLog` |
| React components | PascalCase | `SlotModal`, `MasterGrid` |
| React hooks | `use` prefix | `useBatches`, `useCreateSlot` |
| CSS classes | kebab-case (Tailwind utilities) | `timetable-cell`, `nav-tab--active` |
| Environment variables | UPPER_SNAKE | `MONGO_URI`, `JWT_SECRET`, `VITE_API_URL` |

## Server Patterns

### Route handler structure
```js
router.get("/", asyncHandler(async (req, res) => {
  // 1. Sanitize inputs
  const name = String(req.body.name || "").trim().slice(0, 100);
  // 2. Validate
  if (!name) return res.status(400).json({ error: "Name is required" });
  // 3. DB operation
  const result = await Model.find(query);
  // 4. Respond
  res.json(result);
}));
```

### Duplicate-check pattern (case-insensitive)
```js
const existing = await Model.findOne({
  name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") }
});
if (existing) return res.status(409).json({ error: "Name already exists" });
```

### Regex escaping — always escape before using in $regex
```js
const escapeRegex = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
```

### Export route — always sanitize IDs in filenames
```js
const safeId = (id) => String(id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
```

### New batch/teacher/branch route — always add to server.js
```js
app.use("/api/newresource", newResourceRouter);
// Place BEFORE globalErrorHandler registration
```

## Client Patterns

### All HTTP calls via the shared Axios instance
```js
import api from "../api/client";
const { data } = await api.get("/api/batches");
```
Never create a raw `axios.create()` in a component. Always use the shared `api`.

### React Query hook structure
```js
export const useThings = () =>
  useQuery({
    queryKey: ["things"],
    queryFn: async () => {
      const { data } = await api.get("/api/things");
      return Array.isArray(data) ? data : data?.things || [];
    }
  });

export const useCreateThing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/api/things", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["things"] })
  });
};
```

### Navigation — use internal `navigate()`, not react-router
```js
// In a component that receives onNavigate prop:
onNavigate("/master");

// Inside App.jsx:
navigate("/teacher");
```

### Auth token — never access localStorage directly in components
The Axios interceptor in `api/client.js` automatically reads `authToken` from localStorage.
The Zustand store (`useAuthStore`) is the only place that writes/clears it.

## MongoDB / Mongoose Conventions

- All schemas have `{ timestamps: true }` (adds `createdAt`, `updatedAt`)
- Refs use ObjectId: `{ type: mongoose.Schema.Types.ObjectId, ref: "ModelName" }`
- All queries that compare ObjectIds should use `String()` wrapping: `String(a._id) === String(b._id)`
- Add compound indexes for hot query patterns: `Schema.index({ teacher: 1, date: 1 })`
- `populate()` deeply when needed: `populate({ path: "batch", populate: { path: "branch" } })`

## Security Rules (non-negotiable)

- `authenticate` middleware must stay on ALL `/api/*` routes (mounted globally in server.js)
- `requireRole("admin")` must guard ALL `/api/admin/*` routes
- Passwords must be hashed with `bcrypt.hash(password, 12)` — never store plaintext
- JWT tokens must be created with `createAuthToken(user)` from `middleware/auth.js`
- Sensitive keys (password, hash, token, secret) must be stripped from logs
- Body size must stay at `50kb` limit

## Export & PDF Conventions

- All export functions return a `Buffer`, not a stream
- Set these headers on every export response:
  ```
  Content-Type: <correct mime>
  Content-Disposition: attachment; filename="..."
  X-Content-Type-Options: nosniff
  ```
- Batch list for master exports must be sorted with `sortBatchesByOrder()`
- PDF rendered via Puppeteer `headless: true` with `--no-sandbox` flag (required on Linux/Render)

## Git & Deployment Conventions

- Commit message format: `fix: <what was fixed>` or `feat: <what was added>`
- Always push both backend and client changes together in one commit when they are related
- After pushing, Render takes ~3-5 minutes; Netlify takes ~1-2 minutes
- Never commit `.env` files — only `.env.example` is committed
