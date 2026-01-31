"use client";

import {
  IconAlertCircle,
  IconFileText,
  IconFilter,
  IconInfoCircle,
  IconRefresh,
  IconSearch,
  IconShieldX,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
        className,
      )}
    >
      {children}
    </Card>
  );
}

// Log Entry Skeleton
function LogEntrySkeleton() {
  return (
    <div className="border-l-4 rounded-lg p-4 bg-muted/50">
      <div className="flex items-start gap-4">
        <Skeleton className="h-5 w-5 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    </div>
  );
}

// Stat Card Skeleton
function StatCardSkeleton() {
  return (
    <BentoCard>
      <CardHeader className="pb-4">
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-12 w-20" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </BentoCard>
  );
}

export default function LogsPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [logLevel, setLogLevel] = useState("all");
  const [selectedAgent, setSelectedAgent] = useState("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["logs", logLevel, selectedAgent, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (logLevel !== "all") params.append("level", logLevel);
      if (selectedAgent !== "all") params.append("agentId", selectedAgent);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error(t("logs.errors.loadFailed"));
      }
      return response.json();
    },
    refetchInterval: 10000,
  });

  const logs = data?.logs || [];
  const levelStats = data?.stats || { info: 0, warning: 0, error: 0 };

  const getLogIcon = (level) => {
    switch (level) {
      case "error":
        return <IconShieldX className="h-5 w-5 text-red-400" />;
      case "warning":
        return <IconAlertCircle className="h-5 w-5 text-yellow-400" />;
      default:
        return <IconInfoCircle className="h-5 w-5 text-blue-400" />;
    }
  };

  const getLevelStyle = (level) => {
    switch (level) {
      case "error":
        return "border-l-red-500/50 bg-red-500/5";
      case "warning":
        return "border-l-yellow-500/50 bg-yellow-500/5";
      default:
        return "border-l-blue-500/50 bg-blue-500/5";
    }
  };

  const getLevelBadgeClass = (level) => {
    switch (level) {
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      default:
        return "text-blue-400";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-10" />
        </div>

        {/* Filters Skeleton */}
        <BentoCard>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-5 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </BentoCard>

        {/* Logs List Skeleton */}
        <BentoCard colSpan={2}>
          <CardHeader className="pb-6">
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <LogEntrySkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </BentoCard>

        {/* Stats Skeleton */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center space-y-4">
          <p className="text-red-400">
            {t("common.error")}: {error.message}
          </p>
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
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {t("logs.title")}
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            {data?.total || 0} {t("logs.entriesCount")}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => refetch()}
        >
          <IconRefresh className="h-5 w-5" />
        </Button>
      </div>

      {/* Filters */}
      <BentoCard>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <IconFilter className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg font-medium">
              {t("logs.filters.title")}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("logs.filters.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select value={logLevel} onValueChange={setLogLevel}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t("logs.filters.level")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("logs.filters.allLevels")}
                </SelectItem>
                <SelectItem value="info">{t("logs.filters.info")}</SelectItem>
                <SelectItem value="warning">
                  {t("logs.filters.warning")}
                </SelectItem>
                <SelectItem value="error">{t("logs.filters.error")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t("logs.filters.agent")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("logs.filters.allAgents")}
                </SelectItem>
                <SelectItem value="agent-eu-01">agent-eu-01</SelectItem>
                <SelectItem value="agent-us-01">agent-us-01</SelectItem>
                <SelectItem value="agent-asia-01">agent-asia-01</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </BentoCard>

      {/* Logs List */}
      <BentoCard colSpan={2}>
        <CardHeader className="pb-6">
          <CardTitle className="text-lg font-medium">
            {t("logs.list.title")}
          </CardTitle>
          <CardDescription>{t("logs.list.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <IconFileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("logs.noLogs")}</p>
              <p className="text-sm mt-2">{t("logs.noLogsDescription")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`border-l-4 rounded-lg p-4 ${getLevelStyle(log.level)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5">{getLogIcon(log.level)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-background/50">
                          {log.agent?.name || t("logs.unknownAgent")}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded uppercase font-medium ${getLevelBadgeClass(log.level)}`}
                        >
                          {log.level}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">{log.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.details}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </BentoCard>

      {/* Stats */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        <BentoCard>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              {t("logs.stats.info")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl md:text-5xl font-bold mb-2">
              {levelStats.info}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("logs.stats.infoLabel")}
            </p>
          </CardContent>
        </BentoCard>

        <BentoCard>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              {t("logs.stats.warnings")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl md:text-5xl font-bold mb-2">
              {levelStats.warning}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("logs.stats.warningsLabel")}
            </p>
          </CardContent>
        </BentoCard>

        <BentoCard>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              {t("logs.stats.errors")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl md:text-5xl font-bold mb-2">
              {levelStats.error}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("logs.stats.errorsLabel")}
            </p>
          </CardContent>
        </BentoCard>
      </div>
    </div>
  );
}
