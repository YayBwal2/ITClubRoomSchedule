import type { Firestore } from "firebase-admin/firestore";
import {
  AuthenticatedActor,
  getAuthenticatedActor,
  getFirebaseAdmin,
} from "@/lib/firebase/admin";
import { hasRequiredRole } from "@/lib/firebase/overlap";
import { ActivityProposal, Booking, UserRole } from "@/types/database";

export type ActorCheckResult =
  | { ok: true; actor: AuthenticatedActor; db: Firestore }
  | { ok: false; error: string };

/**
 * Authenticate the current caller and optionally verify they hold one of `allowedRoles`.
 */
export async function requireActor(
  allowedRoles?: readonly UserRole[],
  forbiddenMessage = "Forbidden: You do not have permission to perform this action."
): Promise<ActorCheckResult> {
  const actor = await getAuthenticatedActor();
  if (!actor) {
    return { ok: false, error: "Unauthorized. Please log in first." };
  }

  if (allowedRoles && !hasRequiredRole(actor.role, allowedRoles)) {
    return { ok: false, error: forbiddenMessage };
  }

  const { db } = getFirebaseAdmin();
  return { ok: true, actor, db };
}

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/**
 * Map an ActivityProposal record into the legacy Booking shape.
 */
export function mapProposalToBooking(p: ActivityProposal): Booking {
  return {
    id: p.id,
    room_id: p.room_id,
    user_id: p.coordinator_id,
    title: p.title,
    description: p.description,
    start_time: `${p.activity_date}T${p.start_time}`,
    end_time: `${p.activity_date}T${p.end_time}`,
    status: p.status,
    rejection_reason: p.rejection_reason ?? null,
    reviewed_by: p.reviewed_by ?? null,
    reviewed_at: p.reviewed_at ?? null,
    created_at: p.created_at,
    updated_at: p.updated_at,
    created_by: p.created_by,
    updated_by: p.updated_by,
  };
}
