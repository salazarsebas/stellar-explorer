"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface AnalyticsModeSettings {
  showStatistics: boolean;
  showTrendlines: boolean;
  enableDataExport: boolean;
  chartDensity: "compact" | "normal" | "expanded";
  refreshInterval: number; // in seconds, 0 = manual only
}

interface AnalyticsModeContextValue {
  isAnalyticsMode: boolean;
  toggleAnalyticsMode: () => void;
  settings: AnalyticsModeSettings;
  updateSettings: (settings: Partial<AnalyticsModeSettings>) => void;
}

const AnalyticsModeContext = createContext<AnalyticsModeContextValue | null>(null);

const STORAGE_KEY = "stellar-explorer-analytics-mode";
const SETTINGS_KEY = "stellar-explorer-analytics-settings";

const defaultSettings: AnalyticsModeSettings = {
  showStatistics: true,
  showTrendlines: true,
  enableDataExport: true,
  chartDensity: "normal",
  refreshInterval: 30,
};

export function AnalyticsModeProvider({ children }: { children: ReactNode }) {
  const [isAnalyticsMode, setIsAnalyticsMode] = useState(false);
  const [settings, setSettings] = useState<AnalyticsModeSettings>(defaultSettings);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    queueMicrotask(() => {
      const storedMode = localStorage.getItem(STORAGE_KEY);
      if (storedMode === "true") {
        setIsAnalyticsMode(true);
      }

      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) {
        try {
          const parsed = JSON.parse(storedSettings);
          setSettings({ ...defaultSettings, ...parsed });
        } catch {
          // Ignore parse errors
        }
      }

      setIsHydrated(true);
    });
  }, []);

  const toggleAnalyticsMode = useCallback(() => {
    setIsAnalyticsMode((prev) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AnalyticsModeSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value: AnalyticsModeContextValue = {
    isAnalyticsMode,
    toggleAnalyticsMode,
    settings,
    updateSettings,
  };

  // Wait for hydration
  if (!isHydrated) {
    return <AnalyticsModeContext.Provider value={value}>{children}</AnalyticsModeContext.Provider>;
  }

  return <AnalyticsModeContext.Provider value={value}>{children}</AnalyticsModeContext.Provider>;
}

export function useAnalyticsMode() {
  const context = useContext(AnalyticsModeContext);
  if (!context) {
    throw new Error("useAnalyticsMode must be used within an AnalyticsModeProvider");
  }
  return context;
}
