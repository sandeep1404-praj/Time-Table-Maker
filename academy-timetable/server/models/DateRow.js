import mongoose from "mongoose";

const DateRowSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    isArchived: { type: Boolean, default: false },
    archiveId: { type: mongoose.Schema.Types.ObjectId, ref: "Archive", default: null }
  },
  { timestamps: true }
);

export default mongoose.model("DateRow", DateRowSchema);
