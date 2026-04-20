import { Horizon, rpc } from "@stellar/stellar-sdk";
import { NETWORKS } from "@/lib/constants";
import type { NetworkKey } from "@/types";

export interface StellarClients {
  horizon: Horizon.Server;
  rpc: rpc.Server;
}

const clientCache = new Map<NetworkKey, StellarClients>();

export function createStellarClient(network: NetworkKey): StellarClients {
  const cached = clientCache.get(network);
  if (cached) return cached;

  const config = NETWORKS[network];
  const clients: StellarClients = {
    horizon: new Horizon.Server(config.horizonUrl),
    rpc: new rpc.Server(config.rpcUrl),
  };

  clientCache.set(network, clients);
  return clients;
}

export function getHorizonClient(network: NetworkKey): Horizon.Server {
  return createStellarClient(network).horizon;
}

export function getRpcClient(network: NetworkKey): rpc.Server {
  return createStellarClient(network).rpc;
}
