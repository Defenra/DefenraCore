"use client";

import { useState } from "react";
import {
  Shield,
  Lock,
  RefreshCw,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Info,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";

function ModernCard({ children, className }) {
  return (
    <div
      className={`border border-border/40 bg-card/60 backdrop-blur-sm rounded-lg overflow-hidden ${className || ""}`}
    >
      {children}
    </div>
  );
}

export function SslTab({ domain, onUpdate }) {
  const [isIssuing, setIsIssuing] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [acmeEmail, setAcmeEmail] = useState(
    domain.httpProxy?.ssl?.acmeEmail || "",
  );

  const handleIssueCertificate = async () => {
    if (!acmeEmail) {
      toast.error("Please enter an email address for Let's Encrypt");
      return;
    }

    setIsIssuing(true);
    try {
      const response = await fetch(`/api/domain/${domain.id}/issue-ssl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: acmeEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error);
      }

      toast.success("Certificate issued successfully!");

      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (error) {
      toast.error(`Failed to issue certificate: ${error.message}`);
    } finally {
      setIsIssuing(false);
    }
  };

  const handleRenewCertificate = async () => {
    setIsRenewing(true);
    try {
      const response = await fetch(`/api/domain/${domain.id}/renew-ssl`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error);
      }

      toast.success("Certificate renewed successfully!");

      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (error) {
      toast.error(`Failed to renew certificate: ${error.message}`);
    } finally {
      setIsRenewing(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysUntilExpiry = () => {
    if (!domain.httpProxy?.ssl?.expiresAt) return null;
    const expiresAt = new Date(domain.httpProxy.ssl.expiresAt);
    const now = new Date();
    const days = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysUntilExpiry = getDaysUntilExpiry();
  const hasCertificate = domain.httpProxy?.ssl?.certificate;
  const renewalStatus = domain.httpProxy?.ssl?.renewalStatus;

  const getExpiryStatus = () => {
    if (daysUntilExpiry === null) return { color: "gray", label: "Unknown" };
    if (daysUntilExpiry <= 7) return { color: "red", label: "Critical" };
    if (daysUntilExpiry <= 30)
      return { color: "yellow", label: "Expiring Soon" };
    return { color: "green", label: "Valid" };
  };

  const expiryStatus = getExpiryStatus();

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
                SSL/TLS Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage SSL certificates for HTTPS termination on agents
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Certificate Status Card */}
          {hasCertificate && (
            <div
              className={`p-5 rounded-lg border ${
                expiryStatus.color === "red"
                  ? "bg-red-500/5 border-red-500/20"
                  : expiryStatus.color === "yellow"
                    ? "bg-yellow-500/5 border-yellow-500/20"
                    : "bg-green-500/5 border-green-500/20"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      expiryStatus.color === "red"
                        ? "bg-red-500/10"
                        : expiryStatus.color === "yellow"
                          ? "bg-yellow-500/10"
                          : "bg-green-500/10"
                    }`}
                  >
                    <Lock
                      className={`h-5 w-5 ${
                        expiryStatus.color === "red"
                          ? "text-red-500"
                          : expiryStatus.color === "yellow"
                            ? "text-yellow-500"
                            : "text-green-500"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-semibold">Certificate Active</p>
                    <p className="text-sm text-muted-foreground">
                      Issuer: {domain.httpProxy?.ssl?.issuer || "Unknown"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    expiryStatus.color === "green" ? "default" : "destructive"
                  }
                  className={
                    expiryStatus.color === "yellow"
                      ? "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"
                      : ""
                  }
                >
                  {renewalStatus === "pending"
                    ? "Renewing..."
                    : renewalStatus === "failed"
                      ? "Failed"
                      : expiryStatus.label}
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="font-medium">
                      {formatDate(domain.httpProxy?.ssl?.expiresAt)}
                    </span>
                  </div>
                  <Progress
                    value={Math.max(
                      0,
                      Math.min(100, ((90 - (daysUntilExpiry || 0)) / 90) * 100),
                    )}
                    className={`h-2 ${
                      expiryStatus.color === "red"
                        ? "bg-red-500/20"
                        : expiryStatus.color === "yellow"
                          ? "bg-yellow-500/20"
                          : "bg-green-500/20"
                    }`}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span
                      className={`text-sm ${
                        expiryStatus.color === "red"
                          ? "text-red-500 font-medium"
                          : expiryStatus.color === "yellow"
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}
                    >
                      {daysUntilExpiry} days remaining
                    </span>
                  </div>
                </div>

                {renewalStatus === "failed" &&
                  domain.httpProxy?.ssl?.renewalError && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600">
                        {domain.httpProxy.ssl.renewalError}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Info Card */}
          <Collapsible>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-colors">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  How SSL certificate issuance works (HTTP-01 Challenge)
                </span>
                <ChevronDown className="h-4 w-4 ml-auto text-blue-500" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-sm space-y-2">
                <p className="text-muted-foreground">
                  1. Core creates HTTP challenge and saves to database
                </p>
                <p className="text-muted-foreground">
                  2. Agents receive challenge via Poll API
                </p>
                <p className="text-muted-foreground">
                  3. Let&apos;s Encrypt requests: http://{domain.domain}
                  /.well-known/acme-challenge/TOKEN
                </p>
                <p className="text-muted-foreground">
                  4. Agent responds with keyAuthorization via Lua WAF
                </p>
                <p className="text-muted-foreground">
                  5. Certificate is issued and distributed to agents
                </p>
                <p className="text-muted-foreground">
                  6. Auto-renewal happens 30 days before expiry
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Let's Encrypt Section */}
          <div className="p-5 rounded-lg border bg-gradient-to-r from-green-500/5 to-emerald-500/5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-500/10 rounded">
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <h3 className="font-semibold text-sm">Let&apos;s Encrypt</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email for ACME notifications
                </label>
                <Input
                  type="email"
                  value={acmeEmail}
                  onChange={(e) => setAcmeEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="mt-1.5"
                />
              </div>

              <div className="flex gap-2">
                {!hasCertificate ? (
                  <Button
                    onClick={handleIssueCertificate}
                    disabled={isIssuing || !acmeEmail}
                    className="flex-1"
                  >
                    {isIssuing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Issuing...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Issue Certificate
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleRenewCertificate}
                    disabled={isRenewing}
                    variant="outline"
                    className="flex-1"
                  >
                    {isRenewing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Renewing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Renew Now
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* SSL Enable Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-semibold text-sm">Enable SSL/TLS</p>
              <p className="text-xs text-muted-foreground">
                HTTPS termination on agents
              </p>
            </div>
            <Switch
              checked={domain.httpProxy?.ssl?.enabled || false}
              onCheckedChange={(checked) =>
                onUpdate({
                  ...domain,
                  httpProxy: {
                    ...domain.httpProxy,
                    ssl: {
                      ...domain.httpProxy?.ssl,
                      enabled: checked,
                    },
                  },
                })
              }
            />
          </div>

          {/* SSL Encryption Mode */}
          {domain.httpProxy?.ssl?.enabled && (
            <div className="p-5 rounded-lg border bg-gradient-to-r from-blue-500/5 to-cyan-500/5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 rounded">
                  <Lock className="h-4 w-4 text-blue-500" />
                </div>
                <h3 className="font-semibold text-sm">Encryption Mode</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Select how Defenra connects to your origin server
              </p>

              <div className="space-y-3">
                {[
                  {
                    value: "full_strict",
                    title: "Full (Strict)",
                    desc: "End-to-end encryption with certificate validation. Use Defenra's Origin CA.",
                    color: "green",
                  },
                  {
                    value: "full",
                    title: "Full",
                    desc: "End-to-end encryption. Accepts self-signed certificates on origin.",
                    color: "blue",
                  },
                  {
                    value: "flexible",
                    title: "Flexible",
                    desc: "Encrypts visitor-to-agent only. Agent-to-origin uses HTTP.",
                    color: "yellow",
                  },
                  {
                    value: "off",
                    title: "Off (Not Secure)",
                    desc: "No encryption. Browsers will show security warnings.",
                    color: "red",
                  },
                ].map((mode) => (
                  <label
                    key={mode.value}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      (
                        domain.httpProxy?.ssl?.encryptionMode || "full_strict"
                      ) === mode.value
                        ? mode.color === "red"
                          ? "border-red-500/30 bg-red-500/5"
                          : "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="encryptionMode"
                      value={mode.value}
                      checked={
                        (domain.httpProxy?.ssl?.encryptionMode ||
                          "full_strict") === mode.value
                      }
                      onChange={(e) =>
                        onUpdate({
                          ...domain,
                          httpProxy: {
                            ...domain.httpProxy,
                            ssl: {
                              ...domain.httpProxy?.ssl,
                              encryptionMode: e.target.value,
                            },
                          },
                        })
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p
                        className={`font-medium text-sm ${
                          mode.color === "red" ? "text-red-500" : ""
                        }`}
                      >
                        {mode.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {mode.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Certificate Upload */}
          {domain.httpProxy?.ssl?.enabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  SSL Certificate (PEM)
                </label>
                <Textarea
                  value={domain.httpProxy?.ssl?.certificate || ""}
                  onChange={(e) =>
                    onUpdate({
                      ...domain,
                      httpProxy: {
                        ...domain.httpProxy,
                        ssl: {
                          ...domain.httpProxy?.ssl,
                          certificate: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIJAKZ...\n-----END CERTIFICATE-----"
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Private Key (PEM)
                </label>
                <Textarea
                  value={domain.httpProxy?.ssl?.privateKey || ""}
                  onChange={(e) =>
                    onUpdate({
                      ...domain,
                      httpProxy: {
                        ...domain.httpProxy,
                        ssl: {
                          ...domain.httpProxy?.ssl,
                          privateKey: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0...\n-----END PRIVATE KEY-----"
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>

              {/* Auto-Renewal Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <p className="font-semibold text-sm">Auto-Renewal</p>
                  <p className="text-xs text-muted-foreground">
                    Automatically renew 30 days before expiry
                  </p>
                </div>
                <Switch
                  checked={domain.httpProxy?.ssl?.autoRenew || false}
                  onCheckedChange={(checked) =>
                    onUpdate({
                      ...domain,
                      httpProxy: {
                        ...domain.httpProxy,
                        ssl: {
                          ...domain.httpProxy?.ssl,
                          autoRenew: checked,
                        },
                      },
                    })
                  }
                  disabled={!hasCertificate}
                />
              </div>
            </div>
          )}
        </CardContent>
      </ModernCard>
    </div>
  );
}
