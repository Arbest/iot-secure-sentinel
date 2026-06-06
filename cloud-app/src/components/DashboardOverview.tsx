"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Activity, ArrowRight, Cpu, OctagonAlert, Router, Thermometer } from "lucide-react";
import { PollIndicator } from "@/components/PollIndicator";
import { RecentActivity } from "@/components/RecentActivity";
import { StatCard } from "@/components/StatCard";
import type { DashboardOverviewCounts } from "@/lib/dashboard-overview";
import { THRESHOLDS } from "@/services/alarm-classifier";

async function fetchOverview(): Promise<DashboardOverviewCounts> {
  const res = await fetch("/api/dashboard/overview", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load dashboard overview");
  return res.json();
}

const POLL_INTERVAL_SECONDS = 5;

export function DashboardOverview({
  initialCounts,
  initialFetchedAt,
}: {
  initialCounts: DashboardOverviewCounts;
  initialFetchedAt: number;
}) {
  const query = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: fetchOverview,
    initialData: initialCounts,
    initialDataUpdatedAt: initialFetchedAt,
    refetchInterval: POLL_INTERVAL_SECONDS * 1000,
  });

  const counts = query.data;
  const temperatureWarning =
    counts.latestTemperature !== null &&
    (counts.latestTemperature.value >= THRESHOLDS.tempWarnHigh ||
      counts.latestTemperature.value <= THRESHOLDS.tempWarnLow);

  const gateway = counts.gateway;
  const gatewayValue = gateway
    ? gateway.status === "online"
      ? "Online"
      : "Offline"
    : "-";
  const gatewaySubtitle = gateway
    ? gateway.lastSeenSeconds != null
      ? `${gateway.name}, ${formatLastSeen(gateway.lastSeenSeconds)}`
      : `${gateway.name}, never seen`
    : "No gateway registered";
  const gatewayTone =
    gateway == null
      ? "neutral"
      : gateway.status === "online"
        ? "success"
        : gateway.status === "warning"
          ? "warning"
          : "destructive";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <PollIndicator
          intervalSeconds={POLL_INTERVAL_SECONDS}
          lastUpdated={query.dataUpdatedAt}
          isFetching={query.isFetching}
          isError={query.isError}
        />
      </header>

      {counts.alarmsCritical > 0 ? (
        <Link
          href="/alarms?severity=critical"
          className="group flex items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive-soft px-5 py-4 text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <OctagonAlert className="h-6 w-6 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold tracking-tight">
                {counts.alarmsCritical === 1
                  ? "1 critical alarm needs an operator"
                  : `${counts.alarmsCritical} critical alarms need an operator`}
              </p>
              <p className="text-xs opacity-80">Click to review and acknowledge</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      ) : null}

      <section aria-label="System health summary" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Gateway"
          icon={Router}
          value={gatewayValue}
          subtitle={gatewaySubtitle}
          tone={gatewayTone}
          href="/devices"
          featured
        />
        <StatCard
          title="Open alarms"
          icon={OctagonAlert}
          value={counts.alarmsOpen}
          subtitle={
            counts.alarmsCritical > 0
              ? `${counts.alarmsCritical} critical`
              : counts.alarmsOpen === 0
                ? "All clear"
                : "Awaiting acknowledgement"
          }
          tone={
            counts.alarmsCritical > 0
              ? "destructive"
              : counts.alarmsOpen > 0
                ? "warning"
                : "success"
          }
          href="/alarms"
        />
        <StatCard
          title="Devices"
          icon={Cpu}
          value={counts.devicesTotal}
          subtitle={`${counts.devicesOnline} online`}
          tone="primary"
          href="/devices"
        />
        <StatCard
          title="Temperature"
          icon={Thermometer}
          value={counts.latestTemperature ? `${counts.latestTemperature.value.toFixed(1)} °C` : "-"}
          subtitle={counts.latestTemperature?.deviceName ?? "No reading yet"}
          tone={temperatureWarning ? "warning" : "neutral"}
          href="/devices"
        />
      </section>

      <section aria-label="Activity" className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Events (24h)"
          icon={Activity}
          value={counts.eventsLast24h.toLocaleString("en-US")}
          subtitle="Ingested across all devices"
          tone="neutral"
        />
        <div className="md:col-span-2">
          <RecentActivity items={counts.recentAlarms} />
        </div>
      </section>
    </div>
  );
}

function formatLastSeen(seconds: number): string {
  if (seconds < 60) return `last seen ${seconds}s ago`;
  if (seconds < 3600) return `last seen ${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `last seen ${Math.round(seconds / 3600)}h ago`;
  return `last seen ${Math.round(seconds / 86400)}d ago`;
}
