// Types for stellar.toml file structure
// Reference: https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md

export interface StellarTomlCurrency {
  code: string;
  issuer: string;
  image?: string;
  name?: string;
  desc?: string;
  status?: string;
  display_decimals?: number;
  conditions?: string;
  fixed_number?: number;
  max_number?: number;
  is_unlimited?: boolean;
  is_asset_anchored?: boolean;
  anchor_asset_type?: string;
  anchor_asset?: string;
  redemption_instructions?: string;
  regulated?: boolean;
  approval_server?: string;
  approval_criteria?: string;
}

export interface StellarTomlDocumentation {
  ORG_NAME?: string;
  ORG_DBA?: string;
  ORG_URL?: string;
  ORG_LOGO?: string;
  ORG_DESCRIPTION?: string;
  ORG_PHYSICAL_ADDRESS?: string;
  ORG_OFFICIAL_EMAIL?: string;
  ORG_SUPPORT_EMAIL?: string;
}

export interface StellarTomlData {
  CURRENCIES?: StellarTomlCurrency[];
  DOCUMENTATION?: StellarTomlDocumentation;
  NETWORK_PASSPHRASE?: string;
  FEDERATION_SERVER?: string;
  AUTH_SERVER?: string;
  TRANSFER_SERVER?: string;
  SIGNING_KEY?: string;
}

// Simplified metadata extracted from stellar.toml
export interface AssetMetadata {
  code: string;
  issuer: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  orgName?: string;
  orgLogo?: string;
}
