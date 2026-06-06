import { Schema, Types, model, models, type Model, type InferSchemaType } from "mongoose";
import { deviceTypeEnum } from "@/lib/validation/device";

const deviceSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, maxlength: 120 },
    type: { type: String, enum: deviceTypeEnum.options, required: true },
    status: {
      type: String,
      enum: ["online", "warning", "offline"],
      default: "offline",
    },
    // Arm/disarm gate. Disarmed devices still ingest and update their telemetry,
    // but no alarms are raised for them (neither on ingest classification nor by
    // the offline heartbeat sweep). Defaults to disarmed so a freshly registered
    // device does not raise alarms during install/calibration until an operator
    // explicitly arms it.
    armed: { type: Boolean, default: false },
    // Audit trail for the last arm-state change: who flipped it and when.
    // Disarming silences all alarms for a device, so the actor and time are
    // recorded for forensics (mirrors acknowledgedBy/acknowledgedAt on Alarm).
    armedBy: { type: Schema.Types.ObjectId, ref: "User" },
    armedAt: Date,
    location: { type: String, maxlength: 240 },
    ipAddress: String,
    lastSeen: Date,
    lastSeenAt: Date,
    lastHeartbeatAt: Date,
    lastOfflineAt: Date,
    apiTokenHash: { type: String, required: true },
    firmwareVersion: String,
    batteryVoltage: Number,
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "devices" },
);

deviceSchema.index({ apiTokenHash: 1 });

export type DeviceDoc = InferSchemaType<typeof deviceSchema> & { _id: Types.ObjectId };

export const Device: Model<DeviceDoc> =
  (models.Device as Model<DeviceDoc>) || model<DeviceDoc>("Device", deviceSchema);
