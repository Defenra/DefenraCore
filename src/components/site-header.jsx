"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const pageNames = {
  "/dashboard": "Dashboard",
  "/dashboard/agents": "Агенты",
  "/dashboard/proxies": "Прокси",
  "/dashboard/domains": "Домены",
  "/dashboard/profile": "Профиль",
};

export function SiteHeader() {
  const pathname = usePathname();
  const pageName = pageNames[pathname] || "Dashboard";

  return (
    <header className="flex h-12 md:h-14 shrink-0 items-center gap-2 border-b border-border">
      <div className="flex w-full items-center gap-2 px-3 md:px-6">
        <SidebarTrigger className="h-7 w-7" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm md:text-base font-medium">{pageName}</h1>
      </div>
    </header>
  );
}
