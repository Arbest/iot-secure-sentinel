import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-muted-foreground"
    >
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <span>Loading</span>
    </div>
  );
}
