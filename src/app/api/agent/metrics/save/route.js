import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AgentMetrics from "@/models/AgentMetrics";
import Agent from "@/models/Agent";

export async function POST(request) {
  try {
    await connectDB();

    // Get all active agents with system metrics
    const agents = await Agent.find({
      isActive: true,
      systemMetrics: { $exists: true },
    });

    if (agents.length === 0) {
      return NextResponse.json({ success: true, saved: 0 });
    }

    const now = new Date();
    const metricsToSave = [];

    for (const agent of agents) {
      if (!agent.systemMetrics) continue;

      const cpu = agent.systemMetrics.cpuUsagePercent || 0;
      const memory = agent.systemMetrics.memoryUsagePercent || 0;
      const load = Math.round(((cpu + memory) / 2) * 10) / 10;

      metricsToSave.push({
        agentId: agent._id,
        timestamp: now,
        load,
        cpu: Math.round(cpu * 10) / 10,
        memory: Math.round(memory * 10) / 10,
        loadScore: agent.loadScore || 0,
        agentName: agent.name,
        location: agent.manualLocation?.city || agent.ipInfo?.city || "Unknown",
        country:
          agent.manualLocation?.country || agent.ipInfo?.country || "Unknown",
        ipAddress: agent.ipAddress,
      });
    }

    if (metricsToSave.length > 0) {
      await AgentMetrics.insertMany(metricsToSave);
    }

    return NextResponse.json({
      success: true,
      saved: metricsToSave.length,
      timestamp: now,
    });
  } catch (error) {
    console.error("Error saving agent metrics:", error);
    return NextResponse.json(
      { error: "Failed to save metrics" },
      { status: 500 },
    );
  }
}
