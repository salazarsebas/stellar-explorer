export * from "./networks";

// Stellar-specific constants
export const STROOPS_PER_XLM = 10_000_000;
export const MIN_BALANCE_XLM = 1;
export const BASE_RESERVE_XLM = 0.5;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 200;

// Polling intervals (ms)
export const LIVE_LEDGER_POLL_INTERVAL = 5000;
export const TRANSACTION_POLL_INTERVAL = 10000;

// Cache times (ms)
export const STALE_TIME = 10_000;
export const GC_TIME = 5 * 60_000;

// UI constants
export const HASH_TRUNCATE_LENGTH = 8;
export const ADDRESS_TRUNCATE_LENGTH = 8;

// Operation type labels
export const OPERATION_LABELS: Record<string, string> = {
  create_account: "Create Account",
  payment: "Payment",
  path_payment_strict_receive: "Path Payment (Receive)",
  path_payment_strict_send: "Path Payment (Send)",
  manage_sell_offer: "Sell Offer",
  manage_buy_offer: "Buy Offer",
  create_passive_sell_offer: "Passive Sell Offer",
  set_options: "Set Options",
  change_trust: "Change Trust",
  allow_trust: "Allow Trust",
  account_merge: "Account Merge",
  inflation: "Inflation",
  manage_data: "Manage Data",
  bump_sequence: "Bump Sequence",
  create_claimable_balance: "Create Claimable Balance",
  claim_claimable_balance: "Claim Claimable Balance",
  begin_sponsoring_future_reserves: "Begin Sponsoring",
  end_sponsoring_future_reserves: "End Sponsoring",
  revoke_sponsorship: "Revoke Sponsorship",
  clawback: "Clawback",
  clawback_claimable_balance: "Clawback Claimable Balance",
  set_trust_line_flags: "Set Trust Line Flags",
  liquidity_pool_deposit: "LP Deposit",
  liquidity_pool_withdraw: "LP Withdraw",
  invoke_host_function: "Contract Invoke",
  extend_footprint_ttl: "Extend TTL",
  restore_footprint: "Restore Footprint",
};
