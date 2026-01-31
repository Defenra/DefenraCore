"use client";

import { FloatingDock } from "@/components/floating-dock";
import { SiteHeader } from "@/components/site-header";
import { CommandPalette } from "@/components/command-palette";
import { cn } from "@/lib/utils";

/**
 * Dashboard Layout
 * Features: Floating Dock navigation, Command Palette (Cmd+K), Site Header
 */
export default function DashboardLayout({ children }) {
  return (
    <div className={cn("relative min-h-screen bg-background")}>
      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* Site Header with navigation and user menu */}
      <SiteHeader />

      {/* Main Content Area - Bento Grid pages */}
      <main
        className={cn(
          "flex-1",
          "pb-24 pt-4 md:pt-6 lg:pt-8",
          "px-4 md:px-6 lg:px-8",
        )}
      >
        {children}
      </main>

      {/* Floating Navigation Dock - Fixed bottom center */}
      <FloatingDock />
    </div>
  );
}
