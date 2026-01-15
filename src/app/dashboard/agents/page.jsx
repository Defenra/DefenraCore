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

export default function AgentsPage() {
  const { data: agents = [], isLoading, refetch, isFetching } = useAgents();
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
      return <IconCircle className="h-3 w-3 text-zinc-500" />;
    }
    if (agent.isActive) {
      return <IconCircleFilled className="h-3 w-3 text-green-500" />;
    }
    return <IconAlertCircle className="h-3 w-3 text-yellow-500" />;
  };

  const _getStatusColor = (agent) => {
    if (!agent.isConnected) return "text-zinc-500";
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

  const activeCount = agents.filter((a) => a.isActive).length;
  const inactiveCount = agents.filter(
    (a) => !a.isActive && a.isConnected,
  ).length;
  const pendingCount = agents.filter((a) => !a.isConnected).length;

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:gap-8 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold mb-1 md:mb-2">
            Агенты
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            {agents.length} подключённых агентов
          </p>
        </div>
        <div className="flex gap-2 md:gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 w-9 md:h-10 md:w-10"
          >
            <IconRefresh
              className={`h-4 w-4 md:h-5 md:w-5 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 md:h-10">
                <IconPlus className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
                <span className="text-sm md:text-base">Добавить агента</span>
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

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3 md:gap-6">
        <Card className="border-border">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="text-xs md:text-sm text-muted-foreground font-medium">
              Активные
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2">
              {activeCount}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">В сети</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="text-xs md:text-sm text-muted-foreground font-medium">
              Неактивные
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2">
              {inactiveCount}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Требуют внимания
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="text-xs md:text-sm text-muted-foreground font-medium">
              Ожидают
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2">
              {pendingCount}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Подключения
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-6">
          <CardTitle className="text-lg font-medium">Список агентов</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Загрузка...
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Нет подключённых агентов
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {agents.map((agent) => {
                const isExpanded = expandedAgents.has(agent.id);
                return (
                  <div
                    key={agent.id}
                    className="border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-4 md:p-6 gap-3">
                      <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                        {getStatusIcon(agent)}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-3">
                            <h3 className="font-medium text-base md:text-lg">
                              {agent.name}
                            </h3>
                            {agent.label && (
                              <Badge variant="outline" className="text-xs">
                                {agent.label}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {agent.statusText ||
                                (agent.isActive
                                  ? "Активен"
                                  : agent.isConnected
                                    ? "Подключён"
                                    : "Ожидает")}
                            </span>
                          </div>
                          {agent.tags && agent.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
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
                          <div className="text-xs md:text-sm text-muted-foreground space-y-1.5 md:space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs">ID:</span>
                              <span className="font-mono text-xs break-all">
                                {agent.agentId}
                              </span>
                            </div>
                            {agent.ipAddress && (
                              <div className="flex items-start gap-2">
                                <IconWorld className="h-4 w-4 shrink-0 mt-0.5" />
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="font-mono text-xs">
                                    {agent.ipAddress}
                                  </span>
                                  {(agent.manualLocation?.city ||
                                    agent.ipInfo?.city) &&
                                    (agent.manualLocation?.country ||
                                      agent.ipInfo?.country) && (
                                      <span className="text-xs">
                                        •{" "}
                                        {agent.manualLocation?.city ||
                                          agent.ipInfo.city}
                                        ,{" "}
                                        {agent.manualLocation?.country ||
                                          agent.ipInfo.country}
                                        {agent.manualLocation?.city && (
                                          <Badge
                                            variant="outline"
                                            className="ml-1.5 text-xs"
                                          >
                                            Ручная
                                          </Badge>
                                        )}
                                      </span>
                                    )}
                                </div>
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs">
                              <span>Поллинг: {agent.pollingInterval}с</span>
                              <span>•</span>
                              <span>Timeout: {agent.inactivityThreshold}с</span>
                              {agent.category && (
                                <>
                                  <span>•</span>
                                  <span>Категория: {agent.category}</span>
                                </>
                              )}
                              {agent.provider && (
                                <>
                                  <span>•</span>
                                  <span>Провайдер: {agent.provider}</span>
                                </>
                              )}
                            </div>
                            {(agent.price > 0 || agent.maxTraffic > 0) && (
                              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs text-muted-foreground">
                                {agent.price > 0 && (
                                  <span>Цена: ${agent.price}/мес</span>
                                )}
                                {agent.maxTraffic > 0 && (
                                  <>
                                    {agent.price > 0 && <span>•</span>}
                                    <span>
                                      Лимит: {agent.maxTraffic} GB/мес
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                            {agent.nextPaymentDate && (
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-muted-foreground">
                                  Следующая оплата:
                                </span>
                                <span
                                  className={
                                    agent.isPaid
                                      ? "text-green-600"
                                      : "text-red-600 font-medium"
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
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                        <div className="text-left sm:text-right space-y-1">
                          {agent.lastSeen && (
                            <div className="text-xs text-muted-foreground">
                              <div className="hidden sm:block">
                                Последняя активность:
                              </div>
                              <div className="sm:hidden">Активность:</div>
                              <div className="font-mono">
                                {formatDate(agent.lastSeen)}
                              </div>
                            </div>
                          )}
                          {agent.connectedAt && !agent.lastSeen && (
                            <div className="text-xs text-muted-foreground">
                              <div>Подключён:</div>
                              <div className="font-mono">
                                {formatDate(agent.connectedAt)}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 md:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditAgent(agent)}
                            className="h-8 w-8 md:h-9 md:w-9 hover:bg-accent"
                          >
                            <IconEdit className="h-4 w-4 md:h-5 md:w-5" />
                          </Button>
                          {agent.ipInfo && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleAgentExpanded(agent.id)}
                              className="h-8 w-8 md:h-9 md:w-9"
                            >
                              {isExpanded ? (
                                <IconChevronUp className="h-4 w-4 md:h-5 md:w-5" />
                              ) : (
                                <IconChevronDown className="h-4 w-4 md:h-5 md:w-5" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAgent(agent.id)}
                            className="h-8 w-8 md:h-9 md:w-9 hover:bg-accent"
                          >
                            <IconTrash className="h-4 w-4 md:h-5 md:w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && agent.ipInfo && (
                      <div className="px-4 pb-4 pt-3 md:px-6 md:pb-6 md:pt-4 border-t border-border">
                        <h4 className="text-sm font-medium mb-3 md:mb-4">
                          Информация об IP
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              IP адрес:
                            </span>
                            <p className="font-mono">{agent.ipAddress}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Страна:
                            </span>
                            <p>
                              {agent.ipInfo.country} ({agent.ipInfo.countryCode}
                              )
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Регион:
                            </span>
                            <p>{agent.ipInfo.region}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Город:
                            </span>
                            <p>{agent.ipInfo.city}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Провайдер:
                            </span>
                            <p>{agent.ipInfo.isp}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Организация:
                            </span>
                            <p className="truncate">{agent.ipInfo.org}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Часовой пояс:
                            </span>
                            <p>{agent.ipInfo.timezone}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">AS:</span>
                            <p className="font-mono text-xs">
                              {agent.ipInfo.as}
                            </p>
                          </div>
                        </div>

                        {agent.ipHistory && agent.ipHistory.length > 0 && (
                          <div className="mt-3 pt-3 md:mt-4 md:pt-4 border-t">
                            <h4 className="text-xs md:text-sm font-semibold mb-2">
                              История IP ({agent.ipHistory.length})
                            </h4>
                            <div className="space-y-2 max-h-32 md:max-h-40 overflow-y-auto">
                              {agent.ipHistory
                                .slice()
                                .reverse()
                                .map((entry, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs p-2 bg-background rounded border"
                                  >
                                    <span className="font-mono">
                                      {entry.ip}
                                    </span>
                                    {entry.ipInfo && (
                                      <span className="text-muted-foreground ml-2">
                                        {entry.ipInfo.city},{" "}
                                        {entry.ipInfo.country}
                                      </span>
                                    )}
                                    <div className="text-muted-foreground mt-1">
                                      {formatDate(entry.changedAt)}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
