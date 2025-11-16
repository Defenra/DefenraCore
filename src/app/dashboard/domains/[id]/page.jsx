"use client";

import {
  IconArrowLeft,
  IconCode,
  IconDeviceFloppy,
  IconInfoCircle,
  IconMapPin,
  IconNetwork,
  IconShieldCheck,
  IconShieldLock,
  IconWorld,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import { DnsRecordsTab } from "@/components/domain-management/dns-records-tab";
import { GeoDnsTab } from "@/components/domain-management/geodns-tab";
import { LuaWafTab } from "@/components/domain-management/lua-waf-tab";
import { SslTab } from "@/components/domain-management/ssl-tab";
import { AntiDDoSTab } from "@/components/domain-management/anti-ddos-tab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgents } from "@/hooks/useAgents";
import { useDomain, useUpdateDomain } from "@/hooks/useDomains";

export default function DomainManagePage({ params }) {
  const _router = useRouter();
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
    return <Loading />;
  }

  if (!domain) {
    return (
      <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
        <div className="text-center py-8">Домен не найден</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <Link href="/dashboard/domains">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <IconArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <IconWorld className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-semibold">
                {domain.domain}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {domain.description || "Управление доменом"}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateDomain.isPending} className="h-10">
          <IconDeviceFloppy className="h-5 w-5 mr-2" />
          {updateDomain.isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dns" className="w-full">
        <div className="grid grid-cols-[200px_1fr] gap-6">
          {/* Sidebar Navigation */}
          <TabsList className="flex flex-col h-fit gap-2 bg-transparent p-0">
            <TabsTrigger 
              value="dns" 
              className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-accent"
            >
              <IconWorld className="h-5 w-5" />
              <span>DNS записи</span>
            </TabsTrigger>
            <TabsTrigger 
              value="geo" 
              className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-accent"
            >
              <IconMapPin className="h-5 w-5" />
              <span>География</span>
            </TabsTrigger>
            <TabsTrigger 
              value="proxy" 
              className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-accent"
            >
              <IconNetwork className="h-5 w-5" />
              <span>Прокси</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ssl" 
              className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-accent"
            >
              <IconShieldCheck className="h-5 w-5" />
              <span>SSL</span>
            </TabsTrigger>
            <TabsTrigger 
              value="lua" 
              className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-accent"
            >
              <IconCode className="h-5 w-5" />
              <span>WAF</span>
            </TabsTrigger>
            <TabsTrigger 
              value="antiddos" 
              className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-accent"
            >
              <IconShieldLock className="h-5 w-5" />
              <span>Anti-DDoS</span>
            </TabsTrigger>
          </TabsList>

          {/* Content Area */}
          <div className="min-w-0">
            {/* DNS Records Tab */}
            <TabsContent value="dns" className="mt-0">
              <DnsRecordsTab
                domain={domain}
                onUpdate={setDomain}
                expandedRecords={expandedRecords}
                onToggleExpand={toggleRecordExpand}
              />
            </TabsContent>

            {/* GeoDNS Tab */}
            <TabsContent value="geo" className="mt-0">
              <GeoDnsTab domain={domain} agents={agents} onUpdate={setDomain} />
            </TabsContent>

            {/* HTTP Proxy Tab */}
            <TabsContent value="proxy" className="mt-0">
              <div className="space-y-6">
                <div className="border border-border rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <IconInfoCircle className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                    <div className="space-y-3">
                      <p className="font-medium">
                        Как работает проксирование
                      </p>
                      <ul className="text-muted-foreground space-y-2 text-sm">
                        <li>• Клиент делает DNS запрос к вашему домену</li>
                        <li>
                          • Агенты (GeoDNS) определяют геолокацию клиента и отдают
                          IP ближайшего агента
                        </li>
                        <li>
                          • Трафик идёт на ближайший агент, который проксирует на
                          реальный IP из DNS записи
                        </li>
                        <li>• Применяется SSL и Lua middleware (если настроены)</li>
                      </ul>
                      <p className="text-sm text-muted-foreground mt-4">
                        💡 Целевой IP указывается в поле "Значение" DNS записи.
                        Агенты автоматически проксируют на него.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* SSL Tab */}
            <TabsContent value="ssl" className="mt-0">
              <SslTab domain={domain} onUpdate={setDomain} />
            </TabsContent>

            {/* Lua WAF Tab */}
            <TabsContent value="lua" className="mt-0">
              <LuaWafTab domain={domain} onUpdate={setDomain} />
            </TabsContent>

            {/* Anti-DDoS Tab */}
            <TabsContent value="antiddos" className="mt-0">
              <AntiDDoSTab domain={domain} onUpdate={setDomain} />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
