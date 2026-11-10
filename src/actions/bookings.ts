"use server";

import { createClient } from "@/lib/supabase/server";
import { Booking, BookingStatus, ActivityProposal } from "@/types/database";

/**
 * Backend Server Actions for Bookings & Club Proposals
 * 
 * Note for Backend Developers:
 * - In Supabase, connect this to the `bookings` or `activity_proposals` table.
 * - Handles authentication checks and postgres exclusion/conflict constraint handling.
 */

// 1. Fetch all bookings / proposals
export async function getBookings(): Promise<{ data: Booking[] | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        room:rooms(*),
        profile:profiles(*)
      `)
      .order("start_time", { ascending: true });

    if (error) return { data: null, error: error.message };
    return { data: (data as unknown as Booking[]) || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch bookings";
    return { data: null, error: message };
  }
}

// 2. Submit new room reservation
export async function createBooking(payload: {
  room_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
}): Promise<{ success: boolean; error: string | null; data?: Booking }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Unauthorized. Please log in first." };
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        ...payload,
        user_id: user.id,
        status: "pending" as BookingStatus,
      })
      .select()
      .single();

    if (error) {
      // Catch Postgres double booking constraint or other errors
      if (error.code === "23P01" || error.message.includes("conflict")) {
        return { success: false, error: "This room is already reserved for this time slot." };
      }
      return { success: false, error: error.message };
    }

    return { success: true, error: null, data: data as unknown as Booking };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create booking";
    return { success: false, error: message };
  }
}

// 3. Submit full Event Request Proposal (Clubs and Societies)
export async function createActivityProposal(
  proposal: Omit<ActivityProposal, "id" | "created_at" | "updated_at">
): Promise<{ success: boolean; error: string | null; data?: ActivityProposal }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("activity_proposals")
      .insert(proposal)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, error: null, data: data as ActivityProposal };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit proposal";
    return { success: false, error: message };
  }
}
