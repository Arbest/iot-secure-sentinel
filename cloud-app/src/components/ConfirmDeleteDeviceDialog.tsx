"use client";

import { useEffect } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteDeviceDialogProps {
  deviceName: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteDeviceDialog({
  deviceName,
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmDeleteDeviceDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, isLoading]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-device-title"
      aria-describedby="delete-device-description"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2
            id="delete-device-title"
            className="text-lg font-semibold text-foreground flex items-center gap-2"
          >
            <Trash2 className="h-5 w-5 text-destructive" aria-hidden="true" />
            Remove device
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Cancel delete"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 px-6 py-6">
          <p id="delete-device-description" className="text-sm text-foreground">
            Remove <span className="font-mono font-semibold">{deviceName}</span>? The device
            will stop authenticating immediately. Past events and alarms remain in history.
          </p>
          <p className="text-xs text-muted-foreground">
            To restore the device, register it again with the same name and bearer token.
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Removing
                </>
              ) : (
                <>
                  <Trash2 aria-hidden="true" />
                  Remove
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
