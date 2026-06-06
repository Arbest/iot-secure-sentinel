"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BatteryLow,
  Cpu,
  Flame,
  Plus,
  Router,
  ServerCrash,
  ShieldCheck,
  ShieldOff,
  Thermometer,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ArmedBadge } from "@/components/ArmedBadge";
import { ConfirmDeleteDeviceDialog } from "@/components/ConfirmDeleteDeviceDialog";
import { DevicesSkeleton } from "@/components/DevicesSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { PollIndicator } from "@/components/PollIndicator";
import { RegisterDeviceModal } from "@/components/RegisterDeviceModal";
import { RelativeTime } from "@/components/RelativeTime";
import { StatusDot } from "@/components/StatusDot";
import { Button } from "@/components/ui/button";
import { IconMedallion } from "@/components/ui/IconMedallion";
import { ThermalCameraModal } from "@/components/ThermalCameraModal";
import { cn } from "@/lib/utils";
import { extractUuAppErrorMessage } from "@/lib/uu-error";
import { THRESHOLDS } from "@/services/alarm-classifier";
import type { DeviceListItem } from "@/types/device";

const POLL_INTERVAL_SECONDS = 10;

const NO_VALUE = "-";

async function fetchDevices(): Promise<DeviceListItem[]> {
  const res = await fetch("/api/device/list", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load devices");
  const data = (await res.json()) as { items: DeviceListItem[] };
  return data.items;
}

async function deleteDevice(deviceId: string): Promise<void> {
  const res = await fetch("/api/device/delete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ deviceId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = extractUuAppErrorMessage(body) ?? "Failed to remove device.";
    throw new Error(message);
  }
}

type SetArmedInput = { deviceId: string; armed: boolean };

async function setArmedDevice({ deviceId, armed }: SetArmedInput): Promise<void> {
  const res = await fetch("/api/device/set-armed", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ deviceId, armed }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = extractUuAppErrorMessage(body) ?? "Failed to update device.";
    throw new Error(message);
  }
}

export function DeviceTable({ canManageDevices }: { canManageDevices: boolean }) {
  const queryClient = useQueryClient();
  const [selectedDevice, setSelectedDevice] = useState<DeviceListItem | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<DeviceListItem | null>(null);

  const query = useQuery({
    queryKey: ["devices"],
    queryFn: fetchDevices,
    refetchInterval: POLL_INTERVAL_SECONDS * 1000,
  });

  const remove = useMutation({
    mutationFn: deleteDevice,
    onSuccess: () => {
      toast.success("Device removed.");
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      setDeleteCandidate(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const setArmed = useMutation({
    mutationFn: setArmedDevice,
    onSuccess: (_data, variables) => {
      toast.success(variables.armed ? "Device armed." : "Device disarmed.");
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const items = query.data ?? [];
  const activeDeviceForCamera = selectedDevice ? items.find(d => d.id === selectedDevice.id) : null;

  if (query.isLoading) return <DevicesSkeleton />;
  if (query.isError) {
    return (
      <EmptyState
        icon={ServerCrash}
        tone="destructive"
        title="Cannot reach the device list"
        description="Check the gateway and cloud connectivity, then refresh."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground tabular-nums">
          {items.length} {items.length === 1 ? "device" : "devices"} registered
        </span>
        <div className="flex items-center gap-3">
          <PollIndicator
            intervalSeconds={POLL_INTERVAL_SECONDS}
            lastUpdated={query.dataUpdatedAt}
            isFetching={query.isFetching}
            isError={query.isError}
          />
          {canManageDevices && (
            <Button size="sm" onClick={() => setShowRegister(true)}>
              <Plus aria-hidden="true" />
              Register device
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="No devices registered yet"
          description={
            canManageDevices
              ? "Register a device with the button above to start receiving its events."
              : "No devices have been registered yet. Ask an operator or admin to add one."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          {/*
            Per-column widths sum to ~1320px. Without them the table flexes every
            column to natural content width, which collapses "iris-gateway-prod"
            into a three-line wrap and makes the leading icon look undersized.
            Explicit widths reserve room for the widest expected content per
            column so a single device row stays one line.
          */}
          <table className="w-full min-w-[1320px] text-sm">
            <thead className="border-b border-border bg-secondary/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="w-[260px] px-6 py-3">Device</th>
                <th scope="col" className="w-[120px] px-6 py-3">Status</th>
                <th scope="col" className="w-[130px] px-6 py-3">Armed</th>
                <th scope="col" className="w-[150px] px-6 py-3">Location</th>
                <th scope="col" className="w-[170px] px-6 py-3">Temperature</th>
                <th scope="col" className="w-[110px] px-6 py-3">Battery</th>
                <th scope="col" className="w-[140px] px-6 py-3">Firmware</th>
                <th scope="col" className="w-44 px-6 py-3">Last seen</th>
                <th scope="col" className="w-[200px] px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((device) => {
                const Icon = device.type === "gateway" ? Router : Cpu;
                const lowBattery =
                  device.batteryVoltage !== null && device.batteryVoltage <= THRESHOLDS.batteryWarn;
                const temperatureWarning =
                  device.temperatureC !== null &&
                  (device.temperatureC >= THRESHOLDS.tempWarnHigh ||
                    device.temperatureC <= THRESHOLDS.tempWarnLow);
                // Scope the in-flight state to this row so toggling one device
                // does not disable every other row's Arm button.
                const isArming =
                  setArmed.isPending && setArmed.variables?.deviceId === device.id;
                return (
                  <tr
                    key={device.id}
                    className="border-t border-border transition-colors first:border-t-0 hover:bg-secondary/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <IconMedallion icon={Icon} tone="primary" size="md" />
                        {/* min-w-0 lets the truncating child shrink within the flex parent;
                            without it the inner div keeps its natural width and overflows. */}
                        <div className="min-w-0">
                          <div className="truncate font-medium" title={device.name}>
                            {device.name}
                          </div>
                          <div className="text-xs capitalize text-muted-foreground">
                            {device.type === "iotNode" ? "IoT node" : "Gateway"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusDot status={device.status} />
                    </td>
                    <td className="px-6 py-4">
                      <ArmedBadge armed={device.armed} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                      {device.location ?? NO_VALUE}
                    </td>
                    <td className="px-6 py-4 tabular-nums">
                      {device.temperatureC !== null || device.infraGrid ? (
                        <div className="flex flex-col gap-1">
                          {device.temperatureC !== null ? (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1",
                                temperatureWarning ? "text-warning" : "text-foreground",
                              )}
                            >
                              <Thermometer className="h-4 w-4" aria-hidden="true" />
                              {device.temperatureC.toFixed(1)} C
                            </span>
                          ) : null}
                          {device.infraGrid ? (
                            <button
                              type="button"
                              onClick={() => setSelectedDevice(device)}
                              aria-label={`Open thermal camera for ${device.name}`}
                              aria-haspopup="dialog"
                              className="inline-flex items-center gap-1 rounded border border-border bg-secondary/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-max"
                            >
                              <Flame className="h-3 w-3 text-warning" aria-hidden="true" />
                              Thermal
                            </button>
                          ) : null}
                          {device.temperatureAt || device.infraGridAt ? (
                            <span className="text-xs text-muted-foreground">
                              <RelativeTime date={(device.temperatureAt ?? device.infraGridAt) as string} />
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{NO_VALUE}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 tabular-nums">
                      {device.batteryVoltage !== null ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1",
                            lowBattery ? "text-warning" : "text-foreground",
                          )}
                        >
                          {/* Icon slot is always present (invisible when healthy) so a
                              low-battery transition doesn't shift the voltage or reflow
                              the column; voltages stay aligned across rows. */}
                          <BatteryLow
                            className={cn("h-4 w-4", !lowBattery && "invisible")}
                            aria-hidden="true"
                          />
                          {device.batteryVoltage.toFixed(2)} V
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{NO_VALUE}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-muted-foreground">
                      {device.firmwareVersion ?? NO_VALUE}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-muted-foreground">
                      {device.lastSeen ? <RelativeTime date={device.lastSeen} /> : "never"}
                    </td>
                    <td className="px-6 py-4">
                      {canManageDevices ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant={device.armed ? "outline" : "default"}
                            onClick={() =>
                              setArmed.mutate({ deviceId: device.id, armed: !device.armed })
                            }
                            disabled={isArming}
                            aria-label={device.armed ? `Disarm ${device.name}` : `Arm ${device.name}`}
                            // Fixed min-width keeps the button footprint constant across the
                            // Arm / Disarm / Working label swap so the column never reflows.
                            className="min-w-[7rem]"
                          >
                            {device.armed ? (
                              <ShieldOff aria-hidden="true" />
                            ) : (
                              <ShieldCheck aria-hidden="true" />
                            )}
                            {isArming ? "Working" : device.armed ? "Disarm" : "Arm"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteCandidate(device)}
                            disabled={remove.isPending}
                            aria-label={`Remove ${device.name}`}
                            aria-haspopup="dialog"
                            className="text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </div>
                      ) : (
                        <span className="flex justify-end text-xs text-muted-foreground">
                          Read-only role
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {activeDeviceForCamera && (
        <ThermalCameraModal
          deviceName={activeDeviceForCamera.name}
          matrix={activeDeviceForCamera.infraGrid}
          timestamp={activeDeviceForCamera.infraGridAt}
          onClose={() => setSelectedDevice(null)}
        />
      )}
      {showRegister && <RegisterDeviceModal onClose={() => setShowRegister(false)} />}
      {deleteCandidate && (
        <ConfirmDeleteDeviceDialog
          deviceName={deleteCandidate.name}
          // Scope spinner to the row currently being deleted so an unrelated
          // confirm dialog (opened while a previous delete is in flight) does
          // not render in a half-loaded state. Mirrors AlarmTable's
          // `ack.variables === alarm.id` idiom.
          isLoading={remove.isPending && remove.variables === deleteCandidate.id}
          onConfirm={() => remove.mutate(deleteCandidate.id)}
          onCancel={() => setDeleteCandidate(null)}
        />
      )}
    </div>
  );
}

