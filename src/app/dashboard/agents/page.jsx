"use client";

import {
  IconActivity,
  IconAlertCircle,
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCircle,
  IconCircleFilled,
  IconCopy,
  IconCpu,
  IconDatabase,
  IconDotsVertical,
  IconEdit,
  IconExternalLink,
  IconFilter,
  IconMapPin,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconServer,
  IconShield,
  IconSortAscending,
  IconTrash,
  IconTrendingUp,
  IconWorld,
  IconX,
} from "@tabler/icons-react";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
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
import { useAgents, useCreateAgent, useDeleteAgent } from "@/hooks/useAgents";
import { useTranslation } from "@/hooks/useTranslation";
import { AgentsStatusGraph } from "@/components/agents-status-graph";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

// Modern Card Component
function ModernCard({ children, className, hover = true }) {
  return (
    <Card
      className={cn(
        "border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden",
        hover && "hover:border-border/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300",
        className
      )}
    >
      {children}
    </Card>
  );
}

// Stat Card
function StatCard({ title, value, subtext, icon: Icon, trend, color = "primary" }) {
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
              {trend && (
                <span className={cn("text-xs font-medium", trend > 0 ? "text-emerald-500" : "text-red-500")}>
                  {trend > 0 ? "+" : ""}{trend}%
                </span>
              )}
            </div>
            {subtext && (
              <p className="text-xs text-muted-foreground">{subtext}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-xl bg-primary/5", colorClasses[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </ModernCard>
  );
}

// Loading Skeletons
function StatCardSkeleton() {
  return (
    <ModernCard>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </ModernCard>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border/40">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-8 w-8" />
    </div>
  );
}

// Metric Bar Component
function MetricBar({ value, max = 100, size = "sm" }) {
  const colors =
    value > 80 ? "bg-red-500" : value > 60 ? "bg-amber-500" : "bg-emerald-500";

  const heightClass = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className={`${heightClass} w-full bg-secondary rounded-full overflow-hidden`}>
      <div
        className={cn("h-full rounded-full transition-all", colors)}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

// Agent Status Badge
function AgentStatusBadge({ agent }) {
  if (!agent.isConnected) {
    return (
      <Badge variant="outline" className="text-muted-foreground border-muted text-xs">
        <IconCircle className="h-3 w-3 mr-1" />
        Offline
      </Badge>
    );
  }

  if (agent.isActive) {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0 text-xs">
        <IconCircleFilled className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  }

  return (
    <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-0 text-xs">
      <IconAlertCircle className="h-3 w-3 mr-1" />
      Standby
    </Badge>
  );
}

// Format helpers
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

function formatDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Sort agents
function sortAgents(agents, sortBy, sortOrder) {
  return [...agents].sort((a, b) => {
    let aVal, bVal;

    switch (sortBy) {
      case "name":
        aVal = a.name?.toLowerCase() || "";
        bVal = b.name?.toLowerCase() || "";
        break;
      case "status":
        aVal = a.isConnected ? (a.isActive ? 2 : 1) : 0;
        bVal = b.isConnected ? (b.isActive ? 2 : 1) : 0;
        break;
      case "load":
        aVal = a.loadScore || 0;
        bVal = b.loadScore || 0;
        break;
      case "cpu":
        aVal = a.systemMetrics?.cpuUsagePercent || 0;
        bVal = b.systemMetrics?.cpuUsagePercent || 0;
        break;
      case "memory":
        aVal = a.systemMetrics?.memoryUsagePercent || 0;
        bVal = b.systemMetrics?.memoryUsagePercent || 0;
        break;
      case "lastSeen":
        aVal = new Date(a.lastSeen || 0).getTime();
        bVal = new Date(b.lastSeen || 0).getTime();
        break;
      default:
        aVal = a.name?.toLowerCase() || "";
        bVal = b.name?.toLowerCase() || "";
    }

    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });
}

// Filter agents
function filterAgents(agents, searchQuery, statusFilter, loadFilter) {
  return agents.filter((agent) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = agent.name?.toLowerCase().includes(query);
      const ipMatch = agent.ipAddress?.toLowerCase().includes(query);
      const locationMatch =
        agent.manualLocation?.city?.toLowerCase().includes(query) ||
        agent.manualLocation?.country?.toLowerCase().includes(query) ||
        agent.ipInfo?.city?.toLowerCase().includes(query) ||
        agent.ipInfo?.country?.toLowerCase().includes(query);
      const idMatch = agent.agentId?.toLowerCase().includes(query);
      const tagMatch = agent.tags?.some((tag) => tag.toLowerCase().includes(query));

      if (!nameMatch && !ipMatch && !locationMatch && !idMatch && !tagMatch) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "offline" && agent.isConnected) return false;
      if (statusFilter === "active" && (!agent.isConnected || !agent.isActive)) return false;
      if (statusFilter === "standby" && (!agent.isConnected || agent.isActive)) return false;
    }

    // Load filter
    if (loadFilter !== "all") {
      const load = agent.loadScore || 0;
      if (loadFilter === "overloaded" && load <= 80) return false;
      if (loadFilter === "high" && (load <= 60 || load > 80)) return false;
      if (loadFilter === "normal" && load > 60) return false;
    }

    return true;
  });
}

export default function AgentsPage() {
  const { t } = useTranslation();
  const { data: agents = [], isLoading, refetch, isFetching } = useAgents({
    refetchInterval: 60000,
  });
  const createAgent = useCreateAgent();
  const deleteAgent = useDeleteAgent();

  // UI State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [connectionUrl, setConnectionUrl] = useState("");
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentPolling, setNewAgentPolling] = useState("60");
  const [copied, setCopied] = useState(false);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadFilter, setLoadFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Selection State
  const [selectedAgents, setSelectedAgents] = useState(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Stats calculation
  const activeCount = agents.filter((a) => a.isActive).length;
  const disconnectedCount = agents.filter((a) => !a.isConnected).length;
  const overloadedCount = agents.filter((a) => (a.loadScore || 0) > 80).length;
  const avgLoadScore = agents.length > 0
    ? agents.reduce((sum, a) => sum + (a.loadScore || 0), 0) / agents.length
    : 0;

  // Filtered and sorted agents
  const filteredAgents = useMemo(() => {
    const filtered = filterAgents(agents, searchQuery, statusFilter, loadFilter);
    return sortAgents(filtered, sortBy, sortOrder);
  }, [agents, searchQuery, statusFilter, loadFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAgents.length / ITEMS_PER_PAGE);
  const paginatedAgents = filteredAgents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    setCurrentPage(1);
    setSelectedAgents(new Set());
  }, []);

  const handleStatusFilterChange = useCallback((value) => {
    setStatusFilter(value);
    setCurrentPage(1);
    setSelectedAgents(new Set());
  }, []);

  const handleLoadFilterChange = useCallback((value) => {
    setLoadFilter(value);
    setCurrentPage(1);
    setSelectedAgents(new Set());
  }, []);

  // Sorting
  const handleSort = useCallback((column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  }, [sortBy, sortOrder]);

  // Selection handlers
  const toggleSelectAll = useCallback(() => {
    if (selectedAgents.size === paginatedAgents.length) {
      setSelectedAgents(new Set());
    } else {
      setSelectedAgents(new Set(paginatedAgents.map((a) => a.id)));
    }
  }, [selectedAgents, paginatedAgents]);

  const toggleSelectAgent = useCallback((agentId) => {
    const newSet = new Set(selectedAgents);
    if (newSet.has(agentId)) {
      newSet.delete(agentId);
    } else {
      newSet.add(agentId);
    }
    setSelectedAgents(newSet);
  }, [selectedAgents]);

  const handleSelectAllFiltered = useCallback(() => {
    setSelectedAgents(new Set(filteredAgents.map((a) => a.id)));
  }, [filteredAgents]);

  const handleClearSelection = useCallback(() => {
    setSelectedAgents(new Set());
  }, []);

  // Bulk delete
  const handleBulkDelete = useCallback(async () => {
    try {
      const promises = Array.from(selectedAgents).map((id) =>
        deleteAgent.mutateAsync(id)
      );
      await Promise.all(promises);
      toast.success(`Deleted ${selectedAgents.size} agents`);
      setSelectedAgents(new Set());
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to delete agents");
    }
  }, [selectedAgents, deleteAgent]);

  // Create agent
  const handleCreateAgent = async () => {
    if (!newAgentName.trim()) {
      toast.error(t("agents.errors.nameRequired"));
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
      toast.success(t("agents.tokenCreated"));
    } catch (error) {
      toast.error(error.message || t("agents.errors.createFailed"));
    }
  };

  // Delete agent
  const handleDeleteAgent = async (id) => {
    if (!confirm(t("agents.confirmDelete"))) return;

    try {
      await deleteAgent.mutateAsync(id);
      toast.success(t("agents.deleted"));
    } catch (error) {
      toast.error(error.message || t("agents.errors.deleteFailed"));
    }
  };

  // Edit agent
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

      if (!response.ok) throw new Error("Failed to update");

      toast.success(t("agents.updated"));
      setEditDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(error.message || t("agents.errors.updateFailed"));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(
      `curl -sSL https://raw.githubusercontent.com/Defenra/DefenraAgent/main/quick-install.sh | \\\n   sudo CONNECT_URL="${connectionUrl}" bash`
    );
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const closeDialog = () => {
    setCreateDialogOpen(false);
    setConnectionUrl("");
    setNewAgentName("");
  };

  // Sort indicator
  const SortIndicator = ({ column }) => {
    if (sortBy !== column) return <IconSortAscending className="h-3.5 w-3.5 text-muted-foreground/50" />;
    return sortOrder === "asc" ? (
      <IconArrowUp className="h-3.5 w-3.5 text-primary" />
    ) : (
      <IconArrowDown className="h-3.5 w-3.5 text-primary" />
    );
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("agents.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("agents.description")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9"
            >
              <IconRefresh className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
              {t("common.refresh")}
            </Button>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9">
                  <IconPlus className="h-4 w-4 mr-2" />
                  {t("agents.addAgent")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t("agents.createToken")}</DialogTitle>
                  <DialogDescription>{t("agents.createTokenDesc")}</DialogDescription>
                </DialogHeader>
                {!connectionUrl ? (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("agents.form.name")}</Label>
                      <Input
                        id="name"
                        placeholder={t("agents.form.namePlaceholder")}
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="polling">{t("agents.form.pollingInterval")}</Label>
                      <Input
                        id="polling"
                        type="number"
                        min="10"
                        value={newAgentPolling}
                        onChange={(e) => setNewAgentPolling(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="rounded-lg bg-muted p-4">
                      <code className="text-xs break-all font-mono">
                        curl -sSL https://raw.githubusercontent.com/Defenra/DefenraAgent/main/quick-install.sh | \\\n                        sudo CONNECT_URL="{connectionUrl}" bash
                      </code>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  {!connectionUrl ? (
                    <>
                      <Button variant="outline" onClick={closeDialog}>
                        {t("common.cancel")}
                      </Button>
                      <Button onClick={handleCreateAgent}>{t("common.create")}</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={copyToClipboard}>
                        {copied ? <IconCheck className="h-4 w-4 mr-2" /> : <IconCopy className="h-4 w-4 mr-2" />}
                        {copied ? t("common.copied") : t("common.copy")}
                      </Button>
                      <Button onClick={closeDialog}>{t("common.done")}</Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Overview */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((num) => (
              <StatCardSkeleton key={`stat-${num}`} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("agents.stats.active")}
              value={activeCount}
              subtext={t("agents.stats.protecting")}
              icon={IconShield}
              color="success"
            />
            <StatCard
              title={t("agents.stats.inactive")}
              value={agents.filter((a) => !a.isActive && a.isConnected).length}
              subtext={t("agents.stats.needAttention")}
              icon={IconAlertCircle}
              color="warning"
            />
            <StatCard
              title={t("agents.stats.pending")}
              value={disconnectedCount}
              subtext={t("agents.stats.awaitingConnection")}
              icon={IconServer}
              color="muted"
            />
            <StatCard
              title={t("agents.stats.avgLoad")}
              value={`${avgLoadScore.toFixed(0)}%`}
              subtext={overloadedCount > 0 ? `${overloadedCount} overloaded` : t("agents.stats.networkWide")}
              icon={IconActivity}
              color={avgLoadScore > 80 ? "danger" : avgLoadScore > 60 ? "warning" : "primary"}
            />
          </div>
        )}

        {/* Filters & Search */}
        <ModernCard className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, IP, location, or tags..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <IconX className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-[140px]">
                  <IconFilter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="standby">Standby</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>

              <Select value={loadFilter} onValueChange={handleLoadFilterChange}>
                <SelectTrigger className="w-[140px]">
                  <IconActivity className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Load" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Load</SelectItem>
                  <SelectItem value="overloaded">Overloaded (&gt;80%)</SelectItem>
                  <SelectItem value="high">High (60-80%)</SelectItem>
                  <SelectItem value="normal">Normal (&lt;60%)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={handleSort}>
                <SelectTrigger className="w-[160px]">
                  <IconSortAscending className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="load">Load Score</SelectItem>
                  <SelectItem value="cpu">CPU Usage</SelectItem>
                  <SelectItem value="memory">Memory Usage</SelectItem>
                  <SelectItem value="lastSeen">Last Seen</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="h-9 w-9"
              >
                {sortOrder === "asc" ? <IconArrowUp className="h-4 w-4" /> : <IconArrowDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Results Count & Clear Filters */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40">
            <div className="text-sm text-muted-foreground">
              Showing {filteredAgents.length} of {agents.length} agents
              {(searchQuery || statusFilter !== "all" || loadFilter !== "all") && (
                <span className="ml-2">(filtered)</span>
              )}
            </div>
            {(searchQuery || statusFilter !== "all" || loadFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleSearchChange("");
                  handleStatusFilterChange("all");
                  handleLoadFilterChange("all");
                }}
              >
                <IconX className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
        </ModernCard>

        {/* Bulk Actions Bar */}
        {selectedAgents.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {selectedAgents.size} selected
              </span>
              {selectedAgents.size < filteredAgents.length && (
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-sm text-primary hover:underline"
                >
                  Select all {filteredAgents.length} filtered
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
              >
                Clear
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <IconTrash className="h-4 w-4 mr-1" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Agents Table */}
        <div className="space-y-4">
          {isLoading ? (
            <ModernCard className="divide-y divide-border/40">
              {[1, 2, 3, 4, 5].map((num) => (
                <TableRowSkeleton key={`skeleton-${num}`} />
              ))}
            </ModernCard>
          ) : filteredAgents.length === 0 ? (
            <ModernCard className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <IconServer className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery || statusFilter !== "all" || loadFilter !== "all"
                    ? "No agents match your filters"
                    : t("agents.noAgents")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  {searchQuery || statusFilter !== "all" || loadFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : t("agents.noAgentsDesc")}
                </p>
                {!(searchQuery || statusFilter !== "all" || loadFilter !== "all") && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <IconPlus className="h-4 w-4 mr-2" />
                    {t("agents.addAgent")}
                  </Button>
                )}
              </div>
            </ModernCard>
          ) : (
            <>
              <ModernCard className="overflow-hidden">
                {/* Table Header */}
                <div className="flex items-center gap-4 p-3 border-b border-border/40 bg-muted/30 text-sm font-medium">
                  <div className="w-4 flex justify-center">
                    <Checkbox
                      checked={selectedAgents.size === paginatedAgents.length && paginatedAgents.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSort("name")}
                    className="flex-1 flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    Agent
                    <SortIndicator column="name" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSort("status")}
                    className="w-24 hidden md:flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    Status
                    <SortIndicator column="status" />
                  </button>
                  <div className="w-32 hidden lg:block">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleSort("cpu")}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          CPU
                          <SortIndicator column="cpu" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>CPU Usage</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="w-32 hidden lg:block">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleSort("memory")}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          RAM
                          <SortIndicator column="memory" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Memory Usage</TooltipContent>
                    </Tooltip>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSort("load")}
                    className="w-24 hidden md:flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    Load
                    <SortIndicator column="load" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSort("lastSeen")}
                    className="w-24 hidden sm:flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    Last Seen
                    <SortIndicator column="lastSeen" />
                  </button>
                  <div className="w-10" />
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-border/40">
                  {paginatedAgents.map((agent) => {
                    const cpuUsage = agent.systemMetrics?.cpuUsagePercent || 0;
                    const memoryUsage = agent.systemMetrics?.memoryUsagePercent || 0;
                    const loadScore = agent.loadScore || 0;
                    const isSelected = selectedAgents.has(agent.id);

                    return (
                      <div
                        key={agent.id}
                        className={cn(
                          "flex items-center gap-4 p-3 hover:bg-muted/30 transition-colors",
                          isSelected && "bg-primary/5"
                        )}
                      >
                        <div className="w-4 flex justify-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectAgent(agent.id)}
                          />
                        </div>

                        {/* Agent Info */}
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          <div className={cn(
                            "h-2.5 w-2.5 rounded-full shrink-0",
                            agent.isActive ? "bg-emerald-500" :
                            agent.isConnected ? "bg-amber-500" : "bg-muted-foreground/30"
                          )}>
                            {agent.isActive && (
                              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{agent.name}</span>
                              {agent.label && (
                                <Badge variant="outline" className="text-xs hidden sm:inline-flex shrink-0">
                                  {agent.label}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <code className="text-[10px] bg-muted px-1 rounded">{agent.agentId?.slice(0, 8)}</code>
                              <span>•</span>
                              <span className="truncate">{agent.ipAddress || "—"}</span>
                              {(agent.manualLocation?.city || agent.ipInfo?.city) && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5">
                                    <IconMapPin className="h-3 w-3" />
                                    {agent.manualLocation?.city || agent.ipInfo?.city}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="w-24 hidden md:block">
                          <AgentStatusBadge agent={agent} />
                        </div>

                        {/* CPU */}
                        <div className="w-32 hidden lg:block">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs w-8 text-right",
                              cpuUsage > 80 ? "text-red-500" :
                              cpuUsage > 60 ? "text-amber-500" : "text-emerald-500"
                            )}>
                              {cpuUsage.toFixed(0)}%
                            </span>
                            <div className="flex-1">
                              <MetricBar value={cpuUsage} />
                            </div>
                          </div>
                        </div>

                        {/* Memory */}
                        <div className="w-32 hidden lg:block">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs w-8 text-right",
                              memoryUsage > 80 ? "text-red-500" :
                              memoryUsage > 60 ? "text-amber-500" : "text-emerald-500"
                            )}>
                              {memoryUsage.toFixed(0)}%
                            </span>
                            <div className="flex-1">
                              <MetricBar value={memoryUsage} />
                            </div>
                          </div>
                        </div>

                        {/* Load Score */}
                        <div className="w-24 hidden md:block">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs font-medium",
                              loadScore > 80 ? "text-red-500" :
                              loadScore > 60 ? "text-amber-500" : "text-emerald-500"
                            )}>
                              {loadScore.toFixed(0)}%
                            </span>
                            <MetricBar value={loadScore} />
                          </div>
                        </div>

                        {/* Last Seen */}
                        <div className="w-24 hidden sm:block text-xs text-muted-foreground">
                          {formatDate(agent.lastSeen)}
                        </div>

                        {/* Actions */}
                        <div className="w-10 flex justify-end">
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
                              <DropdownMenuItem onClick={() => handleEditAgent(agent)}>
                                <IconEdit className="h-4 w-4 mr-2" />
                                {t("common.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteAgent(agent.id)}
                              >
                                <IconTrash className="h-4 w-4 mr-2" />
                                {t("common.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ModernCard>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({filteredAgents.length} total)
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <IconChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <IconChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Performance Analytics */}
        {!isLoading && agents.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("agents.analytics.title")}</h2>
              <span className="text-xs text-muted-foreground">{t("agents.analytics.realtime")}</span>
            </div>
            <AgentsStatusGraph agents={agents} />
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("agents.editAgent")}</DialogTitle>
              <DialogDescription>{t("agents.editAgentDesc")}</DialogDescription>
            </DialogHeader>
            {editingAgent && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("agents.form.name")}</Label>
                    <Input
                      value={editingAgent.name}
                      onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("agents.form.label")}</Label>
                    <Input
                      value={editingAgent.label}
                      onChange={(e) => setEditingAgent({ ...editingAgent, label: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("agents.form.tags")}</Label>
                  <Input
                    value={editingAgent.tags}
                    onChange={(e) => setEditingAgent({ ...editingAgent, tags: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">{t("agents.form.tagsHint")}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("agents.form.category")}</Label>
                    <Input
                      value={editingAgent.category}
                      onChange={(e) => setEditingAgent({ ...editingAgent, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("agents.form.provider")}</Label>
                    <Input
                      value={editingAgent.provider}
                      onChange={(e) => setEditingAgent({ ...editingAgent, provider: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("agents.form.price")}</Label>
                    <Input
                      type="number"
                      value={editingAgent.price}
                      onChange={(e) => setEditingAgent({ ...editingAgent, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("agents.form.maxTraffic")}</Label>
                    <Input
                      type="number"
                      value={editingAgent.maxTraffic}
                      onChange={(e) => setEditingAgent({ ...editingAgent, maxTraffic: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSaveAgent}>{t("common.save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Confirmation */}
        <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <IconTrash className="h-5 w-5" />
                Delete {selectedAgents.size} Agents?
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. All selected agents will be permanently removed from your network.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete}>
                <IconTrash className="h-4 w-4 mr-2" />
                Delete {selectedAgents.size} Agents
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
