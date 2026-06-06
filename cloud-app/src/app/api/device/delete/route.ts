import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { errorResponse, fromZod } from "@/lib/error-envelope";
import { isSameOrigin } from "@/lib/origin-guard";
import { deviceDeleteSchema } from "@/lib/validation/device";
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
      "Only OPERATOR or ADMIN may delete devices.",
      403,
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errorResponse("invalidDtoIn", "Request body must be valid JSON.", 400);
  }

  const parsed = deviceDeleteSchema.safeParse(raw);
  if (!parsed.success) return fromZod(parsed.error);

  await connectDb();
  const result = await Device.deleteOne({ _id: parsed.data.deviceId });
  if (result.deletedCount === 0) {
    return errorResponse("deviceNotFound", "Device does not exist.", 404);
  }

  return NextResponse.json({ id: parsed.data.deviceId });
}
