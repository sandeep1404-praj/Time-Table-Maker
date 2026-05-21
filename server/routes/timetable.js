const express = require('express');
const TimeSlot = require('../models/TimeSlot');
const logger = require('../config/logger');

const router = express.Router();

router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const slots = await TimeSlot.find({ teacher: req.params.teacherId })
      .populate('teacher batch')
      .sort({ date: 1, startTime: 1 });
    res.json(slots);
  } catch (error) {
    logger.error('GET /timetable/teacher/:teacherId error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/batch/:batchId', async (req, res) => {
  try {
    const slots = await TimeSlot.find({ batch: req.params.batchId })
      .populate('teacher batch')
      .sort({ date: 1, startTime: 1 });
    res.json(slots);
  } catch (error) {
    logger.error('GET /timetable/batch/:batchId error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
