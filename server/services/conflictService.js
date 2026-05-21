const TimeSlot = require('../models/TimeSlot');
const ConflictLog = require('../models/ConflictLog');
const logger = require('../config/logger');

function hasOverlap(a, b) {
  return a.startTime < b.endTime && a.endTime > b.startTime;
}

const checkConflicts = async (newSlot) => {
  try {
    const existing = await TimeSlot.find({
      teacher: newSlot.teacher,
      date: newSlot.date,
      _id: { $ne: newSlot._id },
    });

    const conflicts = [];
    for (const slot of existing) {
      if (hasOverlap(newSlot, slot)) {
        conflicts.push(slot);
        await ConflictLog.create({
          slot1: newSlot._id,
          slot2: slot._id,
          detectedAt: new Date(),
        });
        logger.warn(`Conflict detected: Slot ${newSlot._id} overlaps with ${slot._id}`);
      }
    }
    return conflicts;
  } catch (error) {
    logger.error('Error checking conflicts:', error.message);
    throw error;
  }
};

module.exports = { checkConflicts, hasOverlap };
