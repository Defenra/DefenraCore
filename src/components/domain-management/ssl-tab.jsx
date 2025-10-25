"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  IconShieldCheck,
  IconInfoCircle,
  IconUpload,
} from "@tabler/icons-react";

export function SslTab({ domain, onUpdate }) {
  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-green-500/5 to-emerald-500/5">
          <CardTitle className="text-xl flex items-center gap-2">
            <IconShieldCheck className="h-5 w-5 text-green-500" />
            SSL/TLS Настройки
          </CardTitle>
          <CardDescription className="mt-1.5">
            Управление SSL сертификатами для HTTPS терминации на агентах
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Info */}
          <div className="border rounded-lg p-4 bg-green-500/5 border-green-500/20">
            <div className="flex items-start gap-3">
              <IconInfoCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">
                  Как работает SSL терминация
                </p>
                <ul className="text-muted-foreground space-y-1.5 text-xs">
                  <li>• Клиент подключается по HTTPS к ближайшему агенту</li>
                  <li>• Агент терминирует SSL/TLS соединение</li>
                  <li>
                    • Агент проксирует запрос на целевой сервер (HTTP или HTTPS)
                  </li>
                  <li>
                    • Поддержка автоматического обновления через Let's Encrypt
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* SSL Enable Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Включить SSL/TLS</p>
              <p className="text-xs text-muted-foreground">
                Терминация HTTPS на агентах
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

              {/* Let's Encrypt Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-sm">
                    Let's Encrypt Auto-Renewal
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Автоматическое обновление сертификатов
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
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                </label>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
