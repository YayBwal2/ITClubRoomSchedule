"use server";

import {
  COLLECTIONS,
  buildAuditCreateFields,
  buildAuditUpdateFields,
  parseTimeToMinutes,
} from "@/lib/firebase/collections";
import { errorMessage, requireActor } from "@/lib/firebase/action-helpers";
import {
  assertNoRoomOverlap,
  writeAuditLogInTransaction,
} from "@/lib/firebase/overlap";
import { ClassSchedule, DayOfWeek } from "@/types/database";

export async function getClassSchedules(filters?: {
  campus?: string;
  dayOfWeek?: DayOfWeek;
}): Promise<{ data: ClassSchedule[] | null; error: string | null }> {
  try {
    const auth = await requireActor();
    if (!auth.ok) return { data: null, error: auth.error };

    let query: FirebaseFirestore.Query = auth.db.collection(
      COLLECTIONS.CLASS_SCHEDULES
    );

    if (filters?.campus) query = query.where("campus", "==", filters.campus);
    if (filters?.dayOfWeek) query = query.where("day_of_week", "==", filters.dayOfWeek);

    const snap = await query.orderBy("start_minutes", "asc").get();
    const schedules = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as ClassSchedule)
      .filter((s) => s.status !== "cancelled");

    return { data: schedules, error: null };
  } catch (err) {
    return {
      data: null,
      error: errorMessage(err, "Failed to fetch class schedules"),
    };
  }
}

export async function createClassSchedule(
  payload: Omit<
    ClassSchedule,
    "id" | "created_at" | "updated_at" | "created_by" | "updated_by"
  >
): Promise<{ success: boolean; error: string | null; data?: ClassSchedule }> {
  try {
    const auth = await requireActor(
      ["admin"],
      "Forbidden: Only Admins can create class schedules."
    );
    if (!auth.ok) return { success: false, error: auth.error };

    const { actor, db } = auth;
    const startMinutes =
      payload.start_minutes ?? parseTimeToMinutes(payload.start_time);
    const endMinutes =
      payload.end_minutes ?? parseTimeToMinutes(payload.end_time);

    if (startMinutes < 0 || endMinutes <= startMinutes) {
      return {
        success: false,
        error: "Invalid time slot: end time must be after start time.",
      };
    }

    const docRef = db.collection(COLLECTIONS.CLASS_SCHEDULES).doc();
    const created = await db.runTransaction(async (tx) => {
      const room = await assertNoRoomOverlap(tx, db, {
        roomId: payload.room_id,
        dayOfWeek: payload.day_of_week,
        activityDate: payload.date,
        startMinutes,
        endMinutes,
      });

      const schedule: ClassSchedule = {
        ...payload,
        id: docRef.id,
        campus: room.campus,
        room_name: room.name,
        start_minutes: startMinutes,
        end_minutes: endMinutes,
        status: payload.status || "active",
        ...buildAuditCreateFields(actor.uid),
      };

      tx.set(docRef, schedule);
      writeAuditLogInTransaction(tx, db, {
        collection: "class_schedules",
        document_id: docRef.id,
        action: "create",
        actor_id: actor.uid,
        actor_role: actor.role,
        details: {
          room_id: schedule.room_id,
          course_code: schedule.course_code,
          day_of_week: schedule.day_of_week,
        },
      });

      return schedule;
    });

    return { success: true, error: null, data: created };
  } catch (err) {
    return {
      success: false,
      error: errorMessage(err, "Failed to create class schedule"),
    };
  }
}

export async function updateClassSchedule(
  scheduleId: string,
  payload: Partial<Omit<ClassSchedule, "id" | "created_at" | "created_by">>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const auth = await requireActor(
      ["admin"],
      "Forbidden: Only Admins can update class schedules."
    );
    if (!auth.ok) return { success: false, error: auth.error };

    const { actor, db } = auth;
    const docRef = db.collection(COLLECTIONS.CLASS_SCHEDULES).doc(scheduleId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists) throw new Error("Class schedule not found.");

      const current = snap.data() as ClassSchedule;
      const nextStatus = payload.status ?? current.status ?? "active";
      const nextStartMinutes =
        payload.start_minutes ??
        parseTimeToMinutes(payload.start_time ?? current.start_time);
      const nextEndMinutes =
        payload.end_minutes ??
        parseTimeToMinutes(payload.end_time ?? current.end_time);

      if (nextStatus !== "cancelled") {
        await assertNoRoomOverlap(tx, db, {
          roomId: payload.room_id ?? current.room_id,
          dayOfWeek: payload.day_of_week ?? current.day_of_week,
          activityDate: payload.date ?? current.date,
          startMinutes: nextStartMinutes,
          endMinutes: nextEndMinutes,
          excludeScheduleId: scheduleId,
        });
      }

      tx.update(docRef, {
        ...payload,
        start_minutes: nextStartMinutes,
        end_minutes: nextEndMinutes,
        ...buildAuditUpdateFields(actor.uid),
      });

      writeAuditLogInTransaction(tx, db, {
        collection: "class_schedules",
        document_id: scheduleId,
        action: "update",
        actor_id: actor.uid,
        actor_role: actor.role,
      });
    });

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: errorMessage(err, "Failed to update class schedule"),
    };
  }
}
