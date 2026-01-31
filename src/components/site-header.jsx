"use client";

import {
  IconLanguage,
  IconShieldLock,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandPaletteButton } from "@/components/command-palette";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

const pageNames = {
  "/dashboard": "dashboard",
  "/dashboard/agents": "agents",
  "/dashboard/proxies": "proxies",
  "/dashboard/domains": "domains",
  "/dashboard/clients": "clients",
  "/dashboard/bans": "bans",
  "/dashboard/statistics": "statistics",
  "/dashboard/logs": "logs",
  "/dashboard/users": "users",
  "/dashboard/geodns-map": "geodnsMap",
  "/dashboard/profile": "profile",
};

export function SiteHeader({ className }) {
  const pathname = usePathname();
  const { t, locale, setLocale } = useTranslation();
  const { data: session } = useSession();

  const pageKey = pageNames[pathname] || "dashboard";
  const pageTitle = t(`navigation.${pageKey}`);

  const user = session?.user || {
    name: "User",
    email: "user@example.com",
    image: null,
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Left: Logo & Page Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <IconShieldLock className="h-5 w-5 text-primary" />
            </div>
            <span className="hidden text-lg font-semibold tracking-tight md:inline-block">
              Defenra
            </span>
          </div>

          <div className="hidden h-6 w-px bg-border md:block" />

          <h1 className="text-sm font-medium text-muted-foreground md:text-base">
            {pageTitle}
          </h1>
        </div>

        {/* Right: Actions & User */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Command Palette Trigger */}
          <CommandPaletteButton />

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <IconLanguage className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("common.language")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setLocale("en")}
                className={locale === "en" ? "bg-accent" : ""}
              >
                🇺🇸 English
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLocale("ru")}
                className={locale === "ru" ? "bg-accent" : ""}
              >
                🇷🇺 Русский
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-accent">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline-block">
                  {user.name}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/dashboard/profile">{t("navigation.profile")}</a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => (window.location.href = "/api/auth/signout")}
                className="text-destructive focus:text-destructive"
              >
                {t("navigation.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
