"use client";

import {
  IconActivity,
  IconAlertCircle,
  IconArrowUpRight,
  IconBan,
  IconCheck,
  IconClock,
  IconDatabase,
  IconExternalLink,
  IconGlobe,
  IconNetwork,
  IconRobot,
  IconShield,
  IconShieldCheck,
  IconTrendingUp,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats, useRecentActivity } from "@/hooks/useDashboard";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

// Bento Card Component
function BentoCard({ children, className, colSpan = 1, rowSpan = 1 }) {
  return (
    <Card
      className={cn(
        "border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300",
        "hover:border-border hover:shadow-lg hover:shadow-primary/5",
        colSpan === 2 && "md:col-span-2",
        rowSpan === 2 && "md:row-span-2",
        className,
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
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-md" />
          <Skeleton className="h-5 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </BentoCard>
  );
}

// Activity Card Skeleton
function ActivityCardSkeleton() {
  return (
    <BentoCard>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-md" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg">
              <Skeleton className="h-5 w-5 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </BentoCard>
  );
}

// Quick Action Card
function QuickActionCard({ href, icon: Icon, title, description, badge }) {
  return (
    <Link href={href}>
      <BentoCard className="cursor-pointer h-full group">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base font-medium">{title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {badge && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {badge}
                </span>
              )}
              <IconArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </BentoCard>
    </Link>
  );
}

// Health Status Widget
function HealthStatusWidget({ stats, t }) {
  const healthy = stats?.agents?.healthy || 0;
  const overloaded = stats?.agents?.overloaded || 0;
  const total = healthy + overloaded;
  const healthPercentage = total > 0 ? (healthy / total) * 100 : 100;

  let status = "healthy";
  let color = "text-emerald-500";
  let bgColor = "bg-emerald-500";
  let icon = IconCheck;

  if (overloaded > 0 && overloaded >= healthy) {
    status = "critical";
    color = "text-red-500";
    bgColor = "bg-red-500";
    icon = IconAlertCircle;
  } else if (overloaded > 0) {
    status = "warning";
    color = "text-amber-500";
    bgColor = "bg-amber-500";
    icon = IconAlertCircle;
  }

  const Icon = icon;

  return (
    <BentoCard>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <IconActivity className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-medium">
            {t("dashboard.health.title")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              bgColor,
              "bg-opacity-10",
            )}
          >
            <Icon className={cn("h-6 w-6", color)} />
          </div>
          <div>
            <div className={cn("text-2xl font-bold", color)}>
              {healthPercentage.toFixed(0)}%
            </div>
            <p className="text-sm text-muted-foreground">
              {t(`dashboard.health.${status}`)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t("dashboard.health.healthyAgents")}
            </span>
            <span className="font-medium text-emerald-600">{healthy}</span>
          </div>
          <Progress value={healthPercentage} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t("dashboard.health.overloadedAgents")}
            </span>
            <span className="font-medium text-amber-600">{overloaded}</span>
          </div>
        </div>
      </CardContent>
    </BentoCard>
  );
}

// Traffic Overview Widget
function TrafficOverviewWidget({ stats, t }) {
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
  };

  const traffic = stats?.traffic || {};
  const requests = traffic.totalRequests || 0;
  const totalBytes = traffic.totalTraffic || 0;
  const blocked = traffic.blockedRequests || 0;
  const avgResponse = traffic.avgResponseTime || 0;

  return (
    <BentoCard>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <IconTrendingUp className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg font-medium">
              {t("dashboard.traffic.title")}
            </CardTitle>
          </div>
          <Link href="/dashboard/statistics">
            <IconExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-2xl font-bold">{formatBytes(totalBytes)}</div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.traffic.total")}
            </p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">
              {requests.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.traffic.requests")}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-border/50 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <IconShield className="h-4 w-4" />
              {t("dashboard.traffic.blocked")}
            </span>
            <span className="font-medium text-red-500">
              {blocked.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <IconClock className="h-4 w-4" />
              {t("dashboard.traffic.avgResponse")}
            </span>
            <span className="font-medium">{avgResponse.toFixed(0)} ms</span>
          </div>
        </div>
      </CardContent>
    </BentoCard>
  );
}

// Recent Bans Widget
function RecentBansWidget({ bans, t }) {
  const recentBans = bans?.recent || [];

  return (
    <BentoCard>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <IconBan className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-medium">
                {t("dashboard.bans.title")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("dashboard.bans.description")}
              </CardDescription>
            </div>
          </div>
          <Link href="/dashboard/bans">
            <IconExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {recentBans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <IconShieldCheck className="h-8 w-8 text-emerald-500/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("dashboard.bans.noActiveBans")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentBans.slice(0, 5).map((ban) => (
              <div
                key={ban._id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      ban.isPermanent ? "bg-red-500" : "bg-amber-500",
                    )}
                  />
                  <code className="text-xs font-mono">{ban.ip}</code>
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {ban.reason}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 pt-3 border-t border-border/50 flex justify-between text-sm">
          <span className="text-muted-foreground">
            {t("dashboard.bans.totalActive")}
          </span>
          <span className="font-medium">{bans?.active || 0}</span>
        </div>
      </CardContent>
    </BentoCard>
  );
}

// Domains Overview Widget
function DomainsOverviewWidget({ domains, t }) {
  const total = domains?.total || 0;
  const active = domains?.active || 0;
  const withProxy = domains?.withProxy || 0;
  const withSSL = domains?.withSSL || 0;

  return (
    <BentoCard>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <IconGlobe className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg font-medium">
              {t("dashboard.domainsBlock.title")}
            </CardTitle>
          </div>
          <Link href="/dashboard/domains">
            <IconExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{total}</span>
          <span className="text-sm text-muted-foreground">
            {t("dashboard.domainsBlock.total")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <IconCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-muted-foreground">
                {t("dashboard.domainsBlock.active")}
              </span>
            </div>
            <span className="text-lg font-semibold">{active}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <IconNetwork className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">
                {t("dashboard.domainsBlock.withProxy")}
              </span>
            </div>
            <span className="text-lg font-semibold">{withProxy}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <IconShieldCheck className="h-4 w-4 text-purple-500" />
              <span className="text-muted-foreground">
                {t("dashboard.domainsBlock.withSSL")}
              </span>
            </div>
            <span className="text-lg font-semibold">{withSSL}</span>
          </div>
        </div>
      </CardContent>
    </BentoCard>
  );
}

// System Alerts Widget
function SystemAlertsWidget({ stats, t }) {
  const alerts = [];

  // Check for disconnected agents
  const disconnected = stats?.agents?.disconnected || 0;
  if (disconnected > 0) {
    alerts.push({
      type: "warning",
      icon: IconAlertCircle,
      message: t("dashboard.alerts.disconnectedAgents", {
        count: disconnected,
      }),
      link: "/dashboard/agents",
    });
  }

  // Check for overloaded agents
  const overloaded = stats?.agents?.overloaded || 0;
  if (overloaded > 0) {
    alerts.push({
      type: "error",
      icon: IconDatabase,
      message: t("dashboard.alerts.overloadedAgents", { count: overloaded }),
      link: "/dashboard/agents",
    });
  }

  // Check for inactive proxies
  const inactiveProxies =
    (stats?.proxies?.total || 0) - (stats?.proxies?.active || 0);
  if (inactiveProxies > 0) {
    alerts.push({
      type: "info",
      icon: IconNetwork,
      message: t("dashboard.alerts.inactiveProxies", {
        count: inactiveProxies,
      }),
      link: "/dashboard/proxies",
    });
  }

  return (
    <BentoCard>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <IconAlertCircle className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-medium">
            {t("dashboard.alerts.title")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <IconCheck className="h-8 w-8 text-emerald-500/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("dashboard.alerts.allGood")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, idx) => {
              const Icon = alert.icon;
              const colors = {
                error: "bg-red-500/10 text-red-500 border-red-200",
                warning: "bg-amber-500/10 text-amber-500 border-amber-200",
                info: "bg-blue-500/10 text-blue-500 border-blue-200",
              };

              return (
                <Link key={idx} href={alert.link}>
                  <div
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-colors hover:opacity-80",
                      colors[alert.type],
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-sm">{alert.message}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </BentoCard>
  );
}

// Format time ago
function formatTimeAgo(date, t) {
  if (!date) return "—";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return t("common.justNow");
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)} ${t("common.minutesAgo")}`;
  if (seconds < 86400)
    return `${Math.floor(seconds / 3600)} ${t("common.hoursAgo")}`;
  return `${Math.floor(seconds / 86400)} ${t("common.daysAgo")}`;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useRecentActivity(8);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {t("dashboard.title")}
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            {t("dashboard.description")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{t("dashboard.liveUpdates")}</span>
        </div>
      </div>

      {/* Main Bento Grid Layout */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-4">
        {/* Row 1: Primary Stats - Agents & Proxies */}
        {/* Agents Block */}
        {statsLoading ? (
          <StatCardSkeleton />
        ) : statsError ? (
          <BentoCard className="flex items-center justify-center min-h-[180px]">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">{t("common.error")}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-primary hover:underline"
              >
                {t("common.retry")}
              </button>
            </div>
          </BentoCard>
        ) : (
          <Link href="/dashboard/agents">
            <BentoCard className="cursor-pointer h-full group">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconRobot className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base font-medium">
                    {t("dashboard.agentsBlock.title")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {stats?.agents.active || 0}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {stats?.agents.total || 0}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {stats?.agents.active} {t("common.online")}
                  </span>
                  {stats?.agents.disconnected > 0 && (
                    <span className="flex items-center gap-1 text-red-500">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      {stats?.agents.disconnected} {t("common.offline")}
                    </span>
                  )}
                </div>
              </CardContent>
            </BentoCard>
          </Link>
        )}

        {/* Proxies Block */}
        {statsLoading ? (
          <StatCardSkeleton />
        ) : (
          <Link href="/dashboard/proxies">
            <BentoCard className="cursor-pointer h-full group">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconNetwork className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base font-medium">
                    {t("dashboard.proxiesBlock.title")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {stats?.proxies.active || 0}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {stats?.proxies.total || 0}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("dashboard.proxiesBlock.routing")}
                </div>
              </CardContent>
            </BentoCard>
          </Link>
        )}

        {/* Domains Block */}
        {statsLoading ? (
          <StatCardSkeleton />
        ) : (
          <DomainsOverviewWidget domains={stats?.domains} t={t} />
        )}

        {/* Bans Block */}
        {statsLoading ? (
          <StatCardSkeleton />
        ) : (
          <RecentBansWidget bans={stats?.bans} t={t} />
        )}

        {/* Row 2: Secondary Stats - Health, Traffic, Alerts */}
        {/* Health Status */}
        {statsLoading ? (
          <StatCardSkeleton />
        ) : (
          <HealthStatusWidget stats={stats} t={t} />
        )}

        {/* Traffic Overview */}
        {statsLoading ? (
          <StatCardSkeleton />
        ) : (
          <TrafficOverviewWidget stats={stats} t={t} />
        )}

        {/* System Alerts */}
        {statsLoading ? (
          <StatCardSkeleton />
        ) : (
          <SystemAlertsWidget stats={stats} t={t} />
        )}

        {/* Recent Activity - Tall Card */}
        {activityLoading ? (
          <ActivityCardSkeleton />
        ) : (
          <BentoCard className="lg:row-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <IconActivity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-medium">
                    {t("dashboard.activity.title")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("dashboard.activity.description")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!activity || activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <IconClock className="h-8 w-8 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {t("dashboard.activity.noActivity")}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {activity.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-md shrink-0",
                          item.type === "agent"
                            ? item.isConnected
                              ? "bg-emerald-500/10"
                              : "bg-amber-500/10"
                            : "bg-primary/10",
                        )}
                      >
                        {item.type === "agent" ? (
                          <IconRobot
                            className={cn(
                              "h-3.5 w-3.5",
                              item.isConnected
                                ? "text-emerald-500"
                                : "text-amber-500",
                            )}
                          />
                        ) : (
                          <IconNetwork className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="font-medium text-sm truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.route || (
                            <>
                              {item.ip && <span>{item.ip}</span>}
                              {item.location && <span> • {item.location}</span>}
                            </>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70">
                          {formatTimeAgo(item.time, t)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </BentoCard>
        )}

        {/* Row 3: Quick Actions */}
        <QuickActionCard
          href="/dashboard/agents"
          icon={IconRobot}
          title={t("dashboard.quickActions.manageAgents")}
          description={t("dashboard.quickActions.manageAgentsDesc")}
          badge={stats?.agents?.total > 0 ? `${stats.agents.total}` : null}
        />

        <QuickActionCard
          href="/dashboard/proxies"
          icon={IconNetwork}
          title={t("dashboard.quickActions.configureProxies")}
          description={t("dashboard.quickActions.configureProxiesDesc")}
          badge={stats?.proxies?.total > 0 ? `${stats.proxies.total}` : null}
        />

        <QuickActionCard
          href="/dashboard/domains"
          icon={IconGlobe}
          title={t("dashboard.quickActions.manageDomains")}
          description={t("dashboard.quickActions.manageDomainsDesc")}
          badge={stats?.domains?.total > 0 ? `${stats.domains.total}` : null}
        />

        <QuickActionCard
          href="/dashboard/statistics"
          icon={IconTrendingUp}
          title={t("dashboard.quickActions.viewStats")}
          description={t("dashboard.quickActions.viewStatsDesc")}
        />
      </div>
    </div>
  );
}
