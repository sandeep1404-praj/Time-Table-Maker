const express = require('express');
const Batch = require('../models/Batch');
const logger = require('../config/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const batches = await Batch.find()
      .populate('branch')
      .sort({ name: 1 });
    res.json(batches);
  } catch (error) {
    logger.error('GET /batches error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
