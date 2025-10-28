"use client";

import {
  IconNetwork,
  IconPlus,
  IconQuestionMark,
  IconRefresh,
  IconSettings,
  IconShieldCheck,
  IconTrash,
  IconWorld,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateDomain,
  useDeleteDomain,
  useDomains,
} from "@/hooks/useDomains";

export default function DomainsPage() {
  const {
    data: domains = [],
    isLoading: loading,
    refetch,
    isFetching,
  } = useDomains();
  const createDomain = useCreateDomain();
  const deleteDomain = useDeleteDomain();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState({ domain: "", description: "" });

  const handleCreateDomain = async () => {
    if (!newDomain.domain) {
      toast.error("Введите домен");
      return;
    }

    try {
      await createDomain.mutateAsync(newDomain);
      toast.success("Домен успешно создан");
      setCreateDialogOpen(false);
      setNewDomain({ domain: "", description: "" });
    } catch (error) {
      toast.error(error.message || "Ошибка при создании домена");
    }
  };

  const handleDeleteDomain = async (id) => {
    if (!confirm("Вы уверены что хотите удалить этот домен?")) return;

    try {
      await deleteDomain.mutateAsync(id);
      toast.success("Домен удалён");
    } catch (error) {
      toast.error(error.message || "Ошибка при удалении домена");
    }
  };

  const activeCount = domains.filter((d) => d.isActive).length;
  const proxyEnabledCount = domains.filter((d) =>
    d.dnsRecords?.some((r) => r.httpProxyEnabled),
  ).length;
  const sslEnabledCount = domains.filter(
    (d) => d.httpProxy?.ssl?.enabled,
  ).length;

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Домены</h1>
          <p className="text-sm text-muted-foreground">
            {domains.length} доменов
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/domains/guide">
            <Button variant="outline" className="h-10">
              <IconQuestionMark className="h-5 w-5 mr-2" />
              Как добавить?
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-10 w-10"
          >
            <IconRefresh
              className={`h-5 w-5 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10">
                <IconPlus className="h-5 w-5 mr-2" />
                Добавить домен
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить домен</DialogTitle>
                <DialogDescription>
                  Создайте новый домен для управления DNS и HTTP прокси
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Домен</Label>
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={newDomain.domain}
                    onChange={(e) =>
                      setNewDomain({ ...newDomain, domain: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    placeholder="Описание домена"
                    value={newDomain.description}
                    onChange={(e) =>
                      setNewDomain({
                        ...newDomain,
                        description: e.target.value,
                      })
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
                <Button onClick={handleCreateDomain}>Создать</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Активные домены
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">
              {activeCount}
            </div>
            <p className="text-sm text-muted-foreground">Настроено и работает</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">HTTP прокси</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">
              {proxyEnabledCount}
            </div>
            <p className="text-sm text-muted-foreground">С проксированием</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">SSL защита</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">
              {sslEnabledCount}
            </div>
            <p className="text-sm text-muted-foreground">С сертификатами</p>
          </CardContent>
        </Card>
      </div>

      {/* Domains List */}
      <Card className="border-border">
        <CardHeader className="pb-6">
          <CardTitle className="text-lg font-medium">Список доменов</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Загрузка...
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-muted-foreground">Нет доменов</div>
              <Link href="/dashboard/domains/guide">
                <Button variant="outline">
                  <IconQuestionMark className="h-5 w-5 mr-2" />
                  Как добавить домен?
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((domain) => {
                const proxyCount =
                  domain.dnsRecords?.filter((r) => r.httpProxyEnabled)
                    ?.length || 0;
                return (
                  <div
                    key={domain.id}
                    className="border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <IconWorld className="h-6 w-6 text-muted-foreground mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="font-medium text-lg">
                                {domain.domain}
                              </h3>
                              <span className="text-xs text-muted-foreground">
                                {domain.isActive ? "Активен" : "Неактивен"}
                              </span>
                            </div>
                            {domain.description && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {domain.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                DNS: {domain.dnsRecords?.length || 0} записей
                              </span>
                              {proxyCount > 0 && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1.5">
                                    <IconNetwork className="h-4 w-4" />
                                    <span>{proxyCount} прокси</span>
                                  </div>
                                </>
                              )}
                              {domain.httpProxy?.ssl?.enabled && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1.5">
                                    <IconShieldCheck className="h-4 w-4" />
                                    <span>SSL</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Link href={`/dashboard/domains/${domain.id}`}>
                            <Button variant="outline" className="h-10">
                              <IconSettings className="h-5 w-5 mr-2" />
                              Управление
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDomain(domain.id)}
                            className="h-10 w-10"
                          >
                            <IconTrash className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
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
