const mongoose = require("mongoose");

const ConflictLogSchema = new mongoose.Schema(
  {
    slot1: { type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot", required: true },
    slot2: { type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot", required: true },
    detectedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ConflictLog", ConflictLogSchema);
