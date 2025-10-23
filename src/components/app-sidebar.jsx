"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import {
  IconDashboard,
  IconUserCircle,
  IconShieldLock,
  IconRobot,
  IconNetwork,
  IconWorld,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

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
      title: "Профиль",
      url: "/dashboard/profile",
      icon: IconUserCircle,
    },
  ],
}

export function AppSidebar({
  ...props
}) {
  const { data: session } = useSession()

  const user = session?.user ? {
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image,
  } : {
    name: "User",
    email: "user@example.com",
    avatar: null,
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/dashboard">
                <IconShieldLock className="!size-5" />
                <span className="text-base font-semibold">Defenra</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
