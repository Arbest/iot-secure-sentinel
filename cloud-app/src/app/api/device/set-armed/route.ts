import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { errorResponse, fromZod } from "@/lib/error-envelope";
import { isSameOrigin } from "@/lib/origin-guard";
import { canManageDevices } from "@/lib/roles";
import { deviceSetArmedSchema } from "@/lib/validation/device";
import { Device } from "@/models/Device";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return errorResponse("forbidden", "Cross-origin request rejected.", 403);
  }

  const session = await auth();
  if (!session?.user) {
    return errorResponse("unauthorized", "Sign in required.", 401);
  }
  if (!canManageDevices(session.user.role)) {
    return errorResponse(
      "forbidden",
      "Only OPERATOR or ADMIN may arm or disarm devices.",
      403,
    );
  }

  let actorId: Types.ObjectId;
  try {
    actorId = Types.ObjectId.createFromHexString(session.user.id);
  } catch {
    return errorResponse("unauthorized", "Session identity is malformed.", 401);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errorResponse("invalidDtoIn", "Request body must be valid JSON.", 400);
  }

  const parsed = deviceSetArmedSchema.safeParse(raw);
  if (!parsed.success) return fromZod(parsed.error);

  await connectDb();
  const armedAt = new Date();
  const result = await Device.updateOne(
    { _id: parsed.data.deviceId },
    { $set: { armed: parsed.data.armed, armedBy: actorId, armedAt } },
  );
  if (result.matchedCount === 0) {
    return errorResponse("deviceNotFound", "Device does not exist.", 404);
  }

  return NextResponse.json({
    id: parsed.data.deviceId,
    armed: parsed.data.armed,
    armedAt: armedAt.toISOString(),
    armedBy: String(actorId),
  });
}
