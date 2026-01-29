"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDeveloperMode, useNetwork } from "@/lib/providers";
import { NETWORKS } from "@/lib/constants";
import {
  Code,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Terminal,
  Globe,
} from "lucide-react";

interface DeveloperPanelProps {
  xdrData?: {
    envelope?: string;
    result?: string;
  };
  additionalEndpoints?: Array<{
    label: string;
    url: string;
  }>;
  internalIds?: Array<{
    label: string;
    value: string | number;
  }>;
}

export function DeveloperPanel({ xdrData, additionalEndpoints, internalIds }: DeveloperPanelProps) {
  const t = useTranslations("developerMode");
  const { isDevMode, settings } = useDeveloperMode();
  const { network } = useNetwork();
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  if (!isDevMode) {
    return null;
  }

  const networkConfig = NETWORKS[network];

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const hasContent =
    (settings.showXdrRaw && xdrData && (xdrData.envelope || xdrData.result)) ||
    settings.showApiEndpoints ||
    (settings.showInternalIds && internalIds && internalIds.length > 0);

  if (!hasContent) {
    return null;
  }

  return (
    <Card className="border-chart-1/30 bg-chart-1/5 border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-chart-1 flex items-center gap-2 text-sm font-medium">
            <Code className="size-4" />
            <span>{t("title")}</span>
            <Badge variant="outline" className="border-chart-1/30 text-chart-1 text-[10px]">
              DEV
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="text-chart-1 hover:bg-chart-1/10 size-7"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          {/* API Endpoints */}
          {settings.showApiEndpoints && (
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                <Globe className="size-3.5" />
                {t("apiEndpoint")}
              </div>
              <div className="space-y-1.5">
                <div className="bg-muted/30 flex items-center justify-between rounded-md p-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-muted-foreground text-xs">{t("horizonUrl")}</span>
                    <p className="truncate font-mono text-xs">{networkConfig.horizonUrl}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => handleCopy(networkConfig.horizonUrl, "horizon")}
                    >
                      {copiedItem === "horizon" ? (
                        <Check className="size-3 text-green-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" className="size-6" asChild>
                      <a href={networkConfig.horizonUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-3" />
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/30 flex items-center justify-between rounded-md p-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-muted-foreground text-xs">{t("rpcUrl")}</span>
                    <p className="truncate font-mono text-xs">{networkConfig.rpcUrl}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => handleCopy(networkConfig.rpcUrl, "rpc")}
                    >
                      {copiedItem === "rpc" ? (
                        <Check className="size-3 text-green-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" className="size-6" asChild>
                      <a href={networkConfig.rpcUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-3" />
                      </a>
                    </Button>
                  </div>
                </div>

                {additionalEndpoints?.map((endpoint, index) => (
                  <div
                    key={index}
                    className="bg-muted/30 flex items-center justify-between rounded-md p-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-muted-foreground text-xs">{endpoint.label}</span>
                      <p className="truncate font-mono text-xs">{endpoint.url}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => handleCopy(endpoint.url, `endpoint-${index}`)}
                      >
                        {copiedItem === `endpoint-${index}` ? (
                          <Check className="size-3 text-green-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" className="size-6" asChild>
                        <a href={endpoint.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internal IDs */}
          {settings.showInternalIds && internalIds && internalIds.length > 0 && (
            <>
              {settings.showApiEndpoints && <Separator className="bg-chart-1/20" />}
              <div className="space-y-2">
                <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                  <Terminal className="size-3.5" />
                  Internal IDs
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {internalIds.map((item, index) => (
                    <div
                      key={index}
                      className="bg-muted/30 flex items-center justify-between rounded-md p-2"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-muted-foreground text-xs">{item.label}</span>
                        <p className="truncate font-mono text-xs">{item.value}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0"
                        onClick={() => handleCopy(String(item.value), `id-${index}`)}
                      >
                        {copiedItem === `id-${index}` ? (
                          <Check className="size-3 text-green-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* XDR Data */}
          {settings.showXdrRaw && xdrData && (xdrData.envelope || xdrData.result) && (
            <>
              {(settings.showApiEndpoints ||
                (settings.showInternalIds && internalIds && internalIds.length > 0)) && (
                <Separator className="bg-chart-1/20" />
              )}
              <div className="space-y-2">
                <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                  <Code className="size-3.5" />
                  {t("xdrData")}
                </div>

                {xdrData.envelope && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">{t("envelopeXdr")}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-chart-1 hover:bg-chart-1/10 h-6 gap-1.5 text-xs"
                        onClick={() => handleCopy(xdrData.envelope!, "envelope")}
                      >
                        {copiedItem === "envelope" ? (
                          <>
                            <Check className="size-3 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            {t("copyXdr")}
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="bg-muted/30 max-h-32 overflow-auto rounded-md p-2">
                      <pre className="font-mono text-[10px] break-all whitespace-pre-wrap">
                        {xdrData.envelope}
                      </pre>
                    </div>
                  </div>
                )}

                {xdrData.result && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">{t("resultXdr")}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-chart-1 hover:bg-chart-1/10 h-6 gap-1.5 text-xs"
                        onClick={() => handleCopy(xdrData.result!, "result")}
                      >
                        {copiedItem === "result" ? (
                          <>
                            <Check className="size-3 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            {t("copyXdr")}
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="bg-muted/30 max-h-32 overflow-auto rounded-md p-2">
                      <pre className="font-mono text-[10px] break-all whitespace-pre-wrap">
                        {xdrData.result}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
