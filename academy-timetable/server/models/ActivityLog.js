import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    userEmail: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin", "system"], default: "user" },
    action: { type: String, required: true },
    method: { type: String, default: "" },
    path: { type: String, default: "" },
    statusCode: { type: Number, default: 200 },
    body: { type: mongoose.Schema.Types.Mixed, default: {} },
    query: { type: mongoose.Schema.Types.Mixed, default: {} },
    params: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export default mongoose.model("ActivityLog", ActivityLogSchema);