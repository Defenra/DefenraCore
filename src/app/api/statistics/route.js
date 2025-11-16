import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import TrafficStats from "@/models/TrafficStats";
import Agent from "@/models/Agent";

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
    let startDate = new Date();

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
    const totalResponseTime = stats.reduce((sum, s) => sum + s.responseTimeMs, 0);
    const avgResponseTime =
      stats.length > 0 ? Math.round(totalResponseTime / stats.length) : 0;
    const totalErrors = stats.reduce((sum, s) => sum + s.errors, 0);

    const agentStats = {};
    for (const stat of stats) {
      const agentIdStr = stat.agentId.toString();
      if (!agentStats[agentIdStr]) {
        agentStats[agentIdStr] = { agentId: stat.agentId, totalBytes: 0, requests: 0 };
      }
      agentStats[agentIdStr].totalBytes += stat.totalBytes;
      agentStats[agentIdStr].requests += stat.requests;
    }

    const topAgentsIds = Object.entries(agentStats)
      .sort(([, a], [, b]) => b.totalBytes - a.totalBytes)
      .slice(0, 10)
      .map(([agentId]) => agentId);

    const topAgents = await Agent.find({ _id: { $in: topAgentsIds } }).select("name agentId");

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
      agents.length > 0 ? Math.round((activeAgents / agents.length) * 100 * 10) / 10 : 100;

    const proxyStats = await TrafficStats.aggregate([
      {
        $match: { userId: session.user.id, timestamp: { $gte: startDate }, resourceType: "proxy" },
      },
      { $group: { _id: null, totalBytes: { $sum: "$totalBytes" }, requests: { $sum: "$requests" } } },
    ]);

    const domainStats = await TrafficStats.aggregate([
      {
        $match: { userId: session.user.id, timestamp: { $gte: startDate }, resourceType: "domain" },
      },
      { $group: { _id: null, totalBytes: { $sum: "$totalBytes" }, requests: { $sum: "$requests" } } },
    ]);

    return NextResponse.json({
      stats: { totalTraffic, inboundTraffic, outboundTraffic, requests: totalRequests, avgResponseTime, uptime, errors: totalErrors },
      byType: {
        proxy: { totalBytes: proxyStats[0]?.totalBytes || 0, requests: proxyStats[0]?.requests || 0 },
        domain: { totalBytes: domainStats[0]?.totalBytes || 0, requests: domainStats[0]?.requests || 0 },
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
    return NextResponse.json({ error: "Ошибка при получении статистики" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const authHeader = request.headers.get("authorization");
    const body = await request.json();

    // AGENT POST (Bearer token)
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const { agentId, resourceType, resourceId, inboundBytes, outboundBytes, requests, responseTimeMs, errors } = body;

      if (!agentId || !resourceType || !resourceId) {
        return NextResponse.json({ error: "agentId, resourceType и resourceId обязательны" }, { status: 400 });
      }

      if (!["proxy", "domain"].includes(resourceType)) {
        return NextResponse.json({ error: "resourceType должен быть 'proxy' или 'domain'" }, { status: 400 });
      }

      const agent = await Agent.findOne({ agentId });
      if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

      const totalBytes = (inboundBytes || 0) + (outboundBytes || 0);

      const stats = await TrafficStats.create({
        userId: agent.userId,
        agentId: agent._id,
        resourceType,
        resourceId,
        inboundBytes: inboundBytes || 0,
        outboundBytes: outboundBytes || 0,
        totalBytes,
        requests: requests || 0,
        responseTimeMs: responseTimeMs || 0,
        errors: errors || 0,
        timestamp: new Date(),
      });

      return NextResponse.json({ stats });
    }

    // USER SESSION POST (UI)
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { agentId, resourceType, resourceId, inboundBytes, outboundBytes, requests, responseTimeMs, errors } = body;

    if (!agentId || !resourceType || !resourceId) {
      return NextResponse.json({ error: "agentId, resourceType и resourceId обязательны" }, { status: 400 });
    }

    if (!["proxy", "domain"].includes(resourceType)) {
      return NextResponse.json({ error: "resourceType должен быть 'proxy' или 'domain'" }, { status: 400 });
    }

    const agent = await Agent.findOne({ _id: agentId, userId: session.user.id });
    if (!agent) return NextResponse.json({ error: "Агент не найден" }, { status: 404 });

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
      timestamp: new Date(),
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Traffic stats create error:", error);
    return NextResponse.json({ error: "Failed to create statistics" }, { status: 500 });
  }
}
