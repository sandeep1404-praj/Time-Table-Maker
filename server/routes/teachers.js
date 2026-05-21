const express = require('express');
const Teacher = require('../models/Teacher');
const logger = require('../config/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ name: 1 });
    res.json(teachers);
  } catch (error) {
    logger.error('GET /teachers error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
