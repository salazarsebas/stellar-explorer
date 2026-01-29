"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { NetworkProvider } from "./network-provider";
import { ThemeProvider } from "./theme-provider";
import { DeveloperModeProvider } from "./developer-mode-provider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark">
      <QueryProvider>
        <NetworkProvider>
          <DeveloperModeProvider>
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
          </DeveloperModeProvider>
        </NetworkProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

export { useNetwork } from "./network-provider";
export { useTheme } from "./theme-provider";
export { useDeveloperMode } from "./developer-mode-provider";
