"use client";

import {
  IconInfoCircle,
  IconShieldLock,
  IconFingerprint,
  IconBrain,
  IconCode,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  // New L7 Protection settings
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
      <Card className="border-border">
        <CardHeader className="border-b border-border pb-6">
          <CardTitle className="text-lg font-medium flex items-center gap-3">
            <IconShieldLock className="h-6 w-6 text-muted-foreground" />
            Anti-DDoS защита
          </CardTitle>
          <CardDescription className="mt-2">
            Многоуровневая защита от DDoS атак с TLS фингерпринтингом, системой
            вызовов и пользовательскими правилами
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <IconShieldLock className="h-4 w-4" />
                Базовая защита
              </TabsTrigger>
              <TabsTrigger value="l7" className="flex items-center gap-2">
                <IconFingerprint className="h-4 w-4" />
                L7 защита
              </TabsTrigger>
              <TabsTrigger
                value="challenges"
                className="flex items-center gap-2"
              >
                <IconBrain className="h-4 w-4" />
                Вызовы
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <IconCode className="h-4 w-4" />
                Правила
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6 mt-6">
              <div className="border rounded-lg p-4 bg-blue-500/5 border-blue-500/20">
                <div className="flex items-start gap-3">
                  <IconInfoCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p className="text-sm font-medium text-foreground">
                      Базовая защита включает
                    </p>
                    <ul className="space-y-1.5">
                      <li>
                        • <strong>L4 защита:</strong> TCP флаги (SYN flood,
                        Xmas, NULL, FIN scan), лимиты соединений
                      </li>
                      <li>
                        • <strong>Rate limiting:</strong> Ограничение запросов
                        по IP с автоблокировкой
                      </li>
                      <li>
                        • <strong>Slowloris защита:</strong> Защита от медленных
                        запросов
                      </li>
                      <li>
                        • <strong>Системные баны:</strong> Автоматические IP
                        баны через iptables
                      </li>
                      <li>
                        • <strong>Whitelist:</strong> Белый список IP и
                        доверенных proxy-заголовков
                      </li>
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
                      onChange={handleNumberChange([
                        "rateLimit",
                        "windowSeconds",
                      ])}
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
                      onChange={handleNumberChange([
                        "rateLimit",
                        "maxRequests",
                      ])}
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
                      onChange={handleNumberChange([
                        "slowloris",
                        "minContentLength",
                      ])}
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
                      onChange={handleNumberChange([
                        "slowloris",
                        "maxConnections",
                      ])}
                      min={1}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-medium">Белые списки</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      IP whitelist (каждый с новой строки или через запятую)
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
                    <label className="text-xs font-medium text-muted-foreground">
                      Proxy IP headers (доверенные заголовки)
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
              </section>
            </TabsContent>

            <TabsContent value="l7" className="space-y-6 mt-6">
              <div className="border rounded-lg p-4 bg-purple-500/5 border-purple-500/20">
                <div className="flex items-start gap-3">
                  <IconFingerprint className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p className="text-sm font-medium text-foreground">
                      L7 защита включает
                    </p>
                    <ul className="space-y-1.5">
                      <li>
                        • <strong>TLS Fingerprinting:</strong> Анализ
                        ClientHello для идентификации браузеров и ботов
                      </li>
                      <li>
                        • <strong>Bot Detection:</strong> Автоматическое
                        обнаружение известных ботов и краулеров
                      </li>
                      <li>
                        • <strong>Browser Validation:</strong> Проверка
                        подлинности браузеров по TLS отпечаткам
                      </li>
                      <li>
                        • <strong>Rate Limiting:</strong> Отдельные лимиты для
                        отпечатков и IP адресов
                      </li>
                      <li>
                        • <strong>Suspicious Tracking:</strong> Отслеживание
                        подозрительной активности
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <section className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Включить L7 защиту</p>
                    <p className="text-xs text-muted-foreground">
                      TLS фингерпринтинг и продвинутая фильтрация
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={antiDDoS.l7Protection.enabled}
                      onChange={handleToggle(["l7Protection", "enabled"])}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">TLS Fingerprinting</p>
                      <p className="text-xs text-muted-foreground">
                        Анализ TLS отпечатков
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={antiDDoS.l7Protection.tlsFingerprintEnabled}
                      onChange={handleToggle([
                        "l7Protection",
                        "tlsFingerprintEnabled",
                      ])}
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Bot Detection</p>
                      <p className="text-xs text-muted-foreground">
                        Обнаружение ботов
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={antiDDoS.l7Protection.botDetectionEnabled}
                      onChange={handleToggle([
                        "l7Protection",
                        "botDetectionEnabled",
                      ])}
                      className="h-4 w-4"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Лимит для отпечатков
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
                    <label className="text-xs font-medium text-muted-foreground">
                      Лимит для IP
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
                    <label className="text-xs font-medium text-muted-foreground">
                      Порог подозрительности
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Заблокированные отпечатки (каждый с новой строки)
                    </label>
                    <Textarea
                      rows={4}
                      value={antiDDoS.l7Protection.blockedFingerprints.join(
                        "\n",
                      )}
                      onChange={handleListChange(
                        "l7Protection.blockedFingerprints",
                      )}
                      placeholder="0x1301,0x1302,0x1303..."
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Разрешённые отпечатки (каждый с новой строки)
                    </label>
                    <Textarea
                      rows={4}
                      value={antiDDoS.l7Protection.allowedFingerprints.join(
                        "\n",
                      )}
                      onChange={handleListChange(
                        "l7Protection.allowedFingerprints",
                      )}
                      placeholder="0x1301,0x1302,0x1303..."
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="challenges" className="space-y-6 mt-6">
              <div className="border rounded-lg p-4 bg-orange-500/5 border-orange-500/20">
                <div className="flex items-start gap-3">
                  <IconBrain className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p className="text-sm font-medium text-foreground">
                      Система вызовов включает
                    </p>
                    <ul className="space-y-1.5">
                      <li>
                        • <strong>Cookie Challenge:</strong> Проверка поддержки
                        cookies (Stage 1)
                      </li>
                      <li>
                        • <strong>JavaScript PoW:</strong> Proof of Work
                        вычисления в браузере (Stage 2)
                      </li>
                      <li>
                        • <strong>CAPTCHA:</strong> Визуальная проверка для
                        подозрительного трафика (Stage 3)
                      </li>
                      <li>
                        • <strong>Progressive:</strong> Автоматическое повышение
                        сложности при подозрительной активности
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <section className="space-y-4">
                <h3 className="text-sm font-medium">
                  Cookie Challenge (Stage 1)
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">
                        Включить Cookie Challenge
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Базовая проверка поддержки cookies
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={
                        antiDDoS.challengeSettings.cookieChallenge.enabled
                      }
                      onChange={handleToggle([
                        "challengeSettings",
                        "cookieChallenge",
                        "enabled",
                      ])}
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      TTL (секунды)
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
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-medium">
                  JavaScript PoW Challenge (Stage 2)
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Включить JS PoW</p>
                      <p className="text-xs text-muted-foreground">
                        Proof of Work в браузере
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={antiDDoS.challengeSettings.jsChallenge.enabled}
                      onChange={handleToggle([
                        "challengeSettings",
                        "jsChallenge",
                        "enabled",
                      ])}
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Сложность (1-8)
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
                    <label className="text-xs font-medium text-muted-foreground">
                      TTL (секунды)
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
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-medium">
                  CAPTCHA Challenge (Stage 3)
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Включить CAPTCHA</p>
                      <p className="text-xs text-muted-foreground">
                        Визуальная проверка для ботов
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={
                        antiDDoS.challengeSettings.captchaChallenge.enabled
                      }
                      onChange={handleToggle([
                        "challengeSettings",
                        "captchaChallenge",
                        "enabled",
                      ])}
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      TTL (секунды)
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
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <IconShieldLock className="h-4 w-4 text-orange-500" />
                  Auto-Offloading (L7→L3)
                </h3>
                <div className="border rounded-lg p-4 bg-orange-500/5 border-orange-500/20">
                  <div className="flex items-start gap-3 mb-4">
                    <IconInfoCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="text-sm font-medium text-foreground">
                        Автоматическая блокировка на kernel level
                      </p>
                      <p>
                        Боты, которые повторно не проходят challenge,
                        автоматически отправляются в iptables. Это разгружает
                        CPU и очищает логи от спама.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">
                          Включить Auto-Offloading
                        </p>
                        <p className="text-xs text-muted-foreground">
                          L7 → L3 автоматическая блокировка
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={
                          antiDDoS.challengeSettings.autoOffloading?.enabled ??
                          true
                        }
                        onChange={handleToggle([
                          "challengeSettings",
                          "autoOffloading",
                          "enabled",
                        ])}
                        className="h-4 w-4"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Порог неудач
                      </label>
                      <Input
                        type="number"
                        value={
                          antiDDoS.challengeSettings.autoOffloading
                            ?.failureThreshold ?? 5
                        }
                        onChange={handleNumberChange([
                          "challengeSettings",
                          "autoOffloading",
                          "failureThreshold",
                        ])}
                        min={1}
                        max={20}
                      />
                      <p className="text-xs text-muted-foreground">
                        Количество неудачных попыток (default: 5)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Временное окно (сек)
                      </label>
                      <Input
                        type="number"
                        value={
                          antiDDoS.challengeSettings.autoOffloading
                            ?.timeWindowSeconds ?? 10
                        }
                        onChange={handleNumberChange([
                          "challengeSettings",
                          "autoOffloading",
                          "timeWindowSeconds",
                        ])}
                        min={1}
                        max={60}
                      />
                      <p className="text-xs text-muted-foreground">
                        За сколько секунд считать неудачи (default: 10)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Длительность бана (мин)
                      </label>
                      <Input
                        type="number"
                        value={
                          antiDDoS.challengeSettings.autoOffloading
                            ?.banDurationMinutes ?? 60
                        }
                        onChange={handleNumberChange([
                          "challengeSettings",
                          "autoOffloading",
                          "banDurationMinutes",
                        ])}
                        min={1}
                        max={1440}
                      />
                      <p className="text-xs text-muted-foreground">
                        На сколько минут банить в iptables (default: 60)
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Пример:</strong> 5 неудачных попыток за 10 секунд
                      → бан на 60 минут в iptables. Следующие пакеты от этого IP
                      блокируются ядром, не доходя до Go.
                    </p>
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="rules" className="space-y-6 mt-6">
              <div className="border rounded-lg p-4 bg-green-500/5 border-green-500/20">
                <div className="flex items-start gap-3">
                  <IconCode className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p className="text-sm font-medium text-foreground">
                      Пользовательские правила
                    </p>
                    <ul className="space-y-1.5">
                      <li>
                        • <strong>Expression Engine:</strong> Гибкие условия на
                        основе выражений
                      </li>
                      <li>
                        • <strong>IP Filtering:</strong> ip.country, ip.asn,
                        ip.address
                      </li>
                      <li>
                        • <strong>Request Analysis:</strong> request.method,
                        request.path, request.headers
                      </li>
                      <li>
                        • <strong>Actions:</strong> block, challenge, allow,
                        rate_limit
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    Пользовательские правила
                  </h3>
                  <Button onClick={addCustomRule} size="sm">
                    <IconCode className="h-4 w-4 mr-2" />
                    Добавить правило
                  </Button>
                </div>

                {antiDDoS.customRules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <IconCode className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Нет пользовательских правил</p>
                    <p className="text-xs">
                      Добавьте правило для настройки фильтрации
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {antiDDoS.customRules.map((rule, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={(e) =>
                                updateCustomRule(
                                  index,
                                  "enabled",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4"
                            />
                            <Badge
                              variant={rule.enabled ? "default" : "secondary"}
                            >
                              {rule.enabled ? "Активно" : "Отключено"}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomRule(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              Название правила
                            </label>
                            <Input
                              value={rule.name}
                              onChange={(e) =>
                                updateCustomRule(index, "name", e.target.value)
                              }
                              placeholder="Block China Traffic"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              Действие
                            </label>
                            <select
                              value={rule.action}
                              onChange={(e) =>
                                updateCustomRule(
                                  index,
                                  "action",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md"
                            >
                              <option value="block">Заблокировать</option>
                              <option value="challenge">Вызов</option>
                              <option value="allow">Разрешить</option>
                              <option value="rate_limit">Ограничить</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            Выражение
                          </label>
                          <Textarea
                            value={rule.expression}
                            onChange={(e) =>
                              updateCustomRule(
                                index,
                                "expression",
                                e.target.value,
                              )
                            }
                            placeholder="ip.country == 'CN' || ip.country == 'RU'"
                            className="text-xs font-mono"
                            rows={2}
                          />
                          <p className="text-xs text-muted-foreground">
                            Примеры: ip.country == 'CN',
                            request.path.startsWith('/api'),
                            request.headers['User-Agent'].contains('bot')
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
