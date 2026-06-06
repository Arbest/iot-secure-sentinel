import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { errorResponse, fromZod } from "@/lib/error-envelope";
import { isSameOrigin } from "@/lib/origin-guard";
import { hashDeviceToken } from "@/lib/password";
import { deviceCreateSchema } from "@/lib/validation/device";
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
  if (session.user.role === "USER") {
    return errorResponse(
      "forbidden",
      "Only OPERATOR or ADMIN may register devices.",
      403,
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errorResponse("invalidDtoIn", "Request body must be valid JSON.", 400);
  }

  const parsed = deviceCreateSchema.safeParse(raw);
  if (!parsed.success) return fromZod(parsed.error);

  await connectDb();

  const token = randomBytes(32).toString("hex");
  const { name, type, location } = parsed.data;

  try {
    const device = await Device.create({
      name,
      type,
      status: "offline",
      ...(location ? { location } : {}),
      apiTokenHash: hashDeviceToken(token),
    });
    return NextResponse.json(
      {
        id: String(device._id),
        name: device.name,
        type: device.type,
        token,
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return errorResponse(
        "deviceNameConflict",
        `Device name '${name}' is already taken.`,
        409,
      );
    }
    throw err;
  }
}
