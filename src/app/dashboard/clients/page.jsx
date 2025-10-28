"use client";

import { IconSearch, IconUsers, IconWorld } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loading } from "@/components/loading";
import { Input } from "@/components/ui/input";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Загрузка данных из API
  const { data, isLoading, error } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await fetch("/api/clients");
      if (!response.ok) {
        throw new Error("Ошибка загрузки клиентов");
      }
      return response.json();
    },
    refetchInterval: 30000, // Обновлять каждые 30 секунд
  });

  const clients = data?.clients || [];

  const filteredClients = clients.filter(
    (client) =>
      client.ip.includes(searchQuery) ||
      client.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.agent?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400">Ошибка: {error.message}</p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalClients: 0,
    activeConnections: 0,
    uniqueCountries: 0,
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Клиенты</h1>
          <p className="text-sm text-muted-foreground">
            {stats.totalClients} подключенных клиентов
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Всего клиентов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">{stats.totalClients}</div>
            <p className="text-sm text-muted-foreground">Уникальных IP</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Активных соединений
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">
              {stats.activeConnections}
            </div>
            <p className="text-sm text-muted-foreground">Открытые сессии</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Стран
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">
              {stats.uniqueCountries}
            </div>
            <p className="text-sm text-muted-foreground">Географических локаций</p>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      <Card className="border-border">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">
              Список клиентов
            </CardTitle>
            <div className="relative w-64">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по IP, стране, агенту..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <IconUsers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Нет данных о клиентах</p>
              <p className="text-sm mt-2">
                Данные появятся после подключения клиентов к агентам
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="border border-border rounded-lg p-6 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <IconWorld className="h-6 w-6 text-muted-foreground mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-medium text-lg font-mono">
                            {client.ip}
                          </h3>
                          {client.city && client.country && (
                            <span className="text-xs text-muted-foreground">
                              {client.city}, {client.country}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Агент: {client.agent?.name || "Неизвестен"}</span>
                          <span>•</span>
                          <span>{client.connections} подключений</span>
                          <span>•</span>
                          <span>
                            Последний визит:{" "}
                            {new Date(client.lastSeen).toLocaleString("ru-RU")}
                          </span>
                        </div>
                        {client.userAgent && (
                          <p className="text-xs text-muted-foreground mt-2 truncate">
                            {client.userAgent}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Детали
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
