"use client";

import {
  IconExternalLink,
  IconGlobe,
  IconNetwork,
  IconPlus,
  IconQuestionMark,
  IconRefresh,
  IconSettings,
  IconShieldCheck,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateDomain,
  useDeleteDomain,
  useDomains,
} from "@/hooks/useDomains";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

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
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </div>
          <div className={cn("p-3 rounded-xl bg-primary/5", colorClasses[color])}>
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

function DomainRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border/40">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-8 w-28" />
    </div>
  );
}

export default function DomainsPage() {
  const { t } = useTranslation();
  const { data: domains = [], isLoading, refetch, isFetching } = useDomains();
  const createDomain = useCreateDomain();
  const deleteDomain = useDeleteDomain();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState({ domain: "", description: "" });

  const handleCreateDomain = async () => {
    if (!newDomain.domain) {
      toast.error(t("domains.errors.domainRequired"));
      return;
    }

    try {
      await createDomain.mutateAsync(newDomain);
      toast.success(t("domains.created"));
      setCreateDialogOpen(false);
      setNewDomain({ domain: "", description: "" });
    } catch (error) {
      toast.error(error.message || t("domains.errors.createFailed"));
    }
  };

  const handleDeleteDomain = async (id) => {
    if (!confirm(t("domains.confirmDelete"))) return;
    try {
      await deleteDomain.mutateAsync(id);
      toast.success(t("domains.deleted"));
    } catch (error) {
      toast.error(error.message || t("domains.errors.deleteFailed"));
    }
  };

  const activeCount = domains.filter((d) => d.isActive).length;
  const proxyEnabledCount = domains.filter((d) =>
    d.dnsRecords?.some((r) => r.httpProxyEnabled)
  ).length;
  const sslEnabledCount = domains.filter((d) => d.httpProxy?.ssl?.enabled).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("domains.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("domains.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/domains/guide">
            <Button variant="outline" size="sm" className="h-9">
              <IconQuestionMark className="h-4 w-4 mr-2" />
              {t("domains.howToAdd")}
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="h-9">
            <IconRefresh className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
            {t("common.refresh")}
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9">
                <IconPlus className="h-4 w-4 mr-2" />
                {t("domains.addDomain")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("domains.addDomain")}</DialogTitle>
                <DialogDescription>{t("domains.addDescription")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t("domains.form.domain")}</Label>
                  <Input
                    placeholder="example.com"
                    value={newDomain.domain}
                    onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("domains.form.description")}</Label>
                  <Textarea
                    placeholder={t("domains.form.descriptionPlaceholder")}
                    value={newDomain.description}
                    onChange={(e) => setNewDomain({ ...newDomain, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={handleCreateDomain}>{t("common.create")}</Button>
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
            title={t("domains.stats.active")}
            value={activeCount}
            subtext={t("domains.stats.activeDesc")}
            icon={IconGlobe}
            color="success"
          />
          <StatCard
            title={t("domains.stats.proxy")}
            value={proxyEnabledCount}
            subtext={t("domains.stats.proxyDesc")}
            icon={IconNetwork}
            color="primary"
          />
          <StatCard
            title={t("domains.stats.ssl")}
            value={sslEnabledCount}
            subtext={t("domains.stats.sslDesc")}
            icon={IconShieldCheck}
            color="warning"
          />
        </div>
      )}

      {/* Domain List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("domains.listTitle")}</h2>
          <span className="text-sm text-muted-foreground">
            {domains.length} {domains.length === 1 ? t("domains.single") : t("domains.multiple")}
          </span>
        </div>

        {isLoading ? (
          <ModernCard className="divide-y divide-border/40">
            {[...Array(5)].map((_, i) => (
              <DomainRowSkeleton key={i} />
            ))}
          </ModernCard>
        ) : domains.length === 0 ? (
          <ModernCard className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <IconGlobe className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("domains.noDomains")}</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                {t("domains.noDomainsDesc")}
              </p>
              <div className="flex gap-3">
                <Link href="/dashboard/domains/guide">
                  <Button variant="outline">
                    <IconQuestionMark className="h-4 w-4 mr-2" />
                    {t("domains.howToAdd")}
                  </Button>
                </Link>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <IconPlus className="h-4 w-4 mr-2" />
                  {t("domains.addDomain")}
                </Button>
              </div>
            </div>
          </ModernCard>
        ) : (
          <div className="space-y-3">
            {domains.map((domain) => {
              const proxyCount = domain.dnsRecords?.filter((r) => r.httpProxyEnabled)?.length || 0;
              return (
                <ModernCard key={domain.id} className="group">
                  <div className="flex items-center gap-4 p-4">
                    {/* Icon */}
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <IconGlobe className="h-5 w-5 text-primary" />
                    </div>

                    {/* Domain Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold truncate text-lg">{domain.domain}</h3>
                        {domain.isActive ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {domain.description && (
                        <p className="text-sm text-muted-foreground truncate">{domain.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{domain.dnsRecords?.length || 0} DNS records</span>
                        {proxyCount > 0 && (
                          <span className="flex items-center gap-1">
                            <IconNetwork className="h-3 w-3" />
                            {proxyCount} proxy
                          </span>
                        )}
                        {domain.httpProxy?.ssl?.enabled && (
                          <span className="flex items-center gap-1">
                            <IconShieldCheck className="h-3 w-3" />
                            SSL
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/domains/${domain.id}`}>
                        <Button variant="outline" size="sm" className="h-8">
                          <IconSettings className="h-4 w-4 mr-2" />
                          {t("common.manage")}
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteDomain(domain.id)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </ModernCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
