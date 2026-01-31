"use client";

import {
  IconArrowRight,
  IconChartBar,
  IconDotsVertical,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAgents } from "@/hooks/useAgents";
import {
  useCreateProxy,
  useDeleteProxy,
  useProxies,
  useUpdateProxy,
} from "@/hooks/useProxies";
import { useProxyClients } from "@/hooks/useProxyClients";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

// Modern Card Component
function ModernCard({ children, className, hover = true }) {
  return (
    <Card
      className={cn(
        "border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden",
        hover &&
          "hover:border-border/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300",
        className,
      )}
    >
      {children}
    </Card>
  );
}

// Stat Card
function StatCard({ title, value, subtext, icon: Icon, color = "primary" }) {
  const colorClasses = {
    primary: "text-primary",
    success: "text-emerald-500",
    warning: "text-amber-500",
    danger: "text-red-500",
    muted: "text-muted-foreground",
  };

  return (
    <ModernCard className="relative">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">{value}</span>
            </div>
            {subtext && (
              <p className="text-xs text-muted-foreground">{subtext}</p>
            )}
          </div>
          <div
            className={cn("p-3 rounded-xl bg-primary/5", colorClasses[color])}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </ModernCard>
  );
}

// Skeletons
function StatCardSkeleton() {
  return (
    <ModernCard>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-16" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </ModernCard>
  );
}

function ProxyRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border/40">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-8" />
    </div>
  );
}

// Format bytes
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
}

export default function ProxiesPage() {
  const { t } = useTranslation();
  const { data: proxies = [], isLoading, refetch, isFetching } = useProxies();
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

  const {
    data: clientsData,
    isLoading: clientsLoading,
    refetch: refetchClients,
  } = useProxyClients(selectedProxy?.id);

  const activeCount = proxies.filter((p) => p.isActive).length;
  const inactiveCount = proxies.length - activeCount;

  const handleCreateProxy = async () => {
    if (
      !formData.name ||
      !formData.sourcePort ||
      !formData.destinationHost ||
      !formData.destinationPort
    ) {
      toast.error(t("proxies.errors.requiredFields"));
      return;
    }

    try {
      await createProxy.mutateAsync({
        ...formData,
        agentId: formData.agentId === "all" ? null : formData.agentId,
        sourcePort: parseInt(formData.sourcePort, 10),
        destinationPort: parseInt(formData.destinationPort, 10),
      });
      toast.success(t("proxies.created"));
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
      toast.error(error.message || t("proxies.errors.createFailed"));
    }
  };

  const handleToggleProxy = async (id, currentStatus) => {
    try {
      await updateProxy.mutateAsync({ id, isActive: !currentStatus });
      toast.success(
        currentStatus ? t("proxies.deactivated") : t("proxies.activated"),
      );
    } catch (error) {
      toast.error(error.message || t("proxies.errors.toggleFailed"));
    }
  };

  const handleDeleteProxy = async (id) => {
    if (!confirm(t("proxies.confirmDelete"))) return;
    try {
      await deleteProxy.mutateAsync(id);
      toast.success(t("proxies.deleted"));
    } catch (error) {
      toast.error(error.message || t("proxies.errors.deleteFailed"));
    }
  };

  const getAgentName = (agentId) => {
    if (!agentId) return t("proxies.allAgents");
    const agent = agents.find((a) => a.agentId === agentId);
    return agent ? agent.name : agentId;
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("proxies.title")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("proxies.description")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9"
            >
              <IconRefresh
                className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")}
              />
              {t("common.refresh")}
            </Button>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9">
                  <IconPlus className="h-4 w-4 mr-2" />
                  {t("proxies.createProxy")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t("proxies.createTitle")}</DialogTitle>
                  <DialogDescription>
                    {t("proxies.createDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("proxies.form.name")}</Label>
                      <Input
                        placeholder={t("proxies.form.namePlaceholder")}
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("proxies.form.type")}</Label>
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
                      <Label>{t("proxies.form.sourcePort")}</Label>
                      <Input
                        type="number"
                        placeholder="8080"
                        value={formData.sourcePort}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sourcePort: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("proxies.form.destinationPort")}</Label>
                      <Input
                        type="number"
                        placeholder="80"
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
                    <Label>{t("proxies.form.destinationHost")}</Label>
                    <Input
                      placeholder="example.com"
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
                    <Label>{t("proxies.form.applyTo")}</Label>
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
                        <SelectItem value="all">
                          {t("proxies.allAgents")}
                        </SelectItem>
                        {agents.map((agent) => (
                          <SelectItem key={agent.agentId} value={agent.agentId}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button onClick={handleCreateProxy}>
                    {t("common.create")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              title={t("proxies.stats.total")}
              value={proxies.length}
              subtext={t("proxies.stats.configured")}
              icon={IconNetwork}
              color="primary"
            />
            <StatCard
              title={t("proxies.stats.active")}
              value={activeCount}
              subtext={t("proxies.stats.routing")}
              icon={IconNetwork}
              color="success"
            />
            <StatCard
              title={t("proxies.stats.inactive")}
              value={inactiveCount}
              subtext={t("proxies.stats.paused")}
              icon={IconNetwork}
              color="muted"
            />
          </div>
        )}

        {/* Proxy List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("proxies.listTitle")}</h2>
            <span className="text-sm text-muted-foreground">
              {proxies.length}{" "}
              {proxies.length === 1
                ? t("proxies.single")
                : t("proxies.multiple")}
            </span>
          </div>

          {isLoading ? (
            <ModernCard className="divide-y divide-border/40">
              {[...Array(5)].map((_, i) => (
                <ProxyRowSkeleton key={i} />
              ))}
            </ModernCard>
          ) : proxies.length === 0 ? (
            <ModernCard className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <IconNetwork className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t("proxies.noProxies")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  {t("proxies.noProxiesDesc")}
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <IconPlus className="h-4 w-4 mr-2" />
                  {t("proxies.createProxy")}
                </Button>
              </div>
            </ModernCard>
          ) : (
            <div className="space-y-3">
              {proxies.map((proxy) => (
                <ModernCard key={proxy.id} className="group">
                  <div className="flex items-center gap-4 p-4">
                    {/* Type Icon */}
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <IconNetwork className="h-5 w-5 text-primary" />
                    </div>

                    {/* Proxy Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold truncate">{proxy.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {proxy.type.toUpperCase()}
                        </Badge>
                        {proxy.isActive ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground"
                          >
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-mono">{proxy.sourcePort}</span>
                        <IconArrowRight className="h-3 w-3" />
                        <span>{proxy.destinationHost}</span>
                        <span className="font-mono">
                          :{proxy.destinationPort}
                        </span>
                      </div>
                    </div>

                    {/* Agent */}
                    <div className="hidden md:block text-sm text-muted-foreground">
                      {getAgentName(proxy.agentId)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedProxy(proxy)}
                          >
                            <IconUsers className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t("proxies.viewClients")}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              handleToggleProxy(proxy.id, proxy.isActive)
                            }
                          >
                            {proxy.isActive ? (
                              <IconToggleRight className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <IconToggleLeft className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {proxy.isActive ? "Deactivate" : "Activate"}
                        </TooltipContent>
                      </Tooltip>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeleteProxy(proxy.id)}
                            className="text-red-600"
                          >
                            <IconTrash className="h-4 w-4 mr-2" />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </ModernCard>
              ))}
            </div>
          )}
        </div>

        {/* Clients Dialog */}
        <Dialog
          open={!!selectedProxy}
          onOpenChange={(open) => !open && setSelectedProxy(null)}
        >
          <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {t("proxies.activeClients")}: {selectedProxy?.name}
              </DialogTitle>
              <DialogDescription>
                {selectedProxy?.type.toUpperCase()} {t("proxies.port")}{" "}
                {selectedProxy?.sourcePort}
              </DialogDescription>
            </DialogHeader>

            {clientsLoading ? (
              <div className="py-8 text-center">
                <Skeleton className="h-8 w-32 mx-auto" />
              </div>
            ) : !clientsData?.clients?.length ? (
              <div className="py-8 text-center text-muted-foreground">
                {t("proxies.noActiveConnections")}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">
                    {t("proxies.totalClients")}: {clientsData.totalClients}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t("proxies.totalTraffic")}:{" "}
                    {formatBytes(
                      clientsData.clients.reduce(
                        (sum, c) => sum + (c.total_bytes || 0),
                        0,
                      ),
                    )}
                  </span>
                </div>
                <div className="space-y-2">
                  {clientsData.clients.map((client, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <code className="text-sm font-mono">{client.ip}</code>
                        <p className="text-xs text-muted-foreground">
                          {client.agentName} • {client.duration}
                        </p>
                      </div>
                      <div className="text-sm">
                        {formatBytes(client.total_bytes)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
