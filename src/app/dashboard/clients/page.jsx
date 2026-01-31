"use client";

import { IconSearch, IconUsers, IconWorld } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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

// Stat Card Skeleton
function StatCardSkeleton() {
  return (
    <BentoCard>
      <CardHeader className="pb-4">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-12 w-20" />
        <Skeleton className="h-4 w-40" />
      </CardContent>
    </BentoCard>
  );
}

// Client Entry Skeleton
function ClientEntrySkeleton() {
  return (
    <div className="border border-border rounded-lg p-6 bg-card/50">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <Skeleton className="h-6 w-6 mt-1" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await fetch("/api/clients");
      if (!response.ok) {
        throw new Error(t("clients.errors.loadFailed"));
      }
      return response.json();
    },
    refetchInterval: 30000,
  });

  const clients = data?.clients || [];

  const filteredClients = clients.filter(
    (client) =>
      client.ip.includes(searchQuery) ||
      client.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.agent?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const stats = data?.stats || {
    totalClients: 0,
    activeConnections: 0,
    uniqueCountries: 0,
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
        </div>

        {/* Stats Skeleton */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Clients List Skeleton */}
        <BentoCard colSpan={2}>
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-10 w-64" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <ClientEntrySkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </BentoCard>
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
          <Button onClick={() => window.location.reload()} variant="outline">
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
            {t("clients.title")}
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            {stats.totalClients} {t("clients.connectedClients")}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        <BentoCard>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              {t("clients.stats.totalClients")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl md:text-5xl font-bold mb-2">
              {stats.totalClients}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("clients.stats.uniqueIPs")}
            </p>
          </CardContent>
        </BentoCard>

        <BentoCard>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              {t("clients.stats.activeConnections")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl md:text-5xl font-bold mb-2">
              {stats.activeConnections}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("clients.stats.openSessions")}
            </p>
          </CardContent>
        </BentoCard>

        <BentoCard>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              {t("clients.stats.countries")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl md:text-5xl font-bold mb-2">
              {stats.uniqueCountries}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("clients.stats.locations")}
            </p>
          </CardContent>
        </BentoCard>
      </div>

      {/* Clients List */}
      <BentoCard colSpan={2}>
        <CardHeader className="pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-medium">
              {t("clients.list.title")}
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("clients.list.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <IconUsers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("clients.noData")}</p>
              <p className="text-sm mt-2">{t("clients.noDataDescription")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="border border-border rounded-lg p-4 md:p-6 bg-card/50 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <IconWorld className="h-6 w-6 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                          <h3 className="font-medium text-lg font-mono">
                            {client.ip}
                          </h3>
                          {client.city && client.country && (
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              {client.city}, {client.country}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                          <span>
                            {t("clients.agent")}:{" "}
                            {client.agent?.name || t("clients.unknown")}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span>
                            {client.connections} {t("clients.connections")}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span>
                            {t("clients.lastVisit")}:{" "}
                            {new Date(client.lastSeen).toLocaleString()}
                          </span>
                        </div>
                        {client.userAgent && (
                          <p className="text-xs text-muted-foreground mt-2 truncate">
                            {client.userAgent}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                    >
                      {t("clients.details")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </BentoCard>
    </div>
  );
}
