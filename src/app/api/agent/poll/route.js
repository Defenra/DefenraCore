import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";
import Proxy from "@/models/Proxy";
import { getIpInfo, extractIpFromRequest } from "@/lib/ipInfo";

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

    if (currentIp && currentIp !== agent.ipAddress) {
      const ipInfo = await getIpInfo(currentIp);
      
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
    agent.isActive = true;
    await agent.save();

    const proxies = await Proxy.find({
      userId: agent.userId,
      isActive: true,
      $or: [
        { agentId: agentId },
        { agentId: null }
      ]
    }).select('-userId -__v');

    // Get all active domains for this user
    const Domain = (await import("@/models/Domain")).default;
    const allDomains = await Domain.find({
      userId: agent.userId,
      isActive: true,
    }).select("domain dnsRecords geoDnsConfig httpProxy description");

    // Build comprehensive configuration for agent
    // Include only domains where agent is assigned to at least one GeoDNS location
    const domainsConfig = allDomains
      .filter(d => {
        // Agent must be assigned to at least one GeoDNS location for this domain
        return d.geoDnsConfig?.some(loc => loc.agentIds?.includes(agentId));
      })
      .map(d => ({
        id: d._id.toString(),
        domain: d.domain,
        description: d.description || "",
        
        // DNS Records (only with httpProxyEnabled)
        dnsRecords: (d.dnsRecords || [])
          .filter(r => r.httpProxyEnabled)
          .map(r => ({
            id: r._id?.toString(),
            name: r.name,
            type: r.type,
            value: r.value,  // Target IP/hostname for proxying
            ttl: r.ttl,
            priority: r.priority,
          })),
        
        // GeoDNS Locations where this agent is assigned
        geoDnsLocations: (d.geoDnsConfig || [])
          .filter(loc => loc.agentIds?.includes(agentId))
          .map(loc => ({
            code: loc.code,              // us, europe, etc.
            name: loc.name,              // США, Европа
            type: loc.type,              // country, continent, custom
            subdomain: `anycast1.${loc.code}`,  // anycast1.us
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
      }));

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
