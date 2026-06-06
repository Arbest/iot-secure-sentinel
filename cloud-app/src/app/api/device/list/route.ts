import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { effectiveDeviceStatus, ensureOfflineTamperAlarms } from "@/lib/device-status";
import { errorResponse } from "@/lib/error-envelope";
import { Device } from "@/models/Device";
import { Event } from "@/models/Event";
import type { DeviceListItem } from "@/types/device";
import type { DeviceType } from "@/lib/validation/device";

export const runtime = "nodejs";

type LatestReading = {
  _id: unknown;
  value: number;
  timestamp: Date;
};

type LatestInfraGrid = {
  _id: unknown;
  matrix: number[];
  timestamp: Date;
};

function toIso(value: Date | null | undefined): string | null {
  return value ? new Date(value).toISOString() : null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return errorResponse("unauthorized", "Sign in required.", 401);
  }

  await connectDb();
  await ensureOfflineTamperAlarms();
  const devices = await Device.find()
    .select(
      "name type status armed location lastSeen lastSeenAt lastHeartbeatAt lastOfflineAt firmwareVersion batteryVoltage",
    )
    .sort({ name: 1 })
    .lean();
  const deviceIds = devices.map((d) => d._id);
  const latestTemperatures = await Event.aggregate<LatestReading>([
    {
      $match: {
        deviceId: { $in: deviceIds },
        type: "temperature",
        value: { $type: "number" },
      },
    },
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: "$deviceId",
        value: { $first: "$value" },
        timestamp: { $first: "$timestamp" },
      },
    },
  ]);
  const temperatureMap = new Map(latestTemperatures.map((t) => [String(t._id), t]));

  const latestInfraGrids = await Event.aggregate<LatestInfraGrid>([
    {
      $match: {
        deviceId: { $in: deviceIds },
        type: "infra_grid",
        matrix: { $exists: true, $type: "array" },
      },
    },
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: "$deviceId",
        matrix: { $first: "$matrix" },
        timestamp: { $first: "$timestamp" },
      },
    },
  ]);
  const infraGridMap = new Map(latestInfraGrids.map((t) => [String(t._id), t]));

  const items: DeviceListItem[] = devices.map((d) => {
    const latestTemperature = temperatureMap.get(String(d._id));
    const latestInfraGrid = infraGridMap.get(String(d._id));
    return {
      id: String(d._id),
      name: d.name,
      type: d.type as DeviceType,
      status: effectiveDeviceStatus(d),
      armed: d.armed ?? false,
      location: d.location ?? null,
      lastSeen: toIso(d.lastSeenAt ?? d.lastSeen),
      lastSeenAt: toIso(d.lastSeenAt),
      lastHeartbeatAt: toIso(d.lastHeartbeatAt),
      lastOfflineAt: toIso(d.lastOfflineAt),
      firmwareVersion: d.firmwareVersion ?? null,
      batteryVoltage: d.batteryVoltage ?? null,
      temperatureC: latestTemperature?.value ?? null,
      temperatureAt: toIso(latestTemperature?.timestamp),
      infraGrid: latestInfraGrid?.matrix ?? null,
      infraGridAt: toIso(latestInfraGrid?.timestamp),
    };
  });

  return NextResponse.json({ items });
}
