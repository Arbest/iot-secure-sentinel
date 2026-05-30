"use client";

import { useEffect, useState } from "react";
import { formatSecondsAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Live freshness indicator for polled data.
 *
 * Auto-stale: if data hasn't refreshed in 3x the expected interval, switches to warning tone
 * with a "Stale" label so the operator can't mistake cached values for live ones.
 */
export function PollIndicator({
  intervalSeconds,
  lastUpdated,
  isFetching = false,
  isError = false,
  className,
}: {
  intervalSeconds: number;
  lastUpdated?: number;
  isFetching?: boolean;
  isError?: boolean;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (lastUpdated == null) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const ageSeconds =
    lastUpdated != null && now != null ? (now - lastUpdated) / 1000 : null;
  const isStale = ageSeconds != null && ageSeconds > intervalSeconds * 3;
  const tone = isError || isStale ? "warning" : "ok";

  const label =
    ageSeconds != null
      ? isStale
        ? `Stale, ${formatSecondsAgo(ageSeconds).toLowerCase()}`
        : formatSecondsAgo(ageSeconds)
      : `Refreshes every ${intervalSeconds}s`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs tabular-nums",
        tone === "warning" ? "text-warning" : "text-muted-foreground",
        className,
      )}
    >
      <span className="relative inline-flex h-1.5 w-1.5">
        <span
          className={cn(
            "absolute inset-0 rounded-full",
            tone === "warning" ? "bg-warning" : "bg-success",
            isFetching ? "animate-pulse-soft" : "opacity-70",
          )}
        />
      </span>
      {label}
    </span>
  );
}
