"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconActivity, IconCircleFilled } from "@tabler/icons-react";
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

export function AgentsStatusGraph({ agents }) {
  const [metricsHistory, setMetricsHistory] = useState([]);
  const isInitialMount = useRef(true);

  // Clear localStorage on page load (component mount)
  useEffect(() => {
    if (isInitialMount.current) {
      localStorage.removeItem("agents-metrics-history");
      isInitialMount.current = false;
    }
  }, []);

  // Load history from localStorage on mount (after clearing)
  useEffect(() => {
    const stored = localStorage.getItem("agents-metrics-history");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMetricsHistory(parsed);
      } catch (e) {
        console.error("Failed to parse metrics history:", e);
      }
    }
  }, []);

  // Record current metrics
  useEffect(() => {
    if (!agents || agents.length === 0) return;

    const now = Date.now();
    const activeCount = agents.filter((a) => a.isActive).length;
    const inactiveCount = agents.filter(
      (a) => !a.isActive && a.isConnected,
    ).length;
    const pendingCount = agents.filter((a) => !a.isConnected).length;

    // Calculate average metrics from all agents with system metrics
    const agentsWithMetrics = agents.filter(
      (a) => a.systemMetrics && a.isActive,
    );

    let avgCpu = 0;
    let avgMemory = 0;
    let avgNetworkIn = 0;
    let avgNetworkOut = 0;
    let avgLoadScore = 0;

    if (agentsWithMetrics.length > 0) {
      avgCpu =
        agentsWithMetrics.reduce(
          (sum, a) => sum + (a.systemMetrics.cpuUsagePercent || 0),
          0,
        ) / agentsWithMetrics.length;
      avgMemory =
        agentsWithMetrics.reduce(
          (sum, a) => sum + (a.systemMetrics.memoryUsagePercent || 0),
          0,
        ) / agentsWithMetrics.length;
      avgNetworkIn =
        agentsWithMetrics.reduce(
          (sum, a) => sum + (a.systemMetrics.networkRecvBytesPS || 0),
          0,
        ) / agentsWithMetrics.length;
      avgNetworkOut =
        agentsWithMetrics.reduce(
          (sum, a) => sum + (a.systemMetrics.networkSentBytesPS || 0),
          0,
        ) / agentsWithMetrics.length;
      avgLoadScore =
        agentsWithMetrics.reduce((sum, a) => sum + (a.loadScore || 0), 0) /
        agentsWithMetrics.length;
    }

    const newDataPoint = {
      timestamp: now,
      time: new Date(now).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      cpu: Math.round(avgCpu * 10) / 10,
      memory: Math.round(avgMemory * 10) / 10,
      networkIn: Math.round((avgNetworkIn / 1024 / 1024) * 10) / 10, // MB/s
      networkOut: Math.round((avgNetworkOut / 1024 / 1024) * 10) / 10, // MB/s
      loadScore: Math.round(avgLoadScore * 10) / 10,
      active: activeCount,
      inactive: inactiveCount,
      pending: pendingCount,
      total: agents.length,
    };

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

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border rounded-lg shadow-lg">
          <p className="text-sm font-semibold mb-2">{data.time}</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>CPU: {data.cpu}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>Memory: {data.memory}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Load Score: {data.loadScore}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span>Network In: {data.networkIn} MB/s</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500" />
              <span>Network Out: {data.networkOut} MB/s</span>
            </div>
            <div className="border-t pt-1 mt-1">
              <div className="flex items-center gap-2">
                <IconCircleFilled className="h-2 w-2 text-green-500" />
                <span>Активные: {data.active}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconCircleFilled className="h-2 w-2 text-yellow-500" />
                <span>Неактивные: {data.inactive}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconCircleFilled className="h-2 w-2 text-slate-400" />
                <span>Ожидают: {data.pending}</span>
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
        <div className="w-full h-[300px]">
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
                label={{
                  value: "Нагрузка (%)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 12 },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />
              <Line
                type="monotone"
                dataKey="cpu"
                stroke="rgb(59, 130, 246)"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="CPU"
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="memory"
                stroke="rgb(168, 85, 247)"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Memory"
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="loadScore"
                stroke="rgb(249, 115, 22)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                name="Load Score"
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="networkIn"
                stroke="rgb(6, 182, 212)"
                strokeWidth={1.5}
                dot={{ r: 2 }}
                name="Network In (MB/s)"
                strokeDasharray="5 5"
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="networkOut"
                stroke="rgb(236, 72, 153)"
                strokeWidth={1.5}
                dot={{ r: 2 }}
                name="Network Out (MB/s)"
                strokeDasharray="5 5"
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Current Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-center text-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-muted-foreground mb-1">CPU</div>
            <div className="text-xl font-bold text-blue-600">
              {latestData.cpu}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Макс: {Math.max(...metricsHistory.map((d) => d.cpu)).toFixed(1)}%
            </div>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="text-xs text-muted-foreground mb-1">Memory</div>
            <div className="text-xl font-bold text-purple-600">
              {latestData.memory}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Макс:{" "}
              {Math.max(...metricsHistory.map((d) => d.memory)).toFixed(1)}%
            </div>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="text-xs text-muted-foreground mb-1">Load Score</div>
            <div className="text-xl font-bold text-orange-600">
              {latestData.loadScore}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Макс:{" "}
              {Math.max(...metricsHistory.map((d) => d.loadScore)).toFixed(1)}%
            </div>
          </div>
          <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
            <div className="text-xs text-muted-foreground mb-1">Network In</div>
            <div className="text-xl font-bold text-cyan-600">
              {latestData.networkIn}
            </div>
            <div className="text-xs text-muted-foreground mt-1">MB/s</div>
          </div>
          <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
            <div className="text-xs text-muted-foreground mb-1">
              Network Out
            </div>
            <div className="text-xl font-bold text-pink-600">
              {latestData.networkOut}
            </div>
            <div className="text-xs text-muted-foreground mt-1">MB/s</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
