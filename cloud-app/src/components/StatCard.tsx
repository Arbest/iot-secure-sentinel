import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconMedallion } from "@/components/ui/IconMedallion";
import { TONE, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  subtitle,
  tone,
  icon,
  href,
  featured = false,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  tone: Tone;
  icon: LucideIcon;
  href?: string;
  /** Slightly larger value + a tinted ring. Used for the primary stat on a row. */
  featured?: boolean;
}) {
  const style = TONE[tone];
  const card = (
    <Card
      className={cn(
        "relative h-full overflow-hidden border-border/80 transition-colors duration-150",
        href &&
          "group-hover:border-primary/40 group-focus-visible:border-primary/40",
        featured && "ring-1 ring-inset ring-primary/15",
      )}
    >
      {featured ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r",
            style.bar,
          )}
        />
      ) : null}
      <CardHeader className="flex-row items-start justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <IconMedallion icon={icon} tone={tone} size={featured ? "md" : "sm"} />
      </CardHeader>
      <CardContent className="space-y-1">
        <p
          className={cn(
            "font-semibold tabular-nums",
            featured ? "text-4xl" : "text-3xl",
            style.value,
          )}
        >
          {value}
        </p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{subtitle}</span>
          {href ? (
            <ArrowUpRight
              aria-hidden="true"
              className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary group-focus-visible:text-primary"
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  if (!href) return card;
  return (
    <Link
      href={href}
      className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {card}
    </Link>
  );
}
