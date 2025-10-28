"use client";

import {
  IconArrowDown,
  IconArrowUp,
  IconChartBar,
  IconCloudDownload,
  IconCloudUpload,
  IconNetwork,
  IconRefresh,
  IconWorld,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loading } from "@/components/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState("24h");
  const [resourceType, setResourceType] = useState("all");

  // Загрузка данных из API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["statistics", timeRange, resourceType],
    queryFn: async () => {
      const params = new URLSearchParams({ timeRange });
      if (resourceType !== "all") {
        params.append("resourceType", resourceType);
      }
      const response = await fetch(`/api/statistics?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Ошибка загрузки статистики");
      }
      return response.json();
    },
    refetchInterval: 60000, // Обновлять каждую минуту
  });

  const stats = data?.stats || {
    totalTraffic: 0,
    inboundTraffic: 0,
    outboundTraffic: 0,
    requests: 0,
    avgResponseTime: 0,
    uptime: 0,
  };

  const topAgents = data?.topAgents || [];
  const byType = data?.byType || {
    proxy: { totalBytes: 0, requests: 0 },
    domain: { totalBytes: 0, requests: 0 },
  };
  const timeSeries = data?.timeSeries || [];

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("ru-RU").format(num);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400">Ошибка: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Статистика</h1>
          <p className="text-sm text-muted-foreground">
            Метрики трафика и производительности
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={resourceType} onValueChange={setResourceType}>
            <SelectTrigger className="w-[180px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все ресурсы</SelectItem>
              <SelectItem value="proxy">Только прокси</SelectItem>
              <SelectItem value="domain">Только домены</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Последний час</SelectItem>
              <SelectItem value="24h">Последние 24 часа</SelectItem>
              <SelectItem value="7d">Последние 7 дней</SelectItem>
              <SelectItem value="30d">Последние 30 дней</SelectItem>
              <SelectItem value="90d">Последние 90 дней</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => refetch()}
          >
            <IconRefresh className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <IconChartBar className="h-6 w-6 text-muted-foreground" />
              <CardTitle className="text-lg font-medium">
                Всего трафика
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">
              {formatBytes(stats.totalTraffic)}
            </div>
            <p className="text-sm text-muted-foreground">
              За период: {timeRange === "24h" ? "24 часа" : timeRange}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <IconCloudDownload className="h-6 w-6 text-muted-foreground" />
              <CardTitle className="text-lg font-medium">
                Входящий трафик
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">
              {formatBytes(stats.inboundTraffic)}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconArrowDown className="h-4 w-4" />
              <span>Загружено</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <IconCloudUpload className="h-6 w-6 text-muted-foreground" />
              <CardTitle className="text-lg font-medium">
                Исходящий трафик
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">
              {formatBytes(stats.outboundTraffic)}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconArrowUp className="h-4 w-4" />
              <span>Отправлено</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Resource Type */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <IconNetwork className="h-6 w-6 text-muted-foreground" />
              <CardTitle className="text-lg font-medium">Прокси</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">
              {formatBytes(byType.proxy.totalBytes)}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatNumber(byType.proxy.requests)} запросов
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <IconWorld className="h-6 w-6 text-muted-foreground" />
              <CardTitle className="text-lg font-medium">Домены</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">
              {formatBytes(byType.domain.totalBytes)}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatNumber(byType.domain.requests)} запросов
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Запросов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">
              {formatNumber(stats.requests)}
            </div>
            <p className="text-sm text-muted-foreground">Всего обработано</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Среднее время ответа
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">{stats.avgResponseTime}</div>
            <p className="text-sm text-muted-foreground">миллисекунд</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">{stats.uptime}%</div>
            <p className="text-sm text-muted-foreground">Время работы</p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Chart */}
      <Card className="border-border">
        <CardHeader className="pb-6">
          <CardTitle className="text-lg font-medium">
            График трафика
          </CardTitle>
          <CardDescription>
            Визуализация передачи данных по времени
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeSeries.length === 0 ? (
            <div className="h-80 flex items-center justify-center border border-border rounded-lg">
              <div className="text-center">
                <IconChartBar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Нет данных для отображения
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Данные появятся после начала передачи трафика
                </p>
              </div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timeSeries}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="time"
                    className="text-xs text-muted-foreground"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs text-muted-foreground"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => formatBytes(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value) => formatBytes(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="inbound"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorInbound)"
                    name="Входящий"
                  />
                  <Area
                    type="monotone"
                    dataKey="outbound"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#colorOutbound)"
                    name="Исходящий"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Agents by Traffic */}
      <Card className="border-border">
        <CardHeader className="pb-6">
          <CardTitle className="text-lg font-medium">
            Топ агентов по трафику
          </CardTitle>
          <CardDescription>
            Агенты с наибольшим объемом переданных данных
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topAgents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Данные будут доступны после сбора статистики
            </div>
          ) : (
            <div className="space-y-8">
              {/* Bar Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topAgents}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                      horizontal={true}
                      vertical={false}
                    />
                    <XAxis
                      type="number"
                      className="text-xs text-muted-foreground"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => formatBytes(value)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      className="text-xs"
                      tick={{ fill: "hsl(var(--foreground))" }}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value) => [formatBytes(value), "Трафик"]}
                    />
                    <Bar
                      dataKey="totalBytes"
                      fill="#8b5cf6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed List */}
              <div className="space-y-3">
                {topAgents.map((agent, index) => (
                  <div
                    key={agent.agentId}
                    className="flex items-center justify-between border border-border rounded-lg p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-muted-foreground w-8">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {agent.agentIdShort}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {formatBytes(agent.totalBytes)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(agent.requests)} запросов
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
