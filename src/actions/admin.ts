"use server";

import { createClient } from "@/lib/supabase/server";
import { Booking, BookingStatus } from "@/types/database";

/**
 * Backend Server Actions for Admin Approvals & Status Updates
 */

export async function getPendingBookings(): Promise<{ data: Booking[] | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        room:rooms(*),
        profile:profiles(*)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: (data as unknown as Booking[]) || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch pending bookings";
    return { data: null, error: message };
  }
}

export async function updateBookingStatus(
  bookingId: string,
  status: "approved" | "rejected",
  rejectionReason?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    // Verify current user is admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "school_admin") {
      return { success: false, error: "Forbidden: Only School Admins can update booking status." };
    }

    const { error } = await supabase
      .from("bookings")
      .update({
        status: status as BookingStatus,
        rejection_reason: status === "rejected" ? rejectionReason || null : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update booking status";
    return { success: false, error: message };
  }
}
