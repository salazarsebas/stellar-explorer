"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface DeveloperModeSettings {
  showXdrRaw: boolean;
  showApiEndpoints: boolean;
  showInternalIds: boolean;
}

interface DeveloperModeContextValue {
  isDevMode: boolean;
  toggleDevMode: () => void;
  settings: DeveloperModeSettings;
  updateSettings: (settings: Partial<DeveloperModeSettings>) => void;
}

const DeveloperModeContext = createContext<DeveloperModeContextValue | null>(null);

const STORAGE_KEY = "stellar-explorer-dev-mode";
const SETTINGS_KEY = "stellar-explorer-dev-settings";

const defaultSettings: DeveloperModeSettings = {
  showXdrRaw: true,
  showApiEndpoints: true,
  showInternalIds: true,
};

export function DeveloperModeProvider({ children }: { children: ReactNode }) {
  const [isDevMode, setIsDevMode] = useState(false);
  const [settings, setSettings] = useState<DeveloperModeSettings>(defaultSettings);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    // Use microtask to avoid synchronous setState in effect
    queueMicrotask(() => {
      const storedMode = localStorage.getItem(STORAGE_KEY);
      if (storedMode === "true") {
        setIsDevMode(true);
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

  const toggleDevMode = useCallback(() => {
    setIsDevMode((prev) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<DeveloperModeSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value: DeveloperModeContextValue = {
    isDevMode,
    toggleDevMode,
    settings,
    updateSettings,
  };

  // Wait for hydration
  if (!isHydrated) {
    return <DeveloperModeContext.Provider value={value}>{children}</DeveloperModeContext.Provider>;
  }

  return <DeveloperModeContext.Provider value={value}>{children}</DeveloperModeContext.Provider>;
}

export function useDeveloperMode() {
  const context = useContext(DeveloperModeContext);
  if (!context) {
    throw new Error("useDeveloperMode must be used within a DeveloperModeProvider");
  }
  return context;
}
