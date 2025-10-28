import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ip: {
      type: String,
      required: true,
      index: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },
    country: String,
    city: String,
    countryCode: String,
    userAgent: String,
    connections: {
      type: Number,
      default: 1,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
      index: true,
    },
    firstSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Индекс для быстрого поиска активных клиентов
clientSchema.index({ userId: 1, lastSeen: -1 });
clientSchema.index({ userId: 1, agentId: 1 });

const Client = mongoose.models.Client || mongoose.model("Client", clientSchema);

export default Client;
