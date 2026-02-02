"use client";

import {
  IconActivity,
  IconChartBar,
  IconDashboard,
  IconFileText,
  IconLogout,
  IconMapPin,
  IconNetwork,
  IconRobot,
  IconSearch,
  IconShieldLock,
  IconUserCog,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { usePermissions } from "@/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";

const iconMap = {
  dashboard: IconDashboard,
  agents: IconRobot,
  proxies: IconNetwork,
  domains: IconWorld,
  geodnsMap: IconMapPin,
  ipCheck: IconSearch,
  clients: IconUsers,
  bans: IconShieldLock,
  statistics: IconChartBar,
  monitoring: IconActivity,
  logs: IconFileText,
  users: IconUserCog,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { hasPermission, isAdmin } = usePermissions();

  // Keyboard shortcut listener
  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigateTo = (url) => {
    setOpen(false);
    router.push(url);
  };

  // Navigation items with permissions
  const navItems = [
    {
      key: "dashboard",
      url: "/dashboard",
      permission: null,
      shortcut: "D",
    },
    {
      key: "agents",
      url: "/dashboard/agents",
      permission: "agents.read",
      shortcut: "A",
    },
    {
      key: "proxies",
      url: "/dashboard/proxies",
      permission: "proxies.read",
      shortcut: "P",
    },
    {
      key: "domains",
      url: "/dashboard/domains",
      permission: "domains.read",
      shortcut: "D",
    },
    {
      key: "geodnsMap",
      url: "/dashboard/geodns-map",
      permission: "domains.read",
      shortcut: "M",
    },
    {
      key: "ipCheck",
      url: "/dashboard/ip-check",
      permission: null,
      shortcut: "I",
    },
    {
      key: "clients",
      url: "/dashboard/clients",
      permission: null,
      shortcut: "C",
    },
    {
      key: "bans",
      url: "/dashboard/bans",
      permission: "bans.read",
      shortcut: "B",
    },
    {
      key: "statistics",
      url: "/dashboard/statistics",
      permission: null,
      shortcut: "S",
    },
    {
      key: "monitoring",
      url: "/dashboard/monitoring",
      permission: null,
      shortcut: "N",
    },
    {
      key: "logs",
      url: "/dashboard/logs",
      permission: null,
      shortcut: "L",
    },
    {
      key: "users",
      url: "/dashboard/users",
      permission: "users.read",
      shortcut: "U",
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={t("commandPalette.placeholder")}
        className="border-none focus:ring-0"
      />
      <CommandList>
        <CommandEmpty>{t("commandPalette.noResults")}</CommandEmpty>

        <CommandGroup heading={t("commandPalette.navigation")}>
          {filteredNavItems.map((item) => {
            const Icon = iconMap[item.key];
            return (
              <CommandItem
                key={item.key}
                onSelect={() => navigateTo(item.url)}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{t(`navigation.${item.key}`)}</span>
                <CommandShortcut>⌘{item.shortcut}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t("commandPalette.actions")}>
          <CommandItem
            onSelect={() => {
              setOpen(false);
              window.location.href = "/api/auth/signout";
            }}
            className="cursor-pointer text-destructive"
          >
            <IconLogout className="mr-2 h-4 w-4" />
            <span>{t("navigation.logout")}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Quick search button to show in the header
export function CommandPaletteButton() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-2"
      >
        <span className="text-muted-foreground">
          {t("navigation.quickSearch")}
        </span>
        <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 hidden sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandPaletteDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

// Dialog wrapper for external control
function CommandPaletteDialog({ open, onOpenChange }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();

  const navigateTo = (url) => {
    onOpenChange(false);
    router.push(url);
  };

  const navItems = [
    { key: "dashboard", url: "/dashboard", permission: null, shortcut: "D" },
    {
      key: "agents",
      url: "/dashboard/agents",
      permission: "agents.read",
      shortcut: "A",
    },
    {
      key: "proxies",
      url: "/dashboard/proxies",
      permission: "proxies.read",
      shortcut: "P",
    },
    {
      key: "domains",
      url: "/dashboard/domains",
      permission: "domains.read",
      shortcut: "D",
    },
    {
      key: "geodnsMap",
      url: "/dashboard/geodns-map",
      permission: "domains.read",
      shortcut: "M",
    },
    {
      key: "ipCheck",
      url: "/dashboard/ip-check",
      permission: null,
      shortcut: "I",
    },
    {
      key: "clients",
      url: "/dashboard/clients",
      permission: null,
      shortcut: "C",
    },
    {
      key: "bans",
      url: "/dashboard/bans",
      permission: "bans.read",
      shortcut: "B",
    },
    {
      key: "statistics",
      url: "/dashboard/statistics",
      permission: null,
      shortcut: "S",
    },
    {
      key: "monitoring",
      url: "/dashboard/monitoring",
      permission: null,
      shortcut: "N",
    },
    { key: "logs", url: "/dashboard/logs", permission: null, shortcut: "L" },
    {
      key: "users",
      url: "/dashboard/users",
      permission: "users.read",
      shortcut: "U",
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder={t("commandPalette.placeholder")}
        className="border-none focus:ring-0"
      />
      <CommandList>
        <CommandEmpty>{t("commandPalette.noResults")}</CommandEmpty>

        <CommandGroup heading={t("commandPalette.navigation")}>
          {filteredNavItems.map((item) => {
            const Icon = iconMap[item.key];
            return (
              <CommandItem
                key={item.key}
                onSelect={() => navigateTo(item.url)}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{t(`navigation.${item.key}`)}</span>
                <CommandShortcut>⌘{item.shortcut}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t("commandPalette.actions")}>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              window.location.href = "/api/auth/signout";
            }}
            className="cursor-pointer text-destructive"
          >
            <IconLogout className="mr-2 h-4 w-4" />
            <span>{t("navigation.logout")}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
