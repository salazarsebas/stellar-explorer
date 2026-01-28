"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("text-muted-foreground mb-6 flex items-center gap-1.5 text-sm", className)}
    >
      <Link
        href="/"
        className="hover:text-foreground flex items-center rounded p-1 transition-colors hover:bg-white/5"
      >
        <Home className="size-4" />
        <span className="sr-only">Home</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <Fragment key={item.href}>
            <ChevronRight className="size-3.5 opacity-40" />
            {isLast ? (
              <span className="text-foreground max-w-[200px] truncate font-medium">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-foreground max-w-[150px] truncate underline-offset-4 transition-colors hover:underline"
              >
                {item.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
