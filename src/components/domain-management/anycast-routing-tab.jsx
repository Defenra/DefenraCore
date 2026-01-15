"use client";

import {
  IconAlertTriangle,
  IconInfoCircle,
  IconNetwork,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        agentPool: next.agentPool,
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

  const handleAddAgent = () => {
    updateConfig((prev) => ({
      ...prev,
      agentPool: [
        ...prev.agentPool,
        {
          id: "",
          endpoint: "",
          region: "",
          priority: 0,
        },
      ],
    }));
  };

  const handleRemoveAgent = (index) => {
    updateConfig((prev) => ({
      ...prev,
      agentPool: prev.agentPool.filter((_, i) => i !== index),
    }));
  };

  const handleAgentChange = (index, field, value) => {
    updateConfig((prev) => ({
      ...prev,
      agentPool: prev.agentPool.map((agent, i) =>
        i === index ? { ...agent, [field]: value } : agent,
      ),
    }));
  };

  const handleSelectExistingAgent = (index, agentId) => {
    const selectedAgent = agents.find((a) => a._id === agentId);
    if (!selectedAgent) return;

    // Определяем endpoint на основе данных агента
    const endpoint = selectedAgent.publicIp
      ? `https://${selectedAgent.publicIp}`
      : `https://${selectedAgent.agentId}.agent.local`;

    handleAgentChange(index, "id", selectedAgent.agentId);
    handleAgentChange(index, "endpoint", endpoint);
    handleAgentChange(
      index,
      "region",
      selectedAgent.location || selectedAgent.region || "",
    );
  };

  const isAnycastMode = config.routingMode === "anycast";
  const hasAgents = config.agentPool.length > 0;

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

          {/* BETA Warning */}
          <div className="border rounded-lg p-4 bg-yellow-500/5 border-yellow-500/20">
            <div className="flex items-start gap-3">
              <IconAlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="text-sm font-medium text-foreground">
                  BETA ограничения
                </p>
                <ul className="space-y-1">
                  <li>• Ручная настройка пула агентов (нет автообнаружения)</li>
                  <li>• Простой алгоритм выбора (случайный с приоритетом)</li>
                  <li>• Нет мониторинга здоровья агентов</li>
                  <li>• Нет аутентификации между агентами</li>
                  <li>• Производительность не оптимизирована</li>
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
                      <Badge variant="outline" className="text-xs">
                        BETA
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {config.routingMode === "direct"
                  ? "Прямая маршрутизация на origin сервер"
                  : "Маршрутизация через пул агентов перед origin"}
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

          {/* Agent Pool */}
          {isAnycastMode && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Пул агентов</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Агенты для маршрутизации трафика
                  </p>
                </div>
                <Button
                  onClick={handleAddAgent}
                  variant="outline"
                  size="sm"
                  className="h-9"
                >
                  <IconPlus className="h-4 w-4 mr-2" />
                  Добавить агент
                </Button>
              </div>

              {!hasAgents && (
                <div className="border rounded-lg p-8 text-center">
                  <IconNetwork className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Пул агентов пуст
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Добавьте агенты для anycast маршрутизации
                  </p>
                </div>
              )}

              {hasAgents && (
                <div className="space-y-3">
                  {config.agentPool.map((agent, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-3 bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Агент #{index + 1}
                        </span>
                        <Button
                          onClick={() => handleRemoveAgent(index)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {/* Select from existing agents */}
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            Выбрать из существующих агентов
                          </label>
                          <Select
                            value={agent.id}
                            onValueChange={(value) =>
                              handleSelectExistingAgent(index, value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите агент..." />
                            </SelectTrigger>
                            <SelectContent>
                              {agents.map((a) => (
                                <SelectItem key={a._id} value={a._id}>
                                  <div className="flex items-center gap-2">
                                    <span>{a.agentId}</span>
                                    {a.location && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {a.location}
                                      </Badge>
                                    )}
                                    {a.status === "online" ? (
                                      <span className="h-2 w-2 rounded-full bg-green-500" />
                                    ) : (
                                      <span className="h-2 w-2 rounded-full bg-gray-400" />
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Manual configuration */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            ID агента
                          </label>
                          <Input
                            value={agent.id}
                            onChange={(e) =>
                              handleAgentChange(index, "id", e.target.value)
                            }
                            placeholder="agent-eu-west"
                            className="text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            Endpoint (URL)
                          </label>
                          <Input
                            value={agent.endpoint}
                            onChange={(e) =>
                              handleAgentChange(
                                index,
                                "endpoint",
                                e.target.value,
                              )
                            }
                            placeholder="https://agent.example.com"
                            className="text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            Регион (опционально)
                          </label>
                          <Input
                            value={agent.region}
                            onChange={(e) =>
                              handleAgentChange(index, "region", e.target.value)
                            }
                            placeholder="eu-west"
                            className="text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            Приоритет (0 = высший)
                          </label>
                          <Input
                            type="number"
                            value={agent.priority}
                            onChange={(e) =>
                              handleAgentChange(
                                index,
                                "priority",
                                Number(e.target.value) || 0,
                              )
                            }
                            min={0}
                            max={100}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

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
          {isAnycastMode && hasAgents && (
            <section className="space-y-4">
              <h3 className="text-sm font-medium">Мониторинг</h3>
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="text-sm font-medium text-foreground">
                    Отслеживание маршрутизации
                  </p>
                  <ul className="space-y-1">
                    <li>• Проверяйте логи агентов для решений маршрутизации</li>
                    <li>
                      • Заголовок <code>X-Defenra-Hop</code> показывает полный
                      путь
                    </li>
                    <li>
                      • Метрики: количество хопов, выбор агентов, fallback
                      события
                    </li>
                    <li>
                      • Автоматический fallback на origin если агент недоступен
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
