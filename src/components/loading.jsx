"use client";

import { IconShieldLock } from "@tabler/icons-react";

export function Loading({ variant = "pulse" }) {
  const version = "0.1.0";

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-6">
        {/* Logo with animation */}
        <div className={variant === "pulse" ? "animate-pulse" : ""}>
          <div 
            className={`flex items-center gap-3 ${
              variant === "color" 
                ? "animate-[hue-rotate_3s_linear_infinite]" 
                : ""
            }`}
          >
            <IconShieldLock 
              className="h-16 w-16 text-foreground" 
              strokeWidth={1.5}
            />
            <div className="flex flex-col">
              <span className="text-4xl font-semibold tracking-tight">
                Defenra
              </span>
            </div>
          </div>
        </div>

        {/* Version */}
        <div className="text-sm text-muted-foreground">
          v{version}
        </div>

        {/* Loading dots */}
        <div className="flex gap-2">
          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
        </div>
      </div>
    </div>
  );
}
