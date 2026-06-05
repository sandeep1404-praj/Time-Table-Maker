const mongoose = require("mongoose");

const DateRowSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    isArchived: { type: Boolean, default: false },
    archiveId: { type: mongoose.Schema.Types.ObjectId, ref: "Archive", default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DateRow", DateRowSchema);
