# Project Directory Structure — Academy Timetable

## Root
```
academy-timetable/
├── .agents/                    # AI agent customizations (skills)
│   └── skills/
│       └── project-context/    # This skill
│           ├── SKILL.md        # Agent entry point
│           └── references/     # Deep-dive reference docs
├── client/                     # React frontend (Vite)
├── server/                     # Node.js backend (Express + MongoDB)
├── PROJECT_INFO.txt            # Full project documentation
├── netlify.toml                # Netlify build config
└── .env.example                # Root env template (not used directly)
```

## server/

```
server/
├── server.js                   # Entry point: middleware stack, route mounting
├── seed.js                     # One-time DB seed (branches + batches)
├── package.json                # ESM, dependencies list
├── .env                        # Secret config (not committed)
├── .env.example                # Template for .env
│
├── config/
│   ├── db.js                   # connectDb() — Mongoose connection
│   └── env.js                  # Side-effect: calls dotenv.config() at ESM hoist time
│
├── middleware/
│   ├── auth.js                 # authenticate, requireRole, createAuthToken,
│   │                           #   recordActivity, activityLogger, globalErrorHandler,
│   │                           #   validateStartupConfig
│   ├── rateLimiter.js          # loginLimiter (10/15min), apiLimiter (300/min),
│   │                           #   adminLimiter (100/min)
│   └── sanitize.js             # sanitizeInputs — express-mongo-sanitize
│
├── models/
│   ├── User.js                 # name, email, passwordHash, role, lastLoginAt
│   ├── Teacher.js              # name, code, subject, chapters[], color, allowScheduleOverlap
│   ├── Branch.js               # name
│   ├── Batch.js                # name, branch->Branch
│   ├── TimeSlot.js             # date, startTime, endTime, teacher, batch, topic,
│   │                           #   subject, chapterNumber, slotType, status,
│   │                           #   cancelNote, isArchived, archiveId
│   ├── ConflictLog.js          # slot1, slot2, detectedAt
│   ├── DateRow.js              # date, isArchived, archiveId
│   ├── Archive.js              # name, startDate, endDate
│   └── ActivityLog.js          # user, action, method, path, statusCode, body, query
│
├── routes/
│   ├── auth.js                 # POST /login, POST /signup (disabled), GET /me
│   ├── admin.js                # GET/POST/DELETE /users, GET /logs (admin only)
│   ├── slots.js                # GET/POST/PUT/DELETE /slots, POST /check-conflict
│   ├── teachers.js             # CRUD teachers + chapter management
│   ├── branches.js             # GET/POST/DELETE /branches
│   ├── batches.js              # GET/POST/DELETE /batches (sorted by batchOrder)
│   ├── dates.js                # GET/POST/DELETE /dates + POST /dates/week
│   ├── timetable.js            # GET /timetable/teacher/:id, GET /timetable/batch/:id
│   ├── conflicts.js            # GET /conflicts
│   ├── export.js               # GET /export/teacher|batch|master (pdf/docx/all-pdfs)
│   └── archives.js             # GET/POST/DELETE /archives
│
├── services/
│   ├── conflictService.js      # findConflicts(), checkAndLogConflicts(), hasOverlap()
│   ├── slotStatusService.js    # deriveSlotStatus(), buildStatusTimestamps(),
│   │                           #   resolveSlotStatusPayload()
│   ├── pdfService.js           # exportTeacherPdf, exportBatchPdf, exportMasterPdf,
│   │                           #   exportAllPdfs (uses Puppeteer)
│   └── docxService.js          # exportTeacherDocx, exportBatchDocx, exportMasterDocx
│                               #   (uses docx library)
│
├── templates/
│   ├── masterTemplate.js       # HTML template for master timetable (A3 landscape)
│   ├── teacherTemplate.js      # HTML template for teacher timetable
│   └── batchTemplate.js        # HTML template for batch timetable
│
└── utils/
    ├── asyncHandler.js         # Wraps async route handlers, forwards errors to next()
    ├── batchOrder.js           # BATCH_ORDER array + sortBatchesByOrder() — canonical column order
    ├── time.js                 # parseTimeToMinutes, formatTimeForDisplay, formatTimeForStorage,
    │                           #   sortSlotsByDateAndTime, parseSlotDateTime, getSlotEndDateTime
    └── logo.js                 # (utility for logo assets)
```

## client/

```
client/
├── index.html                  # Vite entry HTML
├── vite.config.js              # Vite config
├── tailwind.config.js          # Tailwind config
├── package.json                # React + TanStack Query + Axios + Zustand
├── .env                        # VITE_API_URL (not committed)
├── .env.example                # Template
│
└── src/
    ├── main.jsx                # ReactDOM.createRoot, QueryClientProvider
    ├── App.jsx                 # Root: auth gate, nav, route switching (no router lib)
    ├── index.css               # Global CSS + Tailwind base + component classes
    │
    ├── api/
    │   └── client.js           # Axios instance with JWT interceptor + localhost fallback
    │
    ├── store/
    │   ├── useAuthStore.js     # Zustand: token, user, setAuth(), clearAuth()
    │   └── useToastStore.js    # Zustand: toast queue, pushToast()
    │
    ├── hooks/
    │   ├── useBranches.js      # useBranches, useCreateBranch
    │   ├── useBatches.js       # useBatches, useCreateBatch, useDeleteBatch
    │   ├── useSlots.js         # useSlots, useCreateSlot, useUpdateSlot, useDeleteSlot
    │   ├── useTeachers.js      # useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher
    │   ├── useDates.js         # useDates, useCreateDate, useCreateWeekDates, useDeleteDateRow
    │   ├── useConflicts.js     # useConflicts
    │   └── useTimetable.js     # useTeacherTimetable, useBatchTimetable
    │
    ├── pages/
    │   ├── AuthPage.jsx            # Login form
    │   ├── MasterPage.jsx          # /master — master grid + toolbar + setup panel
    │   ├── TeacherPage.jsx         # /teacher — teacher timetable view + export
    │   ├── TeacherManagementPage.jsx # /teacher-setup — full teacher CRUD + chapters
    │   ├── BatchPage.jsx           # /batch — batch timetable view + export
    │   ├── ChapterTrackingPage.jsx # /tracking — chapter progress dashboard
    │   ├── TestTrackingPage.jsx    # /tests — test schedule + tracking
    │   ├── HistoryPage.jsx         # /history — archive browser
    │   ├── ManagePage.jsx          # /manage — delete branches/batches
    │   └── AdminPage.jsx           # /admin/users + /admin/activity (admin only)
    │
    ├── components/
    │   ├── MasterGrid.jsx          # Master timetable grid component
    │   ├── SlotModal.jsx           # Create/edit/cancel slot modal (largest component)
    │   ├── TestSlotModal.jsx       # Create test slots
    │   ├── SlotCard.jsx            # Single slot display card
    │   ├── DateCell.jsx            # Date row cell with delete button
    │   ├── TeacherView.jsx         # Teacher's slot table view
    │   ├── BatchView.jsx           # Batch's slot table view
    │   ├── ConflictBanner.jsx      # Inline conflict warning
    │   ├── SearchableComboBox.jsx  # Reusable searchable dropdown
    │   ├── TeacherSearchSelect.jsx # Specialized teacher picker
    │   ├── ChapterCompletionModal.jsx # Mark chapter complete per branch/batch
    │   └── ToastViewport.jsx       # Toast notification container
    │
    └── utils/
        ├── time.js                 # Client-side time formatting
        ├── dateFormat.js           # Date display helpers
        ├── displayName.js          # formatBatchDisplayName (branch\nbatch two-line)
        ├── exactTimeOverlap.js     # getExactTimeOverlapIds — highlights duplicate-time slots
        ├── slotStatus.js           # Client-side slot status color/label
        ├── teacherColor.js         # Teacher color lookup
        ├── chapterProgress.js      # Chapter completion percentage calculation
        └── testProgress.js         # Test pass/fail analytics
```
