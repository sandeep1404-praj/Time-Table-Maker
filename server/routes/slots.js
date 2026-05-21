const express = require('express');
const { z } = require('zod');
const TimeSlot = require('../models/TimeSlot');
const { checkConflicts } = require('../services/conflictService');
const logger = require('../config/logger');

const router = express.Router();

const slotSchema = z.object({
  date: z.string().datetime(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  teacher: z.string(),
  batch: z.string(),
  topic: z.string().min(1),
  slotType: z.enum(['lecture', 'test', 'coverup']).default('lecture'),
  notes: z.string().optional(),
});

router.post('/', async (req, res) => {
  try {
    const validated = slotSchema.parse(req.body);
    const slot = new TimeSlot({
      ...validated,
      date: new Date(validated.date),
    });
    await slot.save();

    const conflicts = await checkConflicts(slot);
    logger.info(`Slot created: ${slot._id}`);

    res.status(201).json({
      slot: slot.toObject(),
      conflicts: conflicts.map(c => c.toObject()),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    logger.error('POST /slots error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const slots = await TimeSlot.find()
      .populate('teacher batch')
      .sort({ date: 1, startTime: 1 });
    res.json(slots);
  } catch (error) {
    logger.error('GET /slots error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const slot = await TimeSlot.findById(req.params.id).populate('teacher batch');
    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    res.json(slot);
  } catch (error) {
    logger.error('GET /slots/:id error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const validated = slotSchema.parse(req.body);
    const slot = await TimeSlot.findByIdAndUpdate(
      req.params.id,
      { ...validated, date: new Date(validated.date) },
      { new: true }
    );
    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    const conflicts = await checkConflicts(slot);
    logger.info(`Slot updated: ${slot._id}`);

    res.json({
      slot: slot.toObject(),
      conflicts: conflicts.map(c => c.toObject()),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    logger.error('PUT /slots/:id error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const slot = await TimeSlot.findByIdAndDelete(req.params.id);
    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    logger.info(`Slot deleted: ${slot._id}`);
    res.json({ message: 'Slot deleted' });
  } catch (error) {
    logger.error('DELETE /slots/:id error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
