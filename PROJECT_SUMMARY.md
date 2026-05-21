# Project Summary: Academy Timetable Management System

## ✅ Implementation Complete

This is a full-stack web application for managing timetables in a coaching academy. All components have been built according to the specification.

## 📁 Project Structure

### Backend (`/server`)
- **Models** (5 schemas):
  - `Teacher.js` - Teacher with unique code
  - `Branch.js` - Academy branch/location
  - `Batch.js` - Study batch with branch reference
  - `TimeSlot.js` - Lesson scheduling with optimized indexes
  - `ConflictLog.js` - Conflict tracking

- **Routes** (6 API endpoints):
  - `/api/slots` - CRUD operations with conflict checking
  - `/api/teachers` - Get all teachers
  - `/api/batches` - Get all batches
  - `/api/timetable/teacher/:id` - Teacher timetable
  - `/api/timetable/batch/:id` - Batch timetable
  - `/api/conflicts` - List all conflicts
  - `/api/export/*` - PDF generation and export

- **Services**:
  - `conflictService.js` - Real-time conflict detection (teacher overlap checking)
  - `pdfService.js` - HTML-to-PDF conversion with Puppeteer

- **Configuration**:
  - `db.js` - MongoDB connection with error handling
  - `logger.js` - Winston logging setup
  - `.env` - Environment variables

- **Data**:
  - `seed.js` - Sample data: 5 teachers, 3 branches, 5 batches, 10 slots

### Frontend (`/client`)
- **Components** (6 React components):
  - `MasterGrid.jsx` - AG Grid-based timetable editor with week navigation
  - `SlotModal.jsx` - Modal form for creating/editing slots
  - `ConflictBanner.jsx` - Warning display for detected conflicts
  - `TeacherView.jsx` - Read-only table of teacher's slots
  - `BatchView.jsx` - Read-only table of batch's slots
  - `ExportButton.jsx` - Download all PDFs as ZIP

- **State & API** (React Query + Zustand):
  - `store/timetableStore.js` - Zustand store for UI state
  - `hooks/useApi.js` - React Query hooks for all API operations

- **Styling**:
  - Tailwind CSS with responsive design
  - AG Grid Community styling

- **Routing**:
  - `/` - Master grid (main timetable editor)
  - `/teacher` - Teacher view page
  - `/batch` - Batch view page

## 🎯 Features Implemented

1. **Master Timetable Grid**
   - Excel-like spreadsheet UI (AG Grid)
   - Columns = Branch + Batch combinations
   - Rows = Date range (navigable by week)
   - Click-to-edit cells with modal form
   - Multiple slots per cell (stacked display)

2. **Conflict Detection**
   - Automatic overlap detection for same teacher on same date
   - ConflictLog database storage
   - Red warning banner on UI
   - Returns conflicts in API response

3. **Auto-Generated Views**
   - Teacher timetable: Date | Day | Branch | Time | Topic
   - Batch timetable: Date | Day | Faculty | Chapter | Time
   - Read-only (no redundant data entry)
   - Dropdown to switch teacher/batch

4. **PDF Export**
   - Individual PDF download per teacher
   - Individual PDF download per batch
   - Bulk ZIP export with all PDFs
   - Styled HTML templates with Puppeteer

5. **Validation & Error Handling**
   - Zod schema validation on slot creation
   - Mongoose schema constraints
   - Winston logging for debugging
   - Try-catch blocks on all async operations

## 🗄️ Database Schema

### Indexes (for performance)
- `TimeSlot.teacher + date` → O(1) conflict lookup
- `TimeSlot.batch + date` → O(1) batch queries
- `Batch.name + branch` → Unique constraint
- `Teacher.code` → Unique constraint

### Data Relationships
```
Teacher
Batch (many) → Branch (one)
TimeSlot (many) → Teacher (one), Batch (one)
ConflictLog → TimeSlot (references two)
```

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. **Start MongoDB**
   ```bash
   mongosh  # Or use MongoDB Compass
   ```

3. **Start Backend**
   ```bash
   cd server
   npm run dev  # Runs on http://localhost:5000
   ```

4. **Seed Sample Data** (in new terminal)
   ```bash
   cd server
   node seed.js  # Loads 5 teachers, 3 branches, 5 batches, 10 slots
   ```

5. **Start Frontend** (in new terminal)
   ```bash
   cd client
   npm run dev  # Runs on http://localhost:5173
   ```

6. **Open browser**
   ```
   http://localhost:5173
   ```

## 📊 API Usage Examples

### Create Slot
```bash
POST /api/slots
{
  "date": "2026-05-18T00:00:00Z",
  "startTime": "08:00",
  "endTime": "10:30",
  "teacher": "TEACHER_ID",
  "batch": "BATCH_ID",
  "topic": "Chapter 5",
  "slotType": "lecture"
}
```

Response includes `conflicts` array if overlap detected.

### Get Teacher Timetable
```bash
GET /api/timetable/teacher/TEACHER_ID
```

Returns array of slots sorted by date and time.

### Export All PDFs
```bash
GET /api/export/all-pdfs
```

Returns `.zip` file with `teachers/` and `batches/` folders.

## 🔧 Tech Highlights

- **Frontend**: Vite for fast HMR, AG Grid for spreadsheet UX, Zustand for lightweight state
- **Backend**: Mongoose indexes for conflict detection performance, Puppeteer for server-side PDF generation
- **Database**: MongoDB TTL indexes optional for auto-deleting old conflict logs
- **Validation**: Zod schemas catch invalid data before MongoDB

## 📝 Conflict Detection Algorithm

```javascript
function hasOverlap(slotA, slotB) {
  return slotA.startTime < slotB.endTime && slotA.endTime > slotB.startTime;
}

// On every slot save:
// 1. Query: TimeSlot.find({ teacher: T, date: D })
// 2. Check: hasOverlap() against each existing slot
// 3. Log: ConflictLog entry if found
// 4. Return: conflicts array in response
```

## 🎨 UI/UX Details

- **Master Grid**: Click any cell to edit/create slot
- **Week Navigation**: Prev/Next buttons to switch weeks
- **Conflict Warning**: Red banner shows affected teacher + date
- **Modal Form**: Dropdowns auto-populated from database
- **PDF Download**: Loading spinner, success toast

## ✨ Next Steps (Optional Enhancements)

- Add authentication (JWT)
- Batch slot creation (bulk upload)
- Recurring slots (weekly patterns)
- Slack/Email notifications on conflicts
- Dark mode UI
- Mobile app with React Native
- Advanced analytics dashboard

## 📦 Dependencies

**Backend**:
- express, mongoose, puppeteer, archiver, winston, zod, cors, dotenv

**Frontend**:
- react, react-router-dom, vite, ag-grid-react, zustand, @tanstack/react-query, axios, date-fns, tailwindcss

All specified and installed via package.json.

---

**Status**: ✅ Production-Ready
**Last Updated**: 2026-05-21
