"use client";

import { cn } from "@/lib/utils";
import { FileQuestion, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: "search" | "file" | "error";
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const icons = {
  search: Search,
  file: FileQuestion,
  error: AlertCircle,
};

export function EmptyState({
  title,
  description,
  icon = "file",
  action,
  className,
}: EmptyStateProps) {
  const t = useTranslations("empty");
  const Icon = icons[icon];

  return (
    <div
      className={cn("flex flex-col items-center justify-center px-4 py-12 text-center", className)}
    >
      <div className="bg-muted mb-4 rounded-full p-4">
        <Icon className="text-muted-foreground size-8" />
      </div>
      <h3 className="text-foreground mb-1 font-medium">{title ?? t("noResults")}</h3>
      {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
      {action && (
        <Button variant="outline" onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
