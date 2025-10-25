import mongoose from "mongoose";

const ProxySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["tcp", "udp"],
      required: true,
    },
    sourcePort: {
      type: Number,
      required: true,
      min: 1,
      max: 65535,
    },
    destinationHost: {
      type: String,
      required: true,
    },
    destinationPort: {
      type: Number,
      required: true,
      min: 1,
      max: 65535,
    },
    agentId: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const Proxy = mongoose.models?.Proxy || mongoose.model("Proxy", ProxySchema);

export default Proxy;
