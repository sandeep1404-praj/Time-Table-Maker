const express = require('express');
const ConflictLog = require('../models/ConflictLog');
const logger = require('../config/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const conflicts = await ConflictLog.find()
      .populate({
        path: 'slot1',
        populate: [
          { path: 'teacher' },
          { path: 'batch' },
        ],
      })
      .populate({
        path: 'slot2',
        populate: [
          { path: 'teacher' },
          { path: 'batch' },
        ],
      })
      .sort({ detectedAt: -1 });
    res.json(conflicts);
  } catch (error) {
    logger.error('GET /conflicts error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
