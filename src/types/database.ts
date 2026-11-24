// User Roles in the Scheduling System
export type UserRole = "coordinator" | "sse" | "admin";

// Proposal Lifecycle Statuses
export type ProposalStatus = "pending" | "approved" | "rejected";

// Legacy Booking status for backwards compatibility
export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

export type RoomStatus = "active" | "maintenance";

export type ScheduleStatus = "active" | "cancelled";

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

// Standard audit metadata stored across Firestore collections
export interface AuditFields {
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

// User Profile (Firestore collection: `profiles`, doc id = Firebase Auth UID)
export interface Profile extends AuditFields {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  club_name?: string | null;
  phone_number?: string | null;
  is_active?: boolean;
  created_at: string;
}

// Room Details (Firestore collection: `rooms`)
export interface Room extends AuditFields {
  id: string;
  name: string; // e.g. "Room 1", "Theater Room"
  campus: string; // e.g. "U Wisara", "Panchan Tower", "Pyay Campus"
  building: string; // e.g. "Main Wing", "Tower A"
  floor: number;
  capacity: number;
  has_projector: boolean;
  has_ac: boolean;
  has_whiteboard: boolean;
  status: RoomStatus;
  notes?: string | null;
}

// Club Activity Proposal submitted by Club Coordinator (Firestore collection: `activity_proposals`)
export interface ActivityProposal extends AuditFields {
  id: string;
  coordinator_id: string;
  coordinator_name: string;
  club_name: string;
  title: string;
  description: string;
  expected_attendees: number;
  campus: string;
  room_id: string;
  room_name: string;
  activity_date: string; // YYYY-MM-DD
  start_time: string; // e.g. "09:00 AM" or "09:00"
  end_time: string; // e.g. "12:00 PM" or "12:00"
  start_minutes?: number; // Normalized minutes from midnight for overlap & range queries
  end_minutes?: number; // Normalized minutes from midnight for overlap & range queries

  // Budget & Supplier Details from Event Request Form
  expected_budget?: string;
  budget_details?: string;
  supplier_name?: string;
  supplier_phone?: string;
  suppliers?: { name: string; phone: string }[];

  // Organizer Contact Details
  organizer_name?: string;
  organizer_role?: string;
  organizer_email?: string;
  organizer_phone?: string;

  // Equipment & Facilities
  additional_requests?: string;
  requested_equipment?: string[];

  // Approval Status & Lifecycle
  status: ProposalStatus;
  is_completed?: boolean; // True if past event date or completed
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Classroom Timetable Schedule managed by Admin (Firestore collection: `class_schedules`)
export interface ClassSchedule extends AuditFields {
  id: string;
  campus: string;
  room_id: string;
  room_name: string;
  course_code: string;
  course_title: string;
  lecturer_name: string;
  day_of_week: DayOfWeek;
  date?: string; // Optional specific date (YYYY-MM-DD)
  start_time: string; // e.g. "08:30"
  end_time: string; // e.g. "11:30"
  start_minutes?: number;
  end_minutes?: number;
  batch: string; // e.g. "Batch 24"
  status?: ScheduleStatus;
}

// Legacy Booking interface for backwards compatibility
export interface Booking extends AuditFields {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  room?: Room;
  profile?: Profile;
}

// Immutable Security & Operations Audit Log (Firestore collection: `audit_logs`)
export interface AuditLog {
  id: string;
  collection: "profiles" | "rooms" | "activity_proposals" | "class_schedules";
  document_id: string;
  action: "create" | "update" | "approve" | "reject" | "cancel" | "delete";
  actor_id: string;
  actor_role: UserRole | "system";
  details?: Record<string, unknown>;
  created_at: string;
}
