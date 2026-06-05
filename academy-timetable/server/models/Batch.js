const mongoose = require("mongoose");

const BatchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Batch", BatchSchema);
