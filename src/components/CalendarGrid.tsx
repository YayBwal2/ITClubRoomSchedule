"use client";

import React, { useState, useEffect } from "react";
import { Room, Booking } from "@/types/database";
import { Clock, Filter, CalendarDays } from "lucide-react";

interface CalendarGridProps {
  initialRooms?: Room[];
  initialBookings?: Booking[];
}

export default function CalendarGrid({ initialRooms = [], initialBookings = [] }: CalendarGridProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  }, []);

  const timeSlots = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900 text-lg">Room Availability Grid</h2>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-slate-700">
            <Filter className="w-4 h-4" /> Filter Facilities
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 w-48 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                Room Details
              </th>
              {timeSlots.map((slot) => (
                <th key={slot} className="py-3 px-2 text-center border-r border-slate-200 last:border-r-0">
                  {slot}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {initialRooms.length === 0 ? (
              <tr>
                <td colSpan={timeSlots.length + 1} className="py-12 text-center text-slate-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>No rooms loaded or database connection pending.</p>
                  <p className="text-xs text-slate-400 mt-1">Connect Supabase to display real rooms and time slots.</p>
                </td>
              </tr>
            ) : (
              initialRooms.map((room) => (
                <tr key={room.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 sticky left-0 bg-white font-medium text-slate-900 border-r border-slate-200">
                    <div>{room.name}</div>
                    <div className="text-xs text-slate-500 font-normal">Cap: {room.capacity} seats</div>
                  </td>
                  {timeSlots.map((slot) => (
                    <td key={slot} className="py-2 px-2 border-r border-slate-100 last:border-r-0 text-center">
                      <span className="inline-block w-full py-1 text-xs text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100 cursor-pointer">
                        Free
                      </span>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
