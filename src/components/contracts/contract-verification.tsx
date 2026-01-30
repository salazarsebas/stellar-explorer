"use client";

import { useTranslations } from "next-intl";
import { useContractDetails } from "@/lib/hooks";
import { useNetwork } from "@/lib/providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCompactNumber } from "@/lib/utils";
import {
  ShieldCheck,
  ShieldAlert,
  Github,
  ExternalLink,
  Loader2,
  Calendar,
  GitCommit,
  Activity,
  User,
  Hash,
} from "lucide-react";

interface ContractVerificationProps {
  contractId: string;
}

export function ContractVerification({ contractId }: ContractVerificationProps) {
  const t = useTranslations("contract");
  const { network } = useNetwork();
  const { data: details, isLoading } = useContractDetails(contractId);

  // Build Stellar Expert verification URL
  const verifyNowUrl = `https://stellar.expert/explorer/${network}/contract/validation`;

  if (isLoading) {
    return (
      <div className="bg-muted/30 rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
          <span className="text-muted-foreground text-sm">{t("checkingVerification")}</span>
        </div>
      </div>
    );
  }

  // Verified contract
  if (details?.isVerified) {
    return (
      <div className="bg-success/10 border-success/20 rounded-lg border p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="text-success mt-0.5 size-5 shrink-0" />
          <div className="min-w-0 flex-1 space-y-3">
            {/* Header */}
            <div>
              <p className="text-success text-sm font-medium">{t("verified")}</p>
              <p className="text-muted-foreground mt-1 text-xs">{t("verifiedDescription")}</p>
            </div>

            {/* Verification details */}
            {details.validation?.timestamp && (
              <>
                <Separator className="bg-success/20" />
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs font-medium">
                    {t("verificationDetails")}
                  </p>
                  <div className="grid gap-2 text-xs">
                    {/* Verification timestamp */}
                    <div className="flex items-center gap-2">
                      <Calendar className="text-muted-foreground size-3.5" />
                      <span className="text-muted-foreground">{t("verificationTimestamp")}:</span>
                      <span>
                        {new Date(details.validation.timestamp * 1000).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>

                    {/* Verification method */}
                    {details.validation.method && (
                      <div className="flex items-center gap-2">
                        <Activity className="text-muted-foreground size-3.5" />
                        <span className="text-muted-foreground">{t("verificationMethod")}:</span>
                        <Badge variant="secondary" className="h-5 text-[10px]">
                          {details.validation.method === "github-actions"
                            ? t("githubActions")
                            : details.validation.method}
                        </Badge>
                      </div>
                    )}

                    {/* Commit hash */}
                    {details.validation.commit && (
                      <div className="flex items-center gap-2">
                        <GitCommit className="text-muted-foreground size-3.5" />
                        <span className="text-muted-foreground">{t("viewCommit")}:</span>
                        <code className="font-mono">{details.validation.commit.slice(0, 7)}</code>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Contract stats */}
            {(details.invocations !== undefined || details.creator) && (
              <>
                <Separator className="bg-success/20" />
                <div className="grid gap-2 text-xs">
                  {details.creator && (
                    <div className="flex items-center gap-2">
                      <User className="text-muted-foreground size-3.5" />
                      <span className="text-muted-foreground">{t("creator")}:</span>
                      <code className="font-mono">
                        {details.creator.slice(0, 8)}...{details.creator.slice(-8)}
                      </code>
                    </div>
                  )}
                  {details.invocations !== undefined && (
                    <div className="flex items-center gap-2">
                      <Activity className="text-muted-foreground size-3.5" />
                      <span className="text-muted-foreground">{t("totalInvocations")}:</span>
                      <span>{formatCompactNumber(details.invocations)}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* WASM hash */}
            {details.wasmHash && (
              <>
                <Separator className="bg-success/20" />
                <div className="flex items-center gap-2 text-xs">
                  <Hash className="text-muted-foreground size-3.5" />
                  <span className="text-muted-foreground">{t("wasmHash")}:</span>
                  <code className="font-mono">
                    {details.wasmHash.slice(0, 8)}...{details.wasmHash.slice(-8)}
                  </code>
                </div>
              </>
            )}

            {/* Repository link */}
            {details.repository && (
              <a
                href={details.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                  <Github className="size-3.5" />
                  {t("viewRepository")}
                  <ExternalLink className="size-3" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Unverified contract
  return (
    <div className="bg-warning/10 border-warning/20 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="text-warning mt-0.5 size-5 shrink-0" />
        <div className="min-w-0 flex-1 space-y-3">
          {/* Header */}
          <div>
            <p className="text-warning text-sm font-medium">{t("unverified")}</p>
            <p className="text-muted-foreground mt-1 text-xs">{t("unverifiedDescription")}</p>
          </div>

          {/* Why verify section */}
          <Separator className="bg-warning/20" />
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium">{t("whyVerify")}</p>
            <p className="text-muted-foreground text-xs leading-relaxed">{t("verifyGuidance")}</p>
          </div>

          {/* Contract stats if available */}
          {(details?.invocations !== undefined || details?.creator) && (
            <>
              <Separator className="bg-warning/20" />
              <div className="grid gap-2 text-xs">
                {details?.creator && (
                  <div className="flex items-center gap-2">
                    <User className="text-muted-foreground size-3.5" />
                    <span className="text-muted-foreground">{t("creator")}:</span>
                    <code className="font-mono">
                      {details.creator.slice(0, 8)}...{details.creator.slice(-8)}
                    </code>
                  </div>
                )}
                {details?.invocations !== undefined && (
                  <div className="flex items-center gap-2">
                    <Activity className="text-muted-foreground size-3.5" />
                    <span className="text-muted-foreground">{t("totalInvocations")}:</span>
                    <span>{formatCompactNumber(details.invocations)}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <a href={verifyNowUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                <ShieldCheck className="size-3.5" />
                {t("verifyOnStellarExpert")}
                <ExternalLink className="size-3" />
              </Button>
            </a>
            <a
              href="https://developers.stellar.org/docs/build/guides/conventions/verify-contracts"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
                {t("learnToVerify")}
                <ExternalLink className="size-3" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
