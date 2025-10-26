"use client";

import {
  IconNetwork,
  IconPlus,
  IconRefresh,
  IconToggleLeft,
  IconToggleRight,
  IconTrash,
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
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">TCP/UDP Прокси</h1>
          <p className="text-sm text-muted-foreground">
            Управление проксированием портов
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <IconRefresh
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Создать прокси
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Создать TCP/UDP прокси</DialogTitle>
                <DialogDescription>
                  Настройте проксирование порта на агентах
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-4">
              {proxies.map((proxy) => (
                <div
                  key={proxy.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <IconNetwork className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{proxy.name}</h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
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
                    <div className="text-right text-sm">
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
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleToggleProxy(proxy.id, proxy.isActive)
                      }
                    >
                      {proxy.isActive ? (
                        <IconToggleRight className="h-5 w-5 text-green-500" />
                      ) : (
                        <IconToggleLeft className="h-5 w-5 text-zinc-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProxy(proxy.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
