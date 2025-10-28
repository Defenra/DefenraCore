"use client";

import {
  IconAlertCircle,
  IconFileText,
  IconFilter,
  IconInfoCircle,
  IconRefresh,
  IconSearch,
  IconShieldX,
} from "@tabler/icons-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [logLevel, setLogLevel] = useState("all");
  const [selectedAgent, setSelectedAgent] = useState("all");

  // Загрузка данных из API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["logs", logLevel, selectedAgent, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (logLevel !== "all") params.append("level", logLevel);
      if (selectedAgent !== "all") params.append("agentId", selectedAgent);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Ошибка загрузки логов");
      }
      return response.json();
    },
    refetchInterval: 10000, // Обновлять каждые 10 секунд
  });

  const logs = data?.logs || [];
  const levelStats = data?.stats || { info: 0, warning: 0, error: 0 };

  const getLogIcon = (level) => {
    switch (level) {
      case "error":
        return <IconShieldX className="h-5 w-5 text-red-400" />;
      case "warning":
        return <IconAlertCircle className="h-5 w-5 text-yellow-400" />;
      default:
        return <IconInfoCircle className="h-5 w-5 text-blue-400" />;
    }
  };

  const getLevelStyle = (level) => {
    switch (level) {
      case "error":
        return "border-l-red-500/50 bg-red-500/5";
      case "warning":
        return "border-l-yellow-500/50 bg-yellow-500/5";
      default:
        return "border-l-blue-500/50 bg-blue-500/5";
    }
  };

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

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Логи</h1>
          <p className="text-sm text-muted-foreground">
            {data?.total || 0} записей в журнале
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => refetch()}
        >
          <IconRefresh className="h-5 w-5" />
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <IconFilter className="h-6 w-6 text-muted-foreground" />
            <CardTitle className="text-lg font-medium">Фильтры</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по логам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select value={logLevel} onValueChange={setLogLevel}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Уровень" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все уровни</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Агент" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все агенты</SelectItem>
                <SelectItem value="agent-eu-01">agent-eu-01</SelectItem>
                <SelectItem value="agent-us-01">agent-us-01</SelectItem>
                <SelectItem value="agent-asia-01">agent-asia-01</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="border-border">
        <CardHeader className="pb-6">
          <CardTitle className="text-lg font-medium">
            Журнал событий
          </CardTitle>
          <CardDescription>
            Реальное время событий с агентов
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <IconFileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Нет логов</p>
              <p className="text-sm mt-2">
                Логи появятся после начала работы агентов
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`border-l-4 rounded-lg p-4 ${getLevelStyle(log.level)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5">{getLogIcon(log.level)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(log.timestamp).toLocaleString("ru-RU")}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-background/50">
                          {log.agent?.name || "Неизвестный агент"}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded uppercase font-medium ${
                            log.level === "error"
                              ? "text-red-400"
                              : log.level === "warning"
                                ? "text-yellow-400"
                                : "text-blue-400"
                          }`}
                        >
                          {log.level}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">{log.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.details}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">{levelStats.info}</div>
            <p className="text-sm text-muted-foreground">Информационных</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">{levelStats.warning}</div>
            <p className="text-sm text-muted-foreground">Предупреждений</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">{levelStats.error}</div>
            <p className="text-sm text-muted-foreground">Ошибок</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
