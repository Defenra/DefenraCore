import { NextResponse } from "next/server";
import { checkAgentActivity } from "@/lib/agentStatus";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";

export async function GET(request) {
  try {
    await connectDB();

    let userId = null;

    // Check for agent authentication (Bearer token)
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const agentKey = authHeader.substring(7);

      // Find agent by key to get userId
      const agent = await Agent.findOne({ agentKey });
      if (agent) {
        userId = agent.userId;
      }
    }

    // If no agent auth, try user session
    if (!userId) {
      const session = await auth();
      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = session.user.id;
    }

    const agents = await Agent.find({ userId })
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
          tags: agent.tags,
          label: agent.label,
          category: agent.category,
          provider: agent.provider,
          price: agent.price,
          maxTraffic: agent.maxTraffic,
          nextPaymentDate: agent.nextPaymentDate,
          isPaid: agent.isPaid,
          manualLocation: agent.manualLocation,
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
