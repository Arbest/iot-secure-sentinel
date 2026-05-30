import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { AlarmTable } from "@/components/AlarmTable";

export const metadata: Metadata = {
  title: "Alarms",
};

export default async function AlarmsPage() {
  const session = await auth();
  const canAcknowledge = session?.user?.role === "ADMIN" || session?.user?.role === "OPERATOR";

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Open alarms</h1>
      <Suspense>
        <AlarmTable canAcknowledge={canAcknowledge} />
      </Suspense>
    </div>
  );
}
