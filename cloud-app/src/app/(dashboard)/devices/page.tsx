import type { Metadata } from "next";
import { DeviceTable } from "@/components/DeviceTable";

export const metadata: Metadata = {
  title: "Devices",
};

export default function DevicesPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Devices</h1>
      <DeviceTable />
    </div>
  );
}
