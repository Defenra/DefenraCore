import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";
import Domain from "@/models/Domain";
import { checkAgentActivity } from "@/lib/agentStatus";
import { buildAnycastRecords } from "@/lib/geoFallback";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const agents = await Agent.find({ userId: session.user.id });
    const domains = await Domain.find({ userId: session.user.id });

    const agentMap = new Map();
    const allAgents = [];

    for (const agent of agents) {
      const activityStatus = checkAgentActivity(agent);
      const agentData = {
        id: agent._id.toString(),
        agentId: agent.agentId,
        name: agent.name,
        isActive: activityStatus.isActive,
        isConnected: agent.isConnected,
        ipAddress: agent.ipAddress,
        ipInfo: agent.ipInfo,
      };
      agentMap.set(agent.agentId, agentData);
      allAgents.push(agentData);
    }

    const domainsList = [];

    for (const domain of domains) {
      if (!domain.geoDnsConfig || domain.geoDnsConfig.length === 0) {
        continue;
      }

      const anycastRecords = buildAnycastRecords(domain, allAgents);

      const locationRecords = anycastRecords
        .filter((r) => r.value)
        .map((record) => {
          const agent = agentMap.get(record.agentId);

          return {
            locationCode: record.locationCode,
            locationName: record.name,
            agentId: record.agentId,
            agentName: record.agentName,
            agentIp: record.value,
            agent: agent || null,
            isDirect: record.isDirect,
            distance: record.distance,
            description: record.description,
            ttl: record.ttl,
          };
        });

      domainsList.push({
        id: domain._id.toString(),
        domain: domain.domain,
        locations: locationRecords,
        locationCount: locationRecords.length,
        directCount: locationRecords.filter((l) => l.isDirect).length,
        fallbackCount: locationRecords.filter((l) => !l.isDirect).length,
      });
    }

    const totalLocations = domainsList.reduce(
      (sum, d) => sum + d.locationCount,
      0,
    );
    const totalDirect = domainsList.reduce((sum, d) => sum + d.directCount, 0);
    const totalFallback = domainsList.reduce(
      (sum, d) => sum + d.fallbackCount,
      0,
    );

    const stats = {
      totalAgents: agents.length,
      activeAgents: allAgents.filter((a) => a.isActive).length,
      totalDomains: domainsList.length,
      totalLocations: totalLocations,
      directAssignments: totalDirect,
      fallbackAssignments: totalFallback,
    };

    return NextResponse.json({
      domains: domainsList,
      stats,
    });
  } catch (error) {
    console.error("Error fetching GeoDNS map:", error);
    return NextResponse.json(
      { error: "Ошибка при получении карты GeoDNS" },
      { status: 500 },
    );
  }
}
