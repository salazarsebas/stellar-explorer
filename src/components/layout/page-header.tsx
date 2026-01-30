"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { HashDisplay } from "@/components/common";
import { CopyButton } from "@/components/common/copy-button";
import { QrDialog } from "@/components/common/qr-dialog";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  hash?: string;
  backHref?: string;
  backLabel?: string;
  showQr?: boolean;
  showCopy?: boolean;
  copyValue?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  hash,
  backHref,
  backLabel,
  showQr = false,
  showCopy = true,
  copyValue,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  const t = useTranslations("common");
  const tQr = useTranslations("components.qrDialog");

  return (
    <div className={cn("mb-6", className)}>
      {/* Back link */}
      {backHref && (
        <Link
          href={backHref}
          className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft className="size-4" />
          {backLabel ?? t("back")}
        </Link>
      )}

      {/* Title row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {badge}
        </div>

        {/* Actions */}
        {(actions || showCopy || showQr) && (
          <div className="flex items-center gap-2">
            {showCopy && (copyValue || hash) && (
              <CopyButton value={copyValue || hash || ""} variant="text" label={t("copy")} />
            )}
            {showCopy && typeof window !== "undefined" && (copyValue || hash) && (
              <CopyButton
                value={`${window.location.origin}${window.location.pathname}`}
                variant="text"
                label={t("copyLink")}
                isLink
              />
            )}
            {showQr && hash && <QrDialog value={hash} title={tQr("accountQrCode")} />}
            {actions}
          </div>
        )}
      </div>

      {/* Subtitle / Hash */}
      {(subtitle || hash) && (
        <div className="text-muted-foreground mt-2 flex items-center gap-2">
          {hash && (
            <HashDisplay
              hash={hash}
              truncate={false}
              copyable={false}
              className="text-sm break-all"
            />
          )}
          {subtitle && !hash && <span className="text-sm">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
