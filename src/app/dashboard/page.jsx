"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconRobot, IconNetwork, IconActivity, IconClock, IconTrendingUp, IconWorld } from "@tabler/icons-react";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    agents: { total: 0, active: 0, inactive: 0 },
    proxies: { total: 0, active: 0 },
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
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
            active: agents.filter(a => a.isActive).length,
            inactive: agents.filter(a => !a.isActive && a.isConnected).length,
          },
          proxies: {
            total: proxies.length,
            active: proxies.filter(p => p.isActive).length,
          },
        });

        const activity = [
          ...agents.slice(0, 5).map(a => ({
            type: "agent",
            title: a.name,
            status: a.isActive ? "active" : "inactive",
            time: a.lastSeen || a.createdAt,
            ip: a.ipAddress,
            location: a.ipInfo?.city && a.ipInfo?.country ? `${a.ipInfo.city}, ${a.ipInfo.country}` : null,
          })),
          ...proxies.slice(0, 5).map(p => ({
            type: "proxy",
            title: p.name,
            status: p.isActive ? "active" : "inactive",
            time: p.updatedAt || p.createdAt,
            route: `${p.type.toUpperCase()} :${p.sourcePort} → ${p.destinationHost}:${p.destinationPort}`,
          })),
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

        setRecentActivity(activity);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return "—";
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "только что";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин назад`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч назад`;
    return `${Math.floor(seconds / 86400)} д назад`;
  };

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Добро пожаловать</h1>
        <p className="text-muted-foreground">
          Обзор вашей инфраструктуры и активности агентов
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/agents">
          <Card className="hover:bg-accent/50 transition-all hover:scale-105 cursor-pointer border-green-500/20 hover:border-green-500/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные агенты</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <IconActivity className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.agents.active}</div>
              <p className="text-xs text-muted-foreground">
                из {stats.agents.total} агентов
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/agents">
          <Card className="hover:bg-accent/50 transition-all hover:scale-105 cursor-pointer border-yellow-500/20 hover:border-yellow-500/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Неактивные агенты</CardTitle>
              <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <IconClock className="h-4 w-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.agents.inactive}</div>
              <p className="text-xs text-muted-foreground">
                требуют внимания
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/proxies">
          <Card className="hover:bg-accent/50 transition-all hover:scale-105 cursor-pointer border-blue-500/20 hover:border-blue-500/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные прокси</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <IconNetwork className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.proxies.active}</div>
              <p className="text-xs text-muted-foreground">
                из {stats.proxies.total} прокси
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Производительность</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <IconTrendingUp className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">98%</div>
            <p className="text-xs text-muted-foreground">
              среднее время работы
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconActivity className="h-5 w-5" />
            Последняя активность
          </CardTitle>
          <CardDescription>
            Обновления агентов и прокси-конфигураций
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Загрузка...
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет активности
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    item.type === "agent" 
                      ? "bg-green-500/10" 
                      : "bg-blue-500/10"
                  }`}>
                    {item.type === "agent" ? (
                      <IconRobot className={`h-5 w-5 ${item.status === "active" ? "text-green-500" : "text-yellow-500"}`} />
                    ) : (
                      <IconNetwork className={`h-5 w-5 ${item.status === "active" ? "text-blue-500" : "text-zinc-500"}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
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
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === "active"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}>
                      {item.status === "active" ? "Активен" : "Неактивен"}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
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
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/agents">
          <Card className="hover:bg-accent/50 transition-all hover:scale-[1.02] cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconRobot className="h-5 w-5 group-hover:text-green-500 transition-colors" />
                Управление агентами
              </CardTitle>
              <CardDescription>
                Добавляйте, мониторьте и управляйте вашими агентами
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/proxies">
          <Card className="hover:bg-accent/50 transition-all hover:scale-[1.02] cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconNetwork className="h-5 w-5 group-hover:text-blue-500 transition-colors" />
                Настройка прокси
              </CardTitle>
              <CardDescription>
                Создавайте и управляйте TCP/UDP проксированием
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
