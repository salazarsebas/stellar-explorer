"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  loading?: boolean;
  className?: string;
  headerRight?: ReactNode;
}

export function ChartWrapper({
  title,
  subtitle,
  icon: Icon,
  children,
  loading,
  className,
  headerRight,
}: ChartWrapperProps) {
  return (
    <Card variant="glass" className={cn("border-0", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="bg-primary/10 flex size-7 items-center justify-center rounded-lg">
              <Icon className="text-primary size-3.5" />
            </div>
          )}
          <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
          </div>
        </div>
        {headerRight}
      </CardHeader>
      <CardContent className="pt-0">{loading ? <ChartSkeleton /> : children}</CardContent>
    </Card>
  );
}

const SKELETON_HEIGHTS = [45, 72, 58, 85, 35, 68, 52, 78, 42, 65, 55, 82];

export function ChartSkeleton({ height = 140 }: { height?: number }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between gap-1" style={{ height }}>
        {SKELETON_HEIGHTS.map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  );
}
