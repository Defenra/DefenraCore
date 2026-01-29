import mongoose from "mongoose";

const globalBanSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    bannedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    sourceAgentId: {
      type: String,
      required: true,
    },
    isPermanent: {
      type: Boolean,
      default: false,
    },
    // For CIDR bans
    isCIDR: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient cleanup of expired bans
globalBanSchema.index({ expiresAt: 1 });

// Index for finding active bans
globalBanSchema.index({ expiresAt: 1, bannedAt: 1 });

// Compound index for agent-specific queries
globalBanSchema.index({ sourceAgentId: 1, bannedAt: -1 });

const GlobalBan =
  mongoose.models.GlobalBan || mongoose.model("GlobalBan", globalBanSchema);

export default GlobalBan;
