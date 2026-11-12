import { ActivityProposal, ClassSchedule, Room } from "@/types/database";

// Campus Configuration & Rooms matching user requirements:
// - U Wisara (Room 1-6)
// - Panchan Tower (Theater Room, Activity Room, Room 3 - 7)
// - Pyay Campus (Pyay Theater Room, Room 1 - 3)
// - Time City Campus (Coming Soon)
export interface CampusConfig {
  id: string;
  name: string;
  displayName: string;
  status: "active" | "coming_soon";
  rooms: Room[];
}

export const CAMPUSES_DATA: CampusConfig[] = [
  {
    id: "u-wisara",
    name: "U Wisara",
    displayName: "U Wisara Campus",
    status: "active",
    rooms: [
      { id: "uw-r1", name: "Room 1", campus: "U Wisara", building: "Main Wing", floor: 1, capacity: 40, has_ac: true, has_projector: true, has_whiteboard: true, status: "active" },
      { id: "uw-r2", name: "Room 2", campus: "U Wisara", building: "Main Wing", floor: 1, capacity: 45, has_ac: true, has_projector: true, has_whiteboard: true, status: "active" },
      { id: "uw-r3", name: "Room 3", campus: "U Wisara", building: "Main Wing", floor: 2, capacity: 35, has_ac: true, has_projector: true, has_whiteboard: true, status: "active" },
      { id: "uw-r4", name: "Room 4", campus: "U Wisara", building: "Main Wing", floor: 2, capacity: 50, has_ac: true, has_projector: true, has_whiteboard: true, status: "active" },
      { id: "uw-r5", name: "Room 5", campus: "U Wisara", building: "East Wing", floor: 3, capacity: 30, has_ac: true, has_projector: true, has_whiteboard: true, status: "active" },
      { id: "uw-r6", name: "Room 6", campus: "U Wisara", building: "East Wing", floor: 3, capacity: 40, has_ac: true, has_projector: true, has_whiteboard: true, status: "active" },
    ],
  },
  {
    id: "panchan-tower",
    name: "Panchan Tower",
    displayName: "Panchan Tower Campus",
    status: "active",
    rooms: [
      { id: "pt-theater", name: "Theater Room", campus: "Panchan Tower", building: "Tower A", floor: 5, capacity: 120, has_ac: true, has_projector: true, has_whiteboard: true, status: "active" },
      { id: "pt-activity", name: "Activity Room", campus: "Panchan Tower", building: "Tower A", floor: 4, capacity: 60, has_ac: true, has_projector: true, has_whiteboard: true, status: "active" },
      { id: "pt-r3", name: "Room 3", campus: "Panchan Tower", building: "Tower A", floor: 3, capacity: 35, has_ac: true, has_projector: true, has_whiteboard: true, status: "active" },
      { id: "pt-r4", name: "Room 4", campus: "Panchan Tower", building: "Tower A", floor: 3, capacity: 40, has_ac: true, has_projector: true, has_whiteboard: true, status: "active" },
      { id: "pt-r5", name: "Room 5", campus: "Panchan Tower", building: "Tower B", floor: 4, capacity: 40, has_ac: true, has_projector: true, has_whiteboard: true, status: "active" },
      { id: "pt-r6", name: "Room 6", campus: "Panchan Tower", building: "Tower B", floor: 4, capacity: 45, has_ac: true, has_projector: true, has_whiteboard: true, status: "active" },
      { id: "pt-r7", name: "Room 7", campus: "Panchan Tower", building: "Tower B", floor: 5, capacity: 50, has_ac: true, has_projector: true, has_whiteboard: true, status: "active" },
    ],
  },
  {
    id: "pyay-campus",
    name: "Pyay Campus",
    displayName: "Pyay Campus",
    status: "active",
    rooms: [
      { id: "py-theater", name: "Pyay Theater Room", campus: "Pyay Campus", building: "Auditorium", floor: 3, capacity: 100, has_ac: true, has_projector: true, has_whiteboard: true, status: "active" },
      { id: "py-r1", name: "Room 1", campus: "Pyay Campus", building: "Main Hall", floor: 1, capacity: 35, has_ac: true, has_projector: true, has_whiteboard: true, status: "active" },
      { id: "py-r2", name: "Room 2", campus: "Pyay Campus", building: "Main Hall", floor: 2, capacity: 40, has_ac: true, has_projector: true, has_whiteboard: true, status: "active" },
      { id: "py-r3", name: "Room 3", campus: "Pyay Campus", building: "Main Hall", floor: 2, capacity: 45, has_ac: true, has_projector: true, has_whiteboard: true, status: "active" },
    ],
  },
  {
    id: "time-city",
    name: "Time City Campus",
    displayName: "Time City Campus (Coming Soon)",
    status: "coming_soon",
    rooms: [],
  },
];

// Flat list of all available active rooms
export const ALL_ROOMS: Room[] = CAMPUSES_DATA.flatMap((c) => c.rooms);

// Upcoming Classes & Activities matching exact image mockup (raw_sources/Upcoming Class and Activity.png)
export interface UpcomingItem {
  id: string;
  time: string; // e.g. "9:00 - 11:00"
  startMinutes: number; // for conflict checking (e.g. 9:00 = 540)
  endMinutes: number;   // e.g. 11:00 = 660
  category: string;
  room: string;
  campus: string;
  type: "BM Class" | "DC Class" | "DCBM Class" | "Club Activity";
  lecturerOrOrganizer?: string;
}

export const UPCOMING_SCHEDULE_DATA: UpcomingItem[] = [
  { id: "u-1", time: "9:00 - 11:00", startMinutes: 540, endMinutes: 660, category: "Accounting", room: "Room 2", campus: "Panchan Tower", type: "BM Class" },
  { id: "u-2", time: "11:30 - 1:30", startMinutes: 690, endMinutes: 810, category: "DDOOCP", room: "Room 4", campus: "U Wisara", type: "DC Class" },
  { id: "u-3", time: "2:00 - 4:00", startMinutes: 840, endMinutes: 960, category: "E-Business", room: "Room 1", campus: "Pyay Campus", type: "DCBM Class" },
  { id: "u-4", time: "9:00 - 2:00", startMinutes: 540, endMinutes: 840, category: "Song rehearsal", room: "Activity Room", campus: "Panchan Tower", type: "Club Activity" },
  { id: "u-5", time: "11:30 - 4:00", startMinutes: 690, endMinutes: 960, category: "Software Engineering", room: "Room 3", campus: "U Wisara", type: "DC Class" },
  { id: "u-6", time: "2:00 - 4:00", startMinutes: 840, endMinutes: 960, category: "Art Workshop", room: "Room 5", campus: "U Wisara", type: "Club Activity" },
  { id: "u-7", time: "9:00 - 11:00", startMinutes: 540, endMinutes: 660, category: "OOSAD", room: "Room 2", campus: "Pyay Campus", type: "DC Class" },
  { id: "u-8", time: "11:00 - 4:00", startMinutes: 660, endMinutes: 960, category: "IT Project Meeting", room: "Room 6", campus: "Panchan Tower", type: "Club Activity" },
];

// Helper to convert "HH:MM AM/PM" or "HH:MM" string to minutes from midnight
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim();
  
  // Format "09:00 AM" or "02:30 PM"
  const matchAmPm = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (matchAmPm) {
    let hours = parseInt(matchAmPm[1], 10);
    const minutes = parseInt(matchAmPm[2], 10);
    const modifier = matchAmPm[3]?.toUpperCase();

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Fallback 24hr "14:30"
  const parts = clean.split(":");
  if (parts.length >= 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }
  return 0;
}

// Convert minutes to "HH:MM AM/PM" string
export function minutesToDisplayTime(minutes: number): string {
  let h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  const minStr = m < 10 ? `0${m}` : `${m}`;
  return `${h}:${minStr} ${period}`;
}

// Collision Checker: Check if a requested room in a campus is occupied at a given time window
export function checkRoomConflict(
  campus: string,
  roomName: string,
  startMinutes: number,
  endMinutes: number
): { hasConflict: boolean; conflictingSession?: UpcomingItem } {
  // Normalize strings
  const normCampus = campus.toLowerCase().trim();
  const normRoom = roomName.toLowerCase().trim();

  for (const item of UPCOMING_SCHEDULE_DATA) {
    const itemCampus = item.campus.toLowerCase().trim();
    const itemRoom = item.room.toLowerCase().trim();

    // Check if same campus and room
    const campusMatch = itemCampus.includes(normCampus) || normCampus.includes(itemCampus);
    const roomMatch = itemRoom.replace(/\s+/g, "") === normRoom.replace(/\s+/g, "");

    if (campusMatch && roomMatch) {
      // Check time overlap: (StartA < EndB) && (EndA > StartB)
      if (startMinutes < item.endMinutes && endMinutes > item.startMinutes) {
        return { hasConflict: true, conflictingSession: item };
      }
    }
  }

  return { hasConflict: false };
}
