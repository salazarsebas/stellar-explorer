import { Header } from "./header";
import { Sidebar } from "./sidebar";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="bg-background grid h-screen grid-cols-1 md:grid-cols-[auto_1fr]">
      {/* Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Scrollable column: header (sticky) + content share the same scroll container */}
      <div className="overflow-x-hidden overflow-y-auto">
        <Header />
        <main>
          <div className="container mx-auto min-h-full max-w-7xl p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
