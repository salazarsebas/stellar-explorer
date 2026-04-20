import type { ComponentType } from "react";
import { PaymentRenderer } from "./renderers/payment";
import { CreateAccountRenderer } from "./renderers/create-account";
import { PathPaymentRenderer } from "./renderers/path-payment";
import { ManageOfferRenderer } from "./renderers/manage-offer";
import { SetOptionsRenderer } from "./renderers/set-options";
import { ChangeTrustRenderer, AllowTrustRenderer } from "./renderers/change-trust";
import { AccountMergeRenderer } from "./renderers/account-merge";
import { ManageDataRenderer } from "./renderers/manage-data";
import { BumpSequenceRenderer } from "./renderers/bump-sequence";
import {
  CreateClaimableBalanceRenderer,
  ClaimClaimableBalanceRenderer,
} from "./renderers/claimable-balance";
import {
  BeginSponsoringRenderer,
  EndSponsoringRenderer,
  RevokeSponsorshipRenderer,
} from "./renderers/sponsorship";
import { ClawbackRenderer, ClawbackClaimableBalanceRenderer } from "./renderers/clawback";
import { TrustLineFlagsRenderer } from "./renderers/trust-line-flags";
import {
  LiquidityPoolDepositRenderer,
  LiquidityPoolWithdrawRenderer,
} from "./renderers/liquidity-pool";
import {
  InvokeHostFunctionRenderer,
  ExtendFootprintTtlRenderer,
  RestoreFootprintRenderer,
} from "./renderers/soroban";
import { FallbackRenderer } from "./renderers/fallback";

type RendererProps = { operation: Record<string, unknown> };

const RENDERERS: Record<string, ComponentType<RendererProps>> = {
  payment: PaymentRenderer,
  create_account: CreateAccountRenderer,
  path_payment_strict_receive: PathPaymentRenderer,
  path_payment_strict_send: PathPaymentRenderer,
  manage_sell_offer: ManageOfferRenderer,
  manage_buy_offer: ManageOfferRenderer,
  create_passive_sell_offer: ManageOfferRenderer,
  set_options: SetOptionsRenderer,
  change_trust: ChangeTrustRenderer,
  allow_trust: AllowTrustRenderer,
  account_merge: AccountMergeRenderer,
  manage_data: ManageDataRenderer,
  bump_sequence: BumpSequenceRenderer,
  create_claimable_balance: CreateClaimableBalanceRenderer,
  claim_claimable_balance: ClaimClaimableBalanceRenderer,
  begin_sponsoring_future_reserves: BeginSponsoringRenderer,
  end_sponsoring_future_reserves: EndSponsoringRenderer,
  revoke_sponsorship: RevokeSponsorshipRenderer,
  clawback: ClawbackRenderer,
  clawback_claimable_balance: ClawbackClaimableBalanceRenderer,
  set_trust_line_flags: TrustLineFlagsRenderer,
  liquidity_pool_deposit: LiquidityPoolDepositRenderer,
  liquidity_pool_withdraw: LiquidityPoolWithdrawRenderer,
  invoke_host_function: InvokeHostFunctionRenderer,
  extend_footprint_ttl: ExtendFootprintTtlRenderer,
  restore_footprint: RestoreFootprintRenderer,
  inflation: FallbackRenderer,
};

interface OperationDetailsProps {
  operation: Record<string, unknown> & { type: string };
}

export function OperationDetails({ operation }: OperationDetailsProps) {
  const Renderer = RENDERERS[operation.type] || FallbackRenderer;
  return <Renderer operation={operation} />;
}
