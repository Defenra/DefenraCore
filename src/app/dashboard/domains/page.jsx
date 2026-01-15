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
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:gap-8 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold mb-1 md:mb-2">
            Домены
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            {domains.length} доменов
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <Link href="/dashboard/domains/guide">
            <Button variant="outline" className="h-9 md:h-10">
              <IconQuestionMark className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              <span className="text-sm md:text-base">Как добавить?</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 w-9 md:h-10 md:w-10"
          >
            <IconRefresh
              className={`h-4 w-4 md:h-5 md:w-5 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 md:h-10">
                <IconPlus className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                <span className="text-sm md:text-base">Добавить домен</span>
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
      <div className="grid gap-4 sm:grid-cols-3 md:gap-6">
        <Card className="border-border">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="text-xs md:text-sm text-muted-foreground font-medium">
              Активные домены
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2">
              {activeCount}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Настроено и работает
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="text-xs md:text-sm text-muted-foreground font-medium">
              HTTP прокси
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2">
              {proxyEnabledCount}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              С проксированием
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="text-xs md:text-sm text-muted-foreground font-medium">
              SSL защита
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2">
              {sslEnabledCount}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              С сертификатами
            </p>
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
            <div className="space-y-3 md:space-y-4">
              {domains.map((domain) => {
                const proxyCount =
                  domain.dnsRecords?.filter((r) => r.httpProxyEnabled)
                    ?.length || 0;
                return (
                  <div
                    key={domain.id}
                    className="border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                          <IconWorld className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground mt-0.5 md:mt-1 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-3">
                              <h3 className="font-medium text-base md:text-lg break-all">
                                {domain.domain}
                              </h3>
                              <span className="text-xs text-muted-foreground">
                                {domain.isActive ? "Активен" : "Неактивен"}
                              </span>
                            </div>
                            {domain.description && (
                              <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
                                {domain.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                              <span>
                                DNS: {domain.dnsRecords?.length || 0} записей
                              </span>
                              {proxyCount > 0 && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <div className="flex items-center gap-1.5">
                                    <IconNetwork className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                    <span>{proxyCount} прокси</span>
                                  </div>
                                </>
                              )}
                              {domain.httpProxy?.ssl?.enabled && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <div className="flex items-center gap-1.5">
                                    <IconShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                    <span>SSL</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 sm:ml-4">
                          <Link
                            href={`/dashboard/domains/${domain.id}`}
                            className="flex-1 sm:flex-none"
                          >
                            <Button
                              variant="outline"
                              className="h-9 md:h-10 w-full sm:w-auto"
                            >
                              <IconSettings className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                              <span className="text-sm md:text-base">
                                Управление
                              </span>
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDomain(domain.id)}
                            className="h-9 w-9 md:h-10 md:w-10"
                          >
                            <IconTrash className="h-4 w-4 md:h-5 md:w-5" />
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
