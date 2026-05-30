"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive-soft text-destructive">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error broke this page. The team has been logged. You can retry below.
          </p>
        </div>
        {error.digest ? (
          <p className="font-mono text-xs text-muted-foreground">ref: {error.digest}</p>
        ) : null}
        <Button onClick={reset} variant="outline" className="w-full">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      </div>
    </div>
  );
}
