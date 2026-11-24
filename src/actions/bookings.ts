"use server";

import {
  COLLECTIONS,
  buildAuditCreateFields,
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
import { ActivityProposal, Booking } from "@/types/database";

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

    return { data: Array.from(merged.values()), error: null };
  } catch (err) {
    return {
      data: null,
      error: errorMessage(err, "Failed to fetch activity proposals"),
    };
  }
}

export async function createActivityProposal(
  proposal: Omit<
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
  > & { coordinator_id?: string }
): Promise<{ success: boolean; error: string | null; data?: ActivityProposal }> {
  try {
    const auth = await requireActor(
      ["coordinator", "admin"],
      "Forbidden: SSE accounts have view-only access and cannot submit proposals."
    );
    if (!auth.ok) return { success: false, error: auth.error };

    const { actor, db } = auth;
    const startMinutes =
      proposal.start_minutes ?? parseTimeToMinutes(proposal.start_time);
    const endMinutes =
      proposal.end_minutes ?? parseTimeToMinutes(proposal.end_time);

    if (startMinutes < 0 || endMinutes <= startMinutes) {
      return {
        success: false,
        error: "Invalid time slot: end time must be after start time.",
      };
    }

    const docRef = db.collection(COLLECTIONS.ACTIVITY_PROPOSALS).doc();
    const coordinatorId =
      actor.role === "admin" && proposal.coordinator_id
        ? proposal.coordinator_id
        : actor.uid;

    const createdProposal = await db.runTransaction(async (tx) => {
      const room = await assertNoRoomOverlap(tx, db, {
        roomId: proposal.room_id,
        activityDate: proposal.activity_date,
        startMinutes,
        endMinutes,
      });

      const record: ActivityProposal = {
        ...proposal,
        id: docRef.id,
        coordinator_id: coordinatorId,
        coordinator_name: proposal.coordinator_name || actor.profile.full_name,
        campus: room.campus,
        room_name: room.name,
        start_minutes: startMinutes,
        end_minutes: endMinutes,
        status: "pending",
        reviewed_by: null,
        reviewed_at: null,
        rejection_reason: null,
        ...buildAuditCreateFields(actor.uid),
      };

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
        },
      });

      return record;
    });

    return { success: true, error: null, data: createdProposal };
  } catch (err) {
    return { success: false, error: errorMessage(err, "Failed to submit proposal") };
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
    description: payload.description || "",
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
