"use client";

import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "@/components/providers/query-provider";

export function Providers({ children }) {
  return (
    <SessionProvider>
      <QueryProvider>{children}</QueryProvider>
    </SessionProvider>
  );
}
