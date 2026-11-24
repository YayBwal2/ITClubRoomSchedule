import { AuditFields, DayOfWeek } from "@/types/database";

export const COLLECTIONS = {
  PROFILES: "profiles",
  ROOMS: "rooms",
  ACTIVITY_PROPOSALS: "activity_proposals",
  CLASS_SCHEDULES: "class_schedules",
  AUDIT_LOGS: "audit_logs",
} as const;

/**
 * Parse "09:00 AM", "02:30 PM", or "14:30" into minutes from midnight (0..1440).
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return -1;
  const clean = timeStr.trim();

  const matchAmPm = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (matchAmPm) {
    let hours = parseInt(matchAmPm[1], 10);
    const minutes = parseInt(matchAmPm[2], 10);
    const modifier = matchAmPm[3].toUpperCase();

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return -1;
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return -1;
    return hours * 60 + minutes;
  }

  return -1;
}

/**
 * Return true when two half-open time windows [startA, endA) and [startB, endB) overlap.
 */
export function hasTimeOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Resolve UTC day-of-week name from a "YYYY-MM-DD" date string.
 */
export function getDayOfWeekFromDate(dateStr: string): DayOfWeek | null {
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const utcDate = new Date(Date.UTC(year, month, day));

  const days: DayOfWeek[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[utcDate.getUTCDay()] ?? null;
}

export function buildAuditCreateFields(actorId: string): Required<AuditFields> {
  const now = new Date().toISOString();
  return {
    created_at: now,
    updated_at: now,
    created_by: actorId,
    updated_by: actorId,
  };
}

export function buildAuditUpdateFields(
  actorId: string
): Pick<Required<AuditFields>, "updated_at" | "updated_by"> {
  return {
    updated_at: new Date().toISOString(),
    updated_by: actorId,
  };
}
