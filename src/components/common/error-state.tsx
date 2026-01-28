"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "Failed to load data. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn("border-destructive/50", className)}>
      <CardContent className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="bg-destructive/15 mb-4 rounded-full p-4">
          <AlertTriangle className="text-destructive size-8" />
        </div>
        <h3 className="text-foreground mb-1 font-medium">{title}</h3>
        <p className="text-muted-foreground mb-4 max-w-sm text-sm">{message}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-2 size-4" />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
