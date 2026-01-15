import mongoose from "mongoose";

const AgentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    agentId: {
      type: String,
      required: true,
      unique: true,
    },
    agentKey: {
      type: String,
      required: true,
    },
    connectionToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    pollingInterval: {
      type: Number,
      default: 60,
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    inactivityThreshold: {
      type: Number,
      default: 300,
    },
    connectedAt: {
      type: Date,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    ipInfo: {
      country: String,
      countryCode: String,
      region: String,
      city: String,
      timezone: String,
      isp: String,
      org: String,
      as: String,
      lat: Number,
      lon: Number,
    },
    ipHistory: [
      {
        ip: String,
        changedAt: Date,
        ipInfo: {
          country: String,
          city: String,
          isp: String,
        },
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
    // Custom metadata fields for agent management
    tags: {
      type: [String],
      default: [],
    },
    label: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    provider: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
    },
    maxTraffic: {
      type: Number, // in GB
      default: 0,
    },
    // Payment tracking
    nextPaymentDate: {
      type: Date,
      default: null,
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    // Manual location override
    manualLocation: {
      country: String,
      city: String,
      region: String,
    },
  },
  {
    timestamps: true,
  },
);

const Agent = mongoose.models?.Agent || mongoose.model("Agent", AgentSchema);

export default Agent;
