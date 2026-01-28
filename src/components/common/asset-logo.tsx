"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAssetMetadata } from "@/lib/hooks/use-asset-metadata";

// Stellar/XLM logo as inline SVG for native asset
const StellarLogoSvg = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full">
    <circle cx="50" cy="50" r="50" fill="currentColor" className="text-primary/20" />
    <path
      d="M73.8 35.8L69.6 38C65.4 40.2 60.6 41.4 55.7 41.4H25.8L23.5 43.7L24.9 44.4C30.5 47.2 36.8 48.6 43.2 48.6H74.2L76.5 46.3L75.1 45.6C74.7 45.4 74.2 45.2 73.8 45V35.8Z"
      fill="currentColor"
      className="text-primary"
    />
    <path
      d="M76.5 53.7L74.2 51.4H43.2C36.8 51.4 30.5 52.8 24.9 55.6L23.5 56.3L25.8 58.6H55.7C60.6 58.6 65.4 59.8 69.6 62L73.8 64.2V55C74.2 54.8 74.7 54.6 75.1 54.4L76.5 53.7Z"
      fill="currentColor"
      className="text-primary"
    />
  </svg>
);

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
        <StellarLogoSvg />
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
          className="object-cover"
          onError={() => setImageError(true)}
          unoptimized // Skip Next.js optimization for external images
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
