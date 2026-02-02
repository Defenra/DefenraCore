import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getIpInfo } from "@/lib/ipInfo";
import {
  calculateHaversineDistance,
  findAllAgentsForLocation,
  LOCATION_COORDINATES,
} from "@/lib/geoFallback";
import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";
import Domain from "@/models/Domain";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ip = searchParams.get("ip");
    const domainId = searchParams.get("domainId");

    if (!ip) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 },
      );
    }

    // Validate IP format
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
      return NextResponse.json(
        { error: "Invalid IP address format" },
        { status: 400 },
      );
    }

    await connectDB();

    // 1. Get GeoIP info
    const ipInfo = await getIpInfo(ip);

    if (!ipInfo || ipInfo.country === "Unknown") {
      return NextResponse.json({
        ip,
        geoInfo: null,
        error: "Could not determine location for this IP",
      });
    }

    const clientLocation = ipInfo.countryCode?.toLowerCase();

    // 2. Find which agent would serve this IP
    let selectedAgent = null;
    let selectionMethod = null;
    let agentPool = [];
    let distance = null;

    // Get active agents
    const activeAgents = await Agent.find({ isActive: true }).lean();

    if (clientLocation) {
      // Try exact match first
      const exactMatchAgents = findAllAgentsForLocation(
        clientLocation,
        activeAgents,
      );

      if (exactMatchAgents.length > 0) {
        // Sort by load score and pick best
        exactMatchAgents.sort((a, b) => a.loadScore - b.loadScore);
        selectedAgent = exactMatchAgents[0];
        selectionMethod = "exact_match";
        agentPool = exactMatchAgents;
      } else {
        // Try fallback - find nearest agent by distance
        const clientCoords = LOCATION_COORDINATES[clientLocation];

        if (clientCoords) {
          let nearestAgent = null;
          let nearestDistance = Infinity;

          for (const agent of activeAgents) {
            const agentCountryCode =
              agent.manualLocation?.country?.toLowerCase() ||
              agent.ipInfo?.countryCode?.toLowerCase();

            if (!agentCountryCode) continue;

            const agentCoords = LOCATION_COORDINATES[agentCountryCode];
            if (!agentCoords) continue;

            const dist = calculateHaversineDistance(
              clientCoords.lat,
              clientCoords.lon,
              agentCoords.lat,
              agentCoords.lon,
            );

            if (dist < nearestDistance) {
              nearestDistance = dist;
              nearestAgent = agent;
            }
          }

          if (nearestAgent) {
            selectedAgent = {
              agentId: nearestAgent.agentId,
              agentName: nearestAgent.name,
              agentIp: nearestAgent.ipAddress,
              loadScore: nearestAgent.loadScore || 0,
              countryCode:
                nearestAgent.manualLocation?.country ||
                nearestAgent.ipInfo?.countryCode,
              country:
                nearestAgent.manualLocation?.country ||
                nearestAgent.ipInfo?.country,
              city:
                nearestAgent.manualLocation?.city || nearestAgent.ipInfo?.city,
            };
            selectionMethod = "nearest_fallback";
            distance = Math.round(nearestDistance);
          }
        }
      }
    }

    // 3. Get domain-specific GeoDNS config if domainId provided
    let domainConfig = null;
    if (domainId) {
      const domain = await Domain.findById(domainId).lean();
      if (domain) {
        domainConfig = {
          domain: domain.domain,
          geoDnsConfig: domain.geoDnsConfig || [],
          hasGeoDNS: domain.geoDnsConfig && domain.geoDnsConfig.length > 0,
        };

        // Check if there's a specific assignment for this location
        if (clientLocation && domain.geoDnsConfig) {
          const locationConfig = domain.geoDnsConfig.find(
            (cfg) => cfg.code.toLowerCase() === clientLocation,
          );
          if (locationConfig) {
            domainConfig.assignedLocation = locationConfig;
          }
        }
      }
    }

    // Format agent data
    let agentData = null;
    if (selectedAgent) {
      agentData = {
        agentId: selectedAgent.agentId || selectedAgent._id?.toString(),
        name: selectedAgent.agentName || selectedAgent.name,
        ip: selectedAgent.agentIp || selectedAgent.ipAddress,
        loadScore: selectedAgent.loadScore || 0,
        location: {
          countryCode: selectedAgent.countryCode,
          country: selectedAgent.country,
          city: selectedAgent.city,
        },
        isOverloaded: (selectedAgent.loadScore || 0) > 80,
      };

      if (agentPool.length > 0) {
        agentData.alternativeAgents = agentPool.slice(1, 4).map((agent) => ({
          agentId: agent.agentId,
          name: agent.agentName,
          ip: agent.agentIp,
          loadScore: agent.loadScore,
          isOverloaded: agent.loadScore > 80,
        }));
        agentData.totalAgentsInPool = agentPool.length;
      }
    }

    return NextResponse.json({
      ip,
      geoInfo: {
        country: ipInfo.country,
        countryCode: ipInfo.countryCode,
        region: ipInfo.region,
        city: ipInfo.city,
        timezone: ipInfo.timezone,
        isp: ipInfo.isp,
        lat: ipInfo.lat,
        lon: ipInfo.lon,
      },
      routing: {
        clientLocation,
        selectedAgent: agentData,
        selectionMethod,
        distance,
        politicalRestriction:
          clientLocation === "ua"
            ? "UA blocked from RU/BY agents"
            : clientLocation === "ru"
              ? "RU blocked from UA agents"
              : null,
      },
      domainConfig,
    });
  } catch (error) {
    console.error("IP Check error:", error);
    return NextResponse.json(
      { error: "Failed to check IP", details: error.message },
      { status: 500 },
    );
  }
}
