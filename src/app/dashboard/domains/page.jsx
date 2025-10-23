"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IconPlus, IconTrash, IconWorld, IconNetwork, IconShieldCheck, IconRefresh, IconSettings } from "@tabler/icons-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useDomains, useCreateDomain, useDeleteDomain } from "@/hooks/useDomains";

export default function DomainsPage() {
  const { data: domains = [], isLoading: loading, refetch, isFetching } = useDomains();
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

  const activeCount = domains.filter(d => d.isActive).length;
  const proxyEnabledCount = domains.filter(d => 
    d.dnsRecords?.some(r => r.httpProxyEnabled)
  ).length;
  const sslEnabledCount = domains.filter(d => d.httpProxy?.ssl?.enabled).length;

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Домены</h1>
          <p className="text-sm text-muted-foreground">
            Управление доменами, DNS записями и HTTP проксированием
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <IconRefresh className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Обновить
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <IconPlus className="h-4 w-4 mr-2" />
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
                    onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    placeholder="Описание домена"
                    value={newDomain.description}
                    onChange={(e) => setNewDomain({ ...newDomain, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleCreateDomain}>
                  Создать
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные домены</CardTitle>
            <IconWorld className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HTTP прокси</CardTitle>
            <IconNetwork className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{proxyEnabledCount}</div>
          </CardContent>
        </Card>
        <Card className="border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SSL защита</CardTitle>
            <IconShieldCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{sslEnabledCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Domains List */}
      <Card>
        <CardHeader>
          <CardTitle>Список доменов</CardTitle>
          <CardDescription>
            {domains.length} {domains.length === 1 ? "домен" : domains.length > 4 ? "доменов" : "домена"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
          ) : domains.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет доменов
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map((domain) => {
                const proxyCount = domain.dnsRecords?.filter(r => r.httpProxyEnabled)?.length || 0;
                return (
                  <div key={domain.id} className="group border rounded-lg hover:border-accent transition-all hover:shadow-md">
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <IconWorld className="h-5 w-5 text-blue-500" />
                            <h3 className="font-semibold text-lg">{domain.domain}</h3>
                            <Badge variant={domain.isActive ? "success" : "outline"}>
                              {domain.isActive ? "Активен" : "Неактивен"}
                            </Badge>
                            {proxyCount > 0 && (
                              <Badge variant="info">
                                <IconNetwork className="h-3 w-3 mr-1" />
                                {proxyCount} прокси
                              </Badge>
                            )}
                            {domain.httpProxy?.ssl?.enabled && (
                              <Badge variant="success">
                                <IconShieldCheck className="h-3 w-3 mr-1" />
                                SSL
                              </Badge>
                            )}
                          </div>
                          {domain.description && (
                            <p className="text-sm text-muted-foreground">{domain.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>DNS: {domain.dnsRecords?.length || 0} записей</span>
                            {proxyCount > 0 && (
                              <span>• {proxyCount} через прокси</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/dashboard/domains/${domain.id}`}>
                            <Button variant="outline" size="sm">
                              <IconSettings className="h-4 w-4 mr-2" />
                              Управление
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDomain(domain.id)}
                          >
                            <IconTrash className="h-4 w-4" />
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
