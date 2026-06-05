const mongoose = require("mongoose");

const TimeSlotSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", default: null },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    topic: { type: String, default: "" },
    subject: { type: String, default: "" },
    chapterNumber: { type: String, default: "" },
    slotType: {
      type: String,
      enum: ["lecture", "test", "mcq", "revision", "coverup"],
      default: "lecture"
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "canceled"],
      default: "scheduled"
    },
    cancelNote: { type: String, default: "" },
    canceledAt: { type: Date },
    completedAt: { type: Date },
    ongoingAt: { type: Date },
    statusUpdatedAt: { type: Date },
    notes: { type: String, default: "" },
    isArchived: { type: Boolean, default: false },
    archiveId: { type: mongoose.Schema.Types.ObjectId, ref: "Archive", default: null }
  },
  { timestamps: true }
);

TimeSlotSchema.index({ teacher: 1, date: 1 });
TimeSlotSchema.index({ batch: 1, date: 1 });

module.exports = mongoose.model("TimeSlot", TimeSlotSchema);
