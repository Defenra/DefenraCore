"use client";

import {
  IconCertificate,
  IconInfoCircle,
  IconRefresh,
  IconShieldCheck,
  IconUpload,
} from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
      month: "long",
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

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="border-b border-border pb-6">
          <CardTitle className="text-lg font-medium flex items-center gap-3">
            <IconShieldCheck className="h-6 w-6 text-muted-foreground" />
            SSL/TLS Настройки
          </CardTitle>
          <CardDescription className="mt-2">
            Управление SSL сертификатами для HTTPS терминации на агентах
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Certificate Status */}
          {hasCertificate && (
            <div
              className={`border rounded-lg p-4 ${daysUntilExpiry && daysUntilExpiry <= 30 ? "bg-yellow-500/5 border-yellow-500/20" : "bg-green-500/5 border-green-500/20"}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Certificate Status</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Issuer: {domain.httpProxy?.ssl?.issuer || "Unknown"}
                    </p>
                  </div>
                  {renewalStatus === "pending" && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 font-medium">
                      Renewing...
                    </span>
                  )}
                  {renewalStatus === "failed" && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-500 font-medium">
                      Failed
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Expires</p>
                    <p className="font-medium">
                      {formatDate(domain.httpProxy?.ssl?.expiresAt)}
                    </p>
                    {daysUntilExpiry !== null && (
                      <p
                        className={`text-xs mt-1 ${daysUntilExpiry <= 30 ? "text-yellow-500" : "text-green-500"}`}
                      >
                        {daysUntilExpiry} days remaining
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Last Renewal
                    </p>
                    <p className="font-medium">
                      {formatDate(domain.httpProxy?.ssl?.lastRenewal)}
                    </p>
                  </div>
                </div>
                {renewalStatus === "failed" &&
                  domain.httpProxy?.ssl?.renewalError && (
                    <p className="text-xs text-red-500 mt-2">
                      Error: {domain.httpProxy.ssl.renewalError}
                    </p>
                  )}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="border rounded-lg p-4 bg-blue-500/5 border-blue-500/20">
            <div className="flex items-start gap-3">
              <IconInfoCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">
                  How it works (HTTP-01 Challenge)
                </p>
                <ul className="text-muted-foreground space-y-1.5 text-xs">
                  <li>• Core creates HTTP challenge and saves to database</li>
                  <li>• Agents receive challenge via Poll API</li>
                  <li>
                    • Let's Encrypt requests:
                    http://{domain.domain}/.well-known/acme-challenge/TOKEN
                  </li>
                  <li>• Agent responds with keyAuthorization via Lua WAF</li>
                  <li>• Certificate is issued and distributed to agents</li>
                  <li>• Auto-renewal happens 30 days before expiry</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-blue-500/20">
                  <strong>Requirements:</strong> Port 80 must be accessible.
                  Lua WAF on agents handles /.well-known/acme-challenge/*
                  automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Let's Encrypt Section */}
          <div className="space-y-4 border rounded-lg p-4 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
            <div className="flex items-center gap-2">
              <IconCertificate className="h-5 w-5 text-green-500" />
              <h3 className="font-medium text-sm">Let's Encrypt</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
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
                    {isIssuing ? "Issuing..." : "Issue Certificate"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleRenewCertificate}
                    disabled={isRenewing}
                    variant="outline"
                    className="flex-1"
                  >
                    <IconRefresh className="h-4 w-4 mr-2" />
                    {isRenewing ? "Renewing..." : "Renew Now"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* SSL Enable Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Enable SSL/TLS</p>
              <p className="text-xs text-muted-foreground">
                HTTPS termination on agents
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={domain.httpProxy?.ssl?.enabled || false}
                onChange={(e) =>
                  onUpdate({
                    ...domain,
                    httpProxy: {
                      ...domain.httpProxy,
                      ssl: {
                        ...domain.httpProxy?.ssl,
                        enabled: e.target.checked,
                      },
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
            </label>
          </div>

          {/* Certificate Upload */}
          {domain.httpProxy?.ssl?.enabled && (
            <>
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <IconUpload className="h-4 w-4" />
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
                  placeholder="-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKZ...
-----END CERTIFICATE-----"
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <IconUpload className="h-4 w-4" />
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
                  placeholder="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0...
-----END PRIVATE KEY-----"
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>

              {/* Auto-Renewal Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-sm">Auto-Renewal</p>
                  <p className="text-xs text-muted-foreground">
                    Automatically renew 30 days before expiry
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={domain.httpProxy?.ssl?.autoRenew || false}
                    onChange={(e) =>
                      onUpdate({
                        ...domain,
                        httpProxy: {
                          ...domain.httpProxy,
                          ssl: {
                            ...domain.httpProxy?.ssl,
                            autoRenew: e.target.checked,
                          },
                        },
                      })
                    }
                    disabled={!hasCertificate}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                </label>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
