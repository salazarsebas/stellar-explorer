import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EntityContextMetric {
  label: string;
  value: string;
}

interface EntityContextCardProps {
  title: string;
  summary: string;
  detail?: string;
  metrics: EntityContextMetric[];
}

export function EntityContextCard({ title, summary, detail, metrics }: EntityContextCardProps) {
  return (
    <Card variant="gradient" className="border-0">
      <CardHeader className="gap-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="max-w-3xl text-sm leading-6">{summary}</CardDescription>
        {detail ? <p className="text-muted-foreground text-sm leading-6">{detail}</p> : null}
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-background/70 rounded-xl border px-4 py-3">
            <div className="text-muted-foreground text-xs tracking-[0.12em] uppercase">
              {metric.label}
            </div>
            <div className="mt-1 text-sm font-semibold">{metric.value}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
