// User Roles in the Scheduling System
export type UserRole = "coordinator" | "sse" | "admin";

// Proposal Lifecycle Statuses
export type ProposalStatus = "pending" | "approved" | "rejected";

// Legacy Booking status for backwards compatibility
export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

export type RoomStatus = "active" | "maintenance";

// User Profile
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  club_name?: string | null;
  phone_number?: string | null;
  created_at: string;
}

// Room Details
export interface Room {
  id: string;
  name: string; // e.g. "Room 101", "Computer Lab A"
  campus: string; // e.g. "Main Campus", "City Campus"
  building: string; // e.g. "Building A", "Annex"
  floor: number;
  capacity: number;
  has_projector: boolean;
  has_ac: boolean;
  has_whiteboard: boolean;
  status: RoomStatus;
  notes?: string | null;
  created_at?: string;
}

// Club Activity Proposal submitted by Club Coordinator based on Event Request Form
export interface ActivityProposal {
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
  created_at: string;
  updated_at: string;
}

// Classroom Timetable Schedule managed by Admin
export interface ClassSchedule {
  id: string;
  campus: string;
  room_id: string;
  room_name: string;
  course_code: string;
  course_title: string;
  lecturer_name: string;
  day_of_week: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  date?: string; // Optional specific date
  start_time: string; // e.g. "08:30"
  end_time: string; // e.g. "11:30"
  batch: string; // e.g. "Batch 24"
}

// Legacy Booking interface for backwards compatibility
export interface Booking {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  room?: Room;
  profile?: Profile;
}
