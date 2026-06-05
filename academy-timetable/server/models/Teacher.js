const mongoose = require("mongoose");

const TeacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, unique: true, sparse: true },
    subject: { type: String, default: "" },
    chapters: [
      {
        chapterNumber: { type: String, default: "" },
        title: { type: String, default: "" },
        plannedHours: { type: Number, default: 0 },
        branchCompletions: [
          {
            branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
            isCompleted: { type: Boolean, default: false },
            completedAt: { type: Date, default: null }
          }
        ],
        batchCompletions: [
          {
            branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
            batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
            isCompleted: { type: Boolean, default: false },
            completedAt: { type: Date, default: null }
          }
        ]
      }
    ],
    color: { type: String, default: "" },
    allowScheduleOverlap: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", TeacherSchema);
