"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconActivity,
  IconCircleFilled,
  IconServer,
} from "@tabler/icons-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const MAX_DATA_POINTS = 60; // 60 minutes of history

// Generate consistent colors for agents
const AGENT_COLORS = [
  "rgb(59, 130, 246)", // blue
  "rgb(168, 85, 247)", // purple
  "rgb(249, 115, 22)", // orange
  "rgb(6, 182, 212)", // cyan
  "rgb(236, 72, 153)", // pink
  "rgb(34, 197, 94)", // green
  "rgb(234, 179, 8)", // yellow
  "rgb(239, 68, 68)", // red
  "rgb(20, 184, 166)", // teal
  "rgb(168, 162, 158)", // stone
  "rgb(147, 51, 234)", // violet
  "rgb(14, 165, 233)", // sky
];

export function AgentsStatusGraph({ agents }) {
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [agentColorMap, setAgentColorMap] = useState({});
  const isInitialMount = useRef(true);

  // Clear localStorage on page load (component mount)
  useEffect(() => {
    if (isInitialMount.current) {
      localStorage.removeItem("agents-metrics-history");
      localStorage.removeItem("agents-color-map");
      isInitialMount.current = false;
    }
  }, []);

  // Load history from localStorage on mount (after clearing)
  useEffect(() => {
    const stored = localStorage.getItem("agents-metrics-history");
    const colorMap = localStorage.getItem("agents-color-map");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMetricsHistory(parsed);
      } catch (e) {
        console.error("Failed to parse metrics history:", e);
      }
    }
    if (colorMap) {
      try {
        const parsed = JSON.parse(colorMap);
        setAgentColorMap(parsed);
      } catch (e) {
        console.error("Failed to parse color map:", e);
      }
    }
  }, []);

  // Assign colors to new agents
  useEffect(() => {
    if (!agents || agents.length === 0) return;

    const activeAgents = agents.filter((a) => a.isActive);
    const newColorMap = { ...agentColorMap };
    let colorIndex = Object.keys(newColorMap).length;

    activeAgents.forEach((agent) => {
      if (!newColorMap[agent.id]) {
        newColorMap[agent.id] = AGENT_COLORS[colorIndex % AGENT_COLORS.length];
        colorIndex++;
      }
    });

    if (JSON.stringify(newColorMap) !== JSON.stringify(agentColorMap)) {
      setAgentColorMap(newColorMap);
      localStorage.setItem("agents-color-map", JSON.stringify(newColorMap));
    }
  }, [agents, agentColorMap]);

  // Record current metrics
  useEffect(() => {
    if (!agents || agents.length === 0) return;

    const now = Date.now();
    const activeCount = agents.filter((a) => a.isActive).length;
    const inactiveCount = agents.filter(
      (a) => !a.isActive && a.isConnected,
    ).length;
    const pendingCount = agents.filter((a) => !a.isConnected).length;

    // Create data point with per-agent metrics
    const newDataPoint = {
      timestamp: now,
      time: new Date(now).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      active: activeCount,
      inactive: inactiveCount,
      pending: pendingCount,
      total: agents.length,
      agents: {}, // Store agent info for tooltip
    };

    // Calculate load for each active agent
    agents.forEach((agent) => {
      if (agent.isActive && agent.systemMetrics) {
        const cpu = agent.systemMetrics.cpuUsagePercent || 0;
        const memory = agent.systemMetrics.memoryUsagePercent || 0;
        const load = Math.round(((cpu + memory) / 2) * 10) / 10;

        // Store agent load as dynamic key
        newDataPoint[`agent_${agent.id}`] = load;

        // Store full agent info for tooltip
        newDataPoint.agents[agent.id] = {
          id: agent.id,
          name: agent.name,
          load: load,
          cpu: Math.round(cpu * 10) / 10,
          memory: Math.round(memory * 10) / 10,
          loadScore: agent.loadScore || 0,
          location:
            agent.manualLocation?.city || agent.ipInfo?.city || "Unknown",
          country:
            agent.manualLocation?.country || agent.ipInfo?.country || "Unknown",
          ipAddress: agent.ipAddress,
        };
      }
    });

    setMetricsHistory((prev) => {
      const updated = [...prev, newDataPoint].slice(-MAX_DATA_POINTS);
      localStorage.setItem("agents-metrics-history", JSON.stringify(updated));
      return updated;
    });
  }, [agents]);

  if (metricsHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconActivity className="h-5 w-5" />
            Мониторинг нагрузки агентов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            Сбор данных... График появится через минуту
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestData = metricsHistory[metricsHistory.length - 1];
  const activeAgents = agents.filter((a) => a.isActive);

  // Get all unique agent IDs from history
  const allAgentIds = new Set();
  metricsHistory.forEach((point) => {
    Object.keys(point).forEach((key) => {
      if (key.startsWith("agent_")) {
        allAgentIds.add(key.replace("agent_", ""));
      }
    });
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      // Find which agent line was hovered
      const hoveredAgent = payload.find((p) => p.dataKey.startsWith("agent_"));

      if (hoveredAgent && data.agents) {
        const agentId = hoveredAgent.dataKey.replace("agent_", "");
        const agentInfo = data.agents[agentId];

        if (agentInfo) {
          return (
            <div className="bg-white dark:bg-slate-800 p-3 border rounded-lg shadow-lg min-w-[200px]">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                <IconServer
                  className="h-4 w-4"
                  style={{ color: agentColorMap[agentId] }}
                />
                <p className="text-sm font-semibold">{agentInfo.name}</p>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Время:</span>
                  <span className="font-medium">{data.time}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Локация:</span>
                  <span className="font-medium">
                    {agentInfo.location}, {agentInfo.country}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">IP:</span>
                  <span className="font-mono text-[10px]">
                    {agentInfo.ipAddress}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2 space-y-1">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                      Нагрузка (CPU+RAM)/2:
                    </span>
                    <span
                      className="font-bold"
                      style={{ color: agentColorMap[agentId] }}
                    >
                      {agentInfo.load}%
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">CPU:</span>
                    <span className="font-medium text-blue-600">
                      {agentInfo.cpu}%
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Memory:</span>
                    <span className="font-medium text-purple-600">
                      {agentInfo.memory}%
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Load Score:</span>
                    <span className="font-medium text-orange-600">
                      {agentInfo.loadScore}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        }
      }

      // Fallback: show all agents at this time point
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border rounded-lg shadow-lg">
          <p className="text-sm font-semibold mb-2">{data.time}</p>
          <div className="space-y-1 text-xs">
            {Object.entries(data.agents || {}).map(([agentId, agentInfo]) => (
              <div key={agentId} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: agentColorMap[agentId] }}
                />
                <span>
                  {agentInfo.name}: {agentInfo.load}%
                </span>
              </div>
            ))}
            <div className="border-t pt-1 mt-1 text-muted-foreground">
              <div className="flex items-center gap-2">
                <IconCircleFilled className="h-2 w-2 text-green-500" />
                <span>Активные: {data.active}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <IconActivity className="h-5 w-5" />
          Мониторинг нагрузки агентов
        </CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span>
            {metricsHistory[0].time} — {latestData.time}
          </span>
          <span>•</span>
          <span>{metricsHistory.length} точек данных</span>
          <span>•</span>
          <div className="flex items-center gap-2">
            <IconCircleFilled className="h-2 w-2 text-green-500" />
            <span>Активные: {latestData.active}</span>
          </div>
          <div className="flex items-center gap-2">
            <IconCircleFilled className="h-2 w-2 text-yellow-500" />
            <span>Неактивные: {latestData.inactive}</span>
          </div>
          <div className="flex items-center gap-2">
            <IconCircleFilled className="h-2 w-2 text-slate-400" />
            <span>Ожидают: {latestData.pending}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Line Chart */}
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={metricsHistory}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-slate-200 dark:stroke-slate-700"
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                className="text-slate-600 dark:text-slate-400"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-slate-600 dark:text-slate-400"
                domain={[0, 100]}
                label={{
                  value: "Нагрузка (%)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 12 },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px" }} iconType="line" />
              {/* Render a line for each agent */}
              {Array.from(allAgentIds).map((agentId) => {
                const agent = agents.find((a) => a.id === agentId);
                const agentName = agent?.name || `Agent ${agentId.slice(0, 8)}`;
                const color = agentColorMap[agentId] || "rgb(148, 163, 184)";

                return (
                  <Line
                    key={agentId}
                    type="monotone"
                    dataKey={`agent_${agentId}`}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={agentName}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Current Stats - Show per-agent load */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Текущая нагрузка агентов</h3>
            <div className="text-xs text-muted-foreground">
              {latestData.active} активных • {latestData.inactive} неактивных •{" "}
              {latestData.pending} ожидают
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeAgents.map((agent) => {
              const agentData = latestData.agents?.[agent.id];
              if (!agentData) return null;

              const color = agentColorMap[agent.id];
              const isOverloaded = agentData.load > 80;
              const isWarning = agentData.load > 60 && agentData.load <= 80;

              return (
                <div
                  key={agent.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isOverloaded
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      : isWarning
                        ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">
                          {agent.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {agentData.location}, {agentData.country}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-lg font-bold" style={{ color }}>
                        {agentData.load}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        нагрузка
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">CPU</div>
                      <div className="font-semibold text-blue-600">
                        {agentData.cpu}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">RAM</div>
                      <div className="font-semibold text-purple-600">
                        {agentData.memory}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Score</div>
                      <div className="font-semibold text-orange-600">
                        {agentData.loadScore}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
