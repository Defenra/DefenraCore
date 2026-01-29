"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  ComposedChart,
} from "recharts";
import { IconLoader } from "@tabler/icons-react";

export function AgentLoadGraph({ agentId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["agent-stats", agentId],
    queryFn: async () => {
      const res = await fetch(
        `/api/statistics?agentId=${agentId}&timeRange=24h`,
      );
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        <IconLoader className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!data?.timeSeries || data.timeSeries.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg">
        Нет данных за последние 24 часа
      </div>
    );
  }

  // Format data for chart
  const chartData = data.timeSeries.map((item) => ({
    time: item.time,
    requests: item.requests,
    traffic: (item.total / 1024 / 1024).toFixed(2), // MB
    activeBans: item.activeBans || 0,
  }));

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold mb-2">
        Нагрузка (Запросы/час) и Активные баны
      </h4>
      <div className="h-[200px] w-full bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 border">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />
            <XAxis
              dataKey="time"
              tickFormatter={(str) => {
                try {
                  const date = new Date(str);
                  return `${date.getHours()}:00`;
                } catch (e) {
                  return str;
                }
              }}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis
              yAxisId="left"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={30}
              stroke="#ef4444"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                borderColor: "hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              itemStyle={{ color: "hsl(var(--popover-foreground))" }}
              labelFormatter={(label) => {
                try {
                  return new Date(label).toLocaleString("ru-RU", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                } catch (e) {
                  return label;
                }
              }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="requests"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorRequests)"
              strokeWidth={2}
              name="Запросы"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="activeBans"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Активные баны"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-sm" />
          <span>Запросы</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-red-500" />
          <span>Активные баны</span>
        </div>
      </div>
    </div>
  );
}
