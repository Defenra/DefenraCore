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
import { useTranslation } from "@/hooks/useTranslation";
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
import { cn } from "@/lib/utils";

// Bento Card Component
function BentoCard({ children, className }) {
  return (
    <Card
      className={cn(
        "border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300",
        "hover:border-border hover:shadow-lg hover:shadow-primary/5",
        className,
      )}
    >
      {children}
    </Card>
  );
}

export default function DomainGuide() {
  const { t } = useTranslation();

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(t("guide.copied"));
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/dashboard/domains">
            <Button variant="ghost" size="sm" className="mb-2 px-0">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              {t("guide.backToDomains")}
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("guide.title")}
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            {t("guide.description")}
          </p>
        </div>
      </div>

      <Alert className="border-blue-500/50 bg-blue-500/10">
        <IconAlertCircle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-sm">
          {t("guide.nsRecordsAlert")}
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        {/* Step 1 */}
        <BentoCard className="border-green-500/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 text-green-500 font-bold text-lg">
                1
              </div>
              <div>
                <CardTitle className="text-xl">
                  {t("guide.step1.title")}
                </CardTitle>
                <CardDescription>
                  {t("guide.step1.description")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("guide.step1.content")}{" "}
              <code className="px-2 py-1 bg-muted rounded">example.com</code>).
            </p>
          </CardContent>
        </BentoCard>

        {/* Step 2 */}
        <BentoCard className="border-blue-500/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 font-bold text-lg">
                2
              </div>
              <div>
                <CardTitle className="text-xl">
                  {t("guide.step2.title")}
                </CardTitle>
                <CardDescription>
                  {t("guide.step2.description")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("guide.step2.content")}
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 flex-shrink-0">
                  <IconServer className="h-5 w-5 text-blue-500" />
                </div>
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
                    {t("guide.step2.agent1Description")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 flex-shrink-0">
                  <IconServer className="h-5 w-5 text-purple-500" />
                </div>
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
                    {t("guide.step2.agent2Description")}
                  </p>
                </div>
              </div>
            </div>

            <Alert className="border-amber-500/50 bg-amber-500/10">
              <IconAlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                {t("guide.step2.agentIpAlert")}{" "}
                <Link
                  href="/dashboard/agents"
                  className="underline font-medium"
                >
                  {t("guide.step2.agentsLink")}
                </Link>
              </AlertDescription>
            </Alert>
          </CardContent>
        </BentoCard>

        {/* Step 3 */}
        <BentoCard className="border-purple-500/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/20 text-purple-500 font-bold text-lg">
                3
              </div>
              <div>
                <CardTitle className="text-xl">
                  {t("guide.step3.title")}
                </CardTitle>
                <CardDescription>
                  {t("guide.step3.description")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("guide.step3.content")}
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
                {t("guide.step3.dnsPropagationWarning")}
              </AlertDescription>
            </Alert>
          </CardContent>
        </BentoCard>

        {/* Step 4 - Done */}
        <BentoCard className="border-green-500/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 text-green-500">
                <IconCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {t("guide.step4.title")}
                </CardTitle>
                <CardDescription>
                  {t("guide.step4.description")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("guide.step4.content")}
            </p>

            <div className="flex gap-2 pt-2">
              <Link href="/dashboard/domains" className="flex-1 sm:flex-none">
                <Button className="w-full sm:w-auto">
                  <IconWorld className="h-4 w-4 mr-2" />
                  {t("guide.step4.button")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </BentoCard>
      </div>

      {/* Important Notes */}
      <BentoCard className="border-blue-500/20 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconAlertCircle className="h-5 w-5 text-blue-500" />
            {t("guide.notes.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <p className="text-muted-foreground">{t("guide.notes.note1")}</p>
            </div>
            <div className="flex gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <p className="text-muted-foreground">{t("guide.notes.note2")}</p>
            </div>
            <div className="flex gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <p className="text-muted-foreground">
                {t("guide.notes.note3")}{" "}
                <code className="px-2 py-1 bg-muted rounded text-xs">
                  nslookup example.com agent1.example.com
                </code>
              </p>
            </div>
          </div>
        </CardContent>
      </BentoCard>
    </div>
  );
}
