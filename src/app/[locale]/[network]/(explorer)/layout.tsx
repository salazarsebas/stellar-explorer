import { AppShell } from "@/components/layout";
import type { ReactNode } from "react";

export default function ExplorerLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
