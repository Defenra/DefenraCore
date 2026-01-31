"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IconActivity,
  IconCircleFilled,
  IconServer,
  IconRefresh,
  IconWorld,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { useQuery } from "@tanstack/react-query";

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
  const [period, setPeriod] = useState("hour"); // hour, day, week
  const [chartType, setChartType] = useState("linear"); // linear, monotone, step
  const [hiddenAgents, setHiddenAgents] = useState(new Set()); // Hidden agent IDs
  const [agentColorMap, setAgentColorMap] = useState({});

  // Fetch metrics from API
  const {
    data: metricsData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["agent-metrics", period],
    queryFn: async () => {
      const res = await fetch(`/api/agent/metrics?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const metricsHistory = metricsData?.metrics || [];
  const countryStats = metricsData?.countryStats || [];

  // Assign colors to agents
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
    }
  }, [agents, agentColorMap]);

  if (isLoading || metricsHistory.length === 0) {
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
            {isLoading
              ? "Загрузка данных..."
              : "Сбор данных... График появится через минуту"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestData = metricsHistory[metricsHistory.length - 1];

  // Get all unique agent IDs from history
  const allAgentIds = new Set();
  metricsHistory.forEach((point) => {
    Object.keys(point).forEach((key) => {
      if (key.startsWith("agent_")) {
        const agentId = key.replace("agent_", "");
        if (agentId && agentId !== "undefined") {
          allAgentIds.add(agentId);
        }
      }
    });
  });

  const toggleAgentVisibility = (agentId) => {
    setHiddenAgents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    // Find the payload item that has a non-null value (the hovered line)
    const hoveredItem = payload.find((item) => item.value != null);
    if (!hoveredItem) {
      return null;
    }

    const data = hoveredItem.payload;
    const dataKey = hoveredItem.dataKey;

    if (dataKey && dataKey.startsWith("agent_") && data.agents) {
      const agentId = dataKey.replace("agent_", "");
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
    return null;
  };

  const CustomLegend = () => {
    // Show ALL agents in legend, not just visible ones
    return (
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        {Array.from(allAgentIds).map((agentId) => {
          const agent = agents.find((a) => a.id === agentId);
          const agentName = agent?.name || `Agent ${agentId.slice(0, 8)}`;
          const color = agentColorMap[agentId] || "rgb(148, 163, 184)";
          const isHidden = hiddenAgents.has(agentId);

          return (
            <button
              key={agentId}
              onClick={() => toggleAgentVisibility(agentId)}
              className={`flex items-center gap-2 px-2 py-1 rounded transition-all hover:bg-slate-100 dark:hover:bg-slate-800 ${
                isHidden ? "opacity-40 line-through" : ""
              }`}
              title={isHidden ? "Показать агента" : "Скрыть агента"}
              type="button"
            >
              <div className="w-3 h-0.5" style={{ backgroundColor: color }} />
              <span className="text-xs">{agentName}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Load Graph - 2/3 width */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <IconActivity className="h-5 w-5" />
              Мониторинг нагрузки агентов
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Period selector */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={period === "hour" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPeriod("hour")}
                  className="h-7 text-xs"
                >
                  Час
                </Button>
                <Button
                  variant={period === "day" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPeriod("day")}
                  className="h-7 text-xs"
                >
                  День
                </Button>
                <Button
                  variant={period === "week" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPeriod("week")}
                  className="h-7 text-xs"
                >
                  Неделя
                </Button>
              </div>
              {/* Chart type selector */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={chartType === "linear" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChartType("linear")}
                  className="h-7 text-xs px-2"
                  title="Линейный (четкий)"
                >
                  ━
                </Button>
                <Button
                  variant={chartType === "monotone" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChartType("monotone")}
                  className="h-7 text-xs px-2"
                  title="Плавный"
                >
                  ∿
                </Button>
                <Button
                  variant={chartType === "step" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChartType("step")}
                  className="h-7 text-xs px-2"
                  title="Ступенчатый"
                >
                  ⌐
                </Button>
              </div>
              {/* Refresh button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-7"
              >
                <IconRefresh
                  className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span>
              {metricsHistory[0]?.time} — {latestData?.time}
            </span>
            <span>•</span>
            <span>{metricsHistory.length} точек данных</span>
            <span>•</span>
            <div className="flex items-center gap-2">
              <IconCircleFilled className="h-2 w-2 text-green-500" />
              <span>Активные: {latestData?.active || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <IconCircleFilled className="h-2 w-2 text-yellow-500" />
              <span>Неактивные: {latestData?.inactive || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <IconCircleFilled className="h-2 w-2 text-slate-400" />
              <span>Ожидают: {latestData?.pending || 0}</span>
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
                <Legend content={<CustomLegend />} />
                {/* Render a line for each agent (excluding hidden ones) */}
                {Array.from(allAgentIds)
                  .filter((agentId) => !hiddenAgents.has(agentId))
                  .map((agentId) => {
                    const agent = agents.find((a) => a.id === agentId);
                    const agentName =
                      agent?.name || `Agent ${agentId.slice(0, 8)}`;
                    const color =
                      agentColorMap[agentId] || "rgb(148, 163, 184)";

                    return (
                      <Line
                        key={agentId}
                        type={chartType}
                        dataKey={`agent_${agentId}`}
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        name={agentName}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    );
                  })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Country Radar Chart - 1/3 width */}
      {countryStats && countryStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IconWorld className="h-4 w-4" />
              География
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Топ-6 стран по активности
            </p>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={countryStats}>
                  <PolarGrid className="stroke-slate-200 dark:stroke-slate-700" />
                  <PolarAngleAxis
                    dataKey="country"
                    tick={{ fontSize: 11 }}
                    className="text-slate-600 dark:text-slate-400"
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, "auto"]}
                    tick={{ fontSize: 9 }}
                  />
                  <Radar
                    name="Агенты"
                    dataKey="agentCount"
                    stroke="rgb(59, 130, 246)"
                    fill="rgb(59, 130, 246)"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Нагрузка"
                    dataKey="avgLoad"
                    stroke="rgb(249, 115, 22)"
                    fill="rgb(249, 115, 22)"
                    fillOpacity={0.4}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-slate-800 p-2 border rounded-lg shadow-lg">
                            <p className="text-xs font-semibold mb-1">
                              {data.country}
                            </p>
                            <div className="space-y-0.5 text-xs">
                              <div className="flex justify-between gap-3">
                                <span className="text-muted-foreground">
                                  Агентов:
                                </span>
                                <span className="font-medium text-blue-600">
                                  {data.agentCount}
                                </span>
                              </div>
                              <div className="flex justify-between gap-3">
                                <span className="text-muted-foreground">
                                  Нагрузка:
                                </span>
                                <span className="font-medium text-orange-600">
                                  {data.avgLoad.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
