import { Header } from "./header";
import { Sidebar } from "./sidebar";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="bg-background grid h-screen grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[auto_1fr]">
      {/* Sidebar - spans both rows */}
      <div className="row-span-2 hidden md:block">
        <Sidebar />
      </div>

      {/* Header - second column, first row */}
      <Header />

      {/* Main content area - second column, second row, scrollable */}
      <main className="overflow-x-hidden overflow-y-auto">
        <div className="container mx-auto min-h-full max-w-7xl p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
