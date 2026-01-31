"use client";

import { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  Brain,
  Code,
  Info,
  ChevronDown,
  Plus,
  Trash2,
  AlertTriangle,
  Zap,
  Clock,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  enabled: false,
  rateLimit: {
    windowSeconds: 5,
    maxRequests: 100,
  },
  blockDurationSeconds: 300,
  slowloris: {
    minContentLength: 128,
    maxHeaderTimeoutSeconds: 20,
    maxConnections: 100,
  },
  jsChallenge: {
    enabled: false,
    cookieName: "defenra_js_challenge",
    ttlSeconds: 900,
  },
  logging: {
    enabled: true,
  },
  ipWhitelist: [],
  proxyIpHeaders: [],
  l7Protection: {
    enabled: false,
    tlsFingerprintEnabled: true,
    botDetectionEnabled: true,
    browserValidationEnabled: true,
    fingerprintRateLimit: 10,
    ipRateLimit: 50,
    failChallengeRateLimit: 5,
    suspiciousThreshold: 2,
    blockedFingerprints: [],
    allowedFingerprints: [],
  },
  challengeSettings: {
    cookieChallenge: {
      enabled: true,
      ttl: 3600,
    },
    jsChallenge: {
      enabled: true,
      difficulty: 4,
      ttl: 1800,
    },
    captchaChallenge: {
      enabled: false,
      ttl: 7200,
    },
    autoOffloading: {
      enabled: true,
      failureThreshold: 5,
      timeWindowSeconds: 10,
      banDurationMinutes: 60,
    },
  },
  customRules: [],
};

function normalizeConfig(config) {
  if (!config) {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  return {
    ...DEFAULT_CONFIG,
    ...config,
    rateLimit: {
      ...DEFAULT_CONFIG.rateLimit,
      ...config.rateLimit,
    },
    slowloris: {
      ...DEFAULT_CONFIG.slowloris,
      ...config.slowloris,
    },
    jsChallenge: {
      ...DEFAULT_CONFIG.jsChallenge,
      ...config.jsChallenge,
    },
    logging: {
      ...DEFAULT_CONFIG.logging,
      ...config.logging,
    },
    l7Protection: {
      ...DEFAULT_CONFIG.l7Protection,
      ...config.l7Protection,
    },
    challengeSettings: {
      cookieChallenge: {
        ...DEFAULT_CONFIG.challengeSettings.cookieChallenge,
        ...config.challengeSettings?.cookieChallenge,
      },
      jsChallenge: {
        ...DEFAULT_CONFIG.challengeSettings.jsChallenge,
        ...config.challengeSettings?.jsChallenge,
      },
      captchaChallenge: {
        ...DEFAULT_CONFIG.challengeSettings.captchaChallenge,
        ...config.challengeSettings?.captchaChallenge,
      },
      autoOffloading: {
        ...DEFAULT_CONFIG.challengeSettings.autoOffloading,
        ...config.challengeSettings?.autoOffloading,
      },
    },
    ipWhitelist: Array.isArray(config.ipWhitelist)
      ? config.ipWhitelist
      : DEFAULT_CONFIG.ipWhitelist,
    proxyIpHeaders: Array.isArray(config.proxyIpHeaders)
      ? config.proxyIpHeaders
      : DEFAULT_CONFIG.proxyIpHeaders,
    customRules: Array.isArray(config.customRules)
      ? config.customRules
      : DEFAULT_CONFIG.customRules,
  };
}

export function AntiDDoSTab({ domain, onUpdate }) {
  const antiDDoS = normalizeConfig(domain?.httpProxy?.antiDDoS);

  const updateAntiDDoS = (updater) => {
    const current = normalizeConfig(domain?.httpProxy?.antiDDoS);
    const next = typeof updater === "function" ? updater(current) : updater;

    onUpdate({
      ...domain,
      httpProxy: {
        ...domain.httpProxy,
        antiDDoS: next,
      },
    });
  };

  const handleToggle = (keyPath) => (checked) => {
    updateAntiDDoS((prev) => {
      const next = { ...prev };
      let target = next;
      for (let i = 0; i < keyPath.length - 1; i++) {
        const key = keyPath[i];
        target[key] = { ...target[key] };
        target = target[key];
      }
      target[keyPath[keyPath.length - 1]] = checked;
      return next;
    });
  };

  const handleNumberChange = (keyPath) => (event) => {
    const value = Number(event.target.value) || 0;
    updateAntiDDoS((prev) => {
      const next = { ...prev };
      let target = next;
      for (let i = 0; i < keyPath.length - 1; i++) {
        const key = keyPath[i];
        target[key] = { ...target[key] };
        target = target[key];
      }
      target[keyPath[keyPath.length - 1]] = value;
      return next;
    });
  };

  const handleListChange = (keyPath) => (event) => {
    const value = event.target.value;
    const items = value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    updateAntiDDoS((prev) => {
      const next = { ...prev };
      let target = next;
      const keys = typeof keyPath === "string" ? keyPath.split(".") : keyPath;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        target[key] = { ...target[key] };
        target = target[key];
      }
      target[keys[keys.length - 1]] = items;
      return next;
    });
  };

  const addCustomRule = () => {
    updateAntiDDoS((prev) => ({
      ...prev,
      customRules: [
        ...prev.customRules,
        {
          name: "New Rule",
          expression: "ip.country == 'CN'",
          action: "block",
          enabled: true,
        },
      ],
    }));
  };

  const updateCustomRule = (index, field, value) => {
    updateAntiDDoS((prev) => ({
      ...prev,
      customRules: prev.customRules.map((rule, i) =>
        i === index ? { ...rule, [field]: value } : rule,
      ),
    }));
  };

  const removeCustomRule = (index) => {
    updateAntiDDoS((prev) => ({
      ...prev,
      customRules: prev.customRules.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <ModernCard>
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                Anti-DDoS Protection
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Multi-layer protection with TLS fingerprinting, challenge system,
                and custom rules
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="l7" className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4" />
                L7 Protection
              </TabsTrigger>
              <TabsTrigger value="challenges" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Challenges
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Rules
              </TabsTrigger>
            </TabsList>

            {/* Basic Protection Tab */}
            <TabsContent value="basic" className="space-y-6">
              {/* Master Toggle */}
              <div className="flex items-center justify-between p-5 rounded-lg border bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <ShieldCheck className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Enable Anti-DDoS</p>
                    <p className="text-sm text-muted-foreground">
                      Basic rate limiting, blocking, and checks
                    </p>
                  </div>
                </div>
                <Switch
                  checked={antiDDoS.enabled}
                  onCheckedChange={handleToggle(["enabled"])}
                />
              </div>

              {antiDDoS.enabled && (
                <>
                  {/* Rate Limiting Card */}
                  <div className="p-5 rounded-lg border space-y-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <h3 className="font-semibold text-sm">Rate Limiting</h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Window (seconds)
                        </label>
                        <Input
                          type="number"
                          value={antiDDoS.rateLimit.windowSeconds}
                          onChange={handleNumberChange([
                            "rateLimit",
                            "windowSeconds",
                          ])}
                          min={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Max Requests
                        </label>
                        <Input
                          type="number"
                          value={antiDDoS.rateLimit.maxRequests}
                          onChange={handleNumberChange([
                            "rateLimit",
                            "maxRequests",
                          ])}
                          min={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Block Duration (seconds)
                        </label>
                        <Input
                          type="number"
                          value={antiDDoS.blockDurationSeconds}
                          onChange={handleNumberChange(["blockDurationSeconds"])}
                          min={60}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Slowloris Protection Card */}
                  <div className="p-5 rounded-lg border space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <h3 className="font-semibold text-sm">Slowloris Protection</h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Min Content-Length
                        </label>
                        <Input
                          type="number"
                          value={antiDDoS.slowloris.minContentLength}
                          onChange={handleNumberChange([
                            "slowloris",
                            "minContentLength",
                          ])}
                          min={0}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Header Timeout (seconds)
                        </label>
                        <Input
                          type="number"
                          value={antiDDoS.slowloris.maxHeaderTimeoutSeconds}
                          onChange={handleNumberChange([
                            "slowloris",
                            "maxHeaderTimeoutSeconds",
                          ])}
                          min={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Max Connections
                        </label>
                        <Input
                          type="number"
                          value={antiDDoS.slowloris.maxConnections}
                          onChange={handleNumberChange([
                            "slowloris",
                            "maxConnections",
                          ])}
                          min={1}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Whitelist Card */}
                  <div className="p-5 rounded-lg border space-y-4">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-green-500" />
                      <h3 className="font-semibold text-sm">Whitelist</h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          IP Whitelist (one per line)
                        </label>
                        <Textarea
                          rows={4}
                          value={antiDDoS.ipWhitelist.join("\n")}
                          onChange={handleListChange("ipWhitelist")}
                          placeholder="1.2.3.4&#10;10.0.0.0/24"
                          className="text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Proxy Headers (one per line)
                        </label>
                        <Textarea
                          rows={4}
                          value={antiDDoS.proxyIpHeaders.join("\n")}
                          onChange={handleListChange("proxyIpHeaders")}
                          placeholder="CF-Connecting-IP&#10;X-Forwarded-For"
                          className="text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* L7 Protection Tab */}
            <TabsContent value="l7" className="space-y-6">
              {/* Master Toggle */}
              <div className="flex items-center justify-between p-5 rounded-lg border bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Fingerprint className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Enable L7 Protection</p>
                    <p className="text-sm text-muted-foreground">
                      TLS fingerprinting and advanced filtering
                    </p>
                  </div>
                </div>
                <Switch
                  checked={antiDDoS.l7Protection.enabled}
                  onCheckedChange={handleToggle(["l7Protection", "enabled"])}
                />
              </div>

              {antiDDoS.l7Protection.enabled && (
                <>
                  {/* Feature Toggles */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">TLS Fingerprinting</p>
                        <p className="text-xs text-muted-foreground">
                          Analyze TLS fingerprints
                        </p>
                      </div>
                      <Switch
                        checked={antiDDoS.l7Protection.tlsFingerprintEnabled}
                        onCheckedChange={handleToggle([
                          "l7Protection",
                          "tlsFingerprintEnabled",
                        ])}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">Bot Detection</p>
                        <p className="text-xs text-muted-foreground">
                          Detect automated bots
                        </p>
                      </div>
                      <Switch
                        checked={antiDDoS.l7Protection.botDetectionEnabled}
                        onCheckedChange={handleToggle([
                          "l7Protection",
                          "botDetectionEnabled",
                        ])}
                      />
                    </div>
                  </div>

                  {/* Rate Limits */}
                  <div className="p-5 rounded-lg border space-y-4">
                    <h3 className="font-semibold text-sm">Rate Limits</h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Fingerprint Limit
                        </label>
                        <Input
                          type="number"
                          value={antiDDoS.l7Protection.fingerprintRateLimit}
                          onChange={handleNumberChange([
                            "l7Protection",
                            "fingerprintRateLimit",
                          ])}
                          min={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          IP Limit
                        </label>
                        <Input
                          type="number"
                          value={antiDDoS.l7Protection.ipRateLimit}
                          onChange={handleNumberChange([
                            "l7Protection",
                            "ipRateLimit",
                          ])}
                          min={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Suspicion Threshold
                        </label>
                        <Input
                          type="number"
                          value={antiDDoS.l7Protection.suspiciousThreshold}
                          onChange={handleNumberChange([
                            "l7Protection",
                            "suspiciousThreshold",
                          ])}
                          min={0}
                          max={5}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Challenges Tab */}
            <TabsContent value="challenges" className="space-y-6">
              {/* Cookie Challenge */}
              <div className="p-5 rounded-lg border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 rounded">
                      <Shield className="h-4 w-4 text-blue-500" />
                    </div>
                    <h3 className="font-semibold text-sm">Cookie Challenge (Stage 1)</h3>
                  </div>
                  <Switch
                    checked={antiDDoS.challengeSettings.cookieChallenge.enabled}
                    onCheckedChange={handleToggle([
                      "challengeSettings",
                      "cookieChallenge",
                      "enabled",
                    ])}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    TTL (seconds)
                  </label>
                  <Input
                    type="number"
                    value={antiDDoS.challengeSettings.cookieChallenge.ttl}
                    onChange={handleNumberChange([
                      "challengeSettings",
                      "cookieChallenge",
                      "ttl",
                    ])}
                    min={60}
                  />
                </div>
              </div>

              {/* JS Challenge */}
              <div className="p-5 rounded-lg border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-500/10 rounded">
                      <Code className="h-4 w-4 text-green-500" />
                    </div>
                    <h3 className="font-semibold text-sm">JavaScript PoW (Stage 2)</h3>
                  </div>
                  <Switch
                    checked={antiDDoS.challengeSettings.jsChallenge.enabled}
                    onCheckedChange={handleToggle([
                      "challengeSettings",
                      "jsChallenge",
                      "enabled",
                    ])}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Difficulty (1-8)
                    </label>
                    <Input
                      type="number"
                      value={antiDDoS.challengeSettings.jsChallenge.difficulty}
                      onChange={handleNumberChange([
                        "challengeSettings",
                        "jsChallenge",
                        "difficulty",
                      ])}
                      min={1}
                      max={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      TTL (seconds)
                    </label>
                    <Input
                      type="number"
                      value={antiDDoS.challengeSettings.jsChallenge.ttl}
                      onChange={handleNumberChange([
                        "challengeSettings",
                        "jsChallenge",
                        "ttl",
                      ])}
                      min={60}
                    />
                  </div>
                </div>
              </div>

              {/* CAPTCHA Challenge */}
              <div className="p-5 rounded-lg border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-500/10 rounded">
                      <ShieldAlert className="h-4 w-4 text-orange-500" />
                    </div>
                    <h3 className="font-semibold text-sm">CAPTCHA Challenge (Stage 3)</h3>
                  </div>
                  <Switch
                    checked={antiDDoS.challengeSettings.captchaChallenge.enabled}
                    onCheckedChange={handleToggle([
                      "challengeSettings",
                      "captchaChallenge",
                      "enabled",
                    ])}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    TTL (seconds)
                  </label>
                  <Input
                    type="number"
                    value={antiDDoS.challengeSettings.captchaChallenge.ttl}
                    onChange={handleNumberChange([
                      "challengeSettings",
                      "captchaChallenge",
                      "ttl",
                    ])}
                    min={60}
                  />
                </div>
              </div>

              {/* Auto-Offloading */}
              <div className="p-5 rounded-lg border bg-gradient-to-r from-orange-500/5 to-red-500/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold">Auto-Offloading (L7→L3)</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically ban IPs at kernel level
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={antiDDoS.challengeSettings.autoOffloading?.enabled}
                    onCheckedChange={handleToggle([
                      "challengeSettings",
                      "autoOffloading",
                      "enabled",
                    ])}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Failure Threshold
                    </label>
                    <Input
                      type="number"
                      value={
                        antiDDoS.challengeSettings.autoOffloading?.failureThreshold ?? 5
                      }
                      onChange={handleNumberChange([
                        "challengeSettings",
                        "autoOffloading",
                        "failureThreshold",
                      ])}
                      min={1}
                      max={20}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Time Window (seconds)
                    </label>
                    <Input
                      type="number"
                      value={
                        antiDDoS.challengeSettings.autoOffloading?.timeWindowSeconds ?? 10
                      }
                      onChange={handleNumberChange([
                        "challengeSettings",
                        "autoOffloading",
                        "timeWindowSeconds",
                      ])}
                      min={1}
                      max={60}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Ban Duration (minutes)
                    </label>
                    <Input
                      type="number"
                      value={
                        antiDDoS.challengeSettings.autoOffloading?.banDurationMinutes ?? 60
                      }
                      onChange={handleNumberChange([
                        "challengeSettings",
                        "autoOffloading",
                        "banDurationMinutes",
                      ])}
                      min={1}
                      max={1440}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Custom Rules Tab */}
            <TabsContent value="rules" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Custom Rules</h3>
                <Button onClick={addCustomRule} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>

              {antiDDoS.customRules.length === 0 ? (
                <div className="text-center py-12 rounded-lg border border-dashed">
                  <Code className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">
                    No custom rules
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add rules to customize filtering
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {antiDDoS.customRules.map((rule, index) => (
                    <div
                      key={index}
                      className="p-5 rounded-lg border space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(checked) =>
                              updateCustomRule(index, "enabled", checked)
                            }
                          />
                          <Badge variant={rule.enabled ? "default" : "secondary"}>
                            {rule.enabled ? "Active" : "Disabled"}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomRule(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Rule Name
                          </label>
                          <Input
                            value={rule.name}
                            onChange={(e) =>
                              updateCustomRule(index, "name", e.target.value)
                            }
                            placeholder="Block Country"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Action
                          </label>
                          <Select
                            value={rule.action}
                            onValueChange={(value) =>
                              updateCustomRule(index, "action", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="block">Block</SelectItem>
                              <SelectItem value="challenge">Challenge</SelectItem>
                              <SelectItem value="allow">Allow</SelectItem>
                              <SelectItem value="rate_limit">Rate Limit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Expression
                        </label>
                        <Textarea
                          value={rule.expression}
                          onChange={(e) =>
                            updateCustomRule(index, "expression", e.target.value)
                          }
                          placeholder="ip.country == 'CN' || ip.country == 'RU'"
                          className="text-xs font-mono"
                          rows={2}
                        />
                        <p className="text-xs text-muted-foreground">
                          Examples: ip.country == &apos;CN&apos;, request.path.startsWith(&apos;/api&apos;)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </ModernCard>
    </div>
  );
}
