"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Copy, KeyRound, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractUuAppErrorMessage } from "@/lib/uu-error";
import { cn } from "@/lib/utils";
import { deviceTypeEnum, type DeviceType } from "@/lib/validation/device";

const COPIED_FEEDBACK_MS = 2000;

interface RegisterDeviceModalProps {
  onClose: () => void;
}

type RegisterPayload = { name: string; type: DeviceType; location: string };
type RegisterResult = { id: string; name: string; type: DeviceType; token: string };

async function registerDevice(payload: RegisterPayload): Promise<RegisterResult> {
  const body: Record<string, unknown> = {
    name: payload.name,
    type: payload.type,
  };
  if (payload.location) body.location = payload.location;

  const res = await fetch("/api/device/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = extractUuAppErrorMessage(data) ?? "Failed to register device.";
    throw new Error(message);
  }
  return (await res.json()) as RegisterResult;
}

export function RegisterDeviceModal({ onClose }: RegisterDeviceModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState<DeviceType>("iotNode");
  const [location, setLocation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [result, setResult] = useState<RegisterResult | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const register = useMutation({
    mutationFn: registerDevice,
    onSuccess: (data) => {
      toast.success("Device registered.");
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      setResult(data);
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  // ESC closes the dialog, except while submitting or while the token is being
  // displayed (we want the operator to take a deliberate "Done" action so they
  // do not lose the only chance to copy the token).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !register.isPending && !result) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, result, register.isPending]);

  // Clear copied-feedback timer on unmount to avoid setState on dead component.
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (register.isPending) return;
    setFormError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Device name is required.");
      return;
    }

    register.mutate({ name: trimmedName, type, location: location.trim() });
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.token);
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      toast.error("Clipboard is not available. Copy the token manually.");
    }
  }

  // The token reveal step locks dismissal: only the Done button (which calls
  // onClose explicitly) should close the modal once the token is on screen.
  const dismissLocked = register.isPending || result !== null;
  const titleId = "register-device-title";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget && !dismissLocked) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            {result ? "Device token" : "Register device"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={dismissLocked}
            aria-label="Close register device dialog"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {result ? (
          <div className="space-y-4 px-6 py-6">
            <div className="flex items-start gap-3 rounded-lg bg-warning-soft px-4 py-3">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-warning"
                aria-hidden="true"
              />
              <p className="text-sm text-warning">
                Copy this token now. It will not be shown again. Paste it into the device
                firmware configuration.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="register-device-token" className="text-sm font-medium">
                Bearer token for <span className="font-mono">{result.name}</span>
              </label>
              <div className="flex gap-2">
                <Input
                  id="register-device-token"
                  readOnly
                  value={result.token}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label={`Bearer token for ${result.name}`}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  aria-label={copied ? "Token copied" : "Copy token to clipboard"}
                >
                  {copied ? (
                    <Check className="text-success" aria-hidden="true" />
                  ) : (
                    <Copy aria-hidden="true" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The cloud only stores the token's SHA-256 hash. There is no way to recover
                it later.
              </p>
            </div>

            <Button className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
            <div className="space-y-1.5">
              <label htmlFor="device-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="device-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. demo-sensor-01"
                maxLength={120}
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="device-type" className="text-sm font-medium">
                Type
              </label>
              <select
                id="device-type"
                value={type}
                onChange={(e) => setType(deviceTypeEnum.parse(e.target.value))}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                  "transition-colors",
                )}
              >
                <option value="iotNode">IoT node</option>
                <option value="gateway">Gateway</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="device-location" className="text-sm font-medium">
                Location{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="device-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Server room B"
                maxLength={240}
              />
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-secondary/40 px-4 py-3">
              <KeyRound
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-xs text-muted-foreground">
                The cloud will generate a 256-bit bearer token and show it once. Paste it
                into the device firmware to authorize event uploads.
              </p>
            </div>

            {formError ? (
              <p
                role="alert"
                className="rounded-md bg-destructive-soft px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </p>
            ) : null}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={register.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={register.isPending}>
                {register.isPending ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Registering
                  </>
                ) : (
                  "Register"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
