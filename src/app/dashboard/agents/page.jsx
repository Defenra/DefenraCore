"use client";

import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconCircle,
  IconCircleFilled,
  IconCopy,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconWorld,
  IconCpu,
  IconDatabase,
  IconActivity,
  IconServer,
  IconMapPin,
  IconClock,
  IconTrendingUp,
  IconShield,
} from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAgents, useCreateAgent, useDeleteAgent } from "@/hooks/useAgents";
import { AgentLoadGraph } from "@/components/agent-load-graph";
import { AgentsStatusGraph } from "@/components/agents-status-graph";

export default function AgentsPage() {
  const {
    data: agents = [],
    isLoading,
    refetch,
    isFetching,
  } = useAgents({
    refetchInterval: 60000, // Auto-refresh every 60 seconds (1 minute)
  });
  const createAgent = useCreateAgent();
  const deleteAgent = useDeleteAgent();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [connectionUrl, setConnectionUrl] = useState("");
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentPolling, setNewAgentPolling] = useState("60");
  const [copied, setCopied] = useState(false);
  const [expandedAgents, setExpandedAgents] = useState(new Set());

  const getStatusIcon = (agent) => {
    if (!agent.isConnected) {
      return <IconCircle className="h-4 w-4 text-slate-400" />;
    }
    if (agent.isActive) {
      return <IconCircleFilled className="h-4 w-4 text-green-500" />;
    }
    return <IconAlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusColor = (agent) => {
    if (!agent.isConnected) return "text-slate-400";
    if (agent.isActive) return "text-green-500";
    return "text-yellow-500";
  };

  const toggleAgentExpanded = (agentId) => {
    setExpandedAgents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };

  const handleCreateAgent = async () => {
    if (!newAgentName.trim()) {
      toast.error("Введите название агента");
      return;
    }

    try {
      const result = await createAgent.mutateAsync({
        name: newAgentName,
        pollingInterval: parseInt(newAgentPolling, 10) || 60,
      });

      setConnectionUrl(result.agent.connectionUrl);
      setNewAgentName("");
      setNewAgentPolling("60");
      toast.success("Токен подключения создан");
    } catch (error) {
      toast.error(error.message || "Ошибка создания токена");
    }
  };

  const handleDeleteAgent = async (id) => {
    if (!confirm("Удалить агента?")) return;

    try {
      await deleteAgent.mutateAsync(id);
      toast.success("Агент удалён");
    } catch (error) {
      toast.error(error.message || "Ошибка удаления агента");
    }
  };

  const handleEditAgent = (agent) => {
    setEditingAgent({
      id: agent.id,
      name: agent.name || "",
      tags: agent.tags?.join(", ") || "",
      label: agent.label || "",
      category: agent.category || "",
      provider: agent.provider || "",
      price: agent.price || 0,
      maxTraffic: agent.maxTraffic || 0,
      nextPaymentDate: agent.nextPaymentDate
        ? new Date(agent.nextPaymentDate).toISOString().split("T")[0]
        : "",
      isPaid: agent.isPaid !== false,
      manualLocation: {
        country: agent.manualLocation?.country || "",
        city: agent.manualLocation?.city || "",
        region: agent.manualLocation?.region || "",
      },
    });
    setEditDialogOpen(true);
  };

  const handleSaveAgent = async () => {
    if (!editingAgent) return;

    try {
      const response = await fetch(`/api/agent/${editingAgent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingAgent.name,
          tags: editingAgent.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          label: editingAgent.label,
          category: editingAgent.category,
          provider: editingAgent.provider,
          price: parseFloat(editingAgent.price) || 0,
          maxTraffic: parseFloat(editingAgent.maxTraffic) || 0,
          nextPaymentDate: editingAgent.nextPaymentDate || null,
          isPaid: editingAgent.isPaid,
          manualLocation: {
            country: editingAgent.manualLocation.country || null,
            city: editingAgent.manualLocation.city || null,
            region: editingAgent.manualLocation.region || null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Ошибка обновления агента");
      }

      toast.success("Агент обновлён");
      setEditDialogOpen(false);
      setEditingAgent(null);
      refetch();
    } catch (error) {
      toast.error(error.message || "Ошибка обновления агента");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`curl -sSL https://raw.githubusercontent.com/Defenra/DefenraAgent/main/quick-install.sh | \\
  sudo CONNECT_URL="${connectionUrl}" bash`);
    setCopied(true);
    toast.success("Скопировано в буфер обмена");
    setTimeout(() => setCopied(false), 2000);
  };

  const closeDialog = () => {
    setCreateDialogOpen(false);
    setConnectionUrl("");
    setNewAgentName("");
    setNewAgentPolling("60");
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("ru-RU");
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  const activeCount = agents.filter((a) => a.isActive).length;
  const inactiveCount = agents.filter(
    (a) => !a.isActive && a.isConnected,
  ).length;
  const pendingCount = agents.filter((a) => !a.isConnected).length;
  const avgLoadScore =
    agents.length > 0
      ? agents.reduce((sum, a) => sum + (a.loadScore || 0), 0) / agents.length
      : 0;

  return (
    <div className="flex flex-col gap-6 p-6 lg:gap-8 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Агенты</h1>
          <p className="text-muted-foreground">
            Управление распределённой сетью защиты
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-10"
          >
            <IconRefresh
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Обновить
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10">
                <IconPlus className="mr-2 h-4 w-4" />
                Добавить агента
              </Button>
            </DialogTrigger>
            <DialogContent>
              {!connectionUrl ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Создать токен подключения</DialogTitle>
                    <DialogDescription>
                      Укажите название и параметры для нового агента
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Название агента</Label>
                      <Input
                        id="name"
                        placeholder="Мой агент"
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="polling">
                        Интервал поллинга (секунды)
                      </Label>
                      <Input
                        id="polling"
                        type="number"
                        min="10"
                        value={newAgentPolling}
                        onChange={(e) => setNewAgentPolling(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={closeDialog}>
                      Отмена
                    </Button>
                    <Button onClick={handleCreateAgent}>Создать токен</Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>URL для подключения</DialogTitle>
                    <DialogDescription>
                      Скопируйте эту команду вставьте в терминал сервера.
                      Команда действительна 24 часа и может быть использована
                      только один раз.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="relative">
                      <Input
                        readOnly
                        value={`curl -sSL https://raw.githubusercontent.com/Defenra/DefenraAgent/main/quick-install.sh | \\
  sudo CONNECT_URL="${connectionUrl}" bash`}
                        className="pr-10 font-mono text-sm"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={copyToClipboard}
                      >
                        {copied ? (
                          <IconCheck className="h-4 w-4 text-green-500" />
                        ) : (
                          <IconCopy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={closeDialog}>Готово</Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Graph */}
      <AgentsStatusGraph agents={agents} />

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные</CardTitle>
            <IconShield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeCount}
            </div>
            <p className="text-xs text-muted-foreground">Защищают трафик</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Неактивные</CardTitle>
            <IconAlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {inactiveCount}
            </div>
            <p className="text-xs text-muted-foreground">Требуют внимания</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ожидают</CardTitle>
            <IconClock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">
              {pendingCount}
            </div>
            <p className="text-xs text-muted-foreground">Подключения</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Средняя нагрузка
            </CardTitle>
            <IconTrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {avgLoadScore.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">По всей сети</p>
          </CardContent>
        </Card>
      </div>

      {/* Agents Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Сетевые узлы</h2>
          <div className="text-sm text-muted-foreground">
            {agents.length} агентов
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={`skeleton-${i}`} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <IconServer className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Нет агентов</h3>
              <p className="text-muted-foreground text-center mb-4">
                Добавьте первый агент для начала защиты вашей инфраструктуры
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <IconPlus className="mr-2 h-4 w-4" />
                Добавить агента
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => {
              const isExpanded = expandedAgents.has(agent.id);
              return (
                <Card
                  key={agent.id}
                  className={`transition-all duration-200 hover:shadow-md ${
                    agent.isActive
                      ? "border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-900/10"
                      : agent.isConnected
                        ? "border-yellow-200 bg-yellow-50/30 dark:border-yellow-800 dark:bg-yellow-900/10"
                        : "border-slate-200 bg-slate-50/30 dark:border-slate-700 dark:bg-slate-800/30"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(agent)}
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            {agent.name}
                          </CardTitle>
                          <div className="flex items-center gap-1 mt-0.5">
                            <code
                              className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-muted-foreground font-mono select-all"
                              title="Agent ID"
                            >
                              {agent.agentId}
                            </code>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-sm font-medium ${getStatusColor(agent)}`}
                            >
                              {agent.isActive
                                ? "Активен"
                                : agent.isConnected
                                  ? "Подключён"
                                  : "Ожидает"}
                            </span>
                            {agent.label && (
                              <Badge variant="outline" className="text-xs">
                                {agent.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAgent(agent)}
                          className="h-8 w-8 p-0"
                        >
                          <IconEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAgentExpanded(agent.id)}
                          className="h-8 w-8 p-0"
                        >
                          {isExpanded ? (
                            <IconChevronUp className="h-4 w-4" />
                          ) : (
                            <IconChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Location & Basic Info */}
                    <div className="space-y-3 mb-4">
                      {agent.ipAddress && (
                        <div className="flex items-center gap-2 text-sm">
                          <IconWorld className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono">{agent.ipAddress}</span>
                          {(agent.manualLocation?.city ||
                            agent.ipInfo?.city) && (
                            <span className="text-muted-foreground">
                              •{" "}
                              {agent.manualLocation?.city || agent.ipInfo?.city}
                              ,{" "}
                              {agent.manualLocation?.country ||
                                agent.ipInfo?.country}
                              {agent.manualLocation?.city && (
                                <Badge
                                  variant="outline"
                                  className="ml-1 text-xs"
                                >
                                  manual
                                </Badge>
                              )}
                            </span>
                          )}
                        </div>
                      )}

                      {agent.tags && agent.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {agent.tags.map((tag, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* System Metrics Preview */}
                    {agent.systemMetrics &&
                      (agent.systemMetrics.cpuUsagePercent > 0 ||
                        agent.systemMetrics.memoryUsagePercent > 0 ||
                        agent.loadScore > 0) && (
                        <div className="space-y-3 mb-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <IconCpu className="h-4 w-4 text-blue-500 mr-1" />
                                <span className="text-xs text-muted-foreground">
                                  CPU
                                </span>
                              </div>
                              <div className="text-sm font-semibold">
                                {agent.systemMetrics.cpuUsagePercent.toFixed(0)}
                                %
                              </div>
                              <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    agent.systemMetrics.cpuUsagePercent > 80
                                      ? "bg-red-500"
                                      : agent.systemMetrics.cpuUsagePercent > 60
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                  }`}
                                  style={{
                                    width: `${Math.min(agent.systemMetrics.cpuUsagePercent, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <IconDatabase className="h-4 w-4 text-purple-500 mr-1" />
                                <span className="text-xs text-muted-foreground">
                                  RAM
                                </span>
                              </div>
                              <div className="text-sm font-semibold">
                                {agent.systemMetrics.memoryUsagePercent.toFixed(
                                  0,
                                )}
                                %
                              </div>
                              <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    agent.systemMetrics.memoryUsagePercent > 80
                                      ? "bg-red-500"
                                      : agent.systemMetrics.memoryUsagePercent >
                                          60
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                  }`}
                                  style={{
                                    width: `${Math.min(agent.systemMetrics.memoryUsagePercent, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>

                            {agent.loadScore !== undefined && (
                              <div className="text-center">
                                <div className="flex items-center justify-center mb-1">
                                  <IconActivity className="h-4 w-4 text-orange-500 mr-1" />
                                  <span className="text-xs text-muted-foreground">
                                    Load
                                  </span>
                                </div>
                                <div className="text-sm font-semibold">
                                  {agent.loadScore.toFixed(0)}
                                </div>
                                <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      agent.loadScore > 80
                                        ? "bg-red-500"
                                        : agent.loadScore > 60
                                          ? "bg-yellow-500"
                                          : "bg-green-500"
                                    }`}
                                    style={{
                                      width: `${Math.min(agent.loadScore, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* System Metrics Unavailable Notice */}
                    {(!agent.systemMetrics ||
                      (agent.systemMetrics.cpuUsagePercent === 0 &&
                        agent.systemMetrics.memoryUsagePercent === 0 &&
                        agent.loadScore === 0)) && (
                      <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <IconServer className="h-3 w-3" />
                          <span>Системные метрики загружаются...</span>
                        </div>
                      </div>
                    )}

                    {/* Last Activity */}
                    {agent.lastSeen && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <IconClock className="h-3 w-3" />
                        <span>Активность: {formatDate(agent.lastSeen)}</span>
                      </div>
                    )}

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        <AgentLoadGraph agentId={agent.id} />

                        {/* Detailed System Metrics */}
                        {agent.systemMetrics && (
                          <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <IconServer className="h-4 w-4" />
                              Системные метрики
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-muted-foreground">
                                  Memory:
                                </span>
                                <div className="font-mono">
                                  {formatBytes(
                                    agent.systemMetrics.memoryUsedBytes,
                                  )}{" "}
                                  /{" "}
                                  {formatBytes(
                                    agent.systemMetrics.memoryTotalBytes,
                                  )}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Goroutines:
                                </span>
                                <div className="font-mono">
                                  {agent.systemMetrics.numGoroutines || 0}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Load Avg:
                                </span>
                                <div className="font-mono">
                                  {agent.systemMetrics.loadAverage1Min?.toFixed(
                                    2,
                                  ) || "0.00"}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Disk I/O:
                                </span>
                                <div className="font-mono text-xs">
                                  {(
                                    agent.systemMetrics.diskReadBytesPS /
                                    1024 /
                                    1024
                                  ).toFixed(1)}{" "}
                                  MB/s
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* IP Info */}
                        {agent.ipInfo && (
                          <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <IconMapPin className="h-4 w-4" />
                              Геолокация
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-muted-foreground">
                                  Страна:
                                </span>
                                <div>
                                  {agent.ipInfo.country} (
                                  {agent.ipInfo.countryCode})
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Регион:
                                </span>
                                <div>{agent.ipInfo.region}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Провайдер:
                                </span>
                                <div className="truncate">
                                  {agent.ipInfo.isp}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Часовой пояс:
                                </span>
                                <div>{agent.ipInfo.timezone}</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Configuration */}
                        <div>
                          <h4 className="text-sm font-semibold mb-3">
                            Конфигурация
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-muted-foreground">
                                Поллинг:
                              </span>
                              <div>{agent.pollingInterval}с</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Timeout:
                              </span>
                              <div>{agent.inactivityThreshold}с</div>
                            </div>
                            {agent.category && (
                              <div>
                                <span className="text-muted-foreground">
                                  Категория:
                                </span>
                                <div>{agent.category}</div>
                              </div>
                            )}
                            {agent.provider && (
                              <div>
                                <span className="text-muted-foreground">
                                  Провайдер:
                                </span>
                                <div>{agent.provider}</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Billing Info */}
                        {(agent.price > 0 ||
                          agent.maxTraffic > 0 ||
                          agent.nextPaymentDate) && (
                          <div>
                            <h4 className="text-sm font-semibold mb-3">
                              Биллинг
                            </h4>
                            <div className="space-y-2 text-xs">
                              {agent.price > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Цена:
                                  </span>
                                  <span>${agent.price}/мес</span>
                                </div>
                              )}
                              {agent.maxTraffic > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Лимит трафика:
                                  </span>
                                  <span>{agent.maxTraffic} GB/мес</span>
                                </div>
                              )}
                              {agent.nextPaymentDate && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Следующая оплата:
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={
                                        agent.isPaid
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }
                                    >
                                      {new Date(
                                        agent.nextPaymentDate,
                                      ).toLocaleDateString("ru-RU")}
                                    </span>
                                    {!agent.isPaid && (
                                      <Badge
                                        variant="destructive"
                                        className="text-xs"
                                      >
                                        Требует оплаты
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Agent Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать агента</DialogTitle>
            <DialogDescription>
              Настройте метаданные и параметры агента
            </DialogDescription>
          </DialogHeader>
          {editingAgent && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Название</Label>
                  <Input
                    id="edit-name"
                    value={editingAgent.name}
                    onChange={(e) =>
                      setEditingAgent({ ...editingAgent, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-label">Подпись</Label>
                  <Input
                    id="edit-label"
                    placeholder="Production Server"
                    value={editingAgent.label}
                    onChange={(e) =>
                      setEditingAgent({
                        ...editingAgent,
                        label: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tags">Теги (через запятую)</Label>
                <Input
                  id="edit-tags"
                  placeholder="production, europe, high-priority"
                  value={editingAgent.tags}
                  onChange={(e) =>
                    setEditingAgent({ ...editingAgent, tags: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Используйте теги для группировки и фильтрации агентов
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Категория</Label>
                  <Input
                    id="edit-category"
                    placeholder="Web Server, CDN, Edge"
                    value={editingAgent.category}
                    onChange={(e) =>
                      setEditingAgent({
                        ...editingAgent,
                        category: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-provider">Провайдер</Label>
                  <Input
                    id="edit-provider"
                    placeholder="AWS, Hetzner, OVH"
                    value={editingAgent.provider}
                    onChange={(e) =>
                      setEditingAgent({
                        ...editingAgent,
                        provider: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Цена ($/месяц)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingAgent.price}
                    onChange={(e) =>
                      setEditingAgent({
                        ...editingAgent,
                        price: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-traffic">Макс. трафик (GB/месяц)</Label>
                  <Input
                    id="edit-traffic"
                    type="number"
                    min="0"
                    value={editingAgent.maxTraffic}
                    onChange={(e) =>
                      setEditingAgent({
                        ...editingAgent,
                        maxTraffic: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-payment-date">
                    Дата следующей оплаты
                  </Label>
                  <Input
                    id="edit-payment-date"
                    type="date"
                    value={editingAgent.nextPaymentDate}
                    onChange={(e) =>
                      setEditingAgent({
                        ...editingAgent,
                        nextPaymentDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-paid">Статус оплаты</Label>
                  <div className="flex items-center gap-3 h-10">
                    <input
                      type="checkbox"
                      id="edit-paid"
                      checked={editingAgent.isPaid}
                      onChange={(e) =>
                        setEditingAgent({
                          ...editingAgent,
                          isPaid: e.target.checked,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="edit-paid" className="cursor-pointer">
                      Оплачено
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <h4 className="text-sm font-medium">
                  Ручная настройка локации
                </h4>
                <p className="text-xs text-muted-foreground">
                  Переопределить автоматически определённую геолокацию
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-location-country">Страна</Label>
                    <Input
                      id="edit-location-country"
                      placeholder="Russia"
                      value={editingAgent.manualLocation.country}
                      onChange={(e) =>
                        setEditingAgent({
                          ...editingAgent,
                          manualLocation: {
                            ...editingAgent.manualLocation,
                            country: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-location-city">Город</Label>
                    <Input
                      id="edit-location-city"
                      placeholder="Moscow"
                      value={editingAgent.manualLocation.city}
                      onChange={(e) =>
                        setEditingAgent({
                          ...editingAgent,
                          manualLocation: {
                            ...editingAgent.manualLocation,
                            city: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-location-region">Регион</Label>
                    <Input
                      id="edit-location-region"
                      placeholder="Moscow Oblast"
                      value={editingAgent.manualLocation.region}
                      onChange={(e) =>
                        setEditingAgent({
                          ...editingAgent,
                          manualLocation: {
                            ...editingAgent.manualLocation,
                            region: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingAgent(null);
              }}
            >
              Отмена
            </Button>
            <Button onClick={handleSaveAgent}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
