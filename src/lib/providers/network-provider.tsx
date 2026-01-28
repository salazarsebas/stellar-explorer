"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { NetworkKey } from "@/types";
import { DEFAULT_NETWORK, NETWORKS } from "@/lib/constants";

interface NetworkContextValue {
  network: NetworkKey;
  setNetwork: (network: NetworkKey) => void;
  networkConfig: (typeof NETWORKS)[NetworkKey];
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

const STORAGE_KEY = "stellar-explorer-network";

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetworkState] = useState<NetworkKey>(DEFAULT_NETWORK);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (stored === "public" || stored === "testnet" || stored === "futurenet")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNetworkState(stored as NetworkKey);
    }
    setIsHydrated(true);
  }, []);

  const setNetwork = useCallback((newNetwork: NetworkKey) => {
    setNetworkState(newNetwork);
    localStorage.setItem(STORAGE_KEY, newNetwork);
  }, []);

  const value: NetworkContextValue = {
    network,
    setNetwork,
    networkConfig: NETWORKS[network],
  };

  // Prevent hydration mismatch by only rendering children after hydration
  if (!isHydrated) {
    return (
      <NetworkContext.Provider value={value}>
        <div className="bg-background min-h-screen" />
      </NetworkContext.Provider>
    );
  }

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}
