"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import { getAllRoles } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Bento Card Component
function BentoCard({ children, className }) {
  return (
    <Card
      className={cn(
        "border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300",
        "hover:border-border hover:shadow-lg hover:shadow-primary/5",
        className,
      )}
    >
      {children}
    </Card>
  );
}

// Table Skeleton
function TableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-24" />
        </div>
      ))}
    </div>
  );
}

export default function UsersPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasPermission, isLoading: permLoading } = usePermissions();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer",
    canViewAllResources: false,
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const roles = getAllRoles();
  const hasFetchedRef = useRef(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error(t("users.errors.fetchFailed"));
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (status === "loading" || permLoading) {
      return;
    }

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (!hasPermission("users.read")) {
      router.push("/dashboard");
      return;
    }

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchUsers();
    }
  }, [status, permLoading, hasPermission, router, fetchUsers]);

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "viewer",
      canViewAllResources: false,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      canViewAllResources: user.canViewAllResources || false,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm(t("users.confirmDelete"))) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("users.errors.deleteFailed"));
      }

      hasFetchedRef.current = false;
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const url = editingUser ? `/api/users/${editingUser._id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const body = { ...formData };
      if (editingUser && !body.password) {
        delete body.password;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("users.errors.saveFailed"));
      }

      setShowModal(false);
      hasFetchedRef.current = false;
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      "proxy-manager":
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      "domain-manager":
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      operator:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      viewer: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400",
    };
    return (
      colors[role] ||
      "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
    );
  };

  const getRoleName = (role) => {
    const roleConfig = roles.find((r) => r.key === role);
    return roleConfig?.name || role;
  };

  if (status === "loading" || permLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (!hasPermission("users.read")) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("users.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("users.description")}
          </p>
        </div>
        {hasPermission("users.write") && (
          <Button onClick={handleAddUser} className="w-full sm:w-auto">
            {t("users.addUser")}
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Users Table */}
      {loading
        ? <BentoCard>
            <CardContent className="p-6">
              <TableSkeleton />
            </CardContent>
          </BentoCard>
        : <BentoCard>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-left">
                        {t("users.table.name")}
                      </TableHead>
                      <TableHead className="text-left">
                        {t("users.table.email")}
                      </TableHead>
                      <TableHead className="text-left">
                        {t("users.table.role")}
                      </TableHead>
                      <TableHead className="text-left">
                        {t("users.table.created")}
                      </TableHead>
                      {hasPermission("users.write") && (
                        <TableHead className="text-right">
                          {t("users.table.actions")}
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow
                        key={user._id}
                        className="border-border hover:bg-accent/50"
                      >
                        <TableCell className="font-medium">
                          {user.name}
                          {session?.user?.id === user._id && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({t("users.you")})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground break-all">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={getRoleBadgeColor(user.role)}
                          >
                            {getRoleName(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        {hasPermission("users.write") && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              {t("common.edit")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={session?.user?.id === user._id}
                              className="text-red-500 hover:text-red-600"
                            >
                              {t("common.delete")}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {users.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {t("users.noUsers")}
                </div>
              )}
            </CardContent>
          </BentoCard>}

      {/* Add/Edit User Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? t("users.editUser") : t("users.addUser")}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? t("users.editDescription")
                : t("users.addDescription")}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">{t("users.form.name")}</Label>
              <Input
                id="user-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">{t("users.form.email")}</Label>
              <Input
                id="user-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-password">
                {t("users.form.password")}
                {editingUser && ` ${t("users.form.passwordOptional")}`}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required={!editingUser}
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                {t("users.form.passwordHint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-role">{t("users.form.role")}</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.key} value={role.key}>
                      {role.name} - {role.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="canViewAllResources">View All Resources</Label>
              <Switch
                id="canViewAllResources"
                checked={formData.canViewAllResources}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, canViewAllResources: checked })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              When enabled, user can view all agents, proxies and domains
              regardless of ownership
            </p>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? t("common.saving")
                  : editingUser
                    ? t("common.update")
                    : t("common.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
