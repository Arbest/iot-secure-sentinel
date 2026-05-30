import type { Metadata } from "next";
import { DashboardOverview } from "@/components/DashboardOverview";
import { loadDashboardOverview } from "@/lib/dashboard-overview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const counts = await loadDashboardOverview();
  const fetchedAt = Date.now();
  return <DashboardOverview initialCounts={counts} initialFetchedAt={fetchedAt} />;
}
