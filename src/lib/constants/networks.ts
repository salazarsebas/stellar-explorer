import type { NetworkConfig, NetworkKey } from "@/types";

export const NETWORKS: Record<NetworkKey, NetworkConfig> = {
  public: {
    name: "Public",
    horizonUrl: "https://horizon.stellar.org",
    rpcUrl: "https://soroban-rpc.mainnet.stellar.gateway.fm",
    passphrase: "Public Global Stellar Network ; September 2015",
  },
  testnet: {
    name: "Testnet",
    horizonUrl: "https://horizon-testnet.stellar.org",
    rpcUrl: "https://soroban-testnet.stellar.org",
    passphrase: "Test SDF Network ; September 2015",
  },
  futurenet: {
    name: "Futurenet",
    horizonUrl: "https://horizon-futurenet.stellar.org",
    rpcUrl: "https://rpc-futurenet.stellar.org",
    passphrase: "Test SDF Future Network ; October 2022",
  },
} as const;

export const DEFAULT_NETWORK: NetworkKey = "public";

export const NETWORK_COLORS: Record<NetworkKey, string> = {
  public: "bg-success text-success-foreground",
  testnet: "bg-warning text-warning-foreground",
  futurenet: "bg-primary text-primary-foreground",
};
