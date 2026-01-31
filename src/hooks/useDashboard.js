import { useQuery } from "@tanstack/react-query";

// Fetch comprehensive dashboard statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const [agentsRes, proxiesRes, domainsRes, bansRes, statsRes] =
        await Promise.all([
          fetch("/api/agent/list"),
          fetch("/api/proxy/list"),
          fetch("/api/domain/list"),
          fetch("/api/bans?type=active&limit=5"),
          fetch("/api/statistics"),
        ]);

      if (!agentsRes.ok) throw new Error("Failed to fetch agents");
      if (!proxiesRes.ok) throw new Error("Failed to fetch proxies");

      const agentsData = await agentsRes.json();
      const proxiesData = await proxiesRes.json();
      const domainsData = domainsRes.ok
        ? await domainsRes.json()
        : { domains: [] };
      const bansData = bansRes.ok
        ? await bansRes.json()
        : { bans: [], stats: {} };
      const statsData = statsRes.ok ? await statsRes.json() : { summary: {} };

      const agents = agentsData.agents || [];
      const proxies = proxiesData.proxies || [];
      const domains = domainsData.domains || [];

      // Calculate average load score across all agents
      const avgLoadScore =
        agents.length > 0
          ? agents.reduce((sum, a) => sum + (a.loadScore || 0), 0) /
            agents.length
          : 0;

      // Count healthy vs overloaded agents
      const healthyAgents = agents.filter(
        (a) => (a.loadScore || 0) < 80,
      ).length;
      const overloadedAgents = agents.filter(
        (a) => (a.loadScore || 0) >= 80,
      ).length;

      return {
        agents: {
          total: agents.length,
          active: agents.filter((a) => a.isActive).length,
          inactive: agents.filter((a) => !a.isActive && a.isConnected).length,
          disconnected: agents.filter((a) => !a.isConnected).length,
          healthy: healthyAgents,
          overloaded: overloadedAgents,
          avgLoadScore,
          data: agents,
        },
        proxies: {
          total: proxies.length,
          active: proxies.filter((p) => p.isActive).length,
          data: proxies,
        },
        domains: {
          total: domains.length,
          active: domains.filter((d) => d.isActive).length,
          withProxy: domains.filter((d) =>
            d.dnsRecords?.some((r) => r.httpProxyEnabled),
          ).length,
          withSSL: domains.filter((d) => d.httpProxy?.ssl?.enabled).length,
          data: domains,
        },
        bans: {
          total: bansData.stats?.total || 0,
          active: bansData.stats?.active || 0,
          permanent: bansData.stats?.permanent || 0,
          recent: bansData.bans || [],
        },
        traffic: {
          totalRequests: statsData.summary?.totalRequests || 0,
          totalTraffic: statsData.summary?.totalTrafficBytes || 0,
          blockedRequests: statsData.summary?.totalBlockedRequests || 0,
          avgResponseTime: statsData.summary?.avgResponseTimeMs || 0,
        },
      };
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

// Fetch recent activity (agents + proxies sorted by updated time)
export function useRecentActivity(limit = 8) {
  return useQuery({
    queryKey: ["dashboard", "activity", limit],
    queryFn: async () => {
      const [agentsRes, proxiesRes] = await Promise.all([
        fetch("/api/agent/list"),
        fetch("/api/proxy/list"),
      ]);

      if (!agentsRes.ok || !proxiesRes.ok) {
        throw new Error("Failed to fetch activity data");
      }

      const agentsData = await agentsRes.json();
      const proxiesData = await proxiesRes.json();

      const agents = agentsData.agents || [];
      const proxies = proxiesData.proxies || [];

      const activity = [
        ...agents.slice(0, 5).map((a) => ({
          type: "agent",
          id: a._id,
          title: a.name,
          status: a.isActive ? "active" : "inactive",
          time: a.lastSeen || a.createdAt,
          ip: a.ipAddress,
          location:
            a.manualLocation?.city && a.manualLocation?.country
              ? `${a.manualLocation.city}, ${a.manualLocation.country}`
              : a.ipInfo?.city && a.ipInfo?.country
                ? `${a.ipInfo.city}, ${a.ipInfo.country}`
                : null,
          isConnected: a.isConnected,
        })),
        ...proxies.slice(0, 5).map((p) => ({
          type: "proxy",
          id: p._id,
          title: p.name,
          status: p.isActive ? "active" : "inactive",
          time: p.updatedAt || p.createdAt,
          route: `${p.type.toUpperCase()} :${p.sourcePort} → ${p.destinationHost}:${p.destinationPort}`,
        })),
      ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, limit);

      return activity;
    },
    refetchInterval: 30000,
  });
}
