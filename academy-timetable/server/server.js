const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDb } = require("./config/db");

require("./models/Teacher");
require("./models/Branch");
require("./models/Batch");
require("./models/TimeSlot");
require("./models/ConflictLog");
require("./models/DateRow");
require("./models/Archive");

const slotsRouter = require("./routes/slots");
const teachersRouter = require("./routes/teachers");
const branchesRouter = require("./routes/branches");
const batchesRouter = require("./routes/batches");
const datesRouter = require("./routes/dates");
const timetableRouter = require("./routes/timetable");
const conflictsRouter = require("./routes/conflicts");
const exportRouter = require("./routes/export");
const archivesRouter = require("./routes/archives");

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