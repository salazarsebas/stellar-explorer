export function FallbackRenderer({ operation: op }: { operation: Record<string, unknown> }) {
  return (
    <div className="text-muted-foreground text-sm">{(op.type as string).replace(/_/g, " ")}</div>
  );
}
