import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";
import TrafficStats from "@/models/TrafficStats";

// Calculate load score (0-100) based on system metrics
// Higher score means more loaded/stressed system
function calculateLoadScore(systemMetrics) {
  let score = 0;
  let factors = 0;

  // CPU usage (0-100%) - weight: 30%
  if (systemMetrics.cpuUsagePercent !== undefined) {
    score += systemMetrics.cpuUsagePercent * 0.3;
    factors += 0.3;
  }

  // Memory usage (0-100%) - weight: 25%
  if (systemMetrics.memoryUsagePercent !== undefined) {
    score += systemMetrics.memoryUsagePercent * 0.25;
    factors += 0.25;
  }

  // Load average (normalized to 0-100 based on CPU count) - weight: 25%
  if (
    systemMetrics.loadAverage1Min !== undefined &&
    systemMetrics.loadAverage1Min > 0
  ) {
    // Assume 4 CPU cores if not available, normalize load to percentage
    const cpuCores = 4; // Could be enhanced to get actual CPU count
    const loadPercent = Math.min(
      (systemMetrics.loadAverage1Min / cpuCores) * 100,
      100,
    );
    score += loadPercent * 0.25;
    factors += 0.25;
  }

  // Disk I/O (normalized to 0-100 based on typical values) - weight: 10%
  if (
    systemMetrics.diskReadBytesPS !== undefined ||
    systemMetrics.diskWriteBytesPS !== undefined
  ) {
    const totalDiskIO =
      (systemMetrics.diskReadBytesPS || 0) +
      (systemMetrics.diskWriteBytesPS || 0);
    // Normalize: 100MB/s = 100% load (adjust based on typical server disk performance)
    const diskLoadPercent = Math.min(
      (totalDiskIO / (100 * 1024 * 1024)) * 100,
      100,
    );
    score += diskLoadPercent * 0.1;
    factors += 0.1;
  }

  // Network I/O (normalized to 0-100 based on typical values) - weight: 10%
  if (
    systemMetrics.networkRxBytesPS !== undefined ||
    systemMetrics.networkTxBytesPS !== undefined
  ) {
    const totalNetworkIO =
      (systemMetrics.networkRxBytesPS || 0) +
      (systemMetrics.networkTxBytesPS || 0);
    // Normalize: 1GB/s = 100% load (adjust based on typical server network capacity)
    const networkLoadPercent = Math.min(
      (totalNetworkIO / (1024 * 1024 * 1024)) * 100,
      100,
    );
    score += networkLoadPercent * 0.1;
    factors += 0.1;
  }

  // If no factors were available, return 0
  if (factors === 0) {
    return 0;
  }

  // Normalize score based on available factors
  const normalizedScore = (score / factors) * (factors / 1.0);

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(normalizedScore)));
}

export async function GET(request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "24h";
    const agentId = searchParams.get("agentId");
    const resourceType = searchParams.get("resourceType");

    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "1h":
        startDate.setHours(now.getHours() - 1);
        break;
      case "24h":
        startDate.setHours(now.getHours() - 24);
        break;
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setHours(now.getHours() - 24);
    }

    const query = {
      userId: session.user.id,
      timestamp: { $gte: startDate },
    };

    if (agentId) query.agentId = agentId;
    if (resourceType && ["proxy", "domain"].includes(resourceType)) {
      query.resourceType = resourceType;
    }

    const stats = await TrafficStats.find(query).sort({ timestamp: -1 });

    const timeSeriesData = await TrafficStats.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: {
              format:
                timeRange === "1h" || timeRange === "24h"
                  ? "%Y-%m-%d %H:00"
                  : "%Y-%m-%d",
              date: "$timestamp",
            },
          },
          inbound: { $sum: "$inboundBytes" },
          outbound: { $sum: "$outboundBytes" },
          total: { $sum: "$totalBytes" },
          requests: { $sum: "$requests" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalTraffic = stats.reduce((sum, s) => sum + s.totalBytes, 0);
    const inboundTraffic = stats.reduce((sum, s) => sum + s.inboundBytes, 0);
    const outboundTraffic = stats.reduce((sum, s) => sum + s.outboundBytes, 0);
    const totalRequests = stats.reduce((sum, s) => sum + s.requests, 0);
    const totalResponseTime = stats.reduce(
      (sum, s) => sum + s.responseTimeMs,
      0,
    );
    const avgResponseTime =
      stats.length > 0 ? Math.round(totalResponseTime / stats.length) : 0;
    const totalErrors = stats.reduce((sum, s) => sum + (s.errors || 0), 0);
    const totalBlocked = stats.reduce(
      (sum, s) => sum + (s.blockedRequests || 0),
      0,
    );
    const totalRateLimitBlocks = stats.reduce(
      (sum, s) => sum + (s.rateLimitBlocks || 0),
      0,
    );
    const totalFirewallBlocks = stats.reduce(
      (sum, s) => sum + (s.firewallBlocks || 0),
      0,
    );
    const totalL4Blocks = stats.reduce((sum, s) => sum + (s.l4Blocks || 0), 0);

    const agentStats = {};
    for (const stat of stats) {
      const agentIdStr = stat.agentId.toString();
      if (!agentStats[agentIdStr]) {
        agentStats[agentIdStr] = {
          agentId: stat.agentId,
          totalBytes: 0,
          requests: 0,
        };
      }
      agentStats[agentIdStr].totalBytes += stat.totalBytes;
      agentStats[agentIdStr].requests += stat.requests;
    }

    const topAgentsIds = Object.entries(agentStats)
      .sort(([, a], [, b]) => b.totalBytes - a.totalBytes)
      .slice(0, 10)
      .map(([agentId]) => agentId);

    const topAgents = await Agent.find({ _id: { $in: topAgentsIds } }).select(
      "name agentId",
    );

    const topAgentsList = topAgentsIds.map((agentId) => {
      const agent = topAgents.find((a) => a._id.toString() === agentId);
      const stats = agentStats[agentId];
      return {
        agentId,
        name: agent?.name,
        agentIdShort: agent?.agentId,
        totalBytes: stats.totalBytes,
        requests: stats.requests,
      };
    });

    const agents = await Agent.find({ userId: session.user.id });
    const activeAgents = agents.filter((a) => a.isActive).length;
    const uptime =
      agents.length > 0
        ? Math.round((activeAgents / agents.length) * 100 * 10) / 10
        : 100;

    const proxyStats = await TrafficStats.aggregate([
      {
        $match: {
          userId: session.user.id,
          timestamp: { $gte: startDate },
          resourceType: "proxy",
        },
      },
      {
        $group: {
          _id: null,
          totalBytes: { $sum: "$totalBytes" },
          requests: { $sum: "$requests" },
        },
      },
    ]);

    const domainStats = await TrafficStats.aggregate([
      {
        $match: {
          userId: session.user.id,
          timestamp: { $gte: startDate },
          resourceType: "domain",
        },
      },
      {
        $group: {
          _id: null,
          totalBytes: { $sum: "$totalBytes" },
          requests: { $sum: "$requests" },
        },
      },
    ]);

    return NextResponse.json({
      stats: {
        totalTraffic,
        inboundTraffic,
        outboundTraffic,
        requests: totalRequests,
        avgResponseTime,
        uptime,
        errors: totalErrors,
        blockedRequests: totalBlocked,
        rateLimitBlocks: totalRateLimitBlocks,
        firewallBlocks: totalFirewallBlocks,
        l4Blocks: totalL4Blocks,
      },
      byType: {
        proxy: {
          totalBytes: proxyStats[0]?.totalBytes || 0,
          requests: proxyStats[0]?.requests || 0,
        },
        domain: {
          totalBytes: domainStats[0]?.totalBytes || 0,
          requests: domainStats[0]?.requests || 0,
        },
      },
      topAgents: topAgentsList,
      timeSeries: timeSeriesData.map((item) => ({
        time: item._id,
        inbound: item.inbound,
        outbound: item.outbound,
        total: item.total,
        requests: item.requests,
      })),
      timeRange,
    });
  } catch (error) {
    console.error("Statistics error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении статистики" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const authHeader = request.headers.get("authorization");
    const body = await request.json();

    // AGENT POST (Bearer token)
    if (authHeader?.startsWith("Bearer ")) {
      const {
        agentId,
        resourceType,
        resourceId,
        inboundBytes,
        outboundBytes,
        requests,
        responseTimeMs,
        errors,
        blockedRequests,
        rateLimitBlocks,
        firewallBlocks,
        l4Blocks,
        systemMetrics,
      } = body;

      if (!agentId || !resourceType) {
        return NextResponse.json(
          { error: "agentId и resourceType обязательны" },
          { status: 400 },
        );
      }

      if (!["proxy", "domain"].includes(resourceType)) {
        return NextResponse.json(
          { error: "resourceType должен быть 'proxy' или 'domain'" },
          { status: 400 },
        );
      }

      const agent = await Agent.findOne({ agentId });
      if (!agent)
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });

      // Update agent system metrics if provided
      if (systemMetrics) {
        const loadScore = calculateLoadScore(systemMetrics);

        await Agent.findByIdAndUpdate(agent._id, {
          systemMetrics: {
            cpuUsagePercent: systemMetrics.cpuUsagePercent || 0,
            memoryUsagePercent: systemMetrics.memoryUsagePercent || 0,
            memoryUsedBytes: systemMetrics.memoryUsedBytes || 0,
            memoryTotalBytes: systemMetrics.memoryTotalBytes || 0,
            diskReadBytesPS: systemMetrics.diskReadBytesPS || 0,
            diskWriteBytesPS: systemMetrics.diskWriteBytesPS || 0,
            networkRxBytesPS: systemMetrics.networkRxBytesPS || 0,
            networkTxBytesPS: systemMetrics.networkTxBytesPS || 0,
            loadAverage1Min: systemMetrics.loadAverage1Min || 0,
            loadAverage5Min: systemMetrics.loadAverage5Min || 0,
            loadAverage15Min: systemMetrics.loadAverage15Min || 0,
            numGoroutines: systemMetrics.numGoroutines || 0,
            lastUpdated: new Date(),
          },
          loadScore: loadScore,
        });
      }

      const totalBytes = (inboundBytes || 0) + (outboundBytes || 0);

      // Для прокси resourceId это порт (строка), нужно найти прокси по порту
      let finalResourceId;
      if (resourceType === "proxy" && resourceId) {
        // Пытаемся найти прокси по порту
        const ProxyModel = (await import("@/models/Proxy")).default;
        const sourcePort = Number.parseInt(resourceId, 10);

        if (!Number.isNaN(sourcePort)) {
          const proxy = await ProxyModel.findOne({
            userId: agent.userId,
            sourcePort: sourcePort,
          });

          if (proxy) {
            finalResourceId = proxy._id;
          } else {
            // Если прокси не найден, используем агента как fallback
            finalResourceId = agent._id;
          }
        } else {
          finalResourceId = agent._id;
        }
      } else {
        // Для доменов или агрегированной статистики используем агента
        finalResourceId = resourceId === "all" ? agent._id : resourceId;
      }

      const stats = await TrafficStats.create({
        userId: agent.userId,
        agentId: agent._id,
        resourceType,
        resourceId: finalResourceId,
        inboundBytes: inboundBytes || 0,
        outboundBytes: outboundBytes || 0,
        totalBytes,
        requests: requests || 0,
        responseTimeMs: responseTimeMs || 0,
        errors: errors || 0,
        blockedRequests: blockedRequests || 0,
        rateLimitBlocks: rateLimitBlocks || 0,
        firewallBlocks: firewallBlocks || 0,
        l4Blocks: l4Blocks || 0,
        timestamp: new Date(),
      });

      return NextResponse.json({ stats });
    }

    // USER SESSION POST (UI)
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      agentId,
      resourceType,
      resourceId,
      inboundBytes,
      outboundBytes,
      requests,
      responseTimeMs,
      errors,
      blockedRequests,
      rateLimitBlocks,
      firewallBlocks,
      l4Blocks,
    } = body;

    if (!agentId || !resourceType || !resourceId) {
      return NextResponse.json(
        { error: "agentId, resourceType и resourceId обязательны" },
        { status: 400 },
      );
    }

    if (!["proxy", "domain"].includes(resourceType)) {
      return NextResponse.json(
        { error: "resourceType должен быть 'proxy' или 'domain'" },
        { status: 400 },
      );
    }

    const agent = await Agent.findOne({
      _id: agentId,
      userId: session.user.id,
    });
    if (!agent)
      return NextResponse.json({ error: "Агент не найден" }, { status: 404 });

    const totalBytes = (inboundBytes || 0) + (outboundBytes || 0);

    const stats = await TrafficStats.create({
      userId: session.user.id,
      agentId: agent._id,
      resourceType,
      resourceId,
      inboundBytes: inboundBytes || 0,
      outboundBytes: outboundBytes || 0,
      totalBytes,
      requests: requests || 0,
      responseTimeMs: responseTimeMs || 0,
      errors: errors || 0,
      blockedRequests: blockedRequests || 0,
      rateLimitBlocks: rateLimitBlocks || 0,
      firewallBlocks: firewallBlocks || 0,
      l4Blocks: l4Blocks || 0,
      timestamp: new Date(),
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Traffic stats create error:", error);
    return NextResponse.json(
      { error: "Failed to create statistics" },
      { status: 500 },
    );
  }
}
