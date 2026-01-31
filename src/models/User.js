import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "proxy-manager", "domain-manager", "operator", "viewer"],
      default: "viewer",
    },
    image: {
      type: String,
      default: null,
    },
    canViewAllResources: {
      type: Boolean,
      default: false,
      description:
        "When true, user can view all agents, proxies and domains regardless of ownership",
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.models?.User || mongoose.model("User", UserSchema);

export default User;
