import type { AppRole } from "@/types/next-auth";

/**
 * OPERATOR and ADMIN may manage devices (register, delete, arm/disarm); USER is
 * read-only. Single source of truth so the UI gate and the API route guards
 * express the same predicate and cannot drift apart when a role is added.
 */
export function canManageDevices(role: AppRole | null | undefined): boolean {
  return role === "ADMIN" || role === "OPERATOR";
}
