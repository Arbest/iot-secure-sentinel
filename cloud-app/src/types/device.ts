import type { DeviceStatus } from "@/lib/device-status";
import type { DeviceType } from "@/lib/validation/device";

/**
 * One device as returned by GET /api/device/list, after JSON serialization
 * (every timestamp is an ISO string). Single source of truth shared by the list
 * route's response mapping and the client table, so the two cannot drift when a
 * field is added or its type changes.
 */
export type DeviceListItem = {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  armed: boolean;
  location: string | null;
  lastSeen: string | null;
  lastSeenAt: string | null;
  lastHeartbeatAt: string | null;
  lastOfflineAt: string | null;
  firmwareVersion: string | null;
  batteryVoltage: number | null;
  temperatureC: number | null;
  temperatureAt: string | null;
  infraGrid: number[] | null;
  infraGridAt: string | null;
};
