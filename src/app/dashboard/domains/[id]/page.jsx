"use client";

import {
  IconArrowLeft,
  IconCheck,
  IconCopy,
  IconDeviceFloppy,
  IconExternalLink,
  IconGlobe,
  IconInfoCircle,
  IconMapPin,
  IconNetwork,
  IconShield,
  IconShieldCheck,
  IconWorld,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import { DnsRecordsTable } from "@/components/domain-management/dns-records-table";
import { AntiDDoSTab } from "@/components/domain-management/anti-ddos-tab";
import { AnycastRoutingTab } from "@/components/domain-management/anycast-routing-tab";
import { GeoDnsTab } from "@/components/domain-management/geodns-tab";
import { LuaWafTab } from "@/components/domain-management/lua-waf-tab";
import { PageRulesTab } from "@/components/domain-management/page-rules-tab";
import { SslTab } from "@/components/domain-management/ssl-tab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/useTranslation";
import { useAgents } from "@/hooks/useAgents";
import { useDomain, useUpdateDomain } from "@/hooks/useDomains";
import { cn } from "@/lib/utils";

// Modern Card
function ModernCard({ children, className }) {
  return (
    <Card
      className={cn(
        "border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden",
        className
      )}
    >
      {children}
    </Card>
  );
}

// Domain Status Badge
function DomainStatusBadge({ isActive, proxied, sslEnabled }) {
  if (!isActive) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Inactive
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className="bg-emerald-500/10 text-emerald-600 border-0">
        <IconCheck className="h-3 w-3 mr-1" />
        Active
      </Badge>
      {proxied && (
        <Badge className="bg-blue-500/10 text-blue-600 border-0">
          <IconNetwork className="h-3 w-3 mr-1" />
          Proxied
        </Badge>
      )}
      {sslEnabled && (
        <Badge className="bg-purple-500/10 text-purple-600 border-0">
          <IconShieldCheck className="h-3 w-3 mr-1" />
          SSL
        </Badge>
      )}
    </div>
  );
}

export default function DomainManagePage({ params }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { id: domainId } = use(params);

  const { data: domainData, isLoading } = useDomain(domainId);
  const { data: agents = [] } = useAgents();
  const updateDomain = useUpdateDomain(domainId);

  const [domain, setDomain] = useState(domainData);
  const [activeTab, setActiveTab] = useState("dns");

  // Update local state when data is loaded
  if (domainData && !domain) {
    setDomain(domainData);
  }

  const handleSave = async () => {
    try {
      await updateDomain.mutateAsync(domain);
      toast.success(t("domains.saveSuccess"));
    } catch (error) {
      toast.error(error.message || t("domains.saveError"));
    }
  };

  const handleUpdateDomain = (updatedDomain) => {
    setDomain(updatedDomain);
  };

  const copyDomain = () => {
    navigator.clipboard.writeText(domain.domain);
    toast.success("Domain copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <IconInfoCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-mutedforeground">{t("domains.notFound")}</p>
          <Link href="/dashboard/domains">
            <Button variant="outline" className="mt-4">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              {t("domains.backToList")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const proxiedCount = domain.dnsRecords?.filter((r) => r.httpProxyEnabled).length || 0;
  const sslEnabled = domain.httpProxy?.ssl?.enabled;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/domains">
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
              <IconArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">{domain.domain}</h1>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyDomain}>
                <IconCopy className="h-4 w-4" />
              </Button>
            </div>
            <DomainStatusBadge
              isActive={domain.isActive}
              proxied={proxiedCount > 0}
              sslEnabled={sslEnabled}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(`https://${domain.domain}`, "_blank")}>
            <IconExternalLink className="h-4 w-4 mr-2" />
            Visit
          </Button>
          <Button size="sm" onClick={handleSave}>
            <IconDeviceFloppy className="h-4 w-4 mr-2" />
            {t("common.save")}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <ModernCard>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <IconGlobe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{domain.dnsRecords?.length || 0}</p>
              <p className="text-xs text-muted-foreground">DNS Records</p>
            </div>
          </CardContent>
        </ModernCard>
        <ModernCard>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconNetwork className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{proxiedCount}</p>
              <p className="text-xs text-muted-foreground">Proxied</p>
            </div>
          </CardContent>
        </ModernCard>
        <ModernCard>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <IconShieldCheck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sslEnabled ? "On" : "Off"}</p>
              <p className="text-xs text-muted-foreground">SSL</p>
            </div>
          </CardContent>
        </ModernCard>
        <ModernCard>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <IconMapPin className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{domain.geoDnsConfig?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Geo Zones</p>
            </div>
          </CardContent>
        </ModernCard>
      </div>

      {/* Tabs - 7 useful tabs, Proxy removed as it's configured per DNS record */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 h-auto">
          <TabsTrigger value="dns" className="gap-2">
            <IconGlobe className="h-4 w-4 hidden sm:inline" />
            DNS
          </TabsTrigger>
          <TabsTrigger value="geo" className="gap-2">
            <IconMapPin className="h-4 w-4 hidden sm:inline" />
            GeoDNS
          </TabsTrigger>
          <TabsTrigger value="ssl" className="gap-2">
            <IconShield className="h-4 w-4 hidden sm:inline" />
            SSL
          </TabsTrigger>
          <TabsTrigger value="waf" className="gap-2">
            <IconShieldCheck className="h-4 w-4 hidden sm:inline" />
            WAF
          </TabsTrigger>
          <TabsTrigger value="antiddos" className="gap-2">
            <IconShield className="h-4 w-4 hidden sm:inline" />
            DDoS
          </TabsTrigger>
          <TabsTrigger value="anycast" className="gap-2">
            <IconWorld className="h-4 w-4 hidden sm:inline" />
            Anycast
          </TabsTrigger>
          <TabsTrigger value="pagerules" className="gap-2">
            <IconInfoCircle className="h-4 w-4 hidden sm:inline" />
            Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dns" className="space-y-4">
          <ModernCard>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <IconGlobe className="h-5 w-5" />
                DNS Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DnsRecordsTable domain={domain} onUpdate={handleUpdateDomain} />
            </CardContent>
          </ModernCard>
        </TabsContent>

        <TabsContent value="geo">
          <GeoDnsTab
            domain={domain}
            agents={agents}
            onUpdate={handleUpdateDomain}
          />
        </TabsContent>

        <TabsContent value="ssl">
          <SslTab domain={domain} onUpdate={handleUpdateDomain} />
        </TabsContent>

        <TabsContent value="waf">
          <LuaWafTab domain={domain} onUpdate={handleUpdateDomain} />
        </TabsContent>

        <TabsContent value="antiddos">
          <AntiDDoSTab domain={domain} onUpdate={handleUpdateDomain} />
        </TabsContent>

        <TabsContent value="anycast">
          <AnycastRoutingTab domain={domain} onUpdate={handleUpdateDomain} />
        </TabsContent>

        <TabsContent value="pagerules">
          <PageRulesTab domain={domain} onUpdate={handleUpdateDomain} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
