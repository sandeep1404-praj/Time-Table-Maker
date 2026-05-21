require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const logger = require('./config/logger');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

const slotsRouter = require('./routes/slots');
const teachersRouter = require('./routes/teachers');
const batchesRouter = require('./routes/batches');
const timetableRouter = require('./routes/timetable');
const conflictsRouter = require('./routes/conflicts');
const exportRouter = require('./routes/export');

app.use('/api/slots', slotsRouter);
app.use('/api/teachers', teachersRouter);
app.use('/api/batches', batchesRouter);
app.use('/api/timetable', timetableRouter);
app.use('/api/conflicts', conflictsRouter);
app.use('/api/export', exportRouter);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
