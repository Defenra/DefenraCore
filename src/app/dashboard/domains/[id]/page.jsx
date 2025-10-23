"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconArrowLeft, IconDeviceFloppy, IconWorld, IconMapPin, IconNetwork, IconInfoCircle } from "@tabler/icons-react";
import { toast } from "sonner";
import { DnsRecordsTab } from "@/components/domain-management/dns-records-tab";
import { GeoDnsTab } from "@/components/domain-management/geodns-tab";
import { LuaWafTab } from "@/components/domain-management/lua-waf-tab";
import { SslTab } from "@/components/domain-management/ssl-tab";
import { useDomain, useUpdateDomain } from "@/hooks/useDomains";
import { useAgents } from "@/hooks/useAgents";

export default function DomainManagePage({ params }) {
  const router = useRouter();
  const { id: domainId } = use(params);
  
  const { data: domainData, isLoading } = useDomain(domainId);
  const { data: agents = [] } = useAgents();
  const updateDomain = useUpdateDomain(domainId);
  
  const [domain, setDomain] = useState(domainData);
  const [expandedRecords, setExpandedRecords] = useState(new Set());
  
  // Update local state when data is loaded
  if (domainData && !domain) {
    setDomain(domainData);
  }

  const handleSave = async () => {
    try {
      await updateDomain.mutateAsync(domain);
      toast.success("Изменения сохранены");
    } catch (error) {
      toast.error(error.message || "Ошибка при сохранении");
    }
  };

  const toggleRecordExpand = (index) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRecords(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
        <div className="text-center py-8">Домен не найден</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/domains">
              <Button variant="ghost" size="sm">
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <IconWorld className="h-6 w-6 text-blue-500" />
                <h1 className="text-3xl font-bold tracking-tight">{domain.domain}</h1>
                <Badge variant={domain.isActive ? "success" : "outline"}>
                  {domain.isActive ? "Активен" : "Неактивен"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {domain.description || "Управление DNS записями и HTTP проксированием"}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateDomain.isPending}>
          <IconDeviceFloppy className="h-4 w-4 mr-2" />
          {updateDomain.isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dns" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="dns" className="flex items-center gap-2">
            <IconWorld className="h-4 w-4" />
            <span className="hidden sm:inline">DNS записи</span>
            <span className="sm:hidden">DNS</span>
          </TabsTrigger>
          <TabsTrigger value="geo" className="flex items-center gap-2">
            <IconMapPin className="h-4 w-4" />
            <span className="hidden sm:inline">География</span>
            <span className="sm:hidden">Geo</span>
          </TabsTrigger>
          <TabsTrigger value="proxy" className="flex items-center gap-2">
            <IconNetwork className="h-4 w-4" />
            <span className="hidden sm:inline">HTTP Прокси</span>
            <span className="sm:hidden">Proxy</span>
          </TabsTrigger>
          <TabsTrigger value="ssl" className="hidden lg:flex items-center gap-2">
            SSL
          </TabsTrigger>
          <TabsTrigger value="lua" className="hidden lg:flex items-center gap-2">
            Lua WAF
          </TabsTrigger>
        </TabsList>

        {/* DNS Records Tab */}
        <TabsContent value="dns" className="mt-6">
          <DnsRecordsTab
            domain={domain}
            onUpdate={setDomain}
            expandedRecords={expandedRecords}
            onToggleExpand={toggleRecordExpand}
          />
        </TabsContent>

        {/* GeoDNS Tab */}
        <TabsContent value="geo" className="mt-6">
          <GeoDnsTab
            domain={domain}
            agents={agents}
            onUpdate={setDomain}
          />
        </TabsContent>

        {/* HTTP Proxy Tab */}
        <TabsContent value="proxy" className="mt-6">
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-blue-500/5 border-blue-500/20">
              <div className="flex items-start gap-3">
                <IconInfoCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-foreground">Как работает проксирование</p>
                  <ul className="text-muted-foreground space-y-1.5 text-xs">
                    <li>• Клиент делает DNS запрос к вашему домену</li>
                    <li>• Агенты (GeoDNS) определяют геолокацию клиента и отдают IP ближайшего агента</li>
                    <li>• Трафик идёт на ближайший агент, который проксирует на реальный IP из DNS записи</li>
                    <li>• Применяется SSL и Lua middleware (если настроены)</li>
                  </ul>
                  <p className="text-xs text-muted-foreground/80 mt-3">
                    💡 Целевой IP указывается в поле "Значение" DNS записи. Агенты автоматически проксируют на него.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* SSL Tab */}
        <TabsContent value="ssl" className="mt-6">
          <SslTab domain={domain} onUpdate={setDomain} />
        </TabsContent>

        {/* Lua WAF Tab */}
        <TabsContent value="lua" className="mt-6">
          <LuaWafTab domain={domain} onUpdate={setDomain} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
