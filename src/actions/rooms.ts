"use server";

import {
  COLLECTIONS,
  buildAuditCreateFields,
  buildAuditUpdateFields,
} from "@/lib/firebase/collections";
import { errorMessage, requireActor } from "@/lib/firebase/action-helpers";
import { writeAuditLogInTransaction } from "@/lib/firebase/overlap";
import { Room } from "@/types/database";

export async function getRooms(
  campus?: string
): Promise<{ data: Room[] | null; error: string | null }> {
  try {
    const auth = await requireActor();
    if (!auth.ok) return { data: null, error: auth.error };

    let query = auth.db
      .collection(COLLECTIONS.ROOMS)
      .where("status", "==", "active");

    if (campus) {
      query = query.where("campus", "==", campus);
    }

    const snap = await query.orderBy("name", "asc").get();
    return {
      data: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Room),
      error: null,
    };
  } catch (err) {
    return { data: null, error: errorMessage(err, "Failed to fetch rooms") };
  }
}

export async function createRoom(
  payload: Omit<Room, "id" | "created_at" | "updated_at" | "created_by" | "updated_by"> & {
    id?: string;
  }
): Promise<{ success: boolean; error: string | null; data?: Room }> {
  try {
    const auth = await requireActor(
      ["admin"],
      "Forbidden: Only Admins can create rooms."
    );
    if (!auth.ok) return { success: false, error: auth.error };

    const { actor, db } = auth;
    const docRef = payload.id
      ? db.collection(COLLECTIONS.ROOMS).doc(payload.id)
      : db.collection(COLLECTIONS.ROOMS).doc();

    const roomData: Room = {
      ...payload,
      id: docRef.id,
      ...buildAuditCreateFields(actor.uid),
    };

    await db.runTransaction(async (tx) => {
      if ((await tx.get(docRef)).exists) {
        throw new Error(`Room "${docRef.id}" already exists.`);
      }
      tx.set(docRef, roomData);
      writeAuditLogInTransaction(tx, db, {
        collection: "rooms",
        document_id: docRef.id,
        action: "create",
        actor_id: actor.uid,
        actor_role: actor.role,
        details: { campus: roomData.campus, name: roomData.name },
      });
    });

    return { success: true, error: null, data: roomData };
  } catch (err) {
    return { success: false, error: errorMessage(err, "Failed to create room") };
  }
}

export async function updateRoom(
  roomId: string,
  payload: Partial<Omit<Room, "id" | "created_at" | "created_by">>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const auth = await requireActor(
      ["admin"],
      "Forbidden: Only Admins can update rooms."
    );
    if (!auth.ok) return { success: false, error: auth.error };

    const { actor, db } = auth;
    const roomRef = db.collection(COLLECTIONS.ROOMS).doc(roomId);

    await db.runTransaction(async (tx) => {
      if (!(await tx.get(roomRef)).exists) {
        throw new Error("Room not found.");
      }

      tx.update(roomRef, { ...payload, ...buildAuditUpdateFields(actor.uid) });
      writeAuditLogInTransaction(tx, db, {
        collection: "rooms",
        document_id: roomId,
        action: "update",
        actor_id: actor.uid,
        actor_role: actor.role,
      });
    });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: errorMessage(err, "Failed to update room") };
  }
}
