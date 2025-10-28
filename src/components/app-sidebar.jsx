"use client";

import {
  IconChartBar,
  IconDashboard,
  IconFileText,
  IconMapPin,
  IconNetwork,
  IconRobot,
  IconShieldLock,
  IconUserCircle,
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

const navData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Агенты",
      url: "/dashboard/agents",
      icon: IconRobot,
    },
    {
      title: "Прокси",
      url: "/dashboard/proxies",
      icon: IconNetwork,
    },
    {
      title: "Домены",
      url: "/dashboard/domains",
      icon: IconWorld,
    },
    {
      title: "Карта GeoDNS",
      url: "/dashboard/geodns-map",
      icon: IconMapPin,
    },
    {
      title: "Клиенты",
      url: "/dashboard/clients",
      icon: IconUsers,
    },
    {
      title: "Статистика",
      url: "/dashboard/statistics",
      icon: IconChartBar,
    },
    {
      title: "Логи",
      url: "/dashboard/logs",
      icon: IconFileText,
    },
  ],
};

export function AppSidebar({ ...props }) {
  const { data: session } = useSession();

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
        <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter className="border-t border-border">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
