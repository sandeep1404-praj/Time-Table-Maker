# Academy Timetable Management System

A full-stack web application for managing timetables in a coaching academy (like Guru Aanklan Academy).

## Features

- **Master Timetable Grid**: Excel-like spreadsheet interface for editing slots
- **Teacher Views**: Auto-generated timetables per teacher
- **Batch Views**: Auto-generated timetables per batch
- **Conflict Detection**: Real-time detection of teacher scheduling conflicts
- **PDF Export**: Generate and download individual or bulk PDFs with customizable formatting
- **Responsive UI**: Built with React, Tailwind CSS, and AG Grid

## Tech Stack

**Frontend:**
- React 18 + Vite
- AG Grid Community (spreadsheet UI)
- Zustand (state management)
- TanStack Query (API calls)
- Tailwind CSS (styling)
- date-fns (date utilities)

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Puppeteer (PDF generation)
- Archiver (ZIP creation)
- Winston (logging)
- Zod (validation)

## Setup

### Prerequisites
- Node.js 16+
- MongoDB running locally or remote connection string

### Backend Setup

```bash
cd server
npm install
cp .env.example .env  # Edit with your MongoDB URI
npm run dev           # Start development server
node seed.js          # Populate database with sample data
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd client
npm install
npm run dev           # Start Vite dev server
```

Frontend runs on `http://localhost:5173`

## API Endpoints

### Slots
- `GET /api/slots` - Get all slots
- `POST /api/slots` - Create slot (checks conflicts)
- `PUT /api/slots/:id` - Update slot
- `DELETE /api/slots/:id` - Delete slot

### Master Data
- `GET /api/teachers` - Get all teachers
- `GET /api/batches` - Get all batches

### Timetable Views
- `GET /api/timetable/teacher/:teacherId` - Get teacher timetable
- `GET /api/timetable/batch/:batchId` - Get batch timetable

### Conflicts
- `GET /api/conflicts` - Get all detected conflicts

### Export
- `GET /api/export/teacher/:id/pdf` - Download teacher PDF
- `GET /api/export/batch/:id/pdf` - Download batch PDF
- `GET /api/export/all-pdfs` - Download all PDFs as ZIP

## Data Models

### Teacher
```javascript
{ name: String, code: String }
```

### Branch
```javascript
{ name: String }
```

### Batch
```javascript
{ name: String, branch: ObjectId }
```

### TimeSlot
```javascript
{
  date: Date,
  startTime: String,      // "HH:MM"
  endTime: String,        // "HH:MM"
  teacher: ObjectId,
  batch: ObjectId,
  topic: String,
  slotType: "lecture" | "test" | "coverup",
  notes: String
}
```

### ConflictLog
```javascript
{
  slot1: ObjectId,
  slot2: ObjectId,
  detectedAt: Date
}
```

## Conflict Detection

The system automatically detects when a teacher has overlapping time slots on the same date. When conflicts are found:
1. A warning is shown on the UI
2. The conflict is logged in the database
3. The response includes the conflicting slots

## Database Indexes

Critical indexes for performance:
- `TimeSlot.teacher + date` - Fast conflict lookup
- `TimeSlot.batch + date` - Fast batch queries
- `Batch.name + branch` - Unique batch per branch

## Development

### Seed Database
```bash
cd server && node seed.js
```

### View Logs
```bash
tail -f server/logs/combined.log
```

### MongoDB CLI
```bash
mongosh
use academy-timetable
db.timeslots.find().pretty()
```

## Project Structure

```
academy-timetable/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MasterGrid.jsx
│   │   │   ├── TeacherView.jsx
│   │   │   ├── BatchView.jsx
│   │   │   ├── SlotModal.jsx
│   │   │   ├── ConflictBanner.jsx
│   │   │   └── ExportButton.jsx
│   │   ├── hooks/
│   │   │   └── useApi.js
│   │   ├── store/
│   │   │   └── timetableStore.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/
│   ├── models/
│   │   ├── Teacher.js
│   │   ├── Branch.js
│   │   ├── Batch.js
│   │   ├── TimeSlot.js
│   │   └── ConflictLog.js
│   ├── routes/
│   │   ├── slots.js
│   │   ├── teachers.js
│   │   ├── batches.js
│   │   ├── timetable.js
│   │   ├── conflicts.js
│   │   └── export.js
│   ├── services/
│   │   ├── conflictService.js
│   │   └── pdfService.js
│   ├── config/
│   │   ├── db.js
│   │   └── logger.js
│   ├── seed.js
│   ├── server.js
│   ├── .env
│   └── package.json
└── .gitignore
```

## Next Steps

1. Start MongoDB
2. Start backend: `cd server && npm run dev`
3. Seed database: `cd server && node seed.js`
4. Start frontend: `cd client && npm run dev`
5. Open browser: `http://localhost:5173`
