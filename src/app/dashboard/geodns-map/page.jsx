"use client";

import {
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
  IconCircle,
  IconCircleFilled,
  IconMapPin,
  IconRefresh,
  IconWorld,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function fetchGeoDnsMap() {
  const response = await fetch("/api/geodns/map");
  if (!response.ok) {
    throw new Error("Ошибка загрузки карты GeoDNS");
  }
  return response.json();
}

export default function GeoDnsMapPage() {
  // Track expanded domains (empty = all collapsed by default)
  const [expandedDomains, setExpandedDomains] = useState(new Set());

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["geodns-map"],
    queryFn: fetchGeoDnsMap,
    refetchInterval: 30000,
  });

  const toggleDomain = (domainId) => {
    setExpandedDomains((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(domainId)) {
        newSet.delete(domainId);
      } else {
        newSet.add(domainId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (agent) => {
    if (!agent.isConnected) {
      return <IconCircle className="h-3 w-3 text-zinc-500" />;
    }
    if (agent.isActive) {
      return <IconCircleFilled className="h-3 w-3 text-green-500" />;
    }
    return <IconAlertCircle className="h-3 w-3 text-yellow-500" />;
  };

  const domains = data?.domains || [];
  const stats = data?.stats || {
    totalAgents: 0,
    activeAgents: 0,
    totalDomains: 0,
    totalLocations: 0,
    directAssignments: 0,
    fallbackAssignments: 0,
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 py-4 px-4 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Карта GeoDNS зон
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Просмотр anycast записей как они передаются агентам
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <IconRefresh
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Доменов</CardTitle>
            <IconWorld className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDomains}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего зон</CardTitle>
            <IconMapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLocations}</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Прямые</CardTitle>
            <IconCircleFilled className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.directAssignments}
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fallback</CardTitle>
            <IconAlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {stats.fallbackAssignments}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего агентов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные</CardTitle>
            <IconCircleFilled className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.activeAgents}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                Загрузка...
              </div>
            </CardContent>
          </Card>
        ) : domains.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                Нет настроенных GeoDNS доменов
              </div>
            </CardContent>
          </Card>
        ) : (
          domains.map((domain) => {
            const isExpanded = expandedDomains.has(domain.id);

            return (
              <Card key={domain.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <IconWorld className="h-5 w-5" />
                        {domain.domain}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {domain.locationCount} зон • {domain.directCount} прямых
                        • {domain.fallbackCount} fallback
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleDomain(domain.id)}
                      className="ml-2"
                    >
                      {isExpanded ? (
                        <IconChevronUp className="h-4 w-4" />
                      ) : (
                        <IconChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    {domain.locations.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        Нет назначенных зон
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {domain.locations.map((location, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col gap-3 p-4 rounded-lg border ${
                              location.isDirect
                                ? "bg-green-500/5 border-green-500/20"
                                : location.isLastResort
                                  ? "bg-orange-500/5 border-orange-500/20"
                                  : "bg-blue-500/5 border-blue-500/20"
                            }`}
                          >
                            {/* Location info */}
                            <div className="flex items-start gap-3">
                              <IconMapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="px-2 py-1 rounded text-sm font-semibold bg-accent border">
                                    {location.locationCode.toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-base">
                                    {location.locationName}
                                  </span>
                                  {location.isDirect ? (
                                    <Badge
                                      variant="outline"
                                      className="border-green-500/50 text-green-600 text-sm font-medium"
                                    >
                                      DIRECT
                                    </Badge>
                                  ) : location.isLastResort ? (
                                    <Badge
                                      variant="outline"
                                      className="border-orange-500/50 text-orange-600 text-sm font-medium"
                                    >
                                      LAST RESORT
                                      {location.distanceKm &&
                                        ` • ${location.distanceKm}km`}
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="border-blue-500/50 text-blue-600 text-sm font-medium"
                                    >
                                      FALLBACK
                                      {location.distanceKm &&
                                        ` • ${location.distanceKm}km`}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {location.description}
                                </div>
                              </div>
                            </div>

                            {/* Agent info */}
                            <div className="flex items-center justify-between gap-3 pl-8 border-t pt-3">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {location.agent &&
                                  getStatusIcon(location.agent)}
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-base truncate">
                                    {location.agentName}
                                  </div>
                                  <div className="text-sm text-muted-foreground font-mono truncate">
                                    {location.agentIp}
                                  </div>
                                  {location.agent?.ipInfo && (
                                    <div className="text-sm text-muted-foreground truncate mt-0.5">
                                      {location.agent.ipInfo.city},{" "}
                                      {location.agent.ipInfo.country}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {location.agent && (
                                <Badge
                                  variant={
                                    location.agent.isActive
                                      ? "success"
                                      : location.agent.isConnected
                                        ? "warning"
                                        : "outline"
                                  }
                                  className="text-sm flex-shrink-0"
                                >
                                  {location.agent.isActive
                                    ? "Активен"
                                    : location.agent.isConnected
                                      ? "Подключён"
                                      : "Не подключён"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
