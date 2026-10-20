"use server";

import { createClient } from "@/lib/supabase/server";
import { Room } from "@/types/database";

/**
 * Backend Server Actions for Rooms & Facilities
 */

export async function getRooms(): Promise<{ data: Room[] | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) return { data: null, error: error.message };
    return { data: (data as Room[]) || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch rooms";
    return { data: null, error: message };
  }
}
