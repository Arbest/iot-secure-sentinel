import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { errorResponse } from "@/lib/error-envelope";
import { loadDashboardOverview } from "@/lib/dashboard-overview";

export const runtime = "nodejs";
// See /api/device/list for the rationale: the dashboard polls every 5s and
// must always read live counts from Mongo, never a cached response.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return errorResponse("unauthorized", "Sign in required.", 401);
  }

  const counts = await loadDashboardOverview();
  return NextResponse.json(counts);
}
