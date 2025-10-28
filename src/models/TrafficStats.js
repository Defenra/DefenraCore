import mongoose from "mongoose";

const trafficStatsSchema = new mongoose.Schema(
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
    resourceType: {
      type: String,
      enum: ["proxy", "domain"],
      required: true,
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    inboundBytes: {
      type: Number,
      default: 0,
    },
    outboundBytes: {
      type: Number,
      default: 0,
    },
    totalBytes: {
      type: Number,
      default: 0,
    },
    requests: {
      type: Number,
      default: 0,
    },
    responseTimeMs: {
      type: Number,
      default: 0,
    },
    errors: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Индексы для агрегации по времени и типу ресурса
trafficStatsSchema.index({ userId: 1, timestamp: -1 });
trafficStatsSchema.index({ userId: 1, agentId: 1, timestamp: -1 });
trafficStatsSchema.index({ userId: 1, resourceType: 1, timestamp: -1 });
trafficStatsSchema.index({ userId: 1, resourceType: 1, resourceId: 1, timestamp: -1 });

const TrafficStats =
  mongoose.models.TrafficStats ||
  mongoose.model("TrafficStats", trafficStatsSchema);

export default TrafficStats;
