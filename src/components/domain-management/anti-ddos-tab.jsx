"use client";

import { IconInfoCircle, IconShieldLock } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
    maxConnections: 1000,
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
    ipWhitelist: Array.isArray(config.ipWhitelist)
      ? config.ipWhitelist
      : DEFAULT_CONFIG.ipWhitelist,
    proxyIpHeaders: Array.isArray(config.proxyIpHeaders)
      ? config.proxyIpHeaders
      : DEFAULT_CONFIG.proxyIpHeaders,
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

  const handleToggle = (keyPath) => (event) => {
    const checked = event.target.checked;
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

  const handleTextChange = (keyPath) => (event) => {
    const value = event.target.value;
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

  const handleListChange = (key) => (event) => {
    const value = event.target.value;
    const items = value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    updateAntiDDoS((prev) => ({
      ...prev,
      [key]: items,
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="border-b border-border pb-6">
          <CardTitle className="text-lg font-medium flex items-center gap-3">
            <IconShieldLock className="h-6 w-6 text-muted-foreground" />
            Anti-DDoS защита
          </CardTitle>
          <CardDescription className="mt-2">
            Настройки рейт-лимитов, блокировок и JS-защиты на агентах
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="border rounded-lg p-4 bg-blue-500/5 border-blue-500/20">
            <div className="flex items-start gap-3">
              <IconInfoCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="text-sm font-medium text-foreground">
                  Что включено
                </p>
                <ul className="space-y-1.5">
                  <li>• Рейт-лимит на IP с авто-блокировкой</li>
                  <li>• Slowloris / медленные запросы</li>
                  <li>• JS challenge с cookie</li>
                  <li>• Белый список IP и доверенных proxy-заголовков</li>
                </ul>
              </div>
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Включить Anti-DDoS</p>
                <p className="text-xs text-muted-foreground">
                  Базовый rate limit, блокировка и проверки
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={antiDDoS.enabled}
                  onChange={handleToggle(["enabled"])}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Окно (сек)
                </label>
                <Input
                  type="number"
                  value={antiDDoS.rateLimit.windowSeconds}
                  onChange={handleNumberChange(["rateLimit", "windowSeconds"])}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Макс. запросов
                </label>
                <Input
                  type="number"
                  value={antiDDoS.rateLimit.maxRequests}
                  onChange={handleNumberChange(["rateLimit", "maxRequests"])}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Время блокировки (сек)
                </label>
                <Input
                  type="number"
                  value={antiDDoS.blockDurationSeconds}
                  onChange={handleNumberChange(["blockDurationSeconds"])}
                  min={60}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-medium">Slowloris защита</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Мин. Content-Length
                </label>
                <Input
                  type="number"
                  value={antiDDoS.slowloris.minContentLength}
                  onChange={handleNumberChange(["slowloris", "minContentLength"])}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Таймаут заголовков (сек)
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
                <label className="text-xs font-medium text-muted-foreground">
                  Макс. одновременных коннектов
                </label>
                <Input
                  type="number"
                  value={antiDDoS.slowloris.maxConnections}
                  onChange={handleNumberChange(["slowloris", "maxConnections"])}
                  min={1}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-sm">JS Challenge</p>
                <p className="text-xs text-muted-foreground">
                  Лёгкая проверка браузера перед доступом
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={antiDDoS.jsChallenge.enabled}
                  onChange={handleToggle(["jsChallenge", "enabled"])}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
              </label>
            </div>
            {antiDDoS.jsChallenge.enabled && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Cookie name
                  </label>
                  <Input
                    value={antiDDoS.jsChallenge.cookieName}
                    onChange={handleTextChange(["jsChallenge", "cookieName"])}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    TTL (сек)
                  </label>
                  <Input
                    type="number"
                    value={antiDDoS.jsChallenge.ttlSeconds}
                    onChange={handleNumberChange(["jsChallenge", "ttlSeconds"])}
                    min={60}
                  />
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-medium">Логирование и списки</h3>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Журналировать события</p>
                <p className="text-xs text-muted-foreground">
                  Ведение логов блокировок и проверок
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={antiDDoS.logging.enabled}
                  onChange={handleToggle(["logging", "enabled"])}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  IP whitelist (каждый с новой строки или через запятую)
                </label>
                <Textarea
                  rows={4}
                  value={antiDDoS.ipWhitelist.join("\n")}
                  onChange={handleListChange("ipWhitelist")}
                  placeholder="1.2.3.4\n10.0.0.0/24"
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Proxy IP headers (доверенные заголовки)
                </label>
                <Textarea
                  rows={4}
                  value={antiDDoS.proxyIpHeaders.join("\n")}
                  onChange={handleListChange("proxyIpHeaders")}
                  placeholder="CF-Connecting-IP\nX-Forwarded-For"
                  className="text-xs font-mono"
                />
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
