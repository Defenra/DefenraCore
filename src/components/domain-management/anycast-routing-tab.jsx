"use client";

import {
  IconAlertTriangle,
  IconInfoCircle,
  IconNetwork,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <Card className="border-border">
        <CardHeader className="border-b border-border pb-6">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-medium flex items-center gap-3">
                <IconNetwork className="h-6 w-6 text-muted-foreground" />
                Anycast Routing
                <Badge variant="outline" className="text-xs">
                  BETA
                </Badge>
              </CardTitle>
              <CardDescription className="mt-2">
                Маршрутизация трафика через несколько агентов перед origin
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Info Block */}
          <div className="border rounded-lg p-4 bg-blue-500/5 border-blue-500/20">
            <div className="flex items-start gap-3">
              <IconInfoCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="text-sm font-medium text-foreground">
                  Как работает Anycast Routing
                </p>
                <ul className="space-y-1.5">
                  <li>
                    • <strong>Direct mode (по умолчанию):</strong> Клиент →
                    Агент → Origin
                  </li>
                  <li>
                    • <strong>Anycast mode:</strong> Клиент → Агент A → Агент B
                    → ... → Origin
                  </li>
                  <li>
                    • Агенты автоматически обнаруживают друг друга через Core
                    API
                  </li>
                  <li>
                    • Выбор маршрута основан на: геолокации, здоровье агентов,
                    задержке сети
                  </li>
                  <li>
                    • Каждый агент применяет WAF, rate limiting и firewall
                    правила
                  </li>
                  <li>
                    • Заголовок <code>X-Defenra-Hop</code> отслеживает путь
                    маршрутизации
                  </li>
                  <li>• Лимит хопов предотвращает циклы маршрутизации</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Auto-Discovery Info */}
          <div className="border rounded-lg p-4 bg-green-500/5 border-green-500/20">
            <div className="flex items-start gap-3">
              <IconNetwork className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="text-sm font-medium text-foreground">
                  Автоматическое обнаружение агентов
                </p>
                <ul className="space-y-1">
                  <li>
                    • Агенты автоматически получают список других активных
                    агентов
                  </li>
                  <li>• Обновление списка каждые 60 секунд через Core API</li>
                  <li>
                    • Проверка здоровья агентов каждые 30 секунд (latency,
                    доступность)
                  </li>
                  <li>
                    • Автоматическое исключение недоступных агентов из
                    маршрутизации
                  </li>
                  <li>
                    • Предотвращение циклов: агенты не маршрутизируют на уже
                    посещённые узлы
                  </li>
                  <li>
                    • Выбор оптимального агента на основе health score и latency
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Routing Mode Selection */}
          <section className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Режим маршрутизации</label>
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
                      <span>Direct</span>
                      <Badge variant="outline" className="text-xs">
                        По умолчанию
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="anycast">
                    <div className="flex items-center gap-2">
                      <span>Anycast</span>
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-500/10 text-green-600 border-green-500/20"
                      >
                        Авто
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {config.routingMode === "direct"
                  ? "Прямая маршрутизация на origin сервер"
                  : "Автоматическая маршрутизация через сеть агентов"}
              </p>
            </div>

            {/* Max Hops */}
            {isAnycastMode && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Максимум хопов (прыжков)
                </label>
                <Input
                  type="number"
                  value={config.maxHops}
                  onChange={handleMaxHopsChange}
                  min={1}
                  max={10}
                  className="w-full md:w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Предотвращает циклы маршрутизации (рекомендуется: 3)
                </p>
              </div>
            )}
          </section>

          {/* Use Cases */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium">Примеры использования</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="border rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">
                  🛡️ Многослойная защита от DDoS
                </p>
                <p className="text-xs text-muted-foreground">
                  Трафик проходит через несколько агентов, каждый применяет WAF,
                  rate limiting и firewall
                </p>
              </div>
              <div className="border rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">
                  🌍 Географическая оптимизация
                </p>
                <p className="text-xs text-muted-foreground">
                  Маршрутизация через агенты ближе к origin для снижения
                  задержки
                </p>
              </div>
              <div className="border rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">⚖️ Распределение нагрузки</p>
                <p className="text-xs text-muted-foreground">
                  Распределение трафика между несколькими агентами для
                  балансировки
                </p>
              </div>
              <div className="border rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">🔒 Глубокая защита</p>
                <p className="text-xs text-muted-foreground">
                  Множественные слои фильтрации перед достижением origin сервера
                </p>
              </div>
            </div>
          </section>

          {/* Monitoring */}
          {isAnycastMode && (
            <section className="space-y-4">
              <h3 className="text-sm font-medium">Мониторинг и отладка</h3>
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="text-sm font-medium text-foreground">
                    Отслеживание маршрутизации
                  </p>
                  <ul className="space-y-1">
                    <li>• Проверяйте логи агентов для решений маршрутизации</li>
                    <li>
                      • Заголовок <code>X-Defenra-Hop</code> показывает полный
                      путь через агенты
                    </li>
                    <li>
                      • Метрики: health score, latency, количество хопов, выбор
                      агентов
                    </li>
                    <li>
                      • Автоматический fallback на origin если все агенты
                      недоступны
                    </li>
                    <li>
                      • Логи показывают причину выбора каждого агента (health,
                      latency, location)
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
