import { ShieldCheck, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Read-only display of a device's arm state. Visible to every role; the toggle
 * action that changes it is gated to OPERATOR/ADMIN in DeviceTable.
 */
export function ArmedBadge({ armed, className }: { armed: boolean; className?: string }) {
  const Icon = armed ? ShieldCheck : ShieldOff;
  return (
    <span
      className={cn(
        // min-w reserves room for the widest label ("Disarmed" + icon) so an arm/disarm
        // transition does not shrink the badge and reflow the table column.
        "inline-flex min-w-[5.5rem] items-center justify-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        armed
          ? "bg-success-soft text-success ring-success/30"
          : "bg-secondary text-muted-foreground ring-border",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {armed ? "Armed" : "Disarmed"}
    </span>
  );
}
