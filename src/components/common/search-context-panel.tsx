import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SearchContextPanelProps {
  description: string;
  highlights: string[];
  className?: string;
}

export function SearchContextPanel({
  description,
  highlights,
  className,
}: SearchContextPanelProps) {
  return (
    <section aria-label={description} className={className}>
      <Card variant="gradient" className="border-0 py-0">
        <CardContent className="grid gap-5 p-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:p-6">
          <p className="text-muted-foreground text-sm leading-6 md:text-base">{description}</p>

          <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
            {highlights.map((highlight) => (
              <li
                key={highlight}
                className={cn(
                  "bg-background/70 border-border/70 rounded-xl border px-3 py-2 text-sm font-medium",
                  "backdrop-blur-sm"
                )}
              >
                {highlight}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
