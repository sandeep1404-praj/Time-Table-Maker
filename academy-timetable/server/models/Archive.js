import mongoose from "mongoose";

const ArchiveSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Archive", ArchiveSchema);
