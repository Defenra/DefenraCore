import mongoose from 'mongoose';

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
    ipHistory: [{
      ip: String,
      changedAt: Date,
      ipInfo: {
        country: String,
        city: String,
        isp: String,
      },
    }],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Agent = mongoose.models?.Agent || mongoose.model('Agent', AgentSchema);

export default Agent;
