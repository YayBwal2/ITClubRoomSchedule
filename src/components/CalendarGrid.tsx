"use client";

import React, { useState } from "react";
import { CAMPUSES_DATA, UPCOMING_SCHEDULE_DATA } from "@/lib/constants";
import { CalendarDays, Clock, MapPin, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function CalendarGrid() {
  const [selectedCampus, setSelectedCampus] = useState<string>("U Wisara");
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-29");

  // Active campus rooms
  const currentCampusConfig = CAMPUSES_DATA.find((c) => c.name === selectedCampus) || CAMPUSES_DATA[0];
  const rooms = currentCampusConfig.rooms;

  // Timeline hours across standard school day (09:00 AM - 06:00 PM)
  const timeSlots = [
    { label: "09:00 - 10:30", start: 540, end: 630 },
    { label: "10:30 - 12:00", start: 630, end: 720 },
    { label: "12:00 - 01:30", start: 720, end: 810 },
    { label: "01:30 - 03:00", start: 810, end: 900 },
    { label: "03:00 - 04:30", start: 900, end: 990 },
    { label: "04:30 - 06:00", start: 990, end: 1080 },
  ];

  // Helper to get ALL sessions for a room on the active campus
  const getSessionsForRoom = (roomName: string) => {
    const normRoom = roomName.toLowerCase().replace(/\s+/g, "");
    const normCampus = selectedCampus.toLowerCase().trim();

    return UPCOMING_SCHEDULE_DATA.filter((item) => {
      const matchCampus =
        item.campus.toLowerCase().includes(normCampus) || normCampus.includes(item.campus.toLowerCase());
      const matchRoom = item.room.toLowerCase().replace(/\s+/g, "") === normRoom;
      return matchCampus && matchRoom;
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
      {/* Header with Campus Tabs and Date Controller */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#DE0808] text-xs font-bold mb-1 border border-red-200">
              <CalendarDays className="w-3.5 h-3.5" /> Real-Time Campus Timetable
            </div>
            <h2 className="font-black text-slate-900 text-xl tracking-tight">Room Availability & Schedule</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status across Strategy First campuses. Check available slots or reserve a facility.
            </p>
          </div>

          {/* Quick Action to Book */}
          <Link
            href="/bookings?openModal=true"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#DE0808] hover:bg-[#C20707] text-white text-xs font-black rounded-xl shadow-xs transition-colors self-start md:self-auto cursor-pointer"
          >
            <span>Reserve A Room</span>
          </Link>
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isComingSoon
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
                const roomSessions = getSessionsForRoom(room.name);

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
                    <td colSpan={timeSlots.length} className="p-0 relative h-16 sm:h-20 align-middle">
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
                                <Link
                                  href={`/bookings?openModal=true&campus=${encodeURIComponent(selectedCampus)}&room=${encodeURIComponent(room.name)}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50/90 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer select-none"
                                  title={`Book ${room.name} (${slot.label})`}
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>Available</span>
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Continuous Session Bars (Gantt / Continuous timeline pill) */}
                      {roomSessions.map((session) => {
                        const DAY_START = 540; // 09:00 AM
                        const DAY_END = 1080;  // 06:00 PM
                        const TOTAL_MINUTES = DAY_END - DAY_START; // 540 min

                        const leftPct = Math.max(0, ((session.startMinutes - DAY_START) / TOTAL_MINUTES) * 100);
                        const rightPct = Math.min(100, ((session.endMinutes - DAY_START) / TOTAL_MINUTES) * 100);
                        const widthPct = Math.max(4, rightPct - leftPct);
                        const isClub = session.type === "Club Activity";

                        return (
                          <div
                            key={session.id}
                            style={{
                              left: `calc(${leftPct}% + 4px)`,
                              width: `calc(${widthPct}% - 8px)`,
                            }}
                            className={`absolute top-2 bottom-2 rounded-xl px-3 py-1.5 flex flex-col justify-center border shadow-xs transition-all hover:shadow-md hover:z-20 select-none ${
                              isClub
                                ? "bg-amber-50 text-amber-950 border-amber-300 hover:border-amber-400"
                                : "bg-red-50 text-red-950 border-red-200/90 hover:border-red-300"
                            }`}
                            title={`${session.category} (${session.type})\nTime: ${session.time}\nRoom: ${room.name} (${selectedCampus})`}
                          >
                            <div className="flex items-center justify-between gap-1 overflow-hidden">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    isClub ? "bg-amber-500" : "bg-[#DE0808]"
                                  }`}
                                />
                                <span className="font-black text-xs truncate">
                                  {session.category}
                                </span>
                              </div>
                              {widthPct > 26 && (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border shrink-0 ${
                                    isClub
                                      ? "bg-amber-100/70 border-amber-200 text-amber-900"
                                      : "bg-red-100/70 border-red-200 text-red-900"
                                  }`}
                                >
                                  {session.type}
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
        <div className="flex items-center gap-4">
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
            <span className="font-semibold text-slate-700">Club Activity / Event</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400">
          Showing real-time room vacancy. Schedule is updated automatically.
        </p>
      </div>
    </div>
  );
}
