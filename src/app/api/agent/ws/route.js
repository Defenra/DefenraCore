import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";
import Domain from "@/models/Domain";
import GlobalBan from "@/models/GlobalBan";
import { buildAnycastRecords, findAllAgentsForLocation } from "@/lib/geoFallback";

// Connected agents map: agentId -> { ws, lastPing, agent }
const connectedAgents = new Map();

export const SOCKET = async (client, request, server, context) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const agentId = url.searchParams.get("agentId");
  const agentKey = url.searchParams.get("agentKey");

  console.log(`[WebSocket] Connection attempt from agent: ${agentId}`);

  // Validate agent
  if (!agentId || !agentKey) {
    client.close(1008, "Missing agentId or agentKey");
    return;
  }

  await connectDB();
  const agent = await Agent.findOne({ agentId });

  if (!agent || agent.agentKey !== agentKey) {
    client.close(1008, "Invalid credentials");
    return;
  }

  console.log(`[WebSocket] Agent ${agentId} connected`);

  // Store connection
  connectedAgents.set(agentId, {
    ws: client,
    lastPing: Date.now(),
    agent,
  });

  // Update agent status
  agent.isActive = true;
  agent.lastSeen = new Date();
  await agent.save();

  // Send initial config
  await sendConfigUpdate(agentId);

  // Handle messages
  client.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString());
      await handleAgentMessage(agentId, message);
    } catch (error) {
      console.error(`[WebSocket] Error handling message from ${agentId}:`, error);
    }
  });

  // Handle pong (heartbeat response)
  client.on("pong", () => {
    const conn = connectedAgents.get(agentId);
    if (conn) {
      conn.lastPing = Date.now();
    }
  });

  // Handle close
  client.on("close", async () => {
    console.log(`[WebSocket] Agent ${agentId} disconnected`);
    connectedAgents.delete(agentId);

    await Agent.updateOne(
      { agentId },
      { isActive: false, lastSeen: new Date() }
    );
  });

  // Start ping interval
  const pingInterval = setInterval(() => {
    const conn = connectedAgents.get(agentId);
    if (!conn) {
      clearInterval(pingInterval);
      return;
    }

    if (Date.now() - conn.lastPing > 60000) {
      console.log(`[WebSocket] Agent ${agentId} timeout, closing connection`);
      client.close(1001, "Timeout");
      clearInterval(pingInterval);
      return;
    }

    client.ping();
  }, 30000);
};

// Handle messages from agent
async function handleAgentMessage(agentId, message) {
  const conn = connectedAgents.get(agentId);
  if (!conn) return;

  switch (message.type) {
    case "stats":
      console.log(`[WebSocket] Stats from ${agentId}:`, message.data);
      break;
    case "ban_report":
      console.log(`[WebSocket] Ban report from ${agentId}:`, message.data);
      await handleBanReport(agentId, message.data);
      break;
    case "pong":
      conn.lastPing = Date.now();
      break;
  }
}

// Handle ban report from agent
async function handleBanReport(agentId, banData) {
  try {
    await connectDB();
    const ban = new GlobalBan({
      ip: banData.ip,
      reason: banData.reason,
      bannedAt: new Date(),
      expiresAt: banData.isPermanent
        ? new Date("2099-12-31")
        : new Date(Date.now() + banData.durationSeconds * 1000),
      sourceAgentId: agentId,
      isPermanent: banData.isPermanent || false,
      isCIDR: banData.isCIDR || false,
    });
    await ban.save();

    // Broadcast to all other agents
    broadcastToAgents(
      { type: "ban", data: ban },
      (id) => id !== agentId
    );
  } catch (error) {
    console.error("[WebSocket] Error handling ban report:", error);
  }
}

// Send config update to specific agent
async function sendConfigUpdate(agentId) {
  const conn = connectedAgents.get(agentId);
  if (!conn || conn.ws.readyState !== 1) return;

  try {
    await connectDB();
    const agent = await Agent.findOne({ agentId }).lean();
    if (!agent) return;

    const domains = await Domain.find({}).lean();
    const domainConfigs = [];
    for (const domain of domains) {
      const config = await buildDomainConfig(domain, agent);
      domainConfigs.push(config);
    }

    const now = new Date();
    const bans = await GlobalBan.find({
      $or: [{ isPermanent: true }, { expiresAt: { $gt: now } }],
    }).lean();

    const message = {
      type: "config",
      timestamp: Date.now(),
      data: {
        agentId,
        domains: domainConfigs,
        bans: bans.map((b) => ({
          ip: b.ip,
          reason: b.reason,
          bannedAt: b.bannedAt,
          expiresAt: b.expiresAt,
          isPermanent: b.isPermanent,
          isCIDR: b.isCIDR,
        })),
      },
    };

    conn.ws.send(JSON.stringify(message));
    console.log(`[WebSocket] Config sent to ${agentId}`);
  } catch (error) {
    console.error(`[WebSocket] Error sending config to ${agentId}:`, error);
  }
}

// Build domain configuration
async function buildDomainConfig(domain, agent) {
  const geoDnsConfig = {};
  if (domain.geoDnsConfig && domain.geoDnsConfig.length > 0) {
    const allAgents = await Agent.find({ isActive: true }).lean();
    for (const location of domain.geoDnsConfig) {
      const agents = findAllAgentsForLocation(location.code, allAgents);
      if (agents.length > 0) {
        agents.sort((a, b) => a.loadScore - b.loadScore);
        geoDnsConfig[location.code] = agents[0].agentIp;
      }
    }
  }

  return {
    domain: domain.domain,
    originIp: domain.originIp,
    httpProxyEnabled: domain.httpProxy?.enabled || false,
    ssl: domain.ssl || {},
    antiDdos: domain.antiDdos || {},
    geoDns: geoDnsConfig,
  };
}

// Broadcast message to agents
function broadcastToAgents(message, filter = null) {
  const data = JSON.stringify(message);
  for (const [agentId, conn] of connectedAgents.entries()) {
    if (filter && !filter(agentId)) continue;
    if (conn.ws.readyState === 1) {
      conn.ws.send(data);
    }
  }
}

// Periodic config updates (every 5 seconds)
setInterval(async () => {
  for (const [agentId, conn] of connectedAgents.entries()) {
    try {
      await sendConfigUpdate(agentId);
    } catch (error) {
      console.error(`[WebSocket] Error updating ${agentId}:`, error);
    }
  }
}, 5000);
