"use client";

import {
  IconSearch,
  IconMapPin,
  IconServer,
  IconWorld,
  IconRouter,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconShieldLock,
} from "@tabler/icons-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

// Bento Card Component
function BentoCard({ children, className }) {
  return (
    <Card
      className={cn(
        "border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300",
        "hover:border-border hover:shadow-lg hover:shadow-primary/5",
        className,
      )}
    >
      {children}
    </Card>
  );
}

// Skeleton for loading state
function ResultSkeleton() {
  return (
    <div className="space-y-4">
      <BentoCard>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </BentoCard>
      <BentoCard>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </BentoCard>
    </div>
  );
}

async function checkIP(ip, domainId = null) {
  const url = new URL("/api/ip-check", window.location.origin);
  url.searchParams.set("ip", ip);
  if (domainId) url.searchParams.set("domainId", domainId);

  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to check IP");
  }
  return response.json();
}

export default function IPCheckPage() {
  const { t } = useTranslation();
  const [ip, setIp] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!ip.trim()) {
      toast.error(t("ipCheck.error.noIp"));
      return;
    }

    setLoading(true);
    try {
      const data = await checkIP(ip.trim());
      setResult(data);
    } catch (error) {
      toast.error(error.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCheck();
  };

  const getSelectionMethodBadge = (method) => {
    switch (method) {
      case "exact_match":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-500 border-green-500/20"
          >
            <IconCheck className="mr-1 h-3 w-3" />
            {t("ipCheck.routing.exactMatch")}
          </Badge>
        );
      case "nearest_fallback":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          >
            <IconRouter className="mr-1 h-3 w-3" />
            {t("ipCheck.routing.nearestFallback")}
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-500 border-red-500/20"
          >
            <IconX className="mr-1 h-3 w-3" />
            {t("ipCheck.routing.noAgent")}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("ipCheck.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("ipCheck.description")}
          </p>
        </div>
      </div>

      {/* Input Card */}
      <BentoCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSearch className="h-5 w-5" />
            {t("ipCheck.input.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="ip-input" className="sr-only">
                {t("ipCheck.input.label")}
              </Label>
              <Input
                id="ip-input"
                placeholder={t("ipCheck.input.placeholder")}
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-background/50"
              />
            </div>
            <Button
              onClick={handleCheck}
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <>
                  <IconSearch className="mr-2 h-4 w-4" />
                  {t("ipCheck.input.checkButton")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </BentoCard>

      {/* Results */}
      {loading && <ResultSkeleton />}

      {result && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* GeoIP Info */}
          <BentoCard className="md:col-span-2 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconWorld className="h-5 w-5" />
                {t("ipCheck.geoInfo.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.geoInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">
                        {t("ipCheck.geoInfo.ip")}
                      </span>
                      <span className="font-mono font-medium">{result.ip}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">
                        {t("ipCheck.geoInfo.country")}
                      </span>
                      <span className="font-medium">
                        {result.geoInfo.country} ({result.geoInfo.countryCode})
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">
                        {t("ipCheck.geoInfo.city")}
                      </span>
                      <span className="font-medium">
                        {result.geoInfo.city || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">
                        {t("ipCheck.geoInfo.region")}
                      </span>
                      <span className="font-medium">
                        {result.geoInfo.region || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">
                        {t("ipCheck.geoInfo.timezone")}
                      </span>
                      <span className="font-medium">
                        {result.geoInfo.timezone || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">
                        {t("ipCheck.geoInfo.isp")}
                      </span>
                      <span className="font-medium text-right max-w-[200px] truncate">
                        {result.geoInfo.isp || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">
                        {t("ipCheck.geoInfo.coordinates")}
                      </span>
                      <span className="font-mono text-sm">
                        {result.geoInfo.lat?.toFixed(4)},{" "}
                        {result.geoInfo.lon?.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-amber-500">
                  <IconAlertCircle className="h-5 w-5" />
                  <span>{result.error || t("ipCheck.geoInfo.unknown")}</span>
                </div>
              )}
            </CardContent>
          </BentoCard>

          {/* Agent Perspective */}
          <BentoCard className="md:col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconServer className="h-5 w-5" />
                {t("ipCheck.agentPerspective.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.geoInfo ? (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">
                      {t("ipCheck.agentPerspective.database")}
                    </span>
                    <span className="font-medium text-right">
                      {t("ipCheck.agentPerspective.databaseValue")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">
                      {t("ipCheck.agentPerspective.countryCode")}
                    </span>
                    <Badge variant="secondary" className="font-mono text-base">
                      {result.routing?.clientLocation?.toUpperCase() || "XX"}
                    </Badge>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground mb-1">
                      {t("ipCheck.agentPerspective.fallbackLogic")}
                    </p>
                    <p className="text-xs text-muted-foreground/80">
                      {t("ipCheck.agentPerspective.fallbackExplanation")}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 text-amber-500">
                  <IconAlertCircle className="h-5 w-5" />
                  <span>{t("ipCheck.geoInfo.unknown")}</span>
                </div>
              )}
            </CardContent>
          </BentoCard>

          {/* Routing Info */}
          {result.routing && (
            <BentoCard className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconRouter className="h-5 w-5" />
                  {t("ipCheck.routing.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Routing Summary - Compact on wide screens */}
                  <div className="lg:col-span-1 space-y-3">
                    {/* Selection Method */}
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground text-sm">
                        {t("ipCheck.routing.method")}
                      </span>
                      {getSelectionMethodBadge(result.routing.selectionMethod)}
                    </div>

                    {/* Client Location */}
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground text-sm">
                        {t("ipCheck.routing.clientLocation")}
                      </span>
                      <Badge variant="secondary" className="font-mono">
                        {result.routing.clientLocation}
                      </Badge>
                    </div>

                    {/* Distance */}
                    {result.routing.distance && (
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground text-sm">
                          {t("ipCheck.routing.distance")}
                        </span>
                        <span className="font-medium">
                          {result.routing.distance} km
                        </span>
                      </div>
                    )}

                    {/* Political Restriction */}
                    {result.routing.politicalRestriction && (
                      <div className="flex items-center gap-3 py-3 px-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <IconAlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                        <span className="text-amber-700 dark:text-amber-300 text-sm">
                          {result.routing.politicalRestriction}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Selected Agent Details */}
                  <div className="lg:col-span-2">
                    {result.routing.selectedAgent ? (
                      <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg h-full">
                        <div className="flex items-center gap-3 mb-4">
                          <IconServer className="h-5 w-5 text-primary" />
                          <span className="font-semibold">
                            {t("ipCheck.routing.selectedAgent")}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                {t("ipCheck.agent.name")}
                              </span>
                              <span className="font-medium">
                                {result.routing.selectedAgent.name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                {t("ipCheck.agent.ip")}
                              </span>
                              <span className="font-mono">
                                {result.routing.selectedAgent.ip}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                {t("ipCheck.agent.location")}
                              </span>
                              <span className="font-medium flex items-center gap-1">
                                <IconMapPin className="h-3 w-3" />
                                {result.routing.selectedAgent.location
                                  ?.country || "Unknown"}
                                {result.routing.selectedAgent.location?.city &&
                                  ` (${result.routing.selectedAgent.location.city})`}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                {t("ipCheck.agent.load")}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full",
                                      result.routing.selectedAgent.loadScore >
                                        80
                                        ? "bg-red-500"
                                        : result.routing.selectedAgent
                                              .loadScore > 60
                                          ? "bg-yellow-500"
                                          : "bg-green-500",
                                    )}
                                    style={{
                                      width: `${result.routing.selectedAgent.loadScore}%`,
                                    }}
                                  />
                                </div>
                                <span className="font-mono text-xs">
                                  {result.routing.selectedAgent.loadScore}%
                                </span>
                                {result.routing.selectedAgent.isOverloaded && (
                                  <Badge
                                    variant="outline"
                                    className="text-red-500 border-red-500/20 text-xs"
                                  >
                                    {t("ipCheck.agent.overloaded")}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Alternative Agents */}
                          {result.routing.selectedAgent.alternativeAgents
                            ?.length > 0 && (
                            <div className="border-t md:border-t-0 md:border-l border-border/50 md:pl-4 pt-4 md:pt-0">
                              <p className="text-sm text-muted-foreground mb-2">
                                {t("ipCheck.routing.alternativeAgents", {
                                  count:
                                    result.routing.selectedAgent
                                      .totalAgentsInPool,
                                })}
                              </p>
                              <div className="space-y-1">
                                {result.routing.selectedAgent.alternativeAgents.map(
                                  (agent) => (
                                    <div
                                      key={agent.agentId}
                                      className="flex justify-between items-center text-sm py-1 px-2 bg-background/50 rounded"
                                    >
                                      <span className="font-medium truncate max-w-[120px]">
                                        {agent.name}
                                      </span>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <span className="font-mono text-xs">
                                          {agent.ip}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            "text-xs",
                                            agent.isOverloaded
                                              ? "text-red-500 border-red-500/20"
                                              : "text-green-500 border-green-500/20",
                                          )}
                                        >
                                          {agent.loadScore}%
                                        </Badge>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 py-4 px-4 bg-red-500/10 border border-red-500/20 rounded-lg h-full">
                        <IconX className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <div>
                          <p className="text-red-700 dark:text-red-300 font-medium">
                            {t("ipCheck.routing.noAgentAvailable")}
                          </p>
                          <p className="text-red-600/80 dark:text-red-400/80 text-sm mt-1">
                            {t("ipCheck.routing.nxdomainWarning")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </BentoCard>
          )}

          {/* Ban Status */}
          {result.banInfo && (
            <BentoCard className={cn(
              result.banInfo.isBanned ? "border-red-500/30" : "border-green-500/30"
            )}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconShieldLock className={cn(
                    "h-5 w-5",
                    result.banInfo.isBanned ? "text-red-500" : "text-green-500"
                  )} />
                  {t("ipCheck.banStatus.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.banInfo.isBanned ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 py-2 px-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <IconX className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <span className="text-red-700 dark:text-red-300 font-medium">
                        {t("ipCheck.banStatus.banned")}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground">{t("ipCheck.banStatus.reason")}</span>
                        <span className="font-medium">{result.banInfo.reason}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground">{t("ipCheck.banStatus.bannedAt")}</span>
                        <span className="font-medium">
                          {new Date(result.banInfo.bannedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground">{t("ipCheck.banStatus.expiresAt")}</span>
                        <span className="font-medium">
                          {result.banInfo.isPermanent 
                            ? t("ipCheck.banStatus.permanent") 
                            : new Date(result.banInfo.expiresAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground">{t("ipCheck.banStatus.sourceAgent")}</span>
                        <span className="font-mono text-xs">{result.banInfo.sourceAgentId}</span>
                      </div>
                      {result.banInfo.isCIDR && (
                        <div className="flex justify-between py-2 border-b border-border/50">
                          <span className="text-muted-foreground">{t("ipCheck.banStatus.matchedRange")}</span>
                          <Badge variant="outline" className="font-mono">
                            {result.banInfo.matchedIP}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-4 px-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <IconCheck className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      {t("ipCheck.banStatus.notBanned")}
                    </span>
                  </div>
                )}
              </CardContent>
            </BentoCard>
          )}
        </div>
      )}
    </div>
  );
}
