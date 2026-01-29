"use client";

import {
  IconChartBar,
  IconDashboard,
  IconFileText,
  IconMapPin,
  IconNetwork,
  IconRobot,
  IconShieldLock,
  IconUserCog,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePermissions } from "@/hooks/usePermissions";

const allNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
    permission: null,
  },
  {
    title: "Агенты",
    url: "/dashboard/agents",
    icon: IconRobot,
    permission: "agents.read",
  },
  {
    title: "Прокси",
    url: "/dashboard/proxies",
    icon: IconNetwork,
    permission: "proxies.read",
  },
  {
    title: "Домены",
    url: "/dashboard/domains",
    icon: IconWorld,
    permission: "domains.read",
  },
  {
    title: "Карта GeoDNS",
    url: "/dashboard/geodns-map",
    icon: IconMapPin,
    permission: "domains.read",
  },
  {
    title: "Клиенты",
    url: "/dashboard/clients",
    icon: IconUsers,
    permission: null,
  },
  {
    title: "Баны",
    url: "/dashboard/bans",
    icon: IconShieldLock,
    permission: "bans.read",
  },
  {
    title: "Статистика",
    url: "/dashboard/statistics",
    icon: IconChartBar,
    permission: null,
  },
  {
    title: "Логи",
    url: "/dashboard/logs",
    icon: IconFileText,
    permission: null,
  },
  {
    title: "Пользователи",
    url: "/dashboard/users",
    icon: IconUserCog,
    permission: "users.read",
  },
];

export function AppSidebar({ ...props }) {
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();

  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.image,
      }
    : {
        name: "User",
        email: "user@example.com",
        avatar: null,
      };

  const filteredNavItems = allNavItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard" className="flex items-center gap-2">
                <IconShieldLock className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">Defenra</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-border">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
