"use client";

import {
  IconArrowDown,
  IconArrowUp,
  IconChartBar,
  IconCloudDownload,
  IconCloudUpload,
  IconNetwork,
  IconRefresh,
  IconShieldLock,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

// Bento Card Component
function BentoCard({ children, className, colSpan = 1 }) {
  return (
    <Card
      className={cn(
        "border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300",
        "hover:border-border hover:shadow-lg hover:shadow-primary/5",
        colSpan === 2 && "md:col-span-2",
        className
      )}
    >
      {children}
    </Card>
  );
}

// Stat Card Skeleton
function StatCardSkeleton() {
  return (
    <BentoCard>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-md" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </BentoCard>
  );
}

// Chart Skeleton
function ChartSkeleton() {
  return (
    <BentoCard colSpan={2}>
      <CardHeader className="pb-6">
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-80 w-full" />
      </CardContent>
    </BentoCard>
  );
}

// Top Agents Skeleton
function TopAgentsSkeleton() {
  return (
    <BentoCard colSpan={2}>
      <CardHeader className="pb-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-80 w-full" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </CardContent>
    </BentoCard>
  );
}

export default function StatisticsPage() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState("24h");
  const [resourceType, setResourceType] = useState("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["statistics", timeRange, resourceType],
    queryFn: async () => {
      const params = new URLSearchParams({ timeRange });
      if (resourceType !== "all") {
        params.append("resourceType", resourceType);
      }
      const response = await fetch(`/api/statistics?${params.toString()}`);
      if (!response.ok) {
        throw new Error(t("statistics.errors.loadFailed"));
      }
      return response.json();
    },
    refetchInterval: 60000,
  });

  const stats = data?.stats || {
    totalTraffic: 0,
    inboundTraffic: 0,
    outboundTraffic: 0,
    requests: 0,
    avgResponseTime: 0,
    uptime: 0,
    errors: 0,
    blockedRequests: 0,
    rateLimitBlocks: 0,
    firewallBlocks: 0,
    l4Blocks: 0,
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
    return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getTimeRangeLabel = (range) => {
    const labels = {
      "1h": t("statistics.timeRanges.1h"),
      "24h": t("statistics.timeRanges.24h"),
      "7d": t("statistics.timeRanges.7d"),
      "30d": t("statistics.timeRanges.30d"),
      "90d": t("statistics.timeRanges.90d"),
    };
    return labels[range] || range;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Resource Type Skeleton */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Metrics Skeleton */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Security Skeleton */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Charts Skeleton */}
        <ChartSkeleton />
        <TopAgentsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center space-y-4">
          <p className="text-red-400">{t("common.error")}: {error.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            {t("common.retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {t("statistics.title")}
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            {t("statistics.description")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={resourceType} onValueChange={setResourceType}>
            <SelectTrigger className="w-[180px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("statistics.filters.allResources")}</SelectItem>
              <SelectItem value="proxy">{t("statistics.filters.onlyProxies")}</SelectItem>
              <SelectItem value="domain">{t("statistics.filters.onlyDomains")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">{t("statistics.timeRanges.1h")}</SelectItem>
              <SelectItem value="24h">{t("statistics.timeRanges.24h")}</SelectItem>
              <SelectItem value="7d">{t("statistics.timeRanges.7d")}</SelectItem>
              <SelectItem value="30d">{t("statistics.timeRanges.30d")}</SelectItem>
              <SelectItem value="90d">{t("statistics.timeRanges.90d")}</SelectItem>
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
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <BentoCard>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <IconChartBar className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-medium">
                {t("statistics.cards.totalTraffic")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {formatBytes(stats.totalTraffic)}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("statistics.period")}: {getTimeRangeLabel(timeRange)}
              </p>
            </div>
          </CardContent>
        </BentoCard>

        <BentoCard>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <IconCloudDownload className="h-5 w-5 text-blue-500" />
              </div>
              <CardTitle className="text-lg font-medium">
                {t("statistics.cards.inboundTraffic")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {formatBytes(stats.inboundTraffic)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconArrowDown className="h-4 w-4" />
                <span>{t("statistics.downloaded")}</span>
              </div>
            </div>
          </CardContent>
        </BentoCard>

        <BentoCard>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                <IconCloudUpload className="h-5 w-5 text-cyan-500" />
              </div>
              <CardTitle className="text-lg font-medium">
                {t("statistics.cards.outboundTraffic")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {formatBytes(stats.outboundTraffic)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconArrowUp className="h-4 w-4" />
                <span>{t("statistics.uploaded")}</span>
              </div>
            </div>
          </CardContent>
        </BentoCard>
      </div>

      {/* By Resource Type */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        <BentoCard>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                <IconNetwork className="h-5 w-5 text-indigo-500" />
              </div>
              <CardTitle className="text-lg font-medium">{t("statistics.cards.proxies")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {formatBytes(byType.proxy.totalBytes)}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatNumber(byType.proxy.requests)} {t("statistics.requests")}
              </p>
            </div>
          </CardContent>
        </BentoCard>

        <BentoCard>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <IconWorld className="h-5 w-5 text-emerald-500" />
              </div>
              <CardTitle className="text-lg font-medium">{t("statistics.cards.domains")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {formatBytes(byType.domain.totalBytes)}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatNumber(byType.domain.requests)} {t("statistics.requests")}
              </p>
            </div>
          </CardContent>
        </BentoCard>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        <BentoCard>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              {t("statistics.cards.totalRequests")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {formatNumber(stats.requests)}
              </div>
              <p className="text-sm text-muted-foreground">{t("statistics.processed")}</p>
            </div>
          </CardContent>
        </BentoCard>

        <BentoCard>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              {t("statistics.cards.avgResponseTime")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {stats.avgResponseTime}
              </div>
              <p className="text-sm text-muted-foreground">{t("statistics.milliseconds")}</p>
            </div>
          </CardContent>
        </BentoCard>

        <BentoCard>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              {t("statistics.cards.uptime")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">{stats.uptime}%</div>
              <p className="text-sm text-muted-foreground">{t("statistics.uptimeLabel")}</p>
            </div>
          </CardContent>
        </BentoCard>
      </div>

      {/* Security Metrics */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
        <BentoCard>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <IconShieldLock className="h-5 w-5 text-red-500" />
              </div>
              <CardTitle className="text-lg font-medium">
                {t("statistics.cards.blocked")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {formatNumber(stats.blockedRequests || 0)}
              </div>
              <p className="text-sm text-muted-foreground">{t("statistics.blockedRequests")}</p>
            </div>
          </CardContent>
        </BentoCard>

        <BentoCard>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              {t("statistics.cards.rateLimit")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2 text-orange-500">
                {formatNumber(stats.rateLimitBlocks || 0)}
              </div>
              <p className="text-sm text-muted-foreground">{t("statistics.rateLimitBlocks")}</p>
            </div>
          </CardContent>
        </BentoCard>

        <BentoCard>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              {t("statistics.cards.firewall")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2 text-red-500">
                {formatNumber(stats.firewallBlocks || 0)}
              </div>
              <p className="text-sm text-muted-foreground">{t("statistics.firewallBlocks")}</p>
            </div>
          </CardContent>
        </BentoCard>

        <BentoCard>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              {t("statistics.cards.l4Blocks")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2 text-purple-500">
                {formatNumber(stats.l4Blocks || 0)}
              </div>
              <p className="text-sm text-muted-foreground">{t("statistics.l4Blocks")}</p>
            </div>
          </CardContent>
        </BentoCard>
      </div>

      {/* Traffic Chart */}
      <BentoCard colSpan={2}>
        <CardHeader className="pb-6">
          <CardTitle className="text-lg font-medium">{t("statistics.trafficChart.title")}</CardTitle>
          <CardDescription>{t("statistics.trafficChart.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {timeSeries.length === 0 ? (
            <div className="h-80 flex items-center justify-center border border-border rounded-lg bg-muted/50">
              <div className="text-center">
                <IconChartBar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">{t("statistics.noData")}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("statistics.dataWillAppear")}
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
                    <linearGradient
                      id="colorInbound"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorOutbound"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
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
                    name={t("statistics.inbound")}
                  />
                  <Area
                    type="monotone"
                    dataKey="outbound"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#colorOutbound)"
                    name={t("statistics.outbound")}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </BentoCard>

      {/* Top Agents by Traffic */}
      <BentoCard colSpan={2}>
        <CardHeader className="pb-6">
          <CardTitle className="text-lg font-medium">{t("statistics.topAgents.title")}</CardTitle>
          <CardDescription>{t("statistics.topAgents.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {topAgents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t("statistics.topAgents.noData")}
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
                      formatter={(value) => [formatBytes(value), t("statistics.traffic")]}
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
                    className="flex items-center justify-between border border-border rounded-lg p-4 bg-card/50"
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
                        {formatNumber(agent.requests)} {t("statistics.requests")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </BentoCard>
    </div>
  );
}
