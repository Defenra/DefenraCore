"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  Clock,
  Globe,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

// Bento Card Component
function BentoCard({ children, className, colSpan = 1 }) {
  return (
    <Card
      className={cn(
        "border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300",
        "hover:border-border hover:shadow-lg hover:shadow-primary/5",
        colSpan === 2 && "md:col-span-2",
        className
      )}
    >
      {children}
    </Card>
  );
}

// Stat Card Skeleton
function StatCardSkeleton() {
  return (
    <BentoCard>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </BentoCard>
  );
}

// Table Row Skeleton
function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
    </TableRow>
  );
}

export default function BansPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("active");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBan, setNewBan] = useState({
    ip: "",
    reason: "",
    duration: 3600,
    isPermanent: false,
    isCIDR: false,
  });

  // Fetch bans
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["bans", page, search, type],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        type,
      });
      if (search) params.append("search", search);

      const res = await fetch(`/api/bans?${params}`);
      if (!res.ok) throw new Error("Failed to fetch bans");
      return res.json();
    },
    refetchInterval: 30000,
  });

  // Add ban mutation
  const addBanMutation = useMutation({
    mutationFn: async (ban) => {
      const res = await fetch("/api/bans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ban),
      });
      if (!res.ok) throw new Error("Failed to add ban");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bans"] });
      setIsAddDialogOpen(false);
      setNewBan({
        ip: "",
        reason: "",
        duration: 3600,
        isPermanent: false,
        isCIDR: false,
      });
      toast.success(t("bans.added"));
    },
    onError: (error) => {
      toast.error(`${t("bans.addFailed")}: ${error.message}`);
    },
  });

  // Remove ban mutation
  const removeBanMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/bans/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove ban");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bans"] });
      toast.success(t("bans.removed"));
    },
    onError: (error) => {
      toast.error(`${t("bans.removeFailed")}: ${error.message}`);
    },
  });

  // Cleanup expired bans mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/bans", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to cleanup bans");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bans"] });
      toast.success(t("bans.cleaned", { count: data.deletedCount }));
    },
    onError: (error) => {
      toast.error(`${t("bans.cleanupFailed")}: ${error.message}`);
    },
  });

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Filters Skeleton */}
        <BentoCard>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-full md:w-[180px]" />
            </div>
          </CardContent>
        </BentoCard>

        {/* Table Skeleton */}
        <BentoCard>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Banned</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </BentoCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("bans.title")}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {t("bans.description")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("common.refresh")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => cleanupMutation.mutate()}
            disabled={cleanupMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("bans.cleanup")}
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("bans.addBan")}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {data?.stats && (
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-5">
          <BentoCard>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("bans.stats.total")}
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold">{data.stats.total}</div>
            </CardContent>
          </BentoCard>

          <BentoCard className="border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("bans.stats.active")}
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-green-500">
                {data.stats.active}
              </div>
            </CardContent>
          </BentoCard>

          <BentoCard className="border-slate-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("bans.stats.expired")}
              </CardTitle>
              <ShieldOff className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-slate-500">
                {data.stats.expired}
              </div>
            </CardContent>
          </BentoCard>

          <BentoCard className="border-red-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("bans.stats.permanent")}
              </CardTitle>
              <ShieldAlert className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-red-500">
                {data.stats.permanent}
              </div>
            </CardContent>
          </BentoCard>

          <BentoCard className="border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("bans.stats.cidr")}
              </CardTitle>
              <Globe className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-blue-500">
                {data.stats.cidr}
              </div>
            </CardContent>
          </BentoCard>
        </div>
      )}

      {/* Filters */}
      <BentoCard>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("bans.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("bans.filters.all")}</SelectItem>
                <SelectItem value="active">{t("bans.filters.active")}</SelectItem>
                <SelectItem value="expired">{t("bans.filters.expired")}</SelectItem>
                <SelectItem value="permanent">{t("bans.filters.permanent")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </BentoCard>

      {/* Bans Table */}
      <BentoCard>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>{t("bans.table.ip")}</TableHead>
                  <TableHead>{t("bans.table.reason")}</TableHead>
                  <TableHead>{t("bans.table.status")}</TableHead>
                  <TableHead>{t("bans.table.source")}</TableHead>
                  <TableHead>{t("bans.table.bannedAt")}</TableHead>
                  <TableHead>{t("bans.table.expiresAt")}</TableHead>
                  <TableHead>{t("bans.table.remaining")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.bans?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t("bans.noBans")}
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.bans?.map((ban) => (
                    <TableRow
                      key={ban._id}
                      className="border-border hover:bg-accent/50"
                    >
                      <TableCell className="font-mono text-sm">
                        <a
                          href={`https://ipinfo.io/${ban.ip}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline transition-colors"
                        >
                          {ban.ip}
                        </a>
                        {ban.isCIDR && (
                          <Badge
                            variant="outline"
                            className="ml-2 border-blue-500 text-blue-500"
                          >
                            CIDR
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {ban.reason}
                      </TableCell>
                      <TableCell>
                        {ban.isPermanent ? (
                          <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                            {t("bans.status.permanent")}
                          </Badge>
                        ) : ban.isActive ? (
                          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                            {t("bans.status.active")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            {t("bans.status.expired")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ban.sourceAgentName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(ban.bannedAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(ban.expiresAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ban.isActive ? (
                          <span className="flex items-center gap-1 text-green-500">
                            <Clock className="h-3 w-3" />
                            {formatDuration(ban.remainingTime)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBanMutation.mutate(ban._id)}
                          disabled={removeBanMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </BentoCard>

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("common.page")} {data.pagination.page} {t("common.of")} {data.pagination.pages} ({data.pagination.total} {t("common.total")})
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {t("common.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) => Math.min(data.pagination.pages, p + 1))
              }
              disabled={page === data.pagination.pages}
            >
              {t("common.next")}
            </Button>
          </div>
        </div>
      )}

      {/* Add Ban Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("bans.addBan")}</DialogTitle>
            <DialogDescription>
              {t("bans.addBanDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ip">{t("bans.form.ip")}</Label>
              <Input
                id="ip"
                placeholder="1.2.3.4 or 1.2.3.0/24"
                value={newBan.ip}
                onChange={(e) => setNewBan({ ...newBan, ip: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">{t("bans.form.reason")}</Label>
              <Input
                id="reason"
                placeholder={t("bans.form.reasonPlaceholder")}
                value={newBan.reason}
                onChange={(e) =>
                  setNewBan({ ...newBan, reason: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">{t("bans.form.duration")}</Label>
              <Select
                value={newBan.duration.toString()}
                onValueChange={(value) =>
                  setNewBan({ ...newBan, duration: Number.parseInt(value) })
                }
                disabled={newBan.isPermanent}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3600">{t("bans.durations.1h")}</SelectItem>
                  <SelectItem value="21600">{t("bans.durations.6h")}</SelectItem>
                  <SelectItem value="86400">{t("bans.durations.24h")}</SelectItem>
                  <SelectItem value="604800">{t("bans.durations.7d")}</SelectItem>
                  <SelectItem value="2592000">{t("bans.durations.30d")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="permanent"
                checked={newBan.isPermanent}
                onCheckedChange={(checked) =>
                  setNewBan({ ...newBan, isPermanent: checked })
                }
              />
              <Label htmlFor="permanent" className="cursor-pointer">
                {t("bans.form.permanent")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cidr"
                checked={newBan.isCIDR}
                onCheckedChange={(checked) =>
                  setNewBan({ ...newBan, isCIDR: checked })
                }
              />
              <Label htmlFor="cidr" className="cursor-pointer">
                {t("bans.form.cidr")}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => addBanMutation.mutate(newBan)}
              disabled={
                !newBan.ip || !newBan.reason || addBanMutation.isPending
              }
            >
              {t("bans.addBan")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
