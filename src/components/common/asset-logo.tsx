"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAssetMetadata } from "@/lib/hooks/use-asset-metadata";

// XLM logo path in public folder
const XLM_LOGO_PATH = "/logo_xlm.png";

// Blur placeholder SVG as base64 data URL
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iIzMzMzMzMyIvPjwvc3ZnPg==";

// Generate a deterministic color based on asset code
function getAssetColor(code: string): string {
  const colors = [
    "bg-chart-1/20 text-chart-1",
    "bg-chart-2/20 text-chart-2",
    "bg-chart-3/20 text-chart-3",
    "bg-chart-4/20 text-chart-4",
    "bg-primary/20 text-primary",
    "bg-success/20 text-success",
  ];

  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

interface AssetLogoProps {
  code: string;
  issuer?: string;
  tomlUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallback?: boolean;
}

const sizeMap = {
  sm: "size-6",
  md: "size-10",
  lg: "size-14",
  xl: "size-20",
};

const fontSizeMap = {
  sm: "text-[10px]",
  md: "text-sm",
  lg: "text-lg",
  xl: "text-2xl",
};

export function AssetLogo({ code, issuer, tomlUrl, size = "md", className }: AssetLogoProps) {
  const [imageError, setImageError] = useState(false);

  // Check if this is native XLM
  const isNative = !issuer || issuer === "native" || code.toUpperCase() === "XLM";

  // Fetch metadata for non-native assets
  const { data: metadata, isLoading } = useAssetMetadata(
    isNative ? undefined : code,
    isNative ? undefined : issuer,
    isNative ? undefined : tomlUrl
  );

  const sizeClass = sizeMap[size];
  const fontClass = fontSizeMap[size];
  const colorClass = getAssetColor(code);

  // Native XLM - show Stellar logo
  if (isNative) {
    return (
      <div className={cn("relative overflow-hidden rounded-full", sizeClass, className)}>
        <Image src={XLM_LOGO_PATH} alt="XLM logo" fill className="object-cover" />
      </div>
    );
  }

  // Has valid image URL and no error
  const imageUrl = metadata?.imageUrl || metadata?.orgLogo;
  const showImage = imageUrl && !imageError;

  if (showImage) {
    return (
      <div
        className={cn("bg-muted/30 relative overflow-hidden rounded-full", sizeClass, className)}
      >
        <Image
          src={imageUrl}
          alt={`${code} logo`}
          fill
          loading="lazy"
          sizes="(max-width: 640px) 24px, (max-width: 768px) 40px, 56px"
          className="object-cover"
          onError={() => setImageError(true)}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
      </div>
    );
  }

  // Fallback - show initial in colored circle
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full font-bold",
        sizeClass,
        colorClass,
        isLoading && "animate-pulse",
        className
      )}
    >
      <span className={fontClass}>{code.slice(0, 2).toUpperCase()}</span>
    </div>
  );
}

// Skeleton version for loading states
export function AssetLogoSkeleton({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClass = sizeMap[size];

  return <div className={cn("bg-muted/50 animate-pulse rounded-full", sizeClass, className)} />;
}
