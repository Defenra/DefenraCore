"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconActivity, IconServer, IconNetwork, IconShield, IconUsers, IconClock, IconAlertCircle, IconTrendingUp } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TimeSeriesChart, BarChartComponent, GaugeChart } from "@/components/monitoring/charts";
import { useAgents } from "@/hooks/useAgents";
import { cn } from "@/lib/utils";

// Panel Component (Grafana-style)
function Panel({ title, children, className, actions, loading = false, empty = false, emptyMessage = "No data available" }) {
  return (
    <Card className={cn("border border-border/40 bg-card/60 overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border/40 bg-muted/30">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
          {title}
        </CardTitle>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent className="p-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : empty ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

// Stat Card for Grafana-style grid
function StatCard({ title, value, unit, icon: Icon, color = "primary", loading = false }) {
  const colorClasses = {
    primary: "text-primary",
    success: "text-emerald-500",
    warning: "text-amber-500",
    danger: "text-red-500",
  };

  return (
    <Card className="border border-border/40 bg-card/60">
      <CardContent className="p-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold">{value}</span>
                {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
              </div>
            </div>
            <div className={cn("p-2 rounded-lg bg-primary/10", colorClasses[color])}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MonitoringPage() {
  const [timeRange, setTimeRange] = useState("1h");
  const { data: agents = [], isLoading: agentsLoading } = useAgents();

  // Fetch monitoring data from real API
  const { data: metricsData, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ["monitoring", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/statistics?timeRange=${timeRange}`);
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch active bans data
  const { data: bansData, isLoading: bansLoading } = useQuery({
    queryKey: ["bans", "active", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/bans?type=active&timeRange=${timeRange}`);
      if (!res.ok) throw new Error("Failed to fetch bans");
      return res.json();
    },
    refetchInterval: 30000,
  });

  // Agent load series configuration - sorted alphabetically for consistency
  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [agents]);

  // Process real time series data from API
  const loadData = useMemo(() => {
    // Use sorted agents for consistency
    const agentsToShow = sortedAgents.slice(0, 10);
    
    // If we have timeSeries data, use it
    if (metricsData?.timeSeries?.length && agentsToShow.length) {
      return metricsData.timeSeries.map((point) => {
        const dataPoint = {
          time: new Date(point.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        
        // Add load data for each agent from real metrics
        agentsToShow.forEach((agent) => {
          const agentMetrics = point.agents?.find(a => a.agentId === agent.agentId);
          dataPoint[agent.name || agent.agentId] = agentMetrics?.loadScore || agent.loadScore || 0;
        });
        
        return dataPoint;
      });
    }
    
    // Fallback: create single point from current agent metrics
    if (agentsToShow.length) {
      const dataPoint = {
        time: "Current",
      };
      agentsToShow.forEach((agent) => {
        dataPoint[agent.name || agent.agentId] = agent.loadScore || 0;
      });
      return [dataPoint];
    }
    
    return [];
  }, [metricsData, sortedAgents]);

  const agentLoadSeries = useMemo(() => {
    const colors = ["#3b82f6", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"];
    return sortedAgents.slice(0, 10).map((agent, idx) => ({
      key: agent.name || agent.agentId,
      name: agent.name || `Agent ${idx + 1}`,
      color: colors[idx % colors.length],
    }));
  }, [sortedAgents]);

  // Real traffic data from API
  // API returns timeSeries in format: [{time, inbound, outbound, total, requests, activeBans}]
  const trafficData = useMemo(() => {
    // If we have timeSeries, use it
    if (metricsData?.timeSeries?.length) {
      return metricsData.timeSeries.map((point) => ({
        time: new Date(point.time || point.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        requests: point.requests || point.totalRequests || 0,
        blocked: point.activeBans || point.blockedRequests || 0,
      }));
    }

    // Fallback: use topAgents data with agent names - sorted alphabetically
    if (metricsData?.topAgents?.length) {
      const sortedTopAgents = [...metricsData.topAgents].sort((a, b) => 
        (a.name || "").localeCompare(b.name || "")
      );
      const totalRequests = sortedTopAgents.reduce((sum, a) => sum + (a.requests || 0), 0);
      const totalBlocked = metricsData.stats?.blockedRequests || 0;
      
      return sortedTopAgents.map((agent) => {
        // Distribute blocked requests proportionally based on request share
        const requestShare = totalRequests > 0 ? (agent.requests || 0) / totalRequests : 0;
        const blocked = Math.round(totalBlocked * requestShare);
        
        return {
          time: agent.name?.substring(0, 15) || "Unknown",
          requests: agent.requests || 0,
          blocked: blocked,
        };
      });
    }

    // If no data at all, show single point with totals from stats
    if (metricsData?.stats) {
      return [{
        time: "Current",
        requests: metricsData.stats.requests || 0,
        blocked: metricsData.stats.blockedRequests || 0
      }];
    }

    return [{ time: "Current", requests: 0, blocked: 0 }];
  }, [metricsData]);

  // Real stats from API or calculate from agents
  const stats = useMemo(() => {
    const activeAgents = agents.filter((a) => a.isActive).length;
    const avgLoad = agents.length > 0 
      ? Math.floor(agents.reduce((s, a) => s + (a.loadScore || 0), 0) / agents.length)
      : 0;
    
    // Get latest metrics point
    const latestPoint = metricsData?.timeSeries?.[metricsData.timeSeries.length - 1];
    
    // Calculate requests/min from timeSeries data if available
    // The API returns timeSeries with format: [{time, inbound, outbound, total, requests, activeBans}]
    let requestsPerMinute = 0;
    if (metricsData?.timeSeries && metricsData.timeSeries.length > 0) {
      // Calculate total requests in the time range and divide by minutes
      const totalRequests = metricsData.timeSeries.reduce((sum, point) => sum + (point.requests || 0), 0);
      const timeRangeMinutes = timeRange === "1h" ? 60 : timeRange === "24h" ? 1440 : 10080; // 7d
      requestsPerMinute = Math.round(totalRequests / timeRangeMinutes);
    } else if (metricsData?.stats?.requests) {
      // Fallback: calculate from stats.totalRequests divided by time range
      const timeRangeMinutes = timeRange === "1h" ? 60 : timeRange === "24h" ? 1444 : 10080;
      requestsPerMinute = Math.round(metricsData.stats.requests / timeRangeMinutes);
    }
    
    // Calculate blocks per minute from bans data
    // Count bans in the last minute for real-time rate
    let blockedPerMinute = 0;
    if (bansData?.bans) {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000); // Last minute
      
      const bansLastMinute = bansData.bans.filter(ban => {
        const banTime = new Date(ban.bannedAt || ban.createdAt || ban.timestamp);
        return banTime >= oneMinuteAgo;
      });
      
      blockedPerMinute = bansLastMinute.length;
    }
    
    return {
      totalAgents: agents.length,
      activeAgents,
      avgLoad,
      requestsPerMinute,
      blockedPerMinute,
      activeUsers: (metricsData?.stats?.requests || 0) - (metricsData?.stats?.blockedRequests || 0),
      totalRequests: metricsData?.stats?.requests || 0,
    };
  }, [agents, metricsData, bansData, timeRange]);

  const isLoading = agentsLoading || metricsLoading || bansLoading;
  const hasLoadData = agents.length > 0;  // Always true if we have agents (fallback data)
  const hasTrafficData = true;  // Always show at least fallback
  const hasAgents = agents.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
          <p className="text-muted-foreground mt-1">Real-time metrics and performance analytics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]">
            <IconClock className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last 1 hour</SelectItem>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Alert */}
      {metricsError && (
        <Alert variant="destructive">
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load metrics: {metricsError.message}. Showing agent data only.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Row - Real Data Only */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="Total Agents"
          value={stats.totalAgents}
          icon={IconServer}
          color="primary"
          loading={agentsLoading}
        />
        <StatCard
          title="Active Agents"
          value={stats.activeAgents}
          icon={IconActivity}
          color="success"
          loading={agentsLoading}
        />
        <StatCard
          title="Avg Load"
          value={stats.avgLoad}
          unit="%"
          icon={IconActivity}
          color={stats.avgLoad > 80 ? "danger" : stats.avgLoad > 60 ? "warning" : "success"}
          loading={agentsLoading}
        />
        <StatCard
          title="Requests/min"
          value={stats.requestsPerMinute.toLocaleString()}
          icon={IconNetwork}
          color="primary"
          loading={isLoading}
        />
        <StatCard
          title="Total Requests"
          value={stats.totalRequests.toLocaleString()}
          icon={IconTrendingUp}
          color="primary"
          loading={isLoading}
        />
        <StatCard
          title="Blocked/min"
          value={stats.blockedPerMinute.toLocaleString()}
          icon={IconShield}
          color={stats.blockedPerMinute > 100 ? "danger" : "warning"}
          loading={isLoading}
        />
        <StatCard
          title="Legitimate Requests"
          value={stats.activeUsers.toLocaleString()}
          icon={IconUsers}
          color="success"
          loading={isLoading}
        />
      </div>

      {/* Main Dashboard Grid - Grafana Style */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Agent Load Distribution - Real Data */}
        <Panel
          title="Agent Load Distribution"
          className="lg:col-span-2"
          loading={isLoading}
          empty={!hasLoadData && !isLoading}
          emptyMessage={hasAgents ? "Collecting data from agents... Metrics will appear shortly." : "No agents connected. Add agents to see load distribution."}
          actions={
            <span className="text-xs text-muted-foreground">
              {agents.length > 10 ? `Showing top 10 of ${agents.length} agents` : `${agents.length} agents`}
            </span>
          }
        >
          {hasLoadData && (
            metricsData?.timeSeries?.length ? (
              <TimeSeriesChart
                data={loadData}
                series={agentLoadSeries}
                height={300}
                type="line"
                yAxisFormatter={(v) => `${v}%`}
              />
            ) : (
              <BarChartComponent
                data={agents.slice(0, 10).map((agent) => ({
                  name: agent.name?.substring(0, 15) || "Unknown",
                  load: agent.loadScore || 0,
                }))}
                series={[{ key: "load", name: "Load %", color: "#3b82f6" }]}
                height={300}
                yAxisFormatter={(v) => `${v}%`}
              />
            )
          )}
        </Panel>

        {/* Request Rate - Real Data */}
        <Panel 
          title="Request Rate" 
          loading={metricsLoading}
          empty={!hasTrafficData && !metricsLoading}
          emptyMessage={hasAgents ? "No traffic data yet. Requests will appear as traffic flows through agents." : "Connect agents to begin monitoring traffic."}
        >
          {hasTrafficData && (
            <TimeSeriesChart
              data={trafficData}
              series={[
                { key: "requests", name: "Total Requests", color: "#3b82f6" },
                { key: "blocked", name: "Blocked", color: "#ef4444" },
              ]}
              height={250}
              type="area"
            />
          )}
        </Panel>

        {/* Top Agents by Load - Real Data */}
        <Panel title="Top Agents by Load" loading={agentsLoading} empty={agents.length === 0 && !agentsLoading}>
          <div className="space-y-3">
            {agents
              .sort((a, b) => (b.loadScore || 0) - (a.loadScore || 0))
              .slice(0, 5)
              .map((agent, idx) => (
                <div key={agent.id} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-6">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate">{agent.name}</span>
                      <span className={cn(
                        "font-medium",
                        agent.loadScore > 80 ? "text-red-500" :
                        agent.loadScore > 60 ? "text-amber-500" : "text-emerald-500"
                      )}>
                        {agent.loadScore || 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          agent.loadScore > 80 ? "bg-red-500" :
                          agent.loadScore > 60 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min(agent.loadScore || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Panel>

        {/* CPU Usage by Agent - Real Data */}
        <Panel 
          title="CPU Usage by Agent" 
          loading={agentsLoading}
          empty={agents.length === 0 && !agentsLoading}
        >
          {agents.length > 0 && (
            <BarChartComponent
              data={agents.slice(0, 10).map((a) => ({
                name: a.name?.substring(0, 15) || "Unknown",
                cpu: a.systemMetrics?.cpuUsagePercent || 0,
              }))}
              series={[{ key: "cpu", name: "CPU %", color: "#3b82f6" }]}
              height={250}
              yAxisFormatter={(v) => `${v}%`}
            />
          )}
        </Panel>

        {/* Memory Usage by Agent - Real Data */}
        <Panel 
          title="Memory Usage by Agent" 
          loading={agentsLoading}
          empty={agents.length === 0 && !agentsLoading}
        >
          {agents.length > 0 && (
            <BarChartComponent
              data={agents.slice(0, 10).map((a) => ({
                name: a.name?.substring(0, 15) || "Unknown",
                memory: a.systemMetrics?.memoryUsagePercent || 0,
              }))}
              series={[{ key: "memory", name: "Memory %", color: "#22c55e" }]}
              height={250}
              yAxisFormatter={(v) => `${v}%`}
            />
          )}
        </Panel>

        {/* Agent Health Overview - Real Data */}
        <Panel title="Agent Health Overview" loading={agentsLoading} empty={agents.length === 0 && !agentsLoading}>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <GaugeChart
                value={stats.activeAgents}
                max={stats.totalAgents || 1}
                label="Active"
                size={100}
              />
            </div>
            <div className="text-center">
              <GaugeChart
                value={agents.filter((a) => (a.loadScore || 0) < 80).length}
                max={agents.length || 1}
                label="Healthy"
                color="#22c55e"
                size={100}
              />
            </div>
          </div>
        </Panel>

        {/* Response Time Distribution - Will show when API provides data */}
        <Panel 
          title="Response Time Distribution" 
          loading={metricsLoading}
          empty={!metricsData?.responseTimeDistribution && !metricsLoading}
          emptyMessage="Response time data not available"
        >
          {metricsData?.responseTimeDistribution ? (
            <div className="space-y-4">
              {metricsData.responseTimeDistribution.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm w-24">{item.label}</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-primary" 
                      style={{ width: `${item.percentage}%` }} 
                    />
                  </div>
                  <span className="text-sm font-medium w-10 text-right">{item.percentage}%</span>
                </div>
              ))}
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
