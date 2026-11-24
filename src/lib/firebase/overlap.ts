import type {
  Firestore,
  QueryDocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import {
  ActivityProposal,
  AuditLog,
  ClassSchedule,
  DayOfWeek,
  Room,
  UserRole,
} from "@/types/database";
import {
  COLLECTIONS,
  getDayOfWeekFromDate,
  hasTimeOverlap,
  parseTimeToMinutes,
} from "@/lib/firebase/collections";

export interface OverlapCheckInput {
  roomId: string;
  startMinutes: number;
  endMinutes: number;
  /** Required for single-date events/proposals or date-bound schedules */
  activityDate?: string;
  /** Optional explicit day_of_week for recurring class schedules */
  dayOfWeek?: DayOfWeek;
  /** Exclude current doc id when approving or editing an existing proposal */
  excludeProposalId?: string;
  /** Exclude current doc id when editing an existing class schedule */
  excludeScheduleId?: string;
}

function assertNoClassScheduleOverlap(
  docs: QueryDocumentSnapshot[],
  input: OverlapCheckInput
): void {
  for (const doc of docs) {
    if (doc.id === input.excludeScheduleId) continue;
    const existing = doc.data() as ClassSchedule;
    if (existing.status === "cancelled") continue;

    // Skip date-scoped schedules that belong to a different calendar date
    if (existing.date && input.activityDate && existing.date !== input.activityDate) {
      continue;
    }

    const existingStart =
      existing.start_minutes ?? parseTimeToMinutes(existing.start_time);
    const existingEnd =
      existing.end_minutes ?? parseTimeToMinutes(existing.end_time);

    if (
      existingStart >= 0 &&
      existingEnd > existingStart &&
      hasTimeOverlap(input.startMinutes, input.endMinutes, existingStart, existingEnd)
    ) {
      throw new Error(
        `This room is already reserved for class "${existing.course_title}" (${existing.start_time} - ${existing.end_time}).`
      );
    }
  }
}

/**
 * Atomically verify inside a Firestore transaction that:
 * 1. The target room exists and is "active" (not in maintenance).
 * 2. No approved `activity_proposals` overlap on that room & date.
 * 3. No active `class_schedules` overlap on that room & date/day_of_week.
 */
export async function assertNoRoomOverlap(
  tx: Transaction,
  db: Firestore,
  input: OverlapCheckInput
): Promise<Room> {
  if (
    !Number.isInteger(input.startMinutes) ||
    !Number.isInteger(input.endMinutes) ||
    input.startMinutes < 0 ||
    input.endMinutes > 1440 ||
    input.endMinutes <= input.startMinutes
  ) {
    throw new Error("Invalid time slot: end time must be after start time.");
  }

  const roomRef = db.collection(COLLECTIONS.ROOMS).doc(input.roomId);
  const roomSnap = await tx.get(roomRef);
  if (!roomSnap.exists) {
    throw new Error("Selected room does not exist.");
  }

  const room = { id: roomSnap.id, ...roomSnap.data() } as Room;
  if (room.status !== "active") {
    throw new Error(`Room "${room.name}" is currently under maintenance.`);
  }

  const targetDayOfWeek =
    input.dayOfWeek ||
    (input.activityDate ? getDayOfWeekFromDate(input.activityDate) : null);

  // 1. Check approved activity proposals on the specific date
  if (input.activityDate) {
    const proposalSnaps = await tx.get(
      db
        .collection(COLLECTIONS.ACTIVITY_PROPOSALS)
        .where("room_id", "==", input.roomId)
        .where("activity_date", "==", input.activityDate)
        .where("status", "==", "approved")
    );

    for (const doc of proposalSnaps.docs) {
      if (doc.id === input.excludeProposalId) continue;
      const existing = doc.data() as ActivityProposal;
      const existingStart =
        existing.start_minutes ?? parseTimeToMinutes(existing.start_time);
      const existingEnd =
        existing.end_minutes ?? parseTimeToMinutes(existing.end_time);

      if (
        existingStart >= 0 &&
        existingEnd > existingStart &&
        hasTimeOverlap(input.startMinutes, input.endMinutes, existingStart, existingEnd)
      ) {
        throw new Error("This room is already reserved for this time slot.");
      }
    }
  }

  // 2. Check recurring (day_of_week) and date-specific class schedules
  const scheduleQueries = [];
  if (targetDayOfWeek) {
    scheduleQueries.push(
      tx.get(
        db
          .collection(COLLECTIONS.CLASS_SCHEDULES)
          .where("room_id", "==", input.roomId)
          .where("day_of_week", "==", targetDayOfWeek)
      )
    );
  }
  if (input.activityDate) {
    scheduleQueries.push(
      tx.get(
        db
          .collection(COLLECTIONS.CLASS_SCHEDULES)
          .where("room_id", "==", input.roomId)
          .where("date", "==", input.activityDate)
      )
    );
  }

  const scheduleSnaps = await Promise.all(scheduleQueries);
  for (const snap of scheduleSnaps) {
    assertNoClassScheduleOverlap(snap.docs, input);
  }

  return room;
}

/**
 * Record an immutable audit entry inside an active Firestore transaction.
 */
export function writeAuditLogInTransaction(
  tx: Transaction,
  db: Firestore,
  entry: Omit<AuditLog, "id" | "created_at">
): void {
  const logRef = db.collection(COLLECTIONS.AUDIT_LOGS).doc();
  const payload: Omit<AuditLog, "id"> = {
    ...entry,
    created_at: new Date().toISOString(),
  };
  tx.set(logRef, payload);
}

export function hasRequiredRole(
  role: UserRole,
  allowedRoles: readonly UserRole[]
): boolean {
  return allowedRoles.includes(role);
}
