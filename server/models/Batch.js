const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
  },
  { timestamps: true }
);

batchSchema.index({ name: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model('Batch', batchSchema);
