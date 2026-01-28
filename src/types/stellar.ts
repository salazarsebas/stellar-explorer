// Extended types for Stellar API responses that may not be fully typed in the SDK

export interface StellarAsset {
  asset_type: "credit_alphanum4" | "credit_alphanum12";
  asset_code: string;
  asset_issuer: string;
  paging_token: string;
  amount: string;
  num_accounts: number;
  num_claimable_balances?: number;
  num_liquidity_pools?: number;
  num_contracts?: number;
  claimable_balances_amount?: string;
  liquidity_pools_amount?: string;
  contracts_amount?: string;
  accounts?: {
    authorized: number;
    authorized_to_maintain_liabilities: number;
    unauthorized: number;
  };
  balances?: {
    authorized: string;
    authorized_to_maintain_liabilities: string;
    unauthorized: string;
  };
  flags: {
    auth_required: boolean;
    auth_revocable: boolean;
    auth_immutable: boolean;
    auth_clawback_enabled: boolean;
  };
  _links?: {
    toml?: { href: string };
  };
}
