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

export default function BansPage() {
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
    refetchInterval: 30000, // Auto-refresh every 30 seconds
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
      toast.success("Ban added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add ban: ${error.message}`);
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
      toast.success("Ban removed successfully");
    },
    onError: (error) => {
      toast.error(`Failed to remove ban: ${error.message}`);
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
      toast.success(`Cleaned up ${data.deletedCount} expired bans`);
    },
    onError: (error) => {
      toast.error(`Failed to cleanup: ${error.message}`);
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
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Global Bans</h1>
          <p className="text-sm text-zinc-400 md:text-base">
            Manage IP bans synchronized across all agents
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
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => cleanupMutation.mutate()}
            disabled={cleanupMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Cleanup Expired
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Ban
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {data?.stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bans</CardTitle>
              <Shield className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.total}</div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {data.stats.active}
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <ShieldOff className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-400">
                {data.stats.expired}
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Permanent</CardTitle>
              <ShieldAlert className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {data.stats.permanent}
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CIDR Ranges</CardTitle>
              <Globe className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {data.stats.cidr}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search by IP address..."
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
                <SelectItem value="all">All Bans</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="expired">Expired Only</SelectItem>
                <SelectItem value="permanent">Permanent Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bans Table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableHead>IP Address</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Banned At</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : data?.bans?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No bans found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.bans?.map((ban) => (
                    <TableRow
                      key={ban._id}
                      className="border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <TableCell className="font-mono text-sm">
                        <a
                          href={`https://ipinfo.io/${ban.ip}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                        >
                          {ban.ip}
                        </a>
                        {ban.isCIDR && (
                          <Badge
                            variant="outline"
                            className="ml-2 border-blue-500 text-blue-400"
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
                          <Badge className="bg-red-500/10 text-red-400 hover:bg-red-500/20">
                            Permanent
                          </Badge>
                        ) : ban.isActive ? (
                          <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-zinc-600 text-zinc-400"
                          >
                            Expired
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ban.sourceAgentName}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-400">
                        {formatDate(ban.bannedAt)}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-400">
                        {formatDate(ban.expiresAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ban.isActive ? (
                          <span className="flex items-center gap-1 text-green-400">
                            <Clock className="h-3 w-3" />
                            {formatDuration(ban.remainingTime)}
                          </span>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBanMutation.mutate(ban._id)}
                          disabled={removeBanMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-400">
            Page {data.pagination.page} of {data.pagination.pages} (
            {data.pagination.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) => Math.min(data.pagination.pages, p + 1))
              }
              disabled={page === data.pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Ban Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900">
          <DialogHeader>
            <DialogTitle>Add Global Ban</DialogTitle>
            <DialogDescription>
              Manually add an IP ban that will be synchronized across all agents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ip">IP Address or CIDR</Label>
              <Input
                id="ip"
                placeholder="1.2.3.4 or 1.2.3.0/24"
                value={newBan.ip}
                onChange={(e) => setNewBan({ ...newBan, ip: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="e.g., DDoS attack, malicious activity"
                value={newBan.reason}
                onChange={(e) =>
                  setNewBan({ ...newBan, reason: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
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
                  <SelectItem value="3600">1 hour</SelectItem>
                  <SelectItem value="21600">6 hours</SelectItem>
                  <SelectItem value="86400">24 hours</SelectItem>
                  <SelectItem value="604800">7 days</SelectItem>
                  <SelectItem value="2592000">30 days</SelectItem>
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
                Permanent ban (blacklist)
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
                CIDR range ban
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addBanMutation.mutate(newBan)}
              disabled={
                !newBan.ip || !newBan.reason || addBanMutation.isPending
              }
            >
              Add Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
