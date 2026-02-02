"use client";

import {
  IconActivity,
  IconChartBar,
  IconDashboard,
  IconFileText,
  IconLogout,
  IconMapPin,
  IconMenu2,
  IconNetwork,
  IconRobot,
  IconSearch,
  IconShieldLock,
  IconUserCog,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePermissions } from "@/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

const mainNavItems = [
  {
    key: "dashboard",
    url: "/dashboard",
    icon: IconDashboard,
    permission: null,
  },
  {
    key: "agents",
    url: "/dashboard/agents",
    icon: IconRobot,
    permission: "agents.read",
  },
  {
    key: "proxies",
    url: "/dashboard/proxies",
    icon: IconNetwork,
    permission: "proxies.read",
  },
  {
    key: "domains",
    url: "/dashboard/domains",
    icon: IconWorld,
    permission: "domains.read",
  },
];

const secondaryNavItems = [
  {
    key: "monitoring",
    url: "/dashboard/monitoring",
    icon: IconActivity,
    permission: null,
  },
  {
    key: "geodnsMap",
    url: "/dashboard/geodns-map",
    icon: IconMapPin,
    permission: "domains.read",
  },
  {
    key: "ipCheck",
    url: "/dashboard/ip-check",
    icon: IconSearch,
    permission: null,
  },
  {
    key: "clients",
    url: "/dashboard/clients",
    icon: IconUsers,
    permission: null,
  },
  {
    key: "bans",
    url: "/dashboard/bans",
    icon: IconShieldLock,
    permission: "bans.read",
  },
  {
    key: "statistics",
    url: "/dashboard/statistics",
    icon: IconChartBar,
    permission: null,
  },
  { key: "logs", url: "/dashboard/logs", icon: IconFileText, permission: null },
  {
    key: "users",
    url: "/dashboard/users",
    icon: IconUserCog,
    permission: "users.read",
  },
];

export function FloatingDock() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const [moreOpen, setMoreOpen] = useState(false);

  const filteredMainItems = mainNavItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const filteredSecondaryItems = secondaryNavItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const isActive = (url) => {
    if (url === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(url);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl px-3 py-2 shadow-2xl shadow-black/20">
          {/* Main Navigation Items */}
          {filteredMainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.url);

            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.url}
                    className={cn(
                      "relative flex items-center justify-center h-11 w-11 rounded-xl transition-all duration-200",
                      active
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                    {active && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-medium">
                  {t(
                    `floatingDock.${item.key === "geodnsMap" ? "map" : item.key}`,
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* Divider */}
          <div className="h-8 w-px bg-border mx-1" />

          {/* More Menu (Dropdown) */}
          <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center justify-center h-11 w-11 rounded-xl transition-all duration-200",
                      moreOpen
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    )}
                  >
                    <IconMenu2 className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-medium">
                {t("floatingDock.more")}
              </TooltipContent>
            </Tooltip>

            <DropdownMenuContent
              side="top"
              align="center"
              className="w-56 mb-2"
              sideOffset={8}
            >
              {filteredSecondaryItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.url);

                return (
                  <DropdownMenuItem key={item.key} asChild>
                    <Link
                      href={item.url}
                      className={cn(
                        "flex items-center gap-3 cursor-pointer",
                        active && "bg-accent",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          active ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span className={cn(active && "font-medium")}>
                        {t(`navigation.${item.key}`)}
                      </span>
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => (window.location.href = "/api/auth/signout")}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <IconLogout className="h-4 w-4 mr-3" />
                {t("navigation.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}
