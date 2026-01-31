"use client";

import { useState } from "react";
import {
  Network,
  Info,
  Globe,
  Shield,
  Zap,
  Lock,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function ModernCard({ children, className }) {
  return (
    <div
      className={`border border-border/40 bg-card/60 backdrop-blur-sm rounded-lg overflow-hidden ${className || ""}`}
    >
      {children}
    </div>
  );
}

const DEFAULT_CONFIG = {
  routingMode: "direct",
  agentPool: [],
  maxHops: 3,
};

function normalizeConfig(httpProxy) {
  if (!httpProxy) {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  return {
    routingMode: httpProxy.routingMode || DEFAULT_CONFIG.routingMode,
    agentPool: Array.isArray(httpProxy.agentPool)
      ? httpProxy.agentPool
      : DEFAULT_CONFIG.agentPool,
    maxHops:
      typeof httpProxy.maxHops === "number"
        ? httpProxy.maxHops
        : DEFAULT_CONFIG.maxHops,
  };
}

export function AnycastRoutingTab({ domain, agents = [], onUpdate }) {
  const config = normalizeConfig(domain?.httpProxy);

  const updateConfig = (updater) => {
    const current = normalizeConfig(domain?.httpProxy);
    const next = typeof updater === "function" ? updater(current) : updater;

    onUpdate({
      ...domain,
      httpProxy: {
        ...domain.httpProxy,
        routingMode: next.routingMode,
        maxHops: next.maxHops,
      },
    });
  };

  const handleRoutingModeChange = (value) => {
    updateConfig((prev) => ({
      ...prev,
      routingMode: value,
    }));
  };

  const handleMaxHopsChange = (event) => {
    const value = Number(event.target.value) || 3;
    updateConfig((prev) => ({
      ...prev,
      maxHops: Math.max(1, Math.min(10, value)),
    }));
  };

  const isAnycastMode = config.routingMode === "anycast";

  return (
    <div className="space-y-6">
      <ModernCard>
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Network className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold">
                  Anycast Routing
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  BETA
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Route traffic through multiple agents before reaching origin
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Info Card */}
          <Collapsible>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-colors">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  How Anycast Routing works
                </span>
                <ChevronDown className="h-4 w-4 ml-auto text-blue-500" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-sm space-y-2">
                <p className="text-muted-foreground">
                  • Direct mode: Client → Agent → Origin
                </p>
                <p className="text-muted-foreground">
                  • Anycast mode: Client → Agent A → Agent B → ... → Origin
                </p>
                <p className="text-muted-foreground">
                  • Agents auto-discover each other via Core API
                </p>
                <p className="text-muted-foreground">
                  • Routing based on: geolocation, agent health, network latency
                </p>
                <p className="text-muted-foreground">
                  • Each agent applies WAF, rate limiting, and firewall rules
                </p>
                <p className="text-muted-foreground">
                  • X-Defenra-Hop header tracks routing path
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Routing Mode Selection */}
          <div className="p-5 rounded-lg border space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Routing Mode</label>
              <Select
                value={config.routingMode}
                onValueChange={handleRoutingModeChange}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Direct</span>
                      <Badge variant="secondary" className="text-xs ml-2">
                        Default
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="anycast">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      <span>Anycast</span>
                      <Badge
                        variant="outline"
                        className="text-xs ml-2 bg-green-500/10 text-green-600 border-green-500/20"
                      >
                        Auto
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {config.routingMode === "direct"
                  ? "Direct routing to origin server"
                  : "Automatic routing through agent network"}
              </p>
            </div>

            {/* Max Hops */}
            {isAnycastMode && (
              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-semibold">Maximum Hops</label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={config.maxHops}
                    onChange={handleMaxHopsChange}
                    min={1}
                    max={10}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    Prevents routing loops (recommended: 3)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Status Card */}
          <div
            className={`p-5 rounded-lg border ${
              isAnycastMode
                ? "bg-green-500/5 border-green-500/20"
                : "bg-muted/50"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-2 rounded-lg ${
                  isAnycastMode ? "bg-green-500/10" : "bg-muted"
                }`}
              >
                <Network
                  className={`h-5 w-5 ${
                    isAnycastMode ? "text-green-500" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div>
                <p className="font-semibold">
                  {isAnycastMode ? "Anycast Enabled" : "Direct Mode"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isAnycastMode
                    ? `Traffic will route through up to ${config.maxHops} agents`
                    : "Traffic routes directly to origin"}
                </p>
              </div>
              {isAnycastMode && (
                <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
              )}
            </div>

            {isAnycastMode && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span>Multi-layer DDoS protection</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-green-500" />
                  <span>Geographic optimization</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>Load distribution</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="h-4 w-4 text-purple-500" />
                  <span>Deep security filtering</span>
                </div>
              </div>
            )}
          </div>

          {/* Auto-Discovery Info */}
          {isAnycastMode && (
            <div className="p-5 rounded-lg border bg-green-500/5 border-green-500/20">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Auto-Discovery Active</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      • Agents receive list of other active agents every 60s
                    </p>
                    <p>• Health checks every 30s (latency, availability)</p>
                    <p>• Unavailable agents automatically excluded</p>
                    <p>• Loop prevention: no routing to visited nodes</p>
                    <p>• Automatic fallback to origin if agents unavailable</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </ModernCard>
    </div>
  );
}
