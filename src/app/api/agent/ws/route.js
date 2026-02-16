import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";
import Domain from "@/models/Domain";
import GlobalBan from "@/models/GlobalBan";
import ProxyModel from "@/models/Proxy";
import { buildAnycastRecords, findAllAgentsForLocation } from "@/lib/geoFallback";

// Connected agents map: agentId -> { ws, lastPing, agent }
const connectedAgents = new Map();

// Config cache: agentId -> { config, version, timestamp }
const configCache = new Map();
const CONFIG_CACHE_TTL = 30000; // 30 seconds

// Calculate simple hash of config object
function getConfigHash(config) {
  return JSON.stringify(config).length; // Simple hash based on length
}

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
      // Store stats in agent document or separate collection
      await Agent.updateOne(
        { agentId },
        { 
          $set: { 
            lastStats: message.data,
            lastStatsAt: new Date(),
          }
        }
      );
      break;
    case "ban_report":
      console.log(`[WebSocket] Ban report from ${agentId}:`, message.data);
      await handleBanReport(agentId, message.data);
      break;
    case "pong":
      conn.lastPing = Date.now();
      // Update lastSeen in database
      await Agent.updateOne(
        { agentId },
        { lastSeen: new Date() }
      );
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

    // Get all active agents for coordinate-based fallback
    const allActiveAgents = await Agent.find({ isActive: true }).lean();
    const agentsList = allActiveAgents.map(a => ({
      agentId: a.agentId,
      agentName: a.name,
      agentIp: a.ipAddress,
      loadScore: a.loadScore || 0,
      countryCode: a.manualLocation?.country || a.ipInfo?.countryCode,
      city: a.manualLocation?.city || a.ipInfo?.city,
    }));

    // Build new config
    const domains = await Domain.find({}).lean();
    const domainConfigs = [];
    for (const domain of domains) {
      const config = await buildDomainConfig(domain, agent, allActiveAgents);
      domainConfigs.push(config);
    }

    const now = new Date();
    const bans = await GlobalBan.find({
      $or: [{ isPermanent: true }, { expiresAt: { $gt: now } }],
    }).lean();

    // Fetch proxies for this agent (same logic as HTTP poll route)
    const proxies = await ProxyModel.find({
      userId: agent.userId,
      isActive: true,
      $or: [{ agentId: agentId }, { agentId: null }],
    }).select("-userId -__v").lean();

    const newConfig = {
      agentId,
      domains: domainConfigs,
      agents: agentsList, // All agents for coordinate-based fallback
      proxies: proxies.map((proxy) => ({
        id: proxy._id.toString(),
        name: proxy.name,
        type: proxy.type,
        sourcePort: proxy.sourcePort,
        destinationHost: proxy.destinationHost,
        destinationPort: proxy.destinationPort,
        enabled: proxy.isActive !== undefined ? proxy.isActive : true,
        proxyProtocol: proxy.proxyProtocol || false,
      })),
      bans: bans.map((b) => ({
        ip: b.ip,
        reason: b.reason,
        bannedAt: b.bannedAt,
        expiresAt: b.expiresAt,
        isPermanent: b.isPermanent,
        isCIDR: b.isCIDR,
      })),
    };

    // Check if config changed
    const newHash = getConfigHash(newConfig);
    const cached = configCache.get(agentId);
    
    if (cached && cached.hash === newHash && (Date.now() - cached.timestamp) < CONFIG_CACHE_TTL) {
      // Config unchanged, only update lastSeen
      await Agent.updateOne({ agentId }, { lastSeen: new Date() });
      return;
    }

    // Config changed or cache expired, send update
    configCache.set(agentId, {
      config: newConfig,
      hash: newHash,
      timestamp: Date.now(),
    });

    const message = {
      type: "config",
      timestamp: Date.now(),
      data: newConfig,
    };

    conn.ws.send(JSON.stringify(message));
    await Agent.updateOne({ agentId }, { lastSeen: new Date() });
    console.log(`[WebSocket] Config sent to ${agentId} (hash: ${newHash})`);
  } catch (error) {
    console.error(`[WebSocket] Error sending config to ${agentId}:`, error);
  }
}

// Build domain configuration (matches HTTP poll structure exactly)
async function buildDomainConfig(domain, agent, allAgents) {

  // Build GeoDNS maps (same as poll route)
  const geoDnsMap = {};
  const geoDnsAgentPools = {};
  const geoDnsFallbackMap = {};

  if (domain.geoDnsConfig && domain.geoDnsConfig.length > 0) {
    for (const location of domain.geoDnsConfig) {
      const agents = findAllAgentsForLocation(location.code, allAgents);
      if (agents.length > 0) {
        // Sort by load score and pick best agent for geoDnsMap
        agents.sort((a, b) => a.loadScore - b.loadScore);
        geoDnsMap[location.code] = agents[0].agentIp;

        // Store full agent pool with weights
        geoDnsAgentPools[location.code] = agents.map((a) => ({
          agentId: a.agentId,
          ip: a.agentIp,
          weight: Math.max(10, 100 - (a.loadScore || 0)),
          loadScore: a.loadScore || 0,
        }));

        // Build fallback records (Anycast)
        const anycastRecords = await buildAnycastRecords(location.code, agents);
        if (anycastRecords.length > 0) {
          geoDnsFallbackMap[location.code] = anycastRecords;
        }
      }
    }
  }

  // Build DNS records (same filtering as poll route)
  const regularDnsRecords = (domain.dnsRecords || [])
    .filter((record) => record.type !== "A" || !record.isOriginIP)
    .map((record) => ({
      type: record.type,
      name: record.name,
      value: record.value,
      ttl: record.ttl || 300,
      priority: record.priority,
      httpProxyEnabled: record.httpProxyEnabled || false,
    }));

  // Add A records for each GeoDNS location
  Object.entries(geoDnsMap).forEach(([code, ip]) => {
    regularDnsRecords.push({
      type: "A",
      name: code,
      value: ip,
      ttl: 60,
      httpProxyEnabled: true,
    });
  });

  return {
    id: domain._id.toString(),
    domain: domain.domain,
    description: domain.description || "",
    dnsRecords: regularDnsRecords,
    geoDnsMap: geoDnsMap,
    geoDnsFallbackMap: geoDnsFallbackMap,
    geoDnsAgentPools: geoDnsAgentPools,
    geoDnsLocations: (domain.geoDnsConfig || []).map((loc) => ({
      code: loc.code,
      name: loc.name,
      type: loc.type,
      subdomain: `${loc.code}`,
    })),
    httpProxy: {
      enabled: domain.httpProxy?.enabled || false,
      type: domain.httpProxy?.type || "both",
      originHost: domain.httpProxy?.originHost || null,
      originPort: domain.httpProxy?.originPort || null,
      antiDDoS: domain.httpProxy?.antiDDoS || null,
    },
    ssl: {
      enabled: domain.httpProxy?.ssl?.enabled || false,
      certificate: domain.httpProxy?.ssl?.certificate || null,
      privateKey: domain.httpProxy?.ssl?.privateKey || null,
      autoRenew: domain.httpProxy?.ssl?.autoRenew || false,
      acmeHttpChallenge: domain.httpProxy?.ssl?.acmeHttpChallenge,
    },
    luaCode: domain.httpProxy?.luaCode || null,
    pageRules: (domain.pageRules || []).map((rule) => ({
      enabled: rule.enabled !== undefined ? rule.enabled : true,
      priority: rule.priority || 1,
      urlPattern: rule.urlPattern,
      actions: rule.actions || {},
    })),
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

// Periodic ban sync (every 30 seconds)
setInterval(async () => {
  for (const [agentId, conn] of connectedAgents.entries()) {
    try {
      await sendBanSync(agentId);
    } catch (error) {
      console.error(`[WebSocket] Error syncing bans to ${agentId}:`, error);
    }
  }
}, 30000);

// Send ban sync to specific agent
async function sendBanSync(agentId) {
  const conn = connectedAgents.get(agentId);
  if (!conn || conn.ws.readyState !== 1) return;

  try {
    await connectDB();
    const now = new Date();
    const bans = await GlobalBan.find({
      $or: [{ isPermanent: true }, { expiresAt: { $gt: now } }],
    }).lean();

    const message = {
      type: "ban_sync",
      timestamp: Date.now(),
      data: {
        bans: bans.map((b) => ({
          ip: b.ip,
          reason: b.reason,
          bannedAt: b.bannedAt,
          expiresAt: b.expiresAt,
          isPermanent: b.isPermanent,
          isCIDR: b.isCIDR,
        })),
        total: bans.length,
      },
    };

    conn.ws.send(JSON.stringify(message));
    console.log(`[WebSocket] Ban sync sent to ${agentId} (${bans.length} bans)`);
  } catch (error) {
    console.error(`[WebSocket] Error sending ban sync to ${agentId}:`, error);
  }
}
