"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CAMPUSES_DATA,
  UPCOMING_SCHEDULE_DATA,
  UpcomingItem,
} from "@/lib/constants";
import {
  getDayOfWeekFromDate,
  parseTimeToMinutes,
} from "@/lib/firebase/collections";
import { subscribeScheduleUpdates } from "@/lib/schedule-sync";
import { getActivityProposals } from "@/actions/bookings";
import { getCurrentProfile } from "@/actions/profiles";
import { getRooms } from "@/actions/rooms";
import { getClassSchedules } from "@/actions/schedules";
import { ActivityProposal, ClassSchedule, Room } from "@/types/database";
import { CalendarDays, Clock, MapPin, CheckCircle2, RefreshCw } from "lucide-react";
import Link from "next/link";

interface GridSessionItem extends UpcomingItem {
  proposalStatus?: "approved" | "pending";
}

function getTodayYangonDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(
    new Date()
  );
}

/**
 * Assign vertical lanes so overlapping sessions in the same room stack neatly.
 */
function assignSessionLanes(items: GridSessionItem[]): {
  placed: { item: GridSessionItem; lane: number }[];
  laneCount: number;
} {
  const sorted = [...items].sort((a, b) => a.startMinutes - b.startMinutes);
  const laneEnds: number[] = [];
  const placed: { item: GridSessionItem; lane: number }[] = [];

  for (const item of sorted) {
    let lane = laneEnds.findIndex((endMin) => endMin <= item.startMinutes);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.endMinutes);
    } else {
      laneEnds[lane] = item.endMinutes;
    }
    placed.push({ item, lane });
  }

  return { placed, laneCount: Math.max(1, laneEnds.length) };
}

export default function CalendarGrid() {
  const [selectedCampus, setSelectedCampus] = useState<string>("U Wisara");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentRole, setCurrentRole] = useState<string>("coordinator");
  const [liveRooms, setLiveRooms] = useState<Room[]>([]);
  const [liveSchedules, setLiveSchedules] = useState<ClassSchedule[]>([]);
  const [liveProposals, setLiveProposals] = useState<ActivityProposal[]>([]);
  const [hasLiveConnection, setHasLiveConnection] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState("");

  const loadScheduleData = useCallback(async (isCancelled?: () => boolean) => {
    const saved = localStorage.getItem("cfss_current_role");

    const [profileRes, roomsRes, schedulesRes, proposalsRes] =
      await Promise.all([
        getCurrentProfile(),
        getRooms(),
        getClassSchedules(),
        getActivityProposals(),
      ]);

    if (isCancelled?.()) return;

    setSelectedDate((prev) => prev || getTodayYangonDate());
    if (profileRes.data) {
      setCurrentRole(profileRes.data.role);
      setHasLiveConnection(true);
    } else if (saved) {
      setCurrentRole(saved);
    }
    if (roomsRes.data) {
      setLiveRooms(roomsRes.data);
    }
    if (schedulesRes.data) {
      setLiveSchedules(schedulesRes.data);
    }
    if (proposalsRes.data) {
      setLiveProposals(proposalsRes.data);
    }
    setLastSyncedAt(
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;

    const initialTimer = setTimeout(() => {
      void loadScheduleData(isCancelled);
    }, 0);

    const unsubscribe = subscribeScheduleUpdates(() => {
      void loadScheduleData(isCancelled);
    });

    const interval = setInterval(() => {
      if (!document.hidden) {
        void loadScheduleData(isCancelled);
      }
    }, 10000);

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(interval);
      unsubscribe();
    };
  }, [loadScheduleData]);

  const handleManualRefresh = () => {
    setIsSyncing(true);
    void loadScheduleData();
  };

  // Active campus rooms (live Firestore rooms with fallback to constants)
  const currentCampusConfig =
    CAMPUSES_DATA.find((c) => c.name === selectedCampus) || CAMPUSES_DATA[0];
  const rooms = useMemo(() => {
    const campusRooms = liveRooms.filter((r) => r.campus === selectedCampus);
    return campusRooms.length > 0 ? campusRooms : currentCampusConfig.rooms;
  }, [liveRooms, selectedCampus, currentCampusConfig.rooms]);

  const selectedDayOfWeek = useMemo(
    () => getDayOfWeekFromDate(selectedDate),
    [selectedDate]
  );

  // Timeline hours across standard school day (09:00 AM - 06:00 PM)
  const timeSlots = [
    { label: "09:00 - 10:30", start: 540, end: 630 },
    { label: "10:30 - 12:00", start: 630, end: 720 },
    { label: "12:00 - 01:30", start: 720, end: 810 },
    { label: "01:30 - 03:00", start: 810, end: 900 },
    { label: "03:00 - 04:30", start: 900, end: 990 },
    { label: "04:30 - 06:00", start: 990, end: 1080 },
  ];

  // Helper to get ALL sessions for a room on the active campus & date
  const getSessionsForRoom = (room: Room): GridSessionItem[] => {
    if (!hasLiveConnection) {
      const normRoom = room.name.toLowerCase().replace(/\s+/g, "");
      const normCampus = selectedCampus.toLowerCase().trim();
      return UPCOMING_SCHEDULE_DATA.filter((item) => {
        const matchCampus =
          item.campus.toLowerCase().includes(normCampus) ||
          normCampus.includes(item.campus.toLowerCase());
        const matchRoom =
          item.room.toLowerCase().replace(/\s+/g, "") === normRoom;
        return matchCampus && matchRoom;
      });
    }

    const scheduleItems: GridSessionItem[] = liveSchedules
      .filter((s) => {
        if (s.status === "cancelled") return false;
        const sameRoom = s.room_id === room.id || (s.campus === selectedCampus && s.room_name === room.name);
        if (!sameRoom) return false;
        return s.date ? s.date === selectedDate : s.day_of_week === selectedDayOfWeek;
      })
      .map((s) => ({
        id: s.id,
        time: `${s.start_time} - ${s.end_time}`,
        startMinutes: s.start_minutes ?? parseTimeToMinutes(s.start_time),
        endMinutes: s.end_minutes ?? parseTimeToMinutes(s.end_time),
        category: s.course_title,
        room: s.room_name,
        campus: s.campus,
        type: s.course_code.startsWith("DCBM")
          ? "DCBM Class"
          : s.course_code.startsWith("BM")
            ? "BM Class"
            : "DC Class",
        lecturerOrOrganizer: s.lecturer_name,
      }));

    const proposalItems: GridSessionItem[] = liveProposals
      .filter(
        (p) =>
          (p.status === "approved" || p.status === "pending") &&
          p.activity_date === selectedDate &&
          (p.room_id === room.id || (p.campus === selectedCampus && p.room_name === room.name))
      )
      .map((p) => ({
        id: p.id,
        time: `${p.start_time} - ${p.end_time}`,
        startMinutes: p.start_minutes ?? parseTimeToMinutes(p.start_time),
        endMinutes: p.end_minutes ?? parseTimeToMinutes(p.end_time),
        category: p.title,
        room: p.room_name,
        campus: p.campus,
        type: "Club Activity",
        lecturerOrOrganizer: p.club_name,
        proposalStatus: p.status === "pending" ? "pending" : "approved",
      }));

    return [...scheduleItems, ...proposalItems];
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
      {/* Header with Campus Tabs and Date Controller */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-1 border ${currentRole === "sse"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-red-50 text-[#DE0808] border-red-200"
                }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>
                {currentRole === "sse"
                  ? "Student Services Executive • Campus Timetable (Read-Only)"
                  : "Real-Time Campus Timetable"}
              </span>
            </div>
            <h2 className="font-black text-slate-900 text-xl tracking-tight">Room Availability & Schedule</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentRole === "sse"
                ? "Live real-time view of classroom occupancy, course lectures, and scheduled club activities across campuses."
                : "Live status across Strategy First campuses. Check available slots or reserve a facility."}
            </p>
          </div>

          {/* Live Sync Indicator, Refresh & Quick Action to Book */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-600 shadow-2xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  hasLiveConnection
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-slate-300"
                }`}
              />
              <span>
                {hasLiveConnection
                  ? lastSyncedAt
                    ? `Live • ${lastSyncedAt}`
                    : "Live Sync"
                  : "Demo Mode"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh live timetable"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-[#DE0808]" : ""}`}
              />
              <span>Refresh</span>
            </button>

            {currentRole !== "sse" && (
              <Link
                href={`/bookings?openModal=true&campus=${encodeURIComponent(selectedCampus)}${selectedDate ? `&date=${encodeURIComponent(selectedDate)}` : ""}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#DE0808] hover:bg-[#C20707] text-white text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>Reserve A Room</span>
              </Link>
            )}
          </div>
        </div>

        {/* Campus Tabs & Date Picker Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Campus Selector Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {CAMPUSES_DATA.map((campus) => {
              const isSelected = selectedCampus === campus.name;
              const isComingSoon = campus.status === "coming_soon";

              return (
                <button
                  key={campus.id}
                  disabled={isComingSoon}
                  onClick={() => !isComingSoon && setSelectedCampus(campus.name)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isComingSoon
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                      : isSelected
                        ? "bg-[#DE0808] text-white shadow-xs cursor-pointer"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                    }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{campus.name}</span>
                  {isComingSoon && <span className="text-[10px] text-amber-600 font-bold ml-1">(Soon)</span>}
                </button>
              );
            })}
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#DE0808]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Timetable Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[880px] table-fixed">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-xs font-black text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4 w-40 sm:w-44 sticky left-0 bg-slate-100 z-20 border-r border-slate-200">
                Classroom
              </th>
              {timeSlots.map((slot) => (
                <th key={slot.label} className="py-3 px-2 text-center border-r border-slate-200 last:border-r-0 font-bold text-[11px] sm:text-xs">
                  {slot.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={timeSlots.length + 1} className="py-12 text-center text-slate-400">
                  <p>No active classrooms in this facility.</p>
                </td>
              </tr>
            ) : (
              rooms.map((room) => {
                const roomSessions = getSessionsForRoom(room);
                const { placed, laneCount } = assignSessionLanes(roomSessions);
                const rowHeightPx = laneCount > 1 ? laneCount * 58 + 12 : 76;

                return (
                  <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Room Name Column (No seat count!) */}
                    <td className="py-3.5 px-4 sticky left-0 bg-white font-black text-slate-900 border-r border-slate-200 shadow-2xs z-20 align-middle">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#DE0808]" />
                        <span>{room.name}</span>
                      </div>
                    </td>

                    {/* Timeline Track spanning all time slots */}
                    <td
                      colSpan={timeSlots.length}
                      style={{ height: `${rowHeightPx}px` }}
                      className="p-0 relative align-middle"
                    >
                      {/* Background Columns & Available Slot Indicators */}
                      <div className="grid grid-cols-6 h-full absolute inset-0">
                        {timeSlots.map((slot) => {
                          const hasOverlap = roomSessions.some(
                            (s) => slot.start < s.endMinutes && slot.end > s.startMinutes
                          );

                          return (
                            <div
                              key={slot.label}
                              className="border-r border-slate-100 last:border-r-0 h-full flex items-center justify-center p-1.5"
                            >
                              {!hasOverlap && (
                                currentRole === "sse" ? (
                                  <span
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50/90 rounded-lg border border-emerald-200 select-none"
                                    title={`${room.name} (${slot.label}) is Available`}
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>Available</span>
                                  </span>
                                ) : (
                                  <Link
                                    href={`/bookings?openModal=true&campus=${encodeURIComponent(selectedCampus)}&room=${encodeURIComponent(room.name)}${selectedDate ? `&date=${encodeURIComponent(selectedDate)}` : ""}&start=${slot.start}&end=${slot.end}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50/90 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer select-none"
                                    title={`Book ${room.name} (${slot.label})`}
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>Available</span>
                                  </Link>
                                )
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Continuous Session Bars (Stacked cleanly across lanes if overlapping) */}
                      {placed.map(({ item: session, lane }) => {
                        const DAY_START = 540; // 09:00 AM
                        const DAY_END = 1080;  // 06:00 PM
                        const TOTAL_MINUTES = DAY_END - DAY_START; // 540 min

                        const leftPct = Math.max(0, ((session.startMinutes - DAY_START) / TOTAL_MINUTES) * 100);
                        const rightPct = Math.min(100, ((session.endMinutes - DAY_START) / TOTAL_MINUTES) * 100);
                        const widthPct = Math.max(4, rightPct - leftPct);
                        const isClub = session.type === "Club Activity";
                        const isPending = session.proposalStatus === "pending";

                        const topStyle =
                          laneCount === 1
                            ? { top: "8px", bottom: "8px" }
                            : { top: `${6 + lane * 58}px`, height: "52px" };

                        const cardStyleClass = isPending
                          ? "bg-sky-50/95 text-sky-950 border-sky-300 border-dashed hover:border-sky-400"
                          : isClub
                            ? "bg-amber-50 text-amber-950 border-amber-300 hover:border-amber-400"
                            : "bg-red-50 text-red-950 border-red-200/90 hover:border-red-300";

                        const dotClass = isPending
                          ? "bg-sky-500"
                          : isClub
                            ? "bg-amber-500"
                            : "bg-[#DE0808]";

                        const badgeClass = isPending
                          ? "bg-sky-100/80 border-sky-200 text-sky-900"
                          : isClub
                            ? "bg-amber-100/70 border-amber-200 text-amber-900"
                            : "bg-red-100/70 border-red-200 text-red-900";

                        const badgeLabel = isPending
                          ? "Pending"
                          : isClub
                            ? "Approved"
                            : session.type;

                        return (
                          <div
                            key={session.id}
                            style={{
                              left: `calc(${leftPct}% + 4px)`,
                              width: `calc(${widthPct}% - 8px)`,
                              ...topStyle,
                            }}
                            className={`absolute rounded-xl px-3 py-1.5 flex flex-col justify-center border shadow-xs transition-all hover:shadow-md hover:z-20 select-none ${cardStyleClass}`}
                            title={`${session.category} (${isPending ? "Pending Review" : session.type})${session.lecturerOrOrganizer ? `\nBy: ${session.lecturerOrOrganizer}` : ""}\nTime: ${session.time}\nRoom: ${room.name} (${selectedCampus})`}
                          >
                            <div className="flex items-center justify-between gap-1 overflow-hidden">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                                <span className="font-black text-xs truncate">
                                  {session.category}
                                </span>
                              </div>
                              {widthPct > 18 && (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border shrink-0 ${badgeClass}`}
                                >
                                  {badgeLabel}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-bold opacity-80 mt-0.5 truncate flex items-center gap-1">
                              <Clock className="w-3 h-3 shrink-0 opacity-70" />
                              <span>{session.time}</span>
                            </div>
                          </div>
                        );
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Grid Footer Legend */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300" />
            <span className="font-semibold text-slate-700">Available Slot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-red-100 border border-red-300" />
            <span className="font-semibold text-slate-700">Academic Lecture</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300" />
            <span className="font-semibold text-slate-700">Club Activity (Approved)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-sky-100 border border-sky-300 border-dashed" />
            <span className="font-semibold text-slate-700">Pending Request</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400">
          {hasLiveConnection
            ? "Connected to live campus timetable."
            : "Demo preview • Log in to view live campus reservations."}
        </p>
      </div>
    </div>
  );
}
