import mongoose from "mongoose";

const agentLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },
    level: {
      type: String,
      enum: ["info", "warning", "error"],
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    details: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Индекс для быстрого поиска логов
agentLogSchema.index({ userId: 1, timestamp: -1 });
agentLogSchema.index({ userId: 1, level: 1, timestamp: -1 });
agentLogSchema.index({ userId: 1, agentId: 1, timestamp: -1 });

const AgentLog =
  mongoose.models.AgentLog || mongoose.model("AgentLog", agentLogSchema);

export default AgentLog;
