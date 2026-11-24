"use server";

import {
  COLLECTIONS,
  buildAuditUpdateFields,
  parseTimeToMinutes,
} from "@/lib/firebase/collections";
import {
  errorMessage,
  mapProposalToBooking,
  requireActor,
} from "@/lib/firebase/action-helpers";
import {
  assertNoRoomOverlap,
  writeAuditLogInTransaction,
} from "@/lib/firebase/overlap";
import { ActivityProposal, Booking } from "@/types/database";

export async function getPendingProposals(): Promise<{
  data: ActivityProposal[] | null;
  error: string | null;
}> {
  try {
    const auth = await requireActor(
      ["admin", "sse"],
      "Forbidden: Only Admin or SSE can view the approval queue."
    );
    if (!auth.ok) return { data: null, error: auth.error };

    const snap = await auth.db
      .collection(COLLECTIONS.ACTIVITY_PROPOSALS)
      .where("status", "==", "pending")
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
      error: errorMessage(err, "Failed to fetch pending proposals"),
    };
  }
}

export async function reviewActivityProposal(
  proposalId: string,
  status: "approved" | "rejected",
  rejectionReason?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const auth = await requireActor(
      ["admin"],
      "Forbidden: Only School Admins can approve or reject proposals."
    );
    if (!auth.ok) return { success: false, error: auth.error };

    const { actor, db } = auth;
    const proposalRef = db
      .collection(COLLECTIONS.ACTIVITY_PROPOSALS)
      .doc(proposalId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(proposalRef);
      if (!snap.exists) throw new Error("Proposal not found.");

      const proposal = snap.data() as ActivityProposal;
      if (status === "approved") {
        const startMinutes =
          proposal.start_minutes ?? parseTimeToMinutes(proposal.start_time);
        const endMinutes =
          proposal.end_minutes ?? parseTimeToMinutes(proposal.end_time);

        await assertNoRoomOverlap(tx, db, {
          roomId: proposal.room_id,
          activityDate: proposal.activity_date,
          startMinutes,
          endMinutes,
          excludeProposalId: proposalId,
        });
      }

      const reason =
        status === "rejected" ? rejectionReason?.trim() || null : null;

      tx.update(proposalRef, {
        status,
        rejection_reason: reason,
        reviewed_by: actor.uid,
        reviewed_at: new Date().toISOString(),
        ...buildAuditUpdateFields(actor.uid),
      });

      writeAuditLogInTransaction(tx, db, {
        collection: "activity_proposals",
        document_id: proposalId,
        action: status === "approved" ? "approve" : "reject",
        actor_id: actor.uid,
        actor_role: actor.role,
        details: { status, rejection_reason: reason },
      });
    });

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: errorMessage(err, "Failed to update proposal status"),
    };
  }
}

export async function getPendingBookings(): Promise<{
  data: Booking[] | null;
  error: string | null;
}> {
  const res = await getPendingProposals();
  if (res.error || !res.data) {
    return { data: null, error: res.error };
  }
  return { data: res.data.map(mapProposalToBooking), error: null };
}

export async function updateBookingStatus(
  bookingId: string,
  status: "approved" | "rejected",
  rejectionReason?: string
): Promise<{ success: boolean; error: string | null }> {
  return reviewActivityProposal(bookingId, status, rejectionReason);
}
