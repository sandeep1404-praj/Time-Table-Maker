import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDb } from "./config/db.js";

import "./models/Teacher.js";
import "./models/Branch.js";
import "./models/Batch.js";
import "./models/TimeSlot.js";
import "./models/ConflictLog.js";
import "./models/DateRow.js";
import "./models/Archive.js";

import slotsRouter from "./routes/slots.js";
import teachersRouter from "./routes/teachers.js";
import branchesRouter from "./routes/branches.js";
import batchesRouter from "./routes/batches.js";
import datesRouter from "./routes/dates.js";
import timetableRouter from "./routes/timetable.js";
import conflictsRouter from "./routes/conflicts.js";
import exportRouter from "./routes/export.js";
import archivesRouter from "./routes/archives.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://time-table-guru.netlify.app",
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/slots", slotsRouter);
app.use("/api/teachers", teachersRouter);
app.use("/api/branches", branchesRouter);
app.use("/api/batches", batchesRouter);
app.use("/api/dates", datesRouter);
app.use("/api/timetable", timetableRouter);
app.use("/api/conflicts", conflictsRouter);
app.use("/api/export", exportRouter);
app.use("/api/archives", archivesRouter);

const port = process.env.PORT || 4000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("DB connection failed", error);
    process.exit(1);
  });