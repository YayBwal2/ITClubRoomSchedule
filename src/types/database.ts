export type UserRole = "student_coordinator" | "school_admin";

export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

export type RoomStatus = "active" | "maintenance";

export interface Profile {
  id: string; // matches auth.users.id
  email: string;
  full_name: string;
  role: UserRole;
  club_name?: string | null;
  phone_number?: string | null;
  created_at: string;
}

export interface Room {
  id: string;
  name: string; // e.g. "Room 204", "Lab 1"
  building: string; // e.g. "Main Building", "Annex"
  floor: number;
  capacity: number;
  has_projector: boolean;
  has_ac: boolean;
  has_whiteboard: boolean;
  status: RoomStatus;
  notes?: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  description?: string | null;
  start_time: string; // ISO 8601 string
  end_time: string;   // ISO 8601 string
  status: BookingStatus;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations
  room?: Room;
  profile?: Profile;
}
