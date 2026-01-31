import { NextResponse } from "next/server";
import { checkAgentHealth } from "@/lib/agentHealthCheck";
import {
  buildAnycastRecords,
  calculateHaversineDistance,
  LOCATION_COORDINATES,
} from "@/lib/geoFallback";
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

    // --- Обновление IP и гео-инфо ---
    if (
      currentIp &&
      (currentIp !== agent.ipAddress ||
        !agent.ipInfo ||
        agent.ipInfo.country === "Unknown" ||
        agent.ipInfo.countryCode === "Unknown")
    ) {
      const ipInfo = await getIpInfo(currentIp);

      if (currentIp !== agent.ipAddress) {
        ipChanged = true;
        if (agent.ipAddress) {
          if (!agent.ipHistory) agent.ipHistory = [];
          agent.ipHistory.push({
            ip: agent.ipAddress,
            changedAt: now,
            ipInfo: {
              country: agent.ipInfo?.country,
              city: agent.ipInfo?.city,
              isp: agent.ipInfo?.isp,
            },
          });
          if (agent.ipHistory.length > 10)
            agent.ipHistory = agent.ipHistory.slice(-10);
        }
      }

      agent.ipAddress = currentIp;
      agent.ipInfo = ipInfo;

      if (ipInfo.country !== "Unknown") {
        console.log(
          `[Poll] Updated geolocation for ${agent.name}: ${ipInfo.country}`,
        );
      }
    }

    agent.lastSeen = now;
    const wasInactive = !agent.isActive;
    agent.isActive = true;
    await agent.save();

    const healthCheck = await checkAgentHealth(Agent);

    // --- Сбор данных ---
    const proxies = await Proxy.find({
      userId: agent.userId,
      isActive: true,
      $or: [{ agentId: agentId }, { agentId: null }],
    }).select("-userId -__v");

    const Domain = (await import("@/models/Domain")).default;
    const allDomains = await Domain.find({ isActive: true }).select(
      "domain dnsRecords geoDnsConfig httpProxy description pageRules",
    );

    const allAgents = await Agent.find({
      isActive: true,
      ipAddress: { $exists: true, $ne: null },
    }).select(
      "agentId ipAddress name isActive ipInfo manualLocation loadScore",
    );

    console.log(
      `[GeoDNS] Building full configuration (${allDomains.length} domains)`,
    );

    const domainsConfig = allDomains.map((d) => {
      const agentsWithLoad = allAgents.map((a) => ({
        agentId: a.agentId,
        ipAddress: a.ipAddress,
        name: a.name,
        isActive: a.isActive,
        ipInfo: a.ipInfo,
        manualLocation: a.manualLocation,
        loadScore: a.loadScore || 0,
      }));

      // 1. Строим GeoDNS (Anycast) записи
      const anycastRecords = buildAnycastRecords(d, agentsWithLoad);

      const geoDnsMap = {};
      const geoDnsAgentPools = {};
      const geoDnsFallbackMap = {};

      // 2. Балансировка и пулы
      for (const record of anycastRecords) {
        if (!record.agents || record.agents.length === 0) continue;
        const locationCode = record.locationCode || record.name;

        // Сортировка: LoadScore (ASC) -> Random
        const sortedAgents = [...record.agents].sort((a, b) => {
          const loadDiff = (a.loadScore || 0) - (b.loadScore || 0);
          if (Math.abs(loadDiff) > 5) return loadDiff;
          return 0.5 - Math.random();
        });

        geoDnsAgentPools[locationCode] = sortedAgents.map((a) => ({
          ip: a.agentIp,
          weight: a.weight,
          loadScore: a.loadScore,
          agentId: a.agentId,
          agentName: a.agentName,
        }));

        geoDnsMap[locationCode] = sortedAgents[0].agentIp;
      }

      // 3. Политики и Fallback
      const allCountryCodes = Object.keys(LOCATION_COORDINATES);
      // Political routing restrictions - bidirectional blocks between conflicting regions
      const politicalRestrictions = {
        ua: ["ru", "by"], // UA protected from RU/BY
        ru: ["ua"],       // RU protected from UA (bidirectional)
      };

      const calculateCountryDistance = (fromCountry, toCountry) => {
        const from = LOCATION_COORDINATES[fromCountry.toLowerCase()];
        const to = LOCATION_COORDINATES[toCountry.toLowerCase()];
        if (!from || !to) return 999999;
        return calculateHaversineDistance(from.lat, from.lon, to.lat, to.lon);
      };

      const isRoutingRestricted = (fromCountry, toCountry) => {
        const restrictions = politicalRestrictions[fromCountry.toLowerCase()];
        return restrictions
          ? restrictions.includes(toCountry.toLowerCase())
          : false;
      };

      const getContinentForCountry = (countryCode) => {
        const code = countryCode.toUpperCase();
        if (
          [
            "AL",
            "AD",
            "AT",
            "BY",
            "BE",
            "BA",
            "BG",
            "HR",
            "CY",
            "CZ",
            "DK",
            "EE",
            "FO",
            "FI",
            "FR",
            "DE",
            "GI",
            "GR",
            "GG",
            "HU",
            "IS",
            "IE",
            "IM",
            "IT",
            "JE",
            "XK",
            "LV",
            "LI",
            "LT",
            "LU",
            "MK",
            "MT",
            "MD",
            "MC",
            "ME",
            "NL",
            "NO",
            "PL",
            "PT",
            "RO",
            "RU",
            "SM",
            "RS",
            "SK",
            "SI",
            "ES",
            "SJ",
            "SE",
            "CH",
            "UA",
            "GB",
            "VA",
            "TR",
          ].includes(code)
        )
          return "europe";
        if (
          [
            "AF",
            "AM",
            "AZ",
            "BH",
            "BD",
            "BT",
            "BN",
            "KH",
            "CN",
            "CX",
            "CC",
            "IO",
            "GE",
            "HK",
            "IN",
            "ID",
            "IR",
            "IQ",
            "IL",
            "JP",
            "JO",
            "KZ",
            "KP",
            "KR",
            "KW",
            "KG",
            "LA",
            "LB",
            "MO",
            "MY",
            "MV",
            "MN",
            "MM",
            "NP",
            "OM",
            "PK",
            "PS",
            "PH",
            "QA",
            "SA",
            "SG",
            "LK",
            "SY",
            "TW",
            "TJ",
            "TH",
            "TL",
            "TM",
            "AE",
            "UZ",
            "VN",
            "YE",
          ].includes(code)
        )
          return "asia";
        if (
          [
            "AI",
            "AG",
            "AW",
            "BS",
            "BB",
            "BZ",
            "BM",
            "BQ",
            "CA",
            "KY",
            "CR",
            "CU",
            "CW",
            "DM",
            "DO",
            "SV",
            "GL",
            "GD",
            "GP",
            "GT",
            "HT",
            "HN",
            "JM",
            "MQ",
            "MX",
            "MS",
            "NI",
            "PA",
            "PM",
            "PR",
            "BL",
            "KN",
            "LC",
            "MF",
            "VC",
            "SX",
            "TT",
            "TC",
            "US",
            "VG",
            "VI",
          ].includes(code)
        )
          return "north-america";
        if (
          [
            "AR",
            "BO",
            "BR",
            "CL",
            "CO",
            "EC",
            "FK",
            "GF",
            "GY",
            "PY",
            "PE",
            "SR",
            "UY",
            "VE",
          ].includes(code)
        )
          return "south-america";
        if (
          [
            "DZ",
            "AO",
            "BJ",
            "BW",
            "BF",
            "BI",
            "CM",
            "CV",
            "CF",
            "TD",
            "KM",
            "CG",
            "CD",
            "CI",
            "DJ",
            "EG",
            "GQ",
            "ER",
            "ET",
            "GA",
            "GM",
            "GH",
            "GN",
            "GW",
            "KE",
            "LS",
            "LR",
            "LY",
            "MG",
            "MW",
            "ML",
            "MR",
            "MU",
            "YT",
            "MA",
            "MZ",
            "NA",
            "NE",
            "NG",
            "RE",
            "RW",
            "ST",
            "SN",
            "SC",
            "SL",
            "SO",
            "ZA",
            "SS",
            "SD",
            "SZ",
            "TZ",
            "TG",
            "TN",
            "UG",
            "EH",
            "ZM",
            "ZW",
          ].includes(code)
        )
          return "africa";
        if (
          [
            "AS",
            "AU",
            "CK",
            "FJ",
            "PF",
            "GU",
            "KI",
            "MH",
            "FM",
            "NR",
            "NC",
            "NZ",
            "NU",
            "NF",
            "MP",
            "PW",
            "PG",
            "PN",
            "WS",
            "SB",
            "TK",
            "TO",
            "TV",
            "VU",
            "WF",
          ].includes(code)
        )
          return "oceania";
        return "unknown";
      };

      const findContinentAgent = (continent, fromCountry) => {
        // 1. Same continent, check politics
        for (const [agentCountry, agentIp] of Object.entries(geoDnsMap)) {
          if (agentCountry === "default") continue;
          if (agentCountry.toLowerCase() === fromCountry.toLowerCase())
            continue;
          if (isRoutingRestricted(fromCountry, agentCountry)) continue;

          if (getContinentForCountry(agentCountry) === continent)
            return agentIp;
        }
        // 2. Any valid agent
        for (const [agentCountry, agentIp] of Object.entries(geoDnsMap)) {
          if (agentCountry === "default") continue;
          if (isRoutingRestricted(fromCountry, agentCountry)) continue;
          return agentIp;
        }
        return null;
      };

      // DISABLED: Auto-fallback generation removed to enforce strict geo-routing
      // Countries without agents will get NXDOMAIN instead of being routed to distant agents
      /*
      // Fallback: Coordinates
      for (const country of allCountryCodes) {
        const countryLower = country.toLowerCase();
        let nearestAgent = null;
        let nearestDistance = 999999;

        for (const [agentCountry, agentIp] of Object.entries(geoDnsMap)) {
          if (agentCountry === "default") continue;
          if (agentCountry.toLowerCase() === countryLower) continue;
          if (isRoutingRestricted(countryLower, agentCountry)) continue;

          const distance = calculateCountryDistance(countryLower, agentCountry);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestAgent = agentIp;
          }
        }
        if (nearestAgent) geoDnsFallbackMap[countryLower] = nearestAgent;
      }
      */

      // DISABLED: Auto-fallback generation removed to enforce strict geo-routing
      // Countries without agents will get NXDOMAIN instead of being routed to distant agents
      /*
      // Fallback: Continents
      const allIsoCodes = [
        "af",
        "ax",
        "al",
        "dz",
        "as",
        "ad",
        "ao",
        "ai",
        "aq",
        "ag",
        "ar",
        "am",
        "aw",
        "au",
        "at",
        "az",
        "bs",
        "bh",
        "bd",
        "bb",
        "by",
        "be",
        "bz",
        "bj",
        "bm",
        "bt",
        "bo",
        "bq",
        "ba",
        "bw",
        "bv",
        "br",
        "io",
        "bn",
        "bg",
        "bf",
        "bi",
        "cv",
        "kh",
        "cm",
        "ca",
        "ky",
        "cf",
        "td",
        "cl",
        "cn",
        "cx",
        "cc",
        "co",
        "km",
        "cd",
        "cg",
        "ck",
        "cr",
        "ci",
        "hr",
        "cu",
        "cw",
        "cy",
        "cz",
        "dk",
        "dj",
        "dm",
        "do",
        "ec",
        "eg",
        "sv",
        "gq",
        "er",
        "ee",
        "sz",
        "et",
        "fk",
        "fo",
        "fj",
        "fi",
        "fr",
        "gf",
        "pf",
        "tf",
        "ga",
        "gm",
        "ge",
        "de",
        "gh",
        "gi",
        "gr",
        "gl",
        "gd",
        "gp",
        "gu",
        "gt",
        "gg",
        "gn",
        "gw",
        "gy",
        "ht",
        "hm",
        "va",
        "hn",
        "hk",
        "hu",
        "is",
        "in",
        "id",
        "ir",
        "iq",
        "ie",
        "im",
        "il",
        "it",
        "jm",
        "jp",
        "je",
        "jo",
        "kz",
        "ke",
        "ki",
        "kp",
        "kr",
        "kw",
        "kg",
        "la",
        "lv",
        "lb",
        "ls",
        "lr",
        "ly",
        "li",
        "lt",
        "lu",
        "mo",
        "mg",
        "mw",
        "my",
        "mv",
        "ml",
        "mt",
        "mh",
        "mq",
        "mr",
        "mu",
        "yt",
        "mx",
        "fm",
        "md",
        "mc",
        "mn",
        "me",
        "ms",
        "ma",
        "mz",
        "mm",
        "na",
        "nr",
        "np",
        "nl",
        "nc",
        "nz",
        "ni",
        "ne",
        "ng",
        "nu",
        "nf",
        "mk",
        "mp",
        "no",
        "om",
        "pk",
        "pw",
        "ps",
        "pa",
        "pg",
        "py",
        "pe",
        "ph",
        "pn",
        "pl",
        "pt",
        "pr",
        "qa",
        "re",
        "ro",
        "ru",
        "rw",
        "bl",
        "sh",
        "kn",
        "lc",
        "mf",
        "pm",
        "vc",
        "ws",
        "sm",
        "st",
        "sa",
        "sn",
        "rs",
        "sc",
        "sl",
        "sg",
        "sx",
        "sk",
        "si",
        "sb",
        "so",
        "za",
        "gs",
        "ss",
        "es",
        "lk",
        "sd",
        "sr",
        "sj",
        "se",
        "ch",
        "sy",
        "tw",
        "tj",
        "tz",
        "th",
        "tl",
        "tg",
        "tk",
        "to",
        "tt",
        "tn",
        "tr",
        "tm",
        "tc",
        "tv",
        "ug",
        "ua",
        "ae",
        "gb",
        "um",
        "us",
        "uy",
        "uz",
        "vu",
        "ve",
        "vn",
        "vg",
        "vi",
        "wf",
        "eh",
        "ye",
        "zm",
        "zw",
      ];

      for (const countryCode of allIsoCodes) {
        const countryLower = countryCode.toLowerCase();
        if (geoDnsFallbackMap[countryLower] || geoDnsMap[countryLower])
          continue;

        const fallbackAgent = findContinentAgent(
          getContinentForCountry(countryCode),
          countryLower,
        );
        if (fallbackAgent) geoDnsFallbackMap[countryLower] = fallbackAgent;
      }
      */

      // =========================================================
      // SECURITY FILTER: Prevent Origin IP Leak
      // =========================================================

      // Сначала берем все записи, кроме технических GeoDNS
      let regularDnsRecords = (d.dnsRecords || []).filter(
        (record) => !record.isGeoDnsLocation,
      );

      // ЕСЛИ ПРОКСИ ВКЛЮЧЕН: Фильтруем A-записи, ведущие на Origin
      if (d.httpProxy && d.httpProxy.enabled) {
        regularDnsRecords = regularDnsRecords.filter((record) => {
          // Проверяем, является ли запись корневой (@, пусто или имя домена)
          const isRootDomain =
            record.name === "@" ||
            record.name === "" ||
            record.name === d.domain;
          // Проверяем тип записи
          const isTypeIP = record.type === "A" || record.type === "AAAA";

          // Если это корневая запись типа IP -> УДАЛЯЕМ.
          // Агент должен отвечать своим IP (через GeoDNS логику), а не IP ориджина.
          if (isRootDomain && isTypeIP) {
            return false;
          }
          return true;
        });

        // Log для дебага (можно убрать в проде)
        // console.log(`[Security] Stripped origin IP records for ${d.domain}`);
      }

      // =========================================================

      return {
        id: d._id.toString(),
        domain: d.domain,
        description: d.description || "",
        dnsRecords: regularDnsRecords, // <-- Используем отфильтрованный список
        geoDnsMap: geoDnsMap,
        geoDnsFallbackMap: geoDnsFallbackMap,
        geoDnsAgentPools: geoDnsAgentPools,
        geoDnsLocations: (d.geoDnsConfig || []).map((loc) => ({
          code: loc.code,
          name: loc.name,
          type: loc.type,
          subdomain: `${loc.code}`,
        })),
        httpProxy: {
          enabled: d.httpProxy?.enabled || false,
          type: d.httpProxy?.type || "both",
          originHost: d.httpProxy?.originHost || null, // Агент получает Origin только здесь для настройки Nginx/Proxy
          originPort: d.httpProxy?.originPort || null,
          antiDDoS: d.httpProxy?.antiDDoS || null,
        },
        ssl: {
          enabled: d.httpProxy?.ssl?.enabled || false,
          certificate: d.httpProxy?.ssl?.certificate || null,
          privateKey: d.httpProxy?.ssl?.privateKey || null,
          autoRenew: d.httpProxy?.ssl?.autoRenew || false,
          acmeHttpChallenge: d.httpProxy?.ssl?.acmeHttpChallenge,
        },
        luaCode: d.httpProxy?.luaCode || null,
        pageRules: (d.pageRules || []).map((rule) => ({
          enabled: rule.enabled !== undefined ? rule.enabled : true,
          priority: rule.priority || 1,
          urlPattern: rule.urlPattern,
          actions: rule.actions || {},
        })),
      };
    });

    const response = {
      success: true,
      message: "Configuration retrieved successfully",
      timestamp: new Date().toISOString(),
      geoCode:
        agent.manualLocation?.country?.toUpperCase() ||
        agent.ipInfo?.countryCode?.toUpperCase() ||
        "XX",
      agent: {
        id: agentId,
        name: agent.name,
        pollingInterval: agent.pollingInterval,
        inactivityThreshold: agent.inactivityThreshold,
      },
      domains: domainsConfig,
      proxies: proxies.map((proxy) => ({
        id: proxy._id.toString(),
        name: proxy.name,
        type: proxy.type,
        sourcePort: proxy.sourcePort,
        destinationHost: proxy.destinationHost,
        destinationPort: proxy.destinationPort,
        enabled: proxy.isActive !== undefined ? proxy.isActive : true,
        proxyProtocol: proxy.proxyProtocol || false,
      })),
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
      nextPollInterval: agent.pollingInterval,
      forceSystemMetrics: true,
    };

    // Save metrics asynchronously (don't wait for it)
    if (agent.systemMetrics && agent.isActive) {
      const AgentMetrics = (await import("@/models/AgentMetrics")).default;

      const cpu = agent.systemMetrics.cpuUsagePercent || 0;
      const memory = agent.systemMetrics.memoryUsagePercent || 0;
      const load = Math.round(((cpu + memory) / 2) * 10) / 10;

      AgentMetrics.create({
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
      }).catch((err) => console.error("Failed to save metrics:", err));
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Agent poll error:", error);
    return NextResponse.json({ error: "Poll failed" }, { status: 500 });
  }
}
