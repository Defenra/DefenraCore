"use client";

import {
  IconChartBar,
  IconNetwork,
  IconPlus,
  IconRefresh,
  IconToggleLeft,
  IconToggleRight,
  IconTrash,
  IconUsers,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAgents } from "@/hooks/useAgents";
import {
  useCreateProxy,
  useDeleteProxy,
  useProxies,
  useUpdateProxy,
} from "@/hooks/useProxies";
import { useProxyClients } from "@/hooks/useProxyClients";

export default function ProxiesPage() {
  const {
    data: proxies = [],
    isLoading: proxiesLoading,
    refetch,
    isFetching,
  } = useProxies();
  const { data: allAgents = [] } = useAgents();
  const createProxy = useCreateProxy();
  const updateProxy = useUpdateProxy();
  const deleteProxy = useDeleteProxy();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProxy, setSelectedProxy] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "tcp",
    sourcePort: "",
    destinationHost: "",
    destinationPort: "",
    agentId: "all",
    description: "",
  });

  const agents = allAgents.filter((a) => a.isConnected);
  const loading = proxiesLoading;

  // Загружаем клиентов для выбранного прокси
  const {
    data: clientsData,
    isLoading: clientsLoading,
    isFetching: clientsFetching,
    refetch: refetchClients,
  } = useProxyClients(selectedProxy?.id);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
  };

  const formatDuration = (duration) => {
    if (!duration) return "—";
    return duration;
  };

  const handleCreateProxy = async () => {
    if (
      !formData.name ||
      !formData.sourcePort ||
      !formData.destinationHost ||
      !formData.destinationPort
    ) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    try {
      await createProxy.mutateAsync({
        ...formData,
        agentId: formData.agentId === "all" ? null : formData.agentId,
        sourcePort: parseInt(formData.sourcePort, 10),
        destinationPort: parseInt(formData.destinationPort, 10),
      });

      toast.success("Прокси создан");
      setCreateDialogOpen(false);
      setFormData({
        name: "",
        type: "tcp",
        sourcePort: "",
        destinationHost: "",
        destinationPort: "",
        agentId: "all",
        description: "",
      });
    } catch (error) {
      toast.error(error.message || "Ошибка создания прокси");
    }
  };

  const handleToggleProxy = async (id, currentStatus) => {
    try {
      await updateProxy.mutateAsync({ id, isActive: !currentStatus });
      toast.success(
        `Прокси ${!currentStatus ? "активирован" : "деактивирован"}`,
      );
    } catch (error) {
      toast.error(error.message || "Ошибка изменения статуса");
    }
  };

  const handleDeleteProxy = async (id) => {
    if (!confirm("Удалить прокси?")) return;

    try {
      await deleteProxy.mutateAsync(id);
      toast.success("Прокси удалён");
    } catch (error) {
      toast.error(error.message || "Ошибка при удалении");
    }
  };

  const getAgentName = (agentId) => {
    if (!agentId) return "Все агенты";
    const agent = agents.find((a) => a.agentId === agentId);
    return agent ? agent.name : agentId;
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("ru-RU");
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">TCP/UDP Прокси</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Управление проксированием портов
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 w-9 md:h-10 md:w-10"
          >
            <IconRefresh
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 md:h-10">
                <IconPlus className="mr-1 md:mr-2 h-4 w-4" />
                <span className="text-sm md:text-base">Создать прокси</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Создать TCP/UDP прокси</DialogTitle>
                <DialogDescription>
                  Настройте проксирование порта на агентах
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 md:gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Название *</Label>
                    <Input
                      id="name"
                      placeholder="Мой прокси"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Тип *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tcp">TCP</SelectItem>
                        <SelectItem value="udp">UDP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sourcePort">Порт источника *</Label>
                    <Input
                      id="sourcePort"
                      type="number"
                      placeholder="8080"
                      min="1"
                      max="65535"
                      value={formData.sourcePort}
                      onChange={(e) =>
                        setFormData({ ...formData, sourcePort: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destinationPort">Порт назначения *</Label>
                    <Input
                      id="destinationPort"
                      type="number"
                      placeholder="80"
                      min="1"
                      max="65535"
                      value={formData.destinationPort}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          destinationPort: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destinationHost">Хост назначения *</Label>
                  <Input
                    id="destinationHost"
                    placeholder="example.com или 192.168.1.1"
                    value={formData.destinationHost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        destinationHost: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentId">Применить к *</Label>
                  <Select
                    value={formData.agentId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, agentId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все агенты</SelectItem>
                      {agents.map((agent) => (
                        <SelectItem key={agent.agentId} value={agent.agentId}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Input
                    id="description"
                    placeholder="Опционально"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button onClick={handleCreateProxy}>Создать</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список прокси</CardTitle>
          <CardDescription>
            {proxies.length} {proxies.length === 1 ? "прокси" : "прокси"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Загрузка...
            </div>
          ) : proxies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет настроенных прокси
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {proxies.map((proxy) => (
                <div
                  key={proxy.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-3"
                >
                  <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                    <IconNetwork className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base mb-1">
                        {proxy.name}
                      </h3>
                      <div className="text-xs md:text-sm text-muted-foreground space-y-1">
                        <p className="break-all">
                          <span className="font-mono">
                            {proxy.type.toUpperCase()}
                          </span>{" "}
                          :{proxy.sourcePort} → {proxy.destinationHost}:
                          {proxy.destinationPort}
                        </p>
                        <p>Агент: {getAgentName(proxy.agentId)}</p>
                        {proxy.description && (
                          <p className="text-xs">{proxy.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                    <div className="text-left sm:text-right text-xs md:text-sm">
                      <div
                        className={
                          proxy.isActive ? "text-green-500" : "text-zinc-500"
                        }
                      >
                        {proxy.isActive ? "Активен" : "Неактивен"}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {formatDate(proxy.createdAt)}
                      </div>
                    </div>
                    <div className="flex gap-1 md:gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedProxy(proxy)}
                        title="Просмотр клиентов"
                        className="h-8 w-8 md:h-9 md:w-9"
                      >
                        <IconUsers className="h-4 w-4 md:h-5 md:w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleToggleProxy(proxy.id, proxy.isActive)
                        }
                        className="h-8 w-8 md:h-9 md:w-9"
                      >
                        {proxy.isActive ? (
                          <IconToggleRight className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                        ) : (
                          <IconToggleLeft className="h-4 w-4 md:h-5 md:w-5 text-zinc-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProxy(proxy.id)}
                        className="h-8 w-8 md:h-9 md:w-9 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <IconTrash className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог просмотра клиентов */}
      <Dialog
        open={!!selectedProxy}
        onOpenChange={(open) => !open && setSelectedProxy(null)}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-base md:text-lg">
                  Активные клиенты: {selectedProxy?.name}
                </DialogTitle>
                <DialogDescription className="text-xs md:text-sm">
                  {selectedProxy?.type.toUpperCase()} порт{" "}
                  {selectedProxy?.sourcePort} → {selectedProxy?.destinationHost}
                  :{selectedProxy?.destinationPort}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {clientsFetching && !clientsLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Обновление...</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetchClients()}
                  disabled={clientsLoading}
                  className="h-8 w-8"
                  title="Обновить данные"
                >
                  <IconRefresh
                    className={`h-4 w-4 ${clientsFetching ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {clientsLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Загрузка клиентов...
            </div>
          ) : !clientsData?.clients || clientsData.clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Нет активных подключений
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 bg-accent/50 rounded-lg gap-2">
                <div className="flex items-center gap-2">
                  <IconUsers className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                  <span className="text-sm md:text-base font-semibold">
                    Всего клиентов: {clientsData.totalClients}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <IconChartBar className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                  <span className="text-xs md:text-sm text-muted-foreground">
                    Общий трафик:{" "}
                    {formatBytes(
                      clientsData.clients.reduce(
                        (sum, c) => sum + (c.total_bytes || 0),
                        0,
                      ),
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {clientsData.clients.map((client, idx) => (
                  <div
                    key={idx}
                    className="p-3 md:p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          IP адрес
                        </div>
                        <div className="font-mono text-xs md:text-sm break-all">
                          {client.ip}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Агент
                        </div>
                        <div className="text-xs md:text-sm">
                          {client.agentName || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Длительность
                        </div>
                        <div className="text-xs md:text-sm">
                          {formatDuration(client.duration)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Трафик
                        </div>
                        <div className="text-xs md:text-sm">
                          {formatBytes(client.total_bytes)}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:gap-4 mt-2 md:mt-3 pt-2 md:pt-3 border-t">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Отправлено
                        </div>
                        <div className="text-xs md:text-sm text-green-600">
                          ↑ {formatBytes(client.bytes_sent)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Получено
                        </div>
                        <div className="text-xs md:text-sm text-blue-600">
                          ↓ {formatBytes(client.bytes_received)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
