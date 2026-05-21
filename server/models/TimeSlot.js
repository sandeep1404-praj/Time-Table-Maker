const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    slotType: {
      type: String,
      enum: ['lecture', 'test', 'coverup'],
      default: 'lecture',
    },
    notes: String,
  },
  { timestamps: true }
);

timeSlotSchema.index({ teacher: 1, date: 1 });
timeSlotSchema.index({ batch: 1, date: 1 });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
