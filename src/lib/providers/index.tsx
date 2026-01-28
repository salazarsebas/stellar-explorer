"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { NetworkProvider } from "./network-provider";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark">
      <QueryProvider>
        <NetworkProvider>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              },
            }}
          />
        </NetworkProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

export { useNetwork } from "./network-provider";
export { useTheme } from "./theme-provider";
