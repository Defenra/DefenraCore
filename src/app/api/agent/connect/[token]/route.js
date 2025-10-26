import { NextResponse } from "next/server";
import { autoAssignAgentToLocations } from "@/lib/autoAssignAgent";
import { extractIpFromRequest, getIpInfo } from "@/lib/ipInfo";
import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const agent = await Agent.findOne({ connectionToken: token });

    if (!agent) {
      return NextResponse.json(
        { error: "Invalid or expired connection token" },
        { status: 404 },
      );
    }

    if (agent.isConnected) {
      return NextResponse.json(
        { error: "This connection token has already been used" },
        { status: 409 },
      );
    }

    const ipAddress = extractIpFromRequest(request);
    const ipInfo = await getIpInfo(ipAddress);

    agent.isConnected = true;
    agent.isActive = true;
    agent.connectedAt = new Date();
    agent.lastSeen = new Date();
    agent.ipAddress = ipAddress;
    agent.ipInfo = ipInfo;
    agent.connectionToken = undefined;
    await agent.save();

    // Auto-assign agent to GeoDNS locations based on IP
    console.log(`[Agent Connect] ${agent.name} connected from ${ipAddress}`);
    console.log(`  Country: ${ipInfo.country} (${ipInfo.countryCode})`);

    const Domain = (await import("@/models/Domain")).default;
    const autoAssignment = await autoAssignAgentToLocations(
      agent.agentId,
      ipInfo,
      agent.userId,
      Domain,
    );

    console.log(`  Auto-assigned to: ${autoAssignment.locations.join(", ")}`);

    return NextResponse.json({
      success: true,
      message: "Agent connected successfully",
      config: {
        agentId: agent.agentId,
        agentKey: agent.agentKey,
        pollingInterval: agent.pollingInterval,
        apiEndpoint: `/api/agent/poll`,
      },
      autoAssignment: {
        locations: autoAssignment.locations,
        assignedCount: autoAssignment.assignedCount,
        message: autoAssignment.message,
      },
    });
  } catch (error) {
    console.error("Agent connection error:", error);
    return NextResponse.json({ error: "Connection failed" }, { status: 500 });
  }
}
