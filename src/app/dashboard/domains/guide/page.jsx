"use client";

import {
  IconAlertCircle,
  IconArrowLeft,
  IconCheck,
  IconCopy,
  IconServer,
  IconWorld,
} from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DomainGuide() {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Скопировано в буфер обмена");
  };

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/dashboard/domains">
            <Button variant="ghost" size="sm" className="mb-2">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Назад к доменам
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Как добавить домен
          </h1>
          <p className="text-sm text-muted-foreground">
            Пошаговая инструкция по настройке домена для работы с Defenra
          </p>
        </div>
      </div>

      <Alert className="border-blue-500/50 bg-blue-500/10">
        <IconAlertCircle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-sm">
          Для работы домена необходимо настроить NS записи у вашего регистратора
          на наши DNS агенты
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <Card className="border-green-500/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 text-green-500 font-bold">
                1
              </div>
              <div>
                <CardTitle className="text-xl">
                  Создайте домен в Defenra
                </CardTitle>
                <CardDescription>
                  Добавьте домен через кнопку "Добавить домен"
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              На странице доменов нажмите кнопку{" "}
              <strong>"Добавить домен"</strong> и введите ваш домен (например,{" "}
              <code className="px-2 py-1 bg-muted rounded">example.com</code>).
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 font-bold">
                2
              </div>
              <div>
                <CardTitle className="text-xl">
                  Создайте поддомены для агентов
                </CardTitle>
                <CardDescription>
                  Настройте A-записи для DNS агентов
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Вам необходимо создать два поддомена для агентов. Например:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                <IconServer className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-semibold">
                      agent1.example.com
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("agent1.example.com")}
                      className="h-6 px-2"
                    >
                      <IconCopy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Первый DNS агент - создайте A-запись на IP адрес первого
                    агента
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                <IconServer className="h-5 w-5 text-purple-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-semibold">
                      agent2.example.com
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("agent2.example.com")}
                      className="h-6 px-2"
                    >
                      <IconCopy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Второй DNS агент - создайте A-запись на IP адрес второго
                    агента
                  </p>
                </div>
              </div>
            </div>

            <Alert className="border-amber-500/50 bg-amber-500/10">
              <IconAlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                IP адреса агентов вы можете узнать в разделе{" "}
                <Link
                  href="/dashboard/agents"
                  className="underline font-medium"
                >
                  Агенты
                </Link>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/20 text-purple-500 font-bold">
                3
              </div>
              <div>
                <CardTitle className="text-xl">
                  Настройте NS записи у регистратора
                </CardTitle>
                <CardDescription>
                  Делегируйте домен на наши DNS серверы
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Теперь в панели управления вашего регистратора доменов (там где вы
              купили домен) найдите настройки NS серверов и укажите:
            </p>

            <div className="space-y-2 p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  NS1
                </Badge>
                <code className="text-sm">agent1.example.com</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard("agent1.example.com")}
                  className="h-6 px-2 ml-auto"
                >
                  <IconCopy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  NS2
                </Badge>
                <code className="text-sm">agent2.example.com</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard("agent2.example.com")}
                  className="h-6 px-2 ml-auto"
                >
                  <IconCopy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <Alert className="border-amber-500/50 bg-amber-500/10">
              <IconAlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                Изменения NS записей могут занять от нескольких минут до 48
                часов из-за распространения DNS
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 text-green-500 font-bold">
                <IconCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Готово!</CardTitle>
                <CardDescription>
                  Домен настроен и готов к использованию
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              После того как DNS записи распространятся, вы сможете управлять
              DNS записями домена и настраивать HTTP прокси прямо из панели
              Defenra.
            </p>

            <div className="flex gap-2 pt-2">
              <Link href="/dashboard/domains" className="flex-1">
                <Button variant="default" className="w-full">
                  <IconWorld className="h-4 w-4 mr-2" />К списку доменов
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconAlertCircle className="h-5 w-5 text-blue-500" />
            Важные моменты
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <p className="text-muted-foreground">
                Используйте разные IP адреса для agent1 и agent2 для обеспечения
                отказоустойчивости
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <p className="text-muted-foreground">
                Убедитесь что порт 53 (DNS) открыт на ваших агентах
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <p className="text-muted-foreground">
                Проверить правильность настройки можно командой:{" "}
                <code className="px-2 py-1 bg-muted rounded text-xs">
                  nslookup example.com agent1.example.com
                </code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
