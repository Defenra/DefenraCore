import crypto from "crypto";

export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

export function generateAgentId() {
  return `agent_${crypto.randomBytes(16).toString("hex")}`;
}

export function generateAgentKey() {
  return crypto.randomBytes(32).toString("base64");
}
