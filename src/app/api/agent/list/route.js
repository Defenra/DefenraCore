import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";
import { auth } from "@/lib/auth";
import { checkAgentActivity } from "@/lib/agentStatus";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const agents = await Agent.find({ userId: session.user.id })
      .select("-agentKey -connectionToken")
      .sort({ createdAt: -1 });

    const agentsWithStatus = await Promise.all(
      agents.map(async (agent) => {
        const activityStatus = checkAgentActivity(agent);

        if (agent.isActive !== activityStatus.isActive) {
          agent.isActive = activityStatus.isActive;
          await agent.save();
        }

        return {
          id: agent._id,
          name: agent.name,
          agentId: agent.agentId,
          isConnected: agent.isConnected,
          isActive: activityStatus.isActive,
          status: activityStatus.status,
          statusText: activityStatus.statusText,
          pollingInterval: agent.pollingInterval,
          inactivityThreshold: agent.inactivityThreshold,
          lastSeen: agent.lastSeen,
          connectedAt: agent.connectedAt,
          createdAt: agent.createdAt,
          ipAddress: agent.ipAddress,
          ipInfo: agent.ipInfo,
          ipHistory: agent.ipHistory,
        };
      }),
    );

    return NextResponse.json({
      agents: agentsWithStatus,
    });
  } catch (error) {
    console.error("Agent list error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении списка агентов" },
      { status: 500 },
    );
  }
}
