"use client";

import {
  IconActivity,
  IconClock,
  IconNetwork,
  IconRobot,
  IconTrendingUp,
  IconWorld,
} from "@tabler/icons-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    agents: { total: 0, active: 0, inactive: 0 },
    proxies: { total: 0, active: 0 },
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [agentsRes, proxiesRes] = await Promise.all([
        fetch("/api/agent/list"),
        fetch("/api/proxy/list"),
      ]);

      const agentsData = await agentsRes.json();
      const proxiesData = await proxiesRes.json();

      if (agentsRes.ok && proxiesRes.ok) {
        const agents = agentsData.agents || [];
        const proxies = proxiesData.proxies || [];

        setStats({
          agents: {
            total: agents.length,
            active: agents.filter((a) => a.isActive).length,
            inactive: agents.filter((a) => !a.isActive && a.isConnected).length,
          },
          proxies: {
            total: proxies.length,
            active: proxies.filter((p) => p.isActive).length,
          },
        });

        const activity = [
          ...agents.slice(0, 5).map((a) => ({
            type: "agent",
            title: a.name,
            status: a.isActive ? "active" : "inactive",
            time: a.lastSeen || a.createdAt,
            ip: a.ipAddress,
            location:
              a.ipInfo?.city && a.ipInfo?.country
                ? `${a.ipInfo.city}, ${a.ipInfo.country}`
                : null,
          })),
          ...proxies.slice(0, 5).map((p) => ({
            type: "proxy",
            title: p.name,
            status: p.isActive ? "active" : "inactive",
            time: p.updatedAt || p.createdAt,
            route: `${p.type.toUpperCase()} :${p.sourcePort} → ${p.destinationHost}:${p.destinationPort}`,
          })),
        ]
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, 8);

        setRecentActivity(activity);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatTimeAgo = (date) => {
    if (!date) return "—";
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return "только что";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин назад`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч назад`;
    return `${Math.floor(seconds / 86400)} д назад`;
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Stats Grid - Large blocks */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Agents Block */}
        <Link href="/dashboard/agents">
          <Card className="hover:bg-accent transition-colors cursor-pointer border-border h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <IconRobot className="h-6 w-6 text-muted-foreground" />
                <CardTitle className="text-lg font-medium">Агенты</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-6xl font-bold mb-2">
                  {stats.agents.active}
                </div>
                <p className="text-sm text-muted-foreground">
                  Активных из {stats.agents.total} всего
                </p>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <IconActivity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{stats.agents.active} онлайн</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconClock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{stats.agents.inactive} неактивных</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Proxies Block */}
        <Link href="/dashboard/proxies">
          <Card className="hover:bg-accent transition-colors cursor-pointer border-border h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <IconNetwork className="h-6 w-6 text-muted-foreground" />
                <CardTitle className="text-lg font-medium">Прокси</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-6xl font-bold mb-2">
                  {stats.proxies.active}
                </div>
                <p className="text-sm text-muted-foreground">
                  Активных из {stats.proxies.total} всего
                </p>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <IconWorld className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">TCP/UDP маршрутизация</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <IconActivity className="h-6 w-6 text-muted-foreground" />
              <CardTitle className="text-lg font-medium">Активность</CardTitle>
            </div>
            <CardDescription className="mt-2">
              Последние обновления системы
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Загрузка...
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Нет активности
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.slice(0, 6).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-accent transition-colors"
                  >
                    {item.type === "agent" ? (
                      <IconRobot className="h-5 w-5 text-muted-foreground mt-0.5" />
                    ) : (
                      <IconNetwork className="h-5 w-5 text-muted-foreground mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.route || (
                          <>
                            {item.ip && (
                              <>
                                <IconWorld className="inline h-3 w-3 mr-1" />
                                {item.ip}
                              </>
                            )}
                            {item.location && ` • ${item.location}`}
                          </>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(item.time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-col gap-6">
          <Link href="/dashboard/agents" className="flex-1">
            <Card className="hover:bg-accent transition-colors cursor-pointer border-border h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <IconRobot className="h-6 w-6 text-muted-foreground" />
                  <CardTitle className="text-lg font-medium">
                    Управление агентами
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Добавляйте, мониторьте и управляйте вашими агентами
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/proxies" className="flex-1">
            <Card className="hover:bg-accent transition-colors cursor-pointer border-border h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <IconNetwork className="h-6 w-6 text-muted-foreground" />
                  <CardTitle className="text-lg font-medium">
                    Настройка прокси
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Создавайте и управляйте TCP/UDP проксированием
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
