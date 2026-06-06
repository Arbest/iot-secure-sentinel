import { z } from "zod";

export const deviceTypeEnum = z.enum(["iotNode", "gateway"]);
export type DeviceType = z.infer<typeof deviceTypeEnum>;

export const deviceCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    type: deviceTypeEnum,
    location: z.string().trim().max(240).optional(),
    // Reject unknown keys so typos like { typ: "iotNode" } surface as
    // invalidDtoIn instead of silently dropping a required field.
  })
  .strict();

export type DeviceCreateInput = z.infer<typeof deviceCreateSchema>;

export const deviceDeleteSchema = z
  .object({
    deviceId: z.string().regex(/^[0-9a-fA-F]{24}$/, "deviceId must be a Mongo ObjectId"),
  })
  .strict();

export type DeviceDeleteInput = z.infer<typeof deviceDeleteSchema>;
