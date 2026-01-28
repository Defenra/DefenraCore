import { NextResponse } from "next/server";
import { checkAgentHealth } from "@/lib/agentHealthCheck";
import { buildAnycastRecords, calculateHaversineDistance, LOCATION_COORDINATES } from "@/lib/geoFallback";
import { extractIpFromRequest, getIpInfo } from "@/lib/ipInfo";
import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";
import Proxy from "@/models/Proxy";

export async function POST(request) {
  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { agentId, agentKey } = body;

    if (!agentId || !agentKey) {
      return NextResponse.json(
        { error: "Missing agentId or agentKey" },
        { status: 400 },
      );
    }

    const agent = await Agent.findOne({ agentId });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (agent.agentKey !== agentKey) {
      return NextResponse.json({ error: "Invalid agent key" }, { status: 401 });
    }

    const currentIp = extractIpFromRequest(request);
    const now = new Date();
    let ipChanged = false;

    // Update IP info if IP changed OR if ipInfo is missing/unknown
    if (
      currentIp &&
      (currentIp !== agent.ipAddress ||
        !agent.ipInfo ||
        agent.ipInfo.country === "Unknown" ||
        agent.ipInfo.countryCode === "Unknown")
    ) {
      const ipInfo = await getIpInfo(currentIp);

      // Only mark as changed if IP actually changed (not just missing ipInfo)
      if (currentIp !== agent.ipAddress) {
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
      }

      agent.ipAddress = currentIp;
      agent.ipInfo = ipInfo;

      // Log geolocation update only if it changed from Unknown
      if (
        ipInfo.country !== "Unknown" &&
        ipInfo.countryCode !== "Unknown" &&
        (!agent.ipInfo ||
          agent.ipInfo.country === "Unknown" ||
          agent.ipInfo.countryCode === "Unknown")
      ) {
        console.log(
          `[Poll] Updated geolocation for ${agent.name}: ${ipInfo.country} (${ipInfo.countryCode}), ${ipInfo.city}`,
        );
      }
    }

    agent.lastSeen = now;
    const wasInactive = !agent.isActive;
    agent.isActive = true;
    await agent.save();

    // Perform health check on other agents
    const healthCheck = await checkAgentHealth(Agent);

    // Reduce logging frequency - only log occasionally or when important changes happen
    const shouldLogDetails = Math.random() < 0.05 || wasInactive || ipChanged; // 5% chance or important events

    if (shouldLogDetails) {
      console.log(`[Poll] Agent: ${agent.name} (${agentId})`);
      console.log(
        `  IP: ${agent.ipAddress} (${agent.ipInfo?.country || "unknown"})`,
      );
      console.log(`  Was inactive: ${wasInactive}`);
      console.log(`  IP changed: ${ipChanged}`);
    }

    // Only log health check details occasionally to reduce spam
    if (shouldLogDetails || healthCheck.deactivated.length > 0) {
      console.log(
        `[Health Check] ${healthCheck.checkedCount} agents, ${healthCheck.activeCount} active, ${healthCheck.inactiveCount} inactive`,
      );
      if (healthCheck.deactivated.length > 0) {
        console.log(`  Deactivated: ${healthCheck.deactivated.join(", ")}`);
      }
    }

    // Get proxies for this specific agent
    const proxies = await Proxy.find({
      userId: agent.userId,
      isActive: true,
      $or: [{ agentId: agentId }, { agentId: null }],
    }).select("-userId -__v");

    // Get ALL active domains (from all users) - every agent needs full configuration
    const Domain = (await import("@/models/Domain")).default;
    const allDomains = await Domain.find({
      isActive: true,
    }).select("domain dnsRecords geoDnsConfig httpProxy description");

    console.log(
      `[GeoDNS] Building full configuration for all agents (${allDomains.length} domains)`,
    );

    // Get ALL active agents (from all users) with their geolocation for dynamic routing
    const allAgents = await Agent.find({
      isActive: true, // CRITICAL: Only active agents
      ipAddress: { $exists: true, $ne: null }, // Must have IP address
    }).select(
      "agentId ipAddress name isActive ipInfo manualLocation loadScore",
    );

    // Only log agent details occasionally to reduce spam
    if (shouldLogDetails) {
      console.log(`[Active Agents] Found ${allAgents.length} active agents:`);
      allAgents.forEach((a) => {
        const location =
          a.manualLocation?.country || a.ipInfo?.countryCode || "UNKNOWN";
        console.log(
          `  - ${a.name} (${a.agentId.substring(0, 20)}...) → ${a.ipAddress}`,
        );
        console.log(
          `    location: ${location} ${a.manualLocation?.country ? "(manual)" : "(auto)"}`,
        );
        console.log(
          `    ipInfo: ${a.ipInfo ? JSON.stringify({ country: a.ipInfo.country, countryCode: a.ipInfo.countryCode, city: a.ipInfo.city }) : "MISSING"}`,
        );
      });
    }

    // Build comprehensive configuration for agent
    // ALL agents get ALL domains (they all act as NS servers)
    const domainsConfig = allDomains.map((d) => {
      // Build anycast DNS records with fallback logic
      // ALL agents get full GeoDNS map for answering client queries
      // Transform agents to include loadScore for load-based selection
      const agentsWithLoad = allAgents.map((a) => ({
        agentId: a.agentId,
        ipAddress: a.ipAddress,
        name: a.name,
        isActive: a.isActive,
        ipInfo: a.ipInfo,
        manualLocation: a.manualLocation,
        loadScore: a.loadScore || 0,
      }));

      const anycastRecords = buildAnycastRecords(d, agentsWithLoad);

      // Build GeoDNS map from anycast records
      // For each location, create map entry with array of agent IPs and weights
      const geoDnsMap = {};
      const geoDnsAgentPools = {}; // location -> array of {ip, weight, loadScore}
      const geoDnsFallbackMap = {}; // country -> nearest agent IP (for countries without direct agents)

      for (const record of anycastRecords) {
        if (!record.agents || record.agents.length === 0) {
          continue; // Skip locations without agents
        }

        const locationCode = record.locationCode || record.name;

        // Store agent pool for this location
        geoDnsAgentPools[locationCode] = record.agents.map((a) => ({
          ip: a.agentIp,
          weight: a.weight,
          loadScore: a.loadScore,
          agentId: a.agentId,
          agentName: a.agentName,
        }));

        // For backward compatibility: store first (best) agent IP in simple map
        // This is used by old DNS logic as fallback
        geoDnsMap[locationCode] = record.agents[0].agentIp;
      }

      // Build fallback map: for EVERY country, find nearest agent
      // This ensures clients always get geographically optimal routing
      // Even if exact country match exists, fallback provides secondary option
      
      const allCountryCodes = Object.keys(LOCATION_COORDINATES);
      const politicalRestrictions = {
        // Ukraine clients should NOT be routed to Russia
        ua: ['ru'],
        // Add more restrictions if needed
      };

      // Helper: calculate distance between two countries
      const calculateCountryDistance = (fromCountry, toCountry) => {
        const from = LOCATION_COORDINATES[fromCountry.toLowerCase()];
        const to = LOCATION_COORDINATES[toCountry.toLowerCase()];
        
        if (!from || !to) return 999999; // Unknown location = very far
        
        return calculateHaversineDistance(from.lat, from.lon, to.lat, to.lon);
      };

      // Helper: check if routing is politically restricted
      const isRoutingRestricted = (fromCountry, toCountry) => {
        const restrictions = politicalRestrictions[fromCountry.toLowerCase()];
        if (!restrictions) return false;
        return restrictions.includes(toCountry.toLowerCase());
      };

      // Helper: get continent for country (for countries without coordinates)
      const getContinentForCountry = (countryCode) => {
        const code = countryCode.toUpperCase();
        
        // Europe
        if (['AL','AD','AT','BY','BE','BA','BG','HR','CY','CZ','DK','EE','FO','FI','FR','DE','GI','GR','GG','HU','IS','IE','IM','IT','JE','XK','LV','LI','LT','LU','MK','MT','MD','MC','ME','NL','NO','PL','PT','RO','RU','SM','RS','SK','SI','ES','SJ','SE','CH','UA','GB','VA'].includes(code)) {
          return 'europe';
        }
        // Asia
        if (['AF','AM','AZ','BH','BD','BT','BN','KH','CN','CX','CC','IO','GE','HK','IN','ID','IR','IQ','IL','JP','JO','KZ','KP','KR','KW','KG','LA','LB','MO','MY','MV','MN','MM','NP','OM','PK','PS','PH','QA','SA','SG','LK','SY','TW','TJ','TH','TL','TR','TM','AE','UZ','VN','YE'].includes(code)) {
          return 'asia';
        }
        // North America
        if (['AI','AG','AW','BS','BB','BZ','BM','BQ','CA','KY','CR','CU','CW','DM','DO','SV','GL','GD','GP','GT','HT','HN','JM','MQ','MX','MS','NI','PA','PM','PR','BL','KN','LC','MF','VC','SX','TT','TC','US','VG','VI'].includes(code)) {
          return 'north-america';
        }
        // South America
        if (['AR','BO','BR','CL','CO','EC','FK','GF','GY','PY','PE','SR','UY','VE'].includes(code)) {
          return 'south-america';
        }
        // Africa
        if (['DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CG','CD','CI','DJ','EG','GQ','ER','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','YT','MA','MZ','NA','NE','NG','RE','RW','ST','SN','SC','SL','SO','ZA','SS','SD','SZ','TZ','TG','TN','UG','EH','ZM','ZW'].includes(code)) {
          return 'africa';
        }
        // Oceania
        if (['AS','AU','CK','FJ','PF','GU','KI','MH','FM','NR','NC','NZ','NU','NF','MP','PW','PG','PN','WS','SB','TK','TO','TV','VU','WF'].includes(code)) {
          return 'oceania';
        }
        
        return 'unknown';
      };

      // Helper: find best agent for continent (for countries without coordinates)
      const findContinentAgent = (continent, excludeCountry) => {
        let bestAgent = null;
        let bestDistance = 999999;
        
        for (const [agentCountry, agentIp] of Object.entries(geoDnsMap)) {
          if (agentCountry === 'default' || agentCountry === excludeCountry) continue;
          
          const agentContinent = getContinentForCountry(agentCountry);
          if (agentContinent === continent) {
            // Same continent - prefer this
            return agentIp;
          }
        }
        
        // No agent in same continent - return any agent
        for (const [agentCountry, agentIp] of Object.entries(geoDnsMap)) {
          if (agentCountry === 'default' || agentCountry === excludeCountry) continue;
          return agentIp;
        }
        
        return null;
      };

      // Build fallback entries for ALL countries (not just those without direct agents)
      // This ensures proper geographic fallback when primary agent is unavailable
      for (const country of allCountryCodes) {
        const countryLower = country.toLowerCase();

        // Find nearest agent by geographic distance
        let nearestAgent = null;
        let nearestDistance = 999999;
        let nearestCountry = null;

        for (const [agentCountry, agentIp] of Object.entries(geoDnsMap)) {
          // Skip "default" key (origin IP)
          if (agentCountry === 'default') {
            continue;
          }

          // Skip same country (we want fallback, not primary)
          if (agentCountry.toLowerCase() === countryLower) {
            continue;
          }

          // Check political restrictions
          if (isRoutingRestricted(countryLower, agentCountry)) {
            continue;
          }

          // Calculate distance
          const distance = calculateCountryDistance(countryLower, agentCountry);
          
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestAgent = agentIp;
            nearestCountry = agentCountry;
          }
        }

        if (nearestAgent) {
          geoDnsFallbackMap[countryLower] = nearestAgent;
          
          // Log fallback mapping occasionally for debugging
          if (Math.random() < 0.05) {
            console.log(`[GeoDNS Fallback] ${countryLower.toUpperCase()} -> ${nearestCountry?.toUpperCase()} (${Math.round(nearestDistance)}km)`);
          }
        }
      }

      // For countries without coordinates, use continental fallback
      const allIsoCodes = [
        'af','ax','al','dz','as','ad','ao','ai','aq','ag','ar','am','aw','au','at','az','bs','bh','bd','bb','by','be','bz','bj','bm','bt','bo','bq','ba','bw','bv','br','io','bn','bg','bf','bi','cv','kh','cm','ca','ky','cf','td','cl','cn','cx','cc','co','km','cd','cg','ck','cr','ci','hr','cu','cw','cy','cz','dk','dj','dm','do','ec','eg','sv','gq','er','ee','sz','et','fk','fo','fj','fi','fr','gf','pf','tf','ga','gm','ge','de','gh','gi','gr','gl','gd','gp','gu','gt','gg','gn','gw','gy','ht','hm','va','hn','hk','hu','is','in','id','ir','iq','ie','im','il','it','jm','jp','je','jo','kz','ke','ki','kp','kr','kw','kg','la','lv','lb','ls','lr','ly','li','lt','lu','mo','mg','mw','my','mv','ml','mt','mh','mq','mr','mu','yt','mx','fm','md','mc','mn','me','ms','ma','mz','mm','na','nr','np','nl','nc','nz','ni','ne','ng','nu','nf','mk','mp','no','om','pk','pw','ps','pa','pg','py','pe','ph','pn','pl','pt','pr','qa','re','ro','ru','rw','bl','sh','kn','lc','mf','pm','vc','ws','sm','st','sa','sn','rs','sc','sl','sg','sx','sk','si','sb','so','za','gs','ss','es','lk','sd','sr','sj','se','ch','sy','tw','tj','tz','th','tl','tg','tk','to','tt','tn','tr','tm','tc','tv','ug','ua','ae','gb','um','us','uy','uz','vu','ve','vn','vg','vi','wf','eh','ye','zm','zw'
      ];
      
      for (const countryCode of allIsoCodes) {
        const countryLower = countryCode.toLowerCase();
        
        // Skip if already has fallback from coordinate-based calculation
        if (geoDnsFallbackMap[countryLower]) {
          continue;
        }
        
        // Skip if has direct agent
        if (geoDnsMap[countryLower]) {
          continue;
        }
        
        // Use continental fallback
        const continent = getContinentForCountry(countryCode);
        const fallbackAgent = findContinentAgent(continent, countryLower);
        
        if (fallbackAgent) {
          geoDnsFallbackMap[countryLower] = fallbackAgent;
        }
      }

      // Extract regular DNS records (filter out GeoDNS location records)
      const regularDnsRecords = (d.dnsRecords || []).filter(
        (record) => !record.isGeoDnsLocation,
      );

      return {
        id: d._id.toString(),
        domain: d.domain,
        description: d.description || "",

        // DNS Records: regular records only (GeoDNS handled separately)
        dnsRecords: regularDnsRecords,

        // GeoDNS Map: Simple map for backward compatibility (location -> best agent IP)
        geoDnsMap: geoDnsMap,

        // GeoDNS Fallback Map: Country fallbacks to nearest agent (cz -> de agent, etc.)
        geoDnsFallbackMap: geoDnsFallbackMap,

        // GeoDNS Agent Pools: Full data for load balancing (location -> array of agents with weights)
        geoDnsAgentPools: geoDnsAgentPools,

        // GeoDNS Locations (ALL locations - agents are selected dynamically)
        geoDnsLocations: (d.geoDnsConfig || []).map((loc) => ({
          code: loc.code, // us, europe, etc.
          name: loc.name, // США, Европа
          type: loc.type, // country, continent, custom
          subdomain: `${loc.code}`, // us
        })),

        // HTTP Proxy Configuration
        httpProxy: {
          enabled: d.httpProxy?.enabled || false, // CRITICAL: DNS needs this to return agent IP
          type: d.httpProxy?.type || "both", // http, https, both
          originHost: d.httpProxy?.originHost || null,
          originPort: d.httpProxy?.originPort || null,
          antiDDoS: d.httpProxy?.antiDDoS || null,
        },

        // SSL/TLS Configuration
        ssl: {
          enabled: d.httpProxy?.ssl?.enabled || false,
          certificate: d.httpProxy?.ssl?.certificate || null,
          privateKey: d.httpProxy?.ssl?.privateKey || null,
          autoRenew: d.httpProxy?.ssl?.autoRenew || false,
          acmeHttpChallenge: {
            token: d.httpProxy?.ssl?.acmeHttpChallenge?.token || "",
            keyAuthorization:
              d.httpProxy?.ssl?.acmeHttpChallenge?.keyAuthorization || "",
          },
        },

        // Lua WAF Code
        luaCode: d.httpProxy?.luaCode || null,

        // Page Rules
        pageRules: (d.pageRules || []).map((rule) => ({
          enabled: rule.enabled !== undefined ? rule.enabled : true,
          priority: rule.priority || 1,
          urlPattern: rule.urlPattern,
          actions: {
            securityLevel: rule.actions?.securityLevel || null,
            cacheLevel: rule.actions?.cacheLevel || null,
            browserCacheTtl: rule.actions?.browserCacheTtl || null,
            edgeCacheTtl: rule.actions?.edgeCacheTtl || null,
            alwaysUseHttps: rule.actions?.alwaysUseHttps || null,
            forwardingUrl: rule.actions?.forwardingUrl || null,
            disableSecurity: rule.actions?.disableSecurity || null,
            disableRateLimiting: rule.actions?.disableRateLimiting || null,
            customHeaders: rule.actions?.customHeaders || null,
            ipGeolocationHeader: rule.actions?.ipGeolocationHeader || null,
            originCacheControl: rule.actions?.originCacheControl || null,
            resolveOverride: rule.actions?.resolveOverride || null,
          },
        })),
      };
    });

    // Build comprehensive response
    const response = {
      success: true,
      message: "Configuration retrieved successfully",
      timestamp: new Date().toISOString(),

      // Agent's geo code for D-Agent-ID header
      geoCode:
        agent.manualLocation?.country?.toUpperCase() ||
        agent.ipInfo?.countryCode?.toUpperCase() ||
        "XX",

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
      proxies: proxies.map((proxy) => ({
        id: proxy._id.toString(),
        name: proxy.name,
        type: proxy.type, // tcp or udp
        sourcePort: proxy.sourcePort,
        destinationHost: proxy.destinationHost,
        destinationPort: proxy.destinationPort,
        enabled: proxy.isActive !== undefined ? proxy.isActive : true,
        proxyProtocol: proxy.proxyProtocol || false,
      })),

      // Statistics
      stats: {
        totalDomains: domainsConfig.length,
        totalProxies: proxies.length,
        totalDnsRecords: domainsConfig.reduce(
          (sum, d) => sum + d.dnsRecords.length,
          0,
        ),
        totalGeoDnsLocations: domainsConfig.reduce(
          (sum, d) => sum + d.geoDnsLocations.length,
          0,
        ),
      },

      // Next poll timing
      nextPollInterval: agent.pollingInterval,

      // Force system metrics reporting (temporary fix for monitoring)
      forceSystemMetrics: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Agent poll error:", error);
    return NextResponse.json({ error: "Poll failed" }, { status: 500 });
  }
}
