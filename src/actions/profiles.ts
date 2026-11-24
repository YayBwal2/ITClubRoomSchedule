"use server";

import {
  COLLECTIONS,
  buildAuditCreateFields,
  buildAuditUpdateFields,
} from "@/lib/firebase/collections";
import { errorMessage, requireActor } from "@/lib/firebase/action-helpers";
import { writeAuditLogInTransaction } from "@/lib/firebase/overlap";
import { Profile, UserRole } from "@/types/database";

export async function getCurrentProfile(): Promise<{
  data: Profile | null;
  error: string | null;
}> {
  try {
    const auth = await requireActor();
    if (!auth.ok) return { data: null, error: auth.error };
    return { data: auth.actor.profile, error: null };
  } catch (err) {
    return { data: null, error: errorMessage(err, "Failed to fetch current profile") };
  }
}

export async function getProfiles(): Promise<{
  data: Profile[] | null;
  error: string | null;
}> {
  try {
    const auth = await requireActor(
      ["admin", "sse"],
      "Forbidden: Only Admin or SSE can list all profiles."
    );
    if (!auth.ok) return { data: null, error: auth.error };

    const snap = await auth.db
      .collection(COLLECTIONS.PROFILES)
      .orderBy("created_at", "desc")
      .get();

    return {
      data: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Profile),
      error: null,
    };
  } catch (err) {
    return { data: null, error: errorMessage(err, "Failed to fetch profiles") };
  }
}

export async function updateOwnProfile(payload: {
  full_name: string;
  club_name?: string | null;
  phone_number?: string | null;
}): Promise<{ success: boolean; error: string | null; data?: Profile }> {
  try {
    const auth = await requireActor();
    if (!auth.ok) return { success: false, error: auth.error };

    const { actor, db } = auth;
    const docRef = db.collection(COLLECTIONS.PROFILES).doc(actor.uid);

    const updated = await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      const commonFields = {
        full_name: payload.full_name.trim(),
        club_name: payload.club_name ?? null,
        phone_number: payload.phone_number ?? null,
      };

      if (!snap.exists) {
        const created: Profile = {
          id: actor.uid,
          email: actor.email,
          ...commonFields,
          role: "coordinator",
          is_active: true,
          ...buildAuditCreateFields(actor.uid),
        };
        tx.set(docRef, created);
        writeAuditLogInTransaction(tx, db, {
          collection: "profiles",
          document_id: actor.uid,
          action: "create",
          actor_id: actor.uid,
          actor_role: "coordinator",
        });
        return created;
      }

      const updates = { ...commonFields, ...buildAuditUpdateFields(actor.uid) };
      tx.update(docRef, updates);
      writeAuditLogInTransaction(tx, db, {
        collection: "profiles",
        document_id: actor.uid,
        action: "update",
        actor_id: actor.uid,
        actor_role: actor.role,
      });

      return { id: snap.id, ...snap.data(), ...updates } as Profile;
    });

    return { success: true, error: null, data: updated };
  } catch (err) {
    return { success: false, error: errorMessage(err, "Failed to update profile") };
  }
}

export async function adminUpdateUserRole(
  targetUserId: string,
  role: UserRole,
  isActive?: boolean
): Promise<{ success: boolean; error: string | null }> {
  try {
    const auth = await requireActor(
      ["admin"],
      "Forbidden: Only Admins can change user roles."
    );
    if (!auth.ok) return { success: false, error: auth.error };

    const { actor, db } = auth;
    const targetRef = db.collection(COLLECTIONS.PROFILES).doc(targetUserId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(targetRef);
      if (!snap.exists) throw new Error("Target profile not found.");

      tx.update(targetRef, {
        role,
        ...(typeof isActive === "boolean" ? { is_active: isActive } : {}),
        ...buildAuditUpdateFields(actor.uid),
      });
      writeAuditLogInTransaction(tx, db, {
        collection: "profiles",
        document_id: targetUserId,
        action: "update",
        actor_id: actor.uid,
        actor_role: actor.role,
        details: { role, is_active: isActive },
      });
    });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: errorMessage(err, "Failed to update user role") };
  }
}
