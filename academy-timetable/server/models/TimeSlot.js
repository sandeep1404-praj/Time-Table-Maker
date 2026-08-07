import mongoose from "mongoose";
import { formatTimeForStorage } from "../utils/time.js";

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
      enum: ["lecture", "lecture-theory", "lecture-mcq", "test", "mcq", "revision", "coverup"],
      default: "lecture-theory"
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

const normalizeTimeFields = (target) => {
  if (!target) return;
  if (target.startTime !== undefined) {
    target.startTime = formatTimeForStorage(target.startTime);
  }
  if (target.endTime !== undefined) {
    target.endTime = formatTimeForStorage(target.endTime);
  }
};

TimeSlotSchema.pre("validate", function (next) {
  normalizeTimeFields(this);
  next();
});

TimeSlotSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function (next) {
  const update = this.getUpdate() || {};
  const target = update.$set ? { ...update.$set } : { ...update };

  normalizeTimeFields(target);

  if (update.$set) {
    update.$set = target;
  } else {
    Object.assign(update, target);
  }

  this.setUpdate(update);
  next();
});

export default mongoose.model("TimeSlot", TimeSlotSchema);
