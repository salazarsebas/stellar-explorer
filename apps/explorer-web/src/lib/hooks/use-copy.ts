"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

export function useCopy() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string, label = "Copied to clipboard") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(label);

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      toast.error("Failed to copy");
      return false;
    }
  }, []);

  return { copy, copied };
}
