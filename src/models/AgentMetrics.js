import mongoose from "mongoose";

const AgentMetricsSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    // Calculated load: (CPU + RAM) / 2
    load: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    // Individual metrics
    cpu: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    memory: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    loadScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Agent info snapshot for historical context
    agentName: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: "Unknown",
    },
    country: {
      type: String,
      default: "Unknown",
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: false, // We use our own timestamp field
  },
);

// Compound index for efficient queries
AgentMetricsSchema.index({ timestamp: -1, agentId: 1 });

// TTL index to automatically delete old metrics after 30 days
AgentMetricsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

const AgentMetrics =
  mongoose.models?.AgentMetrics ||
  mongoose.model("AgentMetrics", AgentMetricsSchema);

export default AgentMetrics;
