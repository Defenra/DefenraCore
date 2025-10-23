"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPlus, IconCopy, IconTrash, IconCheck, IconCircle, IconCircleFilled, IconAlertCircle, IconRefresh, IconWorld, IconChevronDown, IconChevronUp, IconClock } from "@tabler/icons-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useAgents, useCreateAgent, useDeleteAgent } from "@/hooks/useAgents";

export default function AgentsPage() {
  const { data: agents = [], isLoading, refetch, isFetching } = useAgents();
  const createAgent = useCreateAgent();
  const deleteAgent = useDeleteAgent();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
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

  const getStatusColor = (agent) => {
    if (!agent.isConnected) return "text-zinc-500";
    if (agent.isActive) return "text-green-500";
    return "text-yellow-500";
  };

  const toggleAgentExpanded = (agentId) => {
    setExpandedAgents(prev => {
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
        pollingInterval: parseInt(newAgentPolling) || 60,
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(connectionUrl);
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

  const activeCount = agents.filter(a => a.isActive).length;
  const inactiveCount = agents.filter(a => !a.isActive && a.isConnected).length;
  const pendingCount = agents.filter(a => !a.isConnected).length;

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Агенты</h1>
          <p className="text-sm text-muted-foreground">
            Управление подключёнными агентами и мониторинг их состояния
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <IconRefresh className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
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
                    <Label htmlFor="polling">Интервал поллинга (секунды)</Label>
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
                  <Button onClick={handleCreateAgent}>
                    Создать токен
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>URL для подключения</DialogTitle>
                  <DialogDescription>
                    Скопируйте этот URL и передайте его агенту. Ссылка действительна 24 часа и может быть использована только один раз.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="relative">
                    <Input
                      readOnly
                      value={connectionUrl}
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
                  <Button onClick={closeDialog}>
                    Готово
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные</CardTitle>
            <IconCircleFilled className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Неактивные</CardTitle>
            <IconAlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{inactiveCount}</div>
          </CardContent>
        </Card>
        <Card className="border-zinc-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ожидают</CardTitle>
            <IconClock className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-500">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Список агентов</CardTitle>
              <CardDescription>
                {agents.length} {agents.length === 1 ? "агент" : agents.length > 4 ? "агентов" : "агента"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Загрузка...
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет подключённых агентов
            </div>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => {
                const isExpanded = expandedAgents.has(agent.id);
                return (
                  <div
                    key={agent.id}
                    className="group border rounded-lg hover:border-accent transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-4 flex-1">
                        {getStatusIcon(agent)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{agent.name}</h3>
                            <Badge variant={agent.isActive ? "success" : agent.isConnected ? "warning" : "outline"}>
                              {agent.statusText || (agent.isConnected ? "Подключён" : "Ожидает")}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1.5">
                            <p className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground/70">ID:</span>
                              <span className="font-mono text-xs bg-accent px-2 py-0.5 rounded">{agent.agentId}</span>
                            </p>
                            {agent.ipAddress && (
                              <p className="flex items-center gap-1.5">
                                <IconWorld className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="font-mono text-xs">{agent.ipAddress}</span>
                                {agent.ipInfo?.city && agent.ipInfo?.country && (
                                  <span className="text-xs text-muted-foreground/70">
                                    • {agent.ipInfo.city}, {agent.ipInfo.country}
                                  </span>
                                )}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
                              <span>Поллинг: {agent.pollingInterval}с</span>
                              <span>•</span>
                              <span>Timeout: {agent.inactivityThreshold}с</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          {agent.lastSeen && (
                            <div className="text-xs text-muted-foreground">
                              <div className="font-medium">Последняя активность</div>
                              <div>{formatDate(agent.lastSeen)}</div>
                            </div>
                          )}
                          {agent.connectedAt && !agent.lastSeen && (
                            <div className="text-xs text-muted-foreground">
                              <div className="font-medium">Подключён</div>
                              <div>{formatDate(agent.connectedAt)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {agent.ipInfo && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleAgentExpanded(agent.id)}
                          >
                            {isExpanded ? (
                              <IconChevronUp className="h-4 w-4" />
                            ) : (
                              <IconChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {isExpanded && agent.ipInfo && (
                      <div className="px-4 pb-4 pt-2 border-t bg-accent/20">
                        <h4 className="text-sm font-semibold mb-3">Информация об IP</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">IP адрес:</span>
                            <p className="font-mono">{agent.ipAddress}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Страна:</span>
                            <p>{agent.ipInfo.country} ({agent.ipInfo.countryCode})</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Регион:</span>
                            <p>{agent.ipInfo.region}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Город:</span>
                            <p>{agent.ipInfo.city}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Провайдер:</span>
                            <p>{agent.ipInfo.isp}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Организация:</span>
                            <p className="truncate">{agent.ipInfo.org}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Часовой пояс:</span>
                            <p>{agent.ipInfo.timezone}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">AS:</span>
                            <p className="font-mono text-xs">{agent.ipInfo.as}</p>
                          </div>
                        </div>
                        
                        {agent.ipHistory && agent.ipHistory.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-2">История IP ({agent.ipHistory.length})</h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {agent.ipHistory.slice().reverse().map((entry, idx) => (
                                <div key={idx} className="text-xs p-2 bg-background rounded border">
                                  <span className="font-mono">{entry.ip}</span>
                                  {entry.ipInfo && (
                                    <span className="text-muted-foreground ml-2">
                                      {entry.ipInfo.city}, {entry.ipInfo.country}
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
    </div>
  );
}
