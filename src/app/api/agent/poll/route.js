import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";
import Proxy from "@/models/Proxy";
import { getIpInfo, extractIpFromRequest } from "@/lib/ipInfo";
import { buildAnycastRecords } from "@/lib/geoFallback";
import { autoAssignAgentToLocations, removeAgentFromAllLocations } from "@/lib/autoAssignAgent";
import { checkAgentHealth } from "@/lib/agentHealthCheck";

export async function POST(request) {
  try {
    await connectDB();

    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { agentId, agentKey } = body;

    if (!agentId || !agentKey) {
      return NextResponse.json(
        { error: "Missing agentId or agentKey" },
        { status: 400 }
      );
    }

    const agent = await Agent.findOne({ agentId });

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    if (agent.agentKey !== agentKey) {
      return NextResponse.json(
        { error: "Invalid agent key" },
        { status: 401 }
      );
    }

    const currentIp = extractIpFromRequest(request);
    const now = new Date();
    let ipChanged = false;

    if (currentIp && currentIp !== agent.ipAddress) {
      const ipInfo = await getIpInfo(currentIp);
      ipChanged = true;
      
      if (agent.ipAddress) {
        if (!agent.ipHistory) {
          agent.ipHistory = [];
        }
        agent.ipHistory.push({
          ip: agent.ipAddress,
          changedAt: now,
          ipInfo: {
            country: agent.ipInfo?.country,
            city: agent.ipInfo?.city,
            isp: agent.ipInfo?.isp,
          },
        });
        
        if (agent.ipHistory.length > 10) {
          agent.ipHistory = agent.ipHistory.slice(-10);
        }
      }
      
      agent.ipAddress = currentIp;
      agent.ipInfo = ipInfo;
    }

    agent.lastSeen = now;
    const wasInactive = !agent.isActive;
    agent.isActive = true;
    await agent.save();

    console.log(`[Poll] Agent: ${agent.name} (${agentId})`);
    console.log(`  IP: ${agent.ipAddress} (${agent.ipInfo?.country || 'unknown'})`);
    console.log(`  Was inactive: ${wasInactive}`);
    console.log(`  IP changed: ${ipChanged}`);

    // Check health of all agents (update their isActive status)
    const healthCheck = await checkAgentHealth(Agent);
    console.log(`[Health Check] ${healthCheck.checkedCount} agents, ${healthCheck.activeCount} active, ${healthCheck.inactiveCount} inactive`);
    if (healthCheck.deactivated.length > 0) {
      console.log(`  Deactivated: ${healthCheck.deactivated.join(', ')}`);
    }

    // Get proxies for this specific agent
    const proxies = await Proxy.find({
      userId: agent.userId,
      isActive: true,
      $or: [
        { agentId: agentId },
        { agentId: null }
      ]
    }).select('-userId -__v');

    // Get ALL active domains (from all users) - every agent needs full configuration
    const Domain = (await import("@/models/Domain")).default;
    const allDomains = await Domain.find({
      isActive: true,
    }).select("domain dnsRecords geoDnsConfig httpProxy description");
    
    console.log(`[GeoDNS] Building full configuration for all agents (${allDomains.length} domains)`);

    // Get ALL active agents (from all users) with their geolocation for dynamic routing
    const allAgents = await Agent.find({
      isActive: true,  // CRITICAL: Only active agents
      ipAddress: { $exists: true, $ne: null },  // Must have IP address
    }).select("agentId ipAddress name isActive ipInfo");

    console.log(`[Active Agents] Found ${allAgents.length} active agents:`);
    allAgents.forEach(a => {
      console.log(`  - ${a.name} (${a.agentId.substring(0, 20)}...) → ${a.ipAddress}`);
      console.log(`    ipInfo: ${a.ipInfo ? JSON.stringify({ country: a.ipInfo.country, countryCode: a.ipInfo.countryCode, city: a.ipInfo.city }) : 'MISSING'}`);
    });

    // Build comprehensive configuration for agent
    // ALL agents get ALL domains (they all act as NS servers)
    const domainsConfig = allDomains
      .map(d => {
        // Build anycast DNS records with fallback logic
        // ALL agents get full GeoDNS map for answering client queries
        const anycastRecords = buildAnycastRecords(d, allAgents);
        
        // Regular DNS records (without httpProxyEnabled filter - agent needs all DNS records)
        const regularDnsRecords = (d.dnsRecords || [])
          .map(r => ({
            id: r._id?.toString(),
            name: r.name,
            type: r.type,
            value: r.value,
            ttl: r.ttl,
            priority: r.priority,
            httpProxyEnabled: r.httpProxyEnabled || false,
          }));

        // ALL anycast records - agent needs full map to answer DNS queries
        const allAnycastRecords = anycastRecords
          .filter(r => r.value)  // Only records with assigned agents
          .map(r => ({
            name: r.name,  // "europe", "us", etc.
            type: r.type,
            value: r.value,  // IP of nearest agent for this location
            ttl: r.ttl,
            locationCode: r.locationCode,
            isFallback: r.isFallback,
            distance: r.distance,
            description: r.description,
          }));

        console.log(`  Domain ${d.domain}: ${regularDnsRecords.length} regular + ${allAnycastRecords.length} anycast records`);

        return {
          id: d._id.toString(),
          domain: d.domain,
          description: d.description || "",
          
          // DNS Records: regular + ALL anycast records (full GeoDNS map)
          dnsRecords: [
            ...regularDnsRecords,
            ...allAnycastRecords,  // Full map: location -> nearest agent IP
          ],
          
          // GeoDNS Locations (ALL locations - agents are selected dynamically)
          geoDnsLocations: (d.geoDnsConfig || [])
            .map(loc => ({
              code: loc.code,              // us, europe, etc.
              name: loc.name,              // США, Европа
              type: loc.type,              // country, continent, custom
              subdomain: `${loc.code}`,  // us
            })),
          
          // HTTP Proxy Configuration
          httpProxy: {
            type: d.httpProxy?.type || 'both',  // http, https, both
          },
          
          // SSL/TLS Configuration
          ssl: {
            enabled: d.httpProxy?.ssl?.enabled || false,
            certificate: d.httpProxy?.ssl?.certificate || null,
            privateKey: d.httpProxy?.ssl?.privateKey || null,
            autoRenew: d.httpProxy?.ssl?.autoRenew || false,
          },
          
          // Lua WAF Code
          luaCode: d.httpProxy?.luaCode || null,
        };
      });

    // Build comprehensive response
    const response = {
      success: true,
      message: "Configuration retrieved successfully",
      timestamp: new Date().toISOString(),
      
      // Agent Information
      agent: {
        id: agentId,
        name: agent.name,
        pollingInterval: agent.pollingInterval,
        inactivityThreshold: agent.inactivityThreshold,
      },
      
      // Domains Configuration
      domains: domainsConfig,
      
      // TCP/UDP Proxies
      proxies: proxies.map(proxy => ({
        id: proxy._id.toString(),
        name: proxy.name,
        type: proxy.type,  // tcp or udp
        sourcePort: proxy.sourcePort,
        destinationHost: proxy.destinationHost,
        destinationPort: proxy.destinationPort,
        enabled: true,
      })),
      
      // Statistics
      stats: {
        totalDomains: domainsConfig.length,
        totalProxies: proxies.length,
        totalDnsRecords: domainsConfig.reduce((sum, d) => sum + d.dnsRecords.length, 0),
        totalGeoDnsLocations: domainsConfig.reduce((sum, d) => sum + d.geoDnsLocations.length, 0),
      },
      
      // Next poll timing
      nextPollInterval: agent.pollingInterval,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Agent poll error:", error);
    return NextResponse.json(
      { error: "Poll failed" },
      { status: 500 }
    );
  }
}
