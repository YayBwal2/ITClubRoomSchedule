"use server";

import type { Firestore } from "firebase-admin/firestore";
import {
  COLLECTIONS,
  buildAuditCreateFields,
  buildAuditUpdateFields,
  getDayOfWeekFromDate,
  hasTimeOverlap,
  parseTimeToMinutes,
} from "@/lib/firebase/collections";
import {
  errorMessage,
  mapProposalToBooking,
  requireActor,
} from "@/lib/firebase/action-helpers";
import {
  assertNoRoomOverlap,
  hasRequiredRole,
  writeAuditLogInTransaction,
} from "@/lib/firebase/overlap";
import {
  ActivityProposal,
  Booking,
  ClassSchedule,
  DayOfWeek,
  Room,
  RoomAvailabilityResult,
  RoomBusySlot,
} from "@/types/database";

type ProposalWriteInput = Omit<
  ActivityProposal,
  | "id"
  | "coordinator_id"
  | "status"
  | "created_at"
  | "updated_at"
  | "created_by"
  | "updated_by"
  | "reviewed_by"
  | "reviewed_at"
  | "cancelled_at"
  | "cancelled_by"
> & { coordinator_id?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getTodayYangonDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(
    new Date()
  );
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as T;
}

function sanitizeSuppliers(
  suppliers?: { name: string; phone: string }[]
): { ok: true; value: { name: string; phone: string }[] } | { ok: false; error: string } {
  if (!suppliers || suppliers.length === 0) return { ok: true, value: [] };

  const cleaned: { name: string; phone: string }[] = [];
  for (const item of suppliers) {
    const name = item.name?.trim() || "";
    const phone = item.phone?.trim() || "";
    if (!name && !phone) continue;
    if (!name || !phone) {
      return {
        ok: false,
        error: "Each supplier entry must include both a supplier name and phone number.",
      };
    }
    cleaned.push({ name, phone });
  }
  return { ok: true, value: cleaned };
}

function sanitizeEquipment(items?: string[]): string[] {
  if (!items || items.length === 0) return [];
  return Array.from(
    new Set(items.map((item) => item.trim()).filter((item) => item.length > 0))
  );
}

interface ValidatedProposalFields {
  title: string;
  club_name: string;
  description: string;
  expected_attendees: number;
  room_id: string;
  activity_date: string;
  start_time: string;
  end_time: string;
  start_minutes: number;
  end_minutes: number;
  coordinator_name: string;
  expected_budget?: string;
  budget_details?: string;
  suppliers?: { name: string; phone: string }[];
  organizer_name?: string;
  organizer_role?: string;
  organizer_email?: string;
  organizer_phone?: string;
  additional_requests?: string;
  requested_equipment?: string[];
}

function validateProposalInput(
  proposal: ProposalWriteInput,
  fallbackOrganizerName: string
):
  | { ok: true; data: ValidatedProposalFields }
  | { ok: false; error: string } {
  const title = proposal.title?.trim() || "";
  const clubName = proposal.club_name?.trim() || "";
  const description = proposal.description?.trim() || "";
  const roomId = proposal.room_id?.trim() || "";
  const activityDate = proposal.activity_date?.trim() || "";

  if (title.length < 3) {
    return { ok: false, error: "Event title must be at least 3 characters." };
  }
  if (clubName.length < 2) {
    return { ok: false, error: "Please enter your club or society name." };
  }
  if (description.length < 3) {
    return { ok: false, error: "Please provide a brief event description." };
  }
  if (!roomId) {
    return { ok: false, error: "Please select a campus and room." };
  }
  if (!getDayOfWeekFromDate(activityDate)) {
    return { ok: false, error: "Please provide a valid activity date (YYYY-MM-DD)." };
  }
  if (activityDate < getTodayYangonDate()) {
    return {
      ok: false,
      error: "Activity date cannot be in the past. Please choose today or a future date.",
    };
  }

  const attendees = Number(proposal.expected_attendees);
  if (!Number.isInteger(attendees) || attendees < 1) {
    return { ok: false, error: "Expected attendees must be at least 1." };
  }

  const startMinutes =
    proposal.start_minutes ?? parseTimeToMinutes(proposal.start_time);
  const endMinutes =
    proposal.end_minutes ?? parseTimeToMinutes(proposal.end_time);

  if (startMinutes < 0 || endMinutes > 1440 || endMinutes <= startMinutes) {
    return {
      ok: false,
      error: "Invalid time slot: end time must be after start time.",
    };
  }

  const organizerEmail = proposal.organizer_email?.trim();
  if (organizerEmail && !EMAIL_PATTERN.test(organizerEmail)) {
    return { ok: false, error: "Please enter a valid organizer email address." };
  }

  const supplierResult = sanitizeSuppliers(proposal.suppliers);
  if (!supplierResult.ok) {
    return { ok: false, error: supplierResult.error };
  }

  const equipment = sanitizeEquipment(proposal.requested_equipment);
  const expectedBudget = proposal.expected_budget?.trim() || undefined;
  const budgetDetails = proposal.budget_details?.trim() || undefined;
  const additionalRequests = proposal.additional_requests?.trim() || undefined;
  const organizerName = proposal.organizer_name?.trim() || undefined;
  const organizerRole = proposal.organizer_role?.trim() || undefined;
  const organizerPhone = proposal.organizer_phone?.trim() || undefined;

  return {
    ok: true,
    data: {
      title,
      club_name: clubName,
      description,
      expected_attendees: attendees,
      room_id: roomId,
      activity_date: activityDate,
      start_time: proposal.start_time.trim(),
      end_time: proposal.end_time.trim(),
      start_minutes: startMinutes,
      end_minutes: endMinutes,
      coordinator_name:
        proposal.coordinator_name?.trim() || organizerName || fallbackOrganizerName,
      expected_budget: expectedBudget,
      budget_details: budgetDetails,
      suppliers: supplierResult.value.length > 0 ? supplierResult.value : undefined,
      organizer_name: organizerName,
      organizer_role: organizerRole,
      organizer_email: organizerEmail || undefined,
      organizer_phone: organizerPhone,
      additional_requests: additionalRequests,
      requested_equipment: equipment.length > 0 ? equipment : undefined,
    },
  };
}

function assertRoomCapacity(room: Room, expectedAttendees: number): void {
  if (expectedAttendees > room.capacity) {
    throw new Error(
      `Room "${room.name}" seats up to ${room.capacity} people, which cannot accommodate ${expectedAttendees} attendees. Please select a larger room.`
    );
  }
}

async function findAlternativeRooms(
  db: Firestore,
  params: {
    campus: string;
    excludeRoomId: string;
    activityDate: string;
    dayOfWeek: DayOfWeek;
    startMinutes: number;
    endMinutes: number;
    minCapacity: number;
  }
): Promise<Room[]> {
  const [roomsSnap, proposalsSnap, schedulesSnap] = await Promise.all([
    db
      .collection(COLLECTIONS.ROOMS)
      .where("campus", "==", params.campus)
      .where("status", "==", "active")
      .orderBy("name", "asc")
      .get(),
    db
      .collection(COLLECTIONS.ACTIVITY_PROPOSALS)
      .where("campus", "==", params.campus)
      .where("activity_date", "==", params.activityDate)
      .where("status", "==", "approved")
      .get(),
    db
      .collection(COLLECTIONS.CLASS_SCHEDULES)
      .where("campus", "==", params.campus)
      .where("day_of_week", "==", params.dayOfWeek)
      .orderBy("start_minutes", "asc")
      .get(),
  ]);

  const busyRoomIds = new Set<string>();

  for (const doc of proposalsSnap.docs) {
    const p = doc.data() as ActivityProposal;
    const pStart = p.start_minutes ?? parseTimeToMinutes(p.start_time);
    const pEnd = p.end_minutes ?? parseTimeToMinutes(p.end_time);
    if (hasTimeOverlap(params.startMinutes, params.endMinutes, pStart, pEnd)) {
      busyRoomIds.add(p.room_id);
    }
  }

  for (const doc of schedulesSnap.docs) {
    const s = doc.data() as ClassSchedule;
    if (s.status === "cancelled") continue;
    if (s.date && s.date !== params.activityDate) continue;
    const sStart = s.start_minutes ?? parseTimeToMinutes(s.start_time);
    const sEnd = s.end_minutes ?? parseTimeToMinutes(s.end_time);
    if (hasTimeOverlap(params.startMinutes, params.endMinutes, sStart, sEnd)) {
      busyRoomIds.add(s.room_id);
    }
  }

  return roomsSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Room)
    .filter(
      (room) =>
        room.id !== params.excludeRoomId &&
        room.capacity >= params.minCapacity &&
        !busyRoomIds.has(room.id)
    )
    .slice(0, 4);
}

/**
 * Fetch proposals visible to the current user (Admin/SSE see all; Coordinators see own + approved).
 */
export async function getActivityProposals(): Promise<{
  data: ActivityProposal[] | null;
  error: string | null;
}> {
  try {
    const auth = await requireActor();
    if (!auth.ok) return { data: null, error: auth.error };

    const { actor, db } = auth;
    const collectionRef = db.collection(COLLECTIONS.ACTIVITY_PROPOSALS);

    if (hasRequiredRole(actor.role, ["admin", "sse"])) {
      const snap = await collectionRef.orderBy("created_at", "desc").get();
      return {
        data: snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as ActivityProposal
        ),
        error: null,
      };
    }

    const [ownSnap, approvedSnap] = await Promise.all([
      collectionRef
        .where("coordinator_id", "==", actor.uid)
        .orderBy("created_at", "desc")
        .get(),
      collectionRef
        .where("status", "==", "approved")
        .orderBy("created_at", "desc")
        .get(),
    ]);

    const merged = new Map<string, ActivityProposal>();
    for (const doc of [...ownSnap.docs, ...approvedSnap.docs]) {
      merged.set(doc.id, { id: doc.id, ...doc.data() } as ActivityProposal);
    }

    const sorted = Array.from(merged.values()).sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
    return { data: sorted, error: null };
  } catch (err) {
    return {
      data: null,
      error: errorMessage(err, "Failed to fetch activity proposals"),
    };
  }
}

/**
 * Fetch only proposals submitted by the currently signed-in coordinator (or admin).
 */
export async function getMyActivityProposals(): Promise<{
  data: ActivityProposal[] | null;
  error: string | null;
}> {
  try {
    const auth = await requireActor(
      ["coordinator", "admin"],
      "Forbidden: SSE accounts have view-only access and do not manage proposals."
    );
    if (!auth.ok) return { data: null, error: auth.error };

    const snap = await auth.db
      .collection(COLLECTIONS.ACTIVITY_PROPOSALS)
      .where("coordinator_id", "==", auth.actor.uid)
      .orderBy("created_at", "desc")
      .get();

    return {
      data: snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as ActivityProposal
      ),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: errorMessage(err, "Failed to fetch your proposals"),
    };
  }
}

/**
 * Create a new pending activity proposal after server-side validation and atomic overlap check.
 */
export async function createActivityProposal(
  proposal: ProposalWriteInput
): Promise<{ success: boolean; error: string | null; data?: ActivityProposal }> {
  try {
    const auth = await requireActor(
      ["coordinator", "admin"],
      "Forbidden: SSE accounts have view-only access and cannot submit proposals."
    );
    if (!auth.ok) return { success: false, error: auth.error };

    const { actor, db } = auth;
    const validated = validateProposalInput(proposal, actor.profile.full_name);
    if (!validated.ok) return { success: false, error: validated.error };

    const fields = validated.data;
    const docRef = db.collection(COLLECTIONS.ACTIVITY_PROPOSALS).doc();
    const coordinatorId =
      actor.role === "admin" && proposal.coordinator_id
        ? proposal.coordinator_id
        : actor.uid;

    const createdProposal = await db.runTransaction(async (tx) => {
      const room = await assertNoRoomOverlap(tx, db, {
        roomId: fields.room_id,
        activityDate: fields.activity_date,
        startMinutes: fields.start_minutes,
        endMinutes: fields.end_minutes,
      });
      assertRoomCapacity(room, fields.expected_attendees);

      const record = stripUndefined({
        ...fields,
        id: docRef.id,
        coordinator_id: coordinatorId,
        campus: room.campus,
        room_name: room.name,
        status: "pending",
        reviewed_by: null,
        reviewed_at: null,
        rejection_reason: null,
        cancelled_at: null,
        cancelled_by: null,
        ...buildAuditCreateFields(actor.uid),
      }) as ActivityProposal;

      tx.set(docRef, record);
      writeAuditLogInTransaction(tx, db, {
        collection: "activity_proposals",
        document_id: docRef.id,
        action: "create",
        actor_id: actor.uid,
        actor_role: actor.role,
        details: {
          room_id: record.room_id,
          activity_date: record.activity_date,
          start_time: record.start_time,
          end_time: record.end_time,
          equipment_count: record.requested_equipment?.length ?? 0,
          supplier_count: record.suppliers?.length ?? 0,
        },
      });

      return record;
    });

    return { success: true, error: null, data: createdProposal };
  } catch (err) {
    return { success: false, error: errorMessage(err, "Failed to submit proposal") };
  }
}

/**
 * Edit an existing pending proposal owned by the coordinator (or any pending proposal as admin).
 */
export async function updateActivityProposal(
  proposalId: string,
  updates: ProposalWriteInput
): Promise<{ success: boolean; error: string | null; data?: ActivityProposal }> {
  try {
    const auth = await requireActor(
      ["coordinator", "admin"],
      "Forbidden: SSE accounts have view-only access and cannot edit proposals."
    );
    if (!auth.ok) return { success: false, error: auth.error };

    if (!proposalId.trim()) {
      return { success: false, error: "Invalid proposal ID." };
    }

    const { actor, db } = auth;
    const validated = validateProposalInput(updates, actor.profile.full_name);
    if (!validated.ok) return { success: false, error: validated.error };

    const fields = validated.data;
    const proposalRef = db.collection(COLLECTIONS.ACTIVITY_PROPOSALS).doc(proposalId);

    const updatedProposal = await db.runTransaction(async (tx) => {
      const snap = await tx.get(proposalRef);
      if (!snap.exists) {
        throw new Error("Proposal not found.");
      }

      const existing = { id: snap.id, ...snap.data() } as ActivityProposal;
      if (actor.role !== "admin" && existing.coordinator_id !== actor.uid) {
        throw new Error("Forbidden: You can only edit your own proposals.");
      }
      if (existing.status !== "pending") {
        throw new Error(
          `Cannot edit this proposal because its status is already "${existing.status}". Only pending proposals can be edited.`
        );
      }

      const room = await assertNoRoomOverlap(tx, db, {
        roomId: fields.room_id,
        activityDate: fields.activity_date,
        startMinutes: fields.start_minutes,
        endMinutes: fields.end_minutes,
        excludeProposalId: proposalId,
      });
      assertRoomCapacity(room, fields.expected_attendees);

      const auditUpdates = buildAuditUpdateFields(actor.uid);
      const nextRecord: ActivityProposal = stripUndefined({
        ...existing,
        ...fields,
        campus: room.campus,
        room_name: room.name,
        ...auditUpdates,
      });

      const updatePayload = stripUndefined({
        ...fields,
        campus: room.campus,
        room_name: room.name,
        expected_budget: fields.expected_budget ?? null,
        budget_details: fields.budget_details ?? null,
        suppliers: fields.suppliers ?? [],
        additional_requests: fields.additional_requests ?? null,
        requested_equipment: fields.requested_equipment ?? [],
        ...auditUpdates,
      });

      tx.update(proposalRef, updatePayload);
      writeAuditLogInTransaction(tx, db, {
        collection: "activity_proposals",
        document_id: proposalId,
        action: "update",
        actor_id: actor.uid,
        actor_role: actor.role,
        details: {
          room_id: nextRecord.room_id,
          activity_date: nextRecord.activity_date,
          start_time: nextRecord.start_time,
          end_time: nextRecord.end_time,
        },
      });

      return nextRecord;
    });

    return { success: true, error: null, data: updatedProposal };
  } catch (err) {
    return { success: false, error: errorMessage(err, "Failed to update proposal") };
  }
}

/**
 * Cancel a coordinator's own pending or upcoming approved proposal, freeing the room slot.
 */
export async function cancelActivityProposal(
  proposalId: string,
  reason?: string
): Promise<{ success: boolean; error: string | null; data?: ActivityProposal }> {
  try {
    const auth = await requireActor(
      ["coordinator", "admin"],
      "Forbidden: SSE accounts have view-only access and cannot cancel proposals."
    );
    if (!auth.ok) return { success: false, error: auth.error };

    if (!proposalId.trim()) {
      return { success: false, error: "Invalid proposal ID." };
    }

    const { actor, db } = auth;
    const proposalRef = db.collection(COLLECTIONS.ACTIVITY_PROPOSALS).doc(proposalId);

    const cancelledProposal = await db.runTransaction(async (tx) => {
      const snap = await tx.get(proposalRef);
      if (!snap.exists) {
        throw new Error("Proposal not found.");
      }

      const existing = { id: snap.id, ...snap.data() } as ActivityProposal;
      if (actor.role !== "admin" && existing.coordinator_id !== actor.uid) {
        throw new Error("Forbidden: You can only cancel your own proposals.");
      }
      if (existing.status === "cancelled") {
        throw new Error("This proposal has already been cancelled.");
      }
      if (existing.status === "rejected") {
        throw new Error("Rejected proposals cannot be cancelled.");
      }
      if (
        existing.status === "approved" &&
        existing.activity_date < getTodayYangonDate()
      ) {
        throw new Error("Cannot cancel an approved event whose date has already passed.");
      }

      const now = new Date().toISOString();
      const cancelNote = reason?.trim() || null;
      const auditUpdates = buildAuditUpdateFields(actor.uid);

      tx.update(proposalRef, {
        status: "cancelled",
        cancelled_at: now,
        cancelled_by: actor.uid,
        rejection_reason: cancelNote ?? existing.rejection_reason ?? null,
        ...auditUpdates,
      });

      writeAuditLogInTransaction(tx, db, {
        collection: "activity_proposals",
        document_id: proposalId,
        action: "cancel",
        actor_id: actor.uid,
        actor_role: actor.role,
        details: {
          previous_status: existing.status,
          reason: cancelNote,
        },
      });

      return {
        ...existing,
        status: "cancelled" as const,
        cancelled_at: now,
        cancelled_by: actor.uid,
        rejection_reason: cancelNote ?? existing.rejection_reason ?? null,
        ...auditUpdates,
      };
    });

    return { success: true, error: null, data: cancelledProposal };
  } catch (err) {
    return { success: false, error: errorMessage(err, "Failed to cancel proposal") };
  }
}

/**
 * Inspect room availability, busy/pending time slots, and alternative rooms for a date & window.
 */
export async function checkRoomAvailability(input: {
  room_id: string;
  activity_date: string;
  start_time: string;
  end_time: string;
  exclude_proposal_id?: string;
  expected_attendees?: number;
}): Promise<{ data: RoomAvailabilityResult | null; error: string | null }> {
  try {
    const auth = await requireActor();
    if (!auth.ok) return { data: null, error: auth.error };

    const dayOfWeek = getDayOfWeekFromDate(input.activity_date);
    if (!dayOfWeek) {
      return { data: null, error: "Invalid activity date format." };
    }

    const startMinutes = parseTimeToMinutes(input.start_time);
    const endMinutes = parseTimeToMinutes(input.end_time);
    if (startMinutes < 0 || endMinutes > 1440 || endMinutes <= startMinutes) {
      return { data: null, error: "End time must be later than start time." };
    }

    const { db } = auth;
    const roomSnap = await db.collection(COLLECTIONS.ROOMS).doc(input.room_id).get();
    if (!roomSnap.exists) {
      return { data: null, error: "Selected room does not exist." };
    }

    const room = { id: roomSnap.id, ...roomSnap.data() } as Room;

    const [approvedSnap, pendingSnap, dayScheduleSnap, dateScheduleSnap] =
      await Promise.all([
        db
          .collection(COLLECTIONS.ACTIVITY_PROPOSALS)
          .where("room_id", "==", room.id)
          .where("activity_date", "==", input.activity_date)
          .where("status", "==", "approved")
          .orderBy("start_minutes", "asc")
          .get(),
        db
          .collection(COLLECTIONS.ACTIVITY_PROPOSALS)
          .where("room_id", "==", room.id)
          .where("activity_date", "==", input.activity_date)
          .where("status", "==", "pending")
          .orderBy("start_minutes", "asc")
          .get(),
        db
          .collection(COLLECTIONS.CLASS_SCHEDULES)
          .where("room_id", "==", room.id)
          .where("day_of_week", "==", dayOfWeek)
          .where("status", "==", "active")
          .orderBy("start_minutes", "asc")
          .get(),
        db
          .collection(COLLECTIONS.CLASS_SCHEDULES)
          .where("room_id", "==", room.id)
          .where("date", "==", input.activity_date)
          .where("status", "==", "active")
          .get(),
      ]);

    const busySlots: RoomBusySlot[] = [];
    const seenScheduleIds = new Set<string>();

    for (const doc of [...dayScheduleSnap.docs, ...dateScheduleSnap.docs]) {
      if (seenScheduleIds.has(doc.id)) continue;
      seenScheduleIds.add(doc.id);
      const s = doc.data() as ClassSchedule;
      if (s.date && s.date !== input.activity_date) continue;
      const sStart = s.start_minutes ?? parseTimeToMinutes(s.start_time);
      const sEnd = s.end_minutes ?? parseTimeToMinutes(s.end_time);
      if (sStart < 0 || sEnd <= sStart) continue;

      busySlots.push({
        id: doc.id,
        source: "class_schedule",
        title: s.course_title,
        subtitle: `${s.batch} • ${s.lecturer_name}`,
        start_time: s.start_time,
        end_time: s.end_time,
        start_minutes: sStart,
        end_minutes: sEnd,
      });
    }

    for (const doc of approvedSnap.docs) {
      if (doc.id === input.exclude_proposal_id) continue;
      const p = doc.data() as ActivityProposal;
      const pStart = p.start_minutes ?? parseTimeToMinutes(p.start_time);
      const pEnd = p.end_minutes ?? parseTimeToMinutes(p.end_time);
      if (pStart < 0 || pEnd <= pStart) continue;

      busySlots.push({
        id: doc.id,
        source: "approved_proposal",
        title: p.title,
        subtitle: p.club_name,
        start_time: p.start_time,
        end_time: p.end_time,
        start_minutes: pStart,
        end_minutes: pEnd,
      });
    }

    busySlots.sort((a, b) => a.start_minutes - b.start_minutes);

    const pendingSlots: RoomBusySlot[] = pendingSnap.docs
      .filter((doc) => doc.id !== input.exclude_proposal_id)
      .map((doc) => {
        const p = doc.data() as ActivityProposal;
        return {
          id: doc.id,
          source: "pending_proposal" as const,
          title: p.title,
          subtitle: p.club_name,
          start_time: p.start_time,
          end_time: p.end_time,
          start_minutes: p.start_minutes ?? parseTimeToMinutes(p.start_time),
          end_minutes: p.end_minutes ?? parseTimeToMinutes(p.end_time),
        };
      })
      .filter((slot) => slot.start_minutes >= 0 && slot.end_minutes > slot.start_minutes);

    let conflictReason: string | null = null;
    if (room.status !== "active") {
      conflictReason = `Room "${room.name}" is currently under maintenance.`;
    } else if (
      input.expected_attendees &&
      input.expected_attendees > room.capacity
    ) {
      conflictReason = `Room "${room.name}" seats up to ${room.capacity} people, which is smaller than ${input.expected_attendees} expected attendees.`;
    } else {
      const hit = busySlots.find((slot) =>
        hasTimeOverlap(startMinutes, endMinutes, slot.start_minutes, slot.end_minutes)
      );
      if (hit) {
        conflictReason =
          hit.source === "class_schedule"
            ? `Room "${room.name}" has a scheduled class "${hit.title}" (${hit.subtitle}) from ${hit.start_time} - ${hit.end_time}.`
            : `Room "${room.name}" is already booked for "${hit.title}" (${hit.subtitle}) from ${hit.start_time} - ${hit.end_time}.`;
      }
    }

    const isAvailable = conflictReason === null;
    const alternativeRooms = isAvailable
      ? []
      : await findAlternativeRooms(db, {
          campus: room.campus,
          excludeRoomId: room.id,
          activityDate: input.activity_date,
          dayOfWeek,
          startMinutes,
          endMinutes,
          minCapacity: Math.max(1, input.expected_attendees ?? 1),
        });

    return {
      data: {
        room,
        activity_date: input.activity_date,
        is_available: isAvailable,
        conflict_reason: conflictReason,
        busy_slots: busySlots,
        pending_slots: pendingSlots,
        alternative_rooms: alternativeRooms,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: errorMessage(err, "Failed to check room availability"),
    };
  }
}

export async function getBookings(): Promise<{
  data: Booking[] | null;
  error: string | null;
}> {
  const res = await getActivityProposals();
  if (res.error || !res.data) {
    return { data: null, error: res.error };
  }
  return { data: res.data.map(mapProposalToBooking), error: null };
}

export async function createBooking(payload: {
  room_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
}): Promise<{ success: boolean; error: string | null; data?: Booking }> {
  const auth = await requireActor(["coordinator", "admin"]);
  if (!auth.ok) return { success: false, error: auth.error };

  const startDate = new Date(payload.start_time);
  const endDate = new Date(payload.end_time);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { success: false, error: "Invalid ISO timestamp format." };
  }

  const res = await createActivityProposal({
    coordinator_name: auth.actor.profile.full_name,
    club_name: auth.actor.profile.club_name || "Student Club",
    title: payload.title,
    description: payload.description || "Room reservation",
    expected_attendees: 1,
    campus: "",
    room_id: payload.room_id,
    room_name: "",
    activity_date: startDate.toISOString().slice(0, 10),
    start_time: payload.start_time.slice(11, 16),
    end_time: payload.end_time.slice(11, 16),
    start_minutes: startDate.getUTCHours() * 60 + startDate.getUTCMinutes(),
    end_minutes: endDate.getUTCHours() * 60 + endDate.getUTCMinutes(),
  });

  if (!res.success || !res.data) {
    return { success: false, error: res.error };
  }

  return { success: true, error: null, data: mapProposalToBooking(res.data) };
}
