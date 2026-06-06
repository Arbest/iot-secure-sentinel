import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { canManageDevices } from "@/lib/roles";
import { DeviceTable } from "@/components/DeviceTable";

export const metadata: Metadata = {
  title: "Devices",
};

export default async function DevicesPage() {
  const session = await auth();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Devices</h1>
      <DeviceTable canManageDevices={canManageDevices(session?.user?.role)} />
    </div>
  );
}
